import click
import os
from src.utils.jsonl import flatten_to_csv
from src.utils.csv import save_csv
from src.utils.error_handler import handle_app_errors
import structlog

logger = structlog.get_logger(__name__)


@click.command()
@click.argument("filename", type=click.Path(exists=True))
@handle_app_errors
def convert_jsonl_to_csv(filename):
    """
    Converts a JSONL file to a CSV file by flattening all leaf keys into CSV columns.
    """
    if not filename.lower().endswith(".jsonl"):
        logger.error(f"Error: Input file {filename} must have a .jsonl extension")
        return

    output_filename = os.path.splitext(os.path.basename(filename))[0] + ".csv"

    try:
        flattened_data = flatten_to_csv(filename)
        save_csv(output_filename, flattened_data)
        logger.info(f"Successfully converted {filename} to {output_filename}")
    except Exception as error:
        raise Exception(f"Error converting file {filename} to CSV", error)


        import json
import os
import jsonlines
from typing import Any


def read_jsonl(file_path: str) -> list[dict]:
    with jsonlines.open(file_path, "r") as file:
        return list(file)


def get_values_from_jsonl(file_path: str, nested_key: list[str]):
    values = []
    data = read_jsonl(file_path)
    for item in data:
        value = item
        for key in nested_key:
            value = value.get(key, {})
        if value == {}:
            raise KeyError(
                f"`{'.'.join(nested_key)}` was not found on item", {"item": item}
            )
        values.append(value)
    return values


def extract_item(obj: dict[str, Any]) -> dict[str, Any]:
    values = {}
    for key, value in obj.items():
        if isinstance(value, dict):
            values.update(extract_item(value))
        else:
            values[key] = value
    return values


def flatten_to_csv(input_file: str):
    data = read_jsonl(input_file)

    return [extract_item(item) for item in data]


def load_and_merge_jsonl_files(folder_path: str, file_prefix: str) -> list[dict]:
    """
    Load all JSONL files from the given folder path that start with the given prefix
    and merge their contents into a list of dictionaries.

    Parameters:
    - folder_path (str): The path to the folder containing JSONL files.
    - file_prefix (str): The prefix of the JSONL files to load.

    Returns:
    - list[dict]: A list of dictionaries containing the merged contents of the JSONL files.
    """
    merged_data = []

    # Iterate over all files in the folder
    for filename in os.listdir(folder_path):
        if filename.startswith(file_prefix) and filename.endswith(".jsonl"):
            file_path = os.path.join(folder_path, filename)

            with open(file_path, "r", encoding="utf-8") as file:
                for line in file:
                    merged_data.append(json.loads(line))
    print(f"\nTotal merged data {len(merged_data)}\n")
    return merged_data