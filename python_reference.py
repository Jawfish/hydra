from collections.abc import Hashable
import os
import pathlib
import asyncio
import datetime
import argparse
from typing import Literal, get_args
from anthropic import AsyncAnthropic
from dotenv import load_dotenv
import pandas as pd
from tqdm import tqdm

Language = Literal[
    "German", "Spanish", "French", "Italian", "Portuguese", "Japanese", "Korean"
]
LANGUAGES = get_args(Language)


def get_translation_system_prompt(language: Language) -> str:
    return f"""You are a translation assistant. Your task is to translate the given request into {language}. Please provide the translation only, without any additional commentary. Do not attempt to answer questions or fulfill the request provided in English, you are translating the request itself into {language}. You should try to maintain the original meaning, deviating as little as possible from the original text. Please try to retain the original formatting, structure, and style of the request as much as possible."""


async def translate_text(
    client: AsyncAnthropic,
    text: str,
    language: Language,
) -> str:
    if not text.strip():
        return ""

    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            messages=[{"role": "user", "content": text}],
            system=get_translation_system_prompt(language),
        )
        return response.content[0].text if response.content else ""  # type: ignore
    except Exception as e:
        print(f"Error processing {language}: {str(e)}")
        return ""


def format_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = int(seconds % 60)
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"


def save_batch_results(
    results: list[list[Hashable]],
    output_file: pathlib.Path,
) -> None:
    results_df = pd.DataFrame(results)
    results_df.to_csv(
        output_file,
        index=False,
        header=False,
        quoting=1,
        mode="a",
    )


def get_completed_rows(output_file: pathlib.Path) -> set:
    if not output_file.exists():
        return set()

    try:
        completed_df = pd.read_csv(output_file)
        id_columns = [
            col
            for col in completed_df.columns
            if col not in ["Language", "Translated Prompt"]
        ]
        completed = {
            (tuple(row[id_columns]), row["Language"])
            for _, row in completed_df.iterrows()
        }
        return completed
    except pd.errors.EmptyDataError:
        return set()
    except Exception as e:
        print(f"Warning: Error reading existing output file: {str(e)}")
        return set()


async def process_translations(
    input_file: pathlib.Path,
    output_file: pathlib.Path,
    prompt_column_name: str,
    task_size: int = 10,
) -> None:
    load_dotenv(override=True)
    api_key = os.getenv("ANTHROPIC_API_KEY")
    assert api_key, "ANTHROPIC_API_KEY environment variable must be set"

    client = AsyncAnthropic(api_key=api_key)

    df = pd.read_csv(input_file)

    column_map = {col.lower(): col for col in df.columns}
    actual_column_name = column_map.get(prompt_column_name.lower())
    if not actual_column_name:
        raise ValueError(f"Column '{prompt_column_name}' not found in input file")

    total_rows = len(df)
    print(f"Total rows to process: {total_rows}")
    print(f"Concurrent tasks: {task_size}\n")

    completed_pairs = get_completed_rows(output_file)
    print(f"Found {len(completed_pairs)} existing translations")

    start_time = datetime.datetime.now()

    semaphore = asyncio.Semaphore(task_size)

    async def process_single_task(idx, language, row_list, prompt):
        async with semaphore:
            translated_prompt = await translate_text(client, prompt, language)
        if translated_prompt:
            result = list(row_list)
            result.append(language)
            result.append(translated_prompt)
            save_batch_results(
                [result],
                output_file,
            )
        else:
            print(f"Translation failed for idx {idx}, language {language}")

    tasks = []
    for idx, row in df.iterrows():
        row_list = row.to_list()
        prompt = str(row[actual_column_name])

        id_columns = [
            col for col in row.index if col not in ["Language", "Translated Prompt"]
        ]
        row_id = tuple(row[id_columns])

        for language in LANGUAGES:
            if (row_id, language) not in completed_pairs:
                task = asyncio.create_task(
                    process_single_task(idx, language, row_list, prompt)
                )
                tasks.append(task)

    print(f"Total tasks to process: {len(tasks)}")

    progress_bar = tqdm(total=len(tasks), desc="Translating", unit="task")

    async def wrapped_task(task):
        await task
        progress_bar.update(1)

    await asyncio.gather(*(wrapped_task(task) for task in tasks))
    progress_bar.close()

    num_languages = len(LANGUAGES)
    expected_rows = total_rows * num_languages

    await asyncio.sleep(1)

    with open(output_file, "r") as f:
        df = pd.read_csv(f)
        num_output_rows = len(df)

    assert (
        num_output_rows == expected_rows
    ), f"Row count mismatch: Expected={expected_rows}, Actual={num_output_rows}"

    end_time = datetime.datetime.now()
    total_duration = (end_time - start_time).total_seconds()
    print("\nTranslation completed!")
    print(f"Total time: {format_time(total_duration)}")


def main():
    parser = argparse.ArgumentParser(
        description="Translate CSV file contents using Claude API"
    )
    parser.add_argument(
        "folder_path", type=str, help="Input folder path containing CSV files"
    )
    parser.add_argument(
        "--column",
        type=str,
        default="Prompt",
        help="Name of column containing text to translate",
    )
    parser.add_argument(
        "--task-size",
        type=int,
        default=50,
        help="Number of concurrent tasks (default: 50)",
    )

    args = parser.parse_args()
    asyncio.run(async_main(args))


async def async_main(args):
    folder_path = pathlib.Path(args.folder_path)

    if not folder_path.is_dir():
        raise NotADirectoryError(f"Provided path is not a directory: {folder_path}")

    csv_files = [f for f in folder_path.glob("*.csv") if "TRANSLATED" not in f.name]

    if not csv_files:
        print("No CSV files found in the folder to process.")
        return

    print(f"Found {len(csv_files)} CSV files to process.\n")

    for input_file_path in csv_files:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = (
            f"{input_file_path.stem}_TRANSLATED_{timestamp}{input_file_path.suffix}"
        )
        output_file_path = input_file_path.parent / output_filename

        print(f"Processing file: {input_file_path.name}")
        print(f"Output will be saved to: {output_file_path.name}\n")

        if not input_file_path.exists():
            print(f"Input file not found: {input_file_path}")
            continue

        df = pd.read_csv(input_file_path)
        header = df.columns.tolist()
        header.extend(["Language", "Translated Prompt"])
        pd.DataFrame(columns=header).to_csv(output_file_path, index=False)

        await process_translations(
            input_file=input_file_path,
            output_file=output_file_path,
            prompt_column_name=args.column,
            task_size=args.task_size,
        )

        print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    main()