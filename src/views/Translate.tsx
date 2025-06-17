import Anthropic from '@anthropic-ai/sdk';
import retry from 'async-retry';
import type React from 'react';
import type { JSX } from 'react';
import { useId, useState } from 'react';
import { ActionSection } from '@/components/ActionSection';
import { getValueByPath } from '@/lib/parse';
import type { FileType } from '@/store/store';

type ProgressInfo = {
  percentage: number;
  estimatedTimeRemaining: number;
};

const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.round(milliseconds / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds.toString().padStart(2, '0')} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')} min ${seconds.toString().padStart(2, '0')} sec`;
};

const calculateProgress = (
  completedOperations: number,
  totalOperations: number,
  startTime: number
): ProgressInfo => {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;

  const percentage =
    totalOperations > 0 ? Math.round((completedOperations / totalOperations) * 100) : 0;

  let estimatedTimeRemaining = 0;
  if (completedOperations > 0) {
    const averageTimePerOperation = elapsedTime / completedOperations;
    const remainingOperations = totalOperations - completedOperations;
    estimatedTimeRemaining = Math.round(averageTimePerOperation * remainingOperations);
  }

  return {
    percentage,
    estimatedTimeRemaining
  };
};

const ALL_LANGUAGES = [
  'English',
  'German',
  'Spanish',
  'French',
  'Italian',
  'Portuguese',
  'Japanese',
  'Korean'
] as const;

const DEFAULT_ENABLED_LANGUAGES = [
  'German',
  'Spanish',
  'French',
  'Italian',
  'Portuguese',
  'Japanese',
  'Korean'
] as const;

import { toast } from 'sonner';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { HelpTooltip } from '@/components/HelpTooltip';
import { Label } from '@/components/Label';
import { Section } from '@/components/Section';
import { getAllPaths, serializeJson } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shadcn/components/ui/dropdown-menu';
import { Input } from '@/shadcn/components/ui/input';
import { Progress } from '@/shadcn/components/ui/progress';
import { useWorkingFileStore } from '@/store/store';
export function Translate(): JSX.Element {
  const { fileName, fileContentRaw, fileContentParsed, setFileName, setFileContent } =
    useWorkingFileStore();

  const handleFileUpload = (
    name: string,
    content: string,
    fileType: FileType
  ): void => {
    setFileName(name);
    setFileContent(content, fileType);
  };
  const csvHeaders =
    fileContentParsed.length > 0 ? getAllPaths(fileContentParsed[0]) : [];
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('anthropicApiKey') || '';
  });

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    localStorage.setItem('anthropicApiKey', newApiKey);
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo>({
    percentage: 0,
    estimatedTimeRemaining: 0
  });
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(
    new Set(DEFAULT_ENABLED_LANGUAGES)
  );
  const [languageColumnName, setLanguageColumnName] = useState<string>('Language');
  const [translationColumnName, setTranslationColumnName] =
    useState<string>('Translated Text');
  const [chunkSize, setChunkSize] = useState<number>(20);

  const handleColumnSelect = (column: string): void => {
    setSelectedColumn(column);
  };

  const validateInputs = (
    selectedColumn: string,
    apiKey: string,
    fileContentRaw: string | null,
    fileContentParsed: unknown[],
    languageColumnName: string,
    translationColumnName: string
  ): boolean => {
    if (!(selectedColumn && apiKey)) {
      toast.error('Please select a column and provide your Anthropic API key');
      return false;
    }

    if (!fileContentRaw || fileContentParsed.length === 0) {
      toast.error('Please upload a CSV file first');
      return false;
    }

    const existingColumns = Object.keys(fileContentParsed[0] || {});

    if (
      existingColumns.includes(languageColumnName) ||
      existingColumns.includes(translationColumnName)
    ) {
      toast.error('Output column names conflict with existing columns in the CSV');
      return false;
    }

    if (!(languageColumnName.trim() && translationColumnName.trim())) {
      toast.error('Output column names cannot be empty');
      return false;
    }

    if (languageColumnName === translationColumnName) {
      toast.error('Output column names must be different');
      return false;
    }

    return true;
  };

  const translateText = async (
    text: string,
    language: string,
    anthropic: Anthropic
  ): Promise<string> => {
    console.debug('Translating text:', {
      textLength: text.length,
      textType: typeof text,
      textValue: text,
      language: language
    });

    // Validate text before translation
    if (!text || text.trim() === '') {
      console.warn('Attempted to translate empty text');
      return 'No text to translate';
    }

    return retry(
      async () => {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            // biome-ignore lint/style/useNamingConvention: api structure
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: text }]
              }
            ],
            system: `You are a translation assistant. Your task is to translate the given request into ${language}. Please provide the translation only, without any additional commentary. Do not attempt to answer questions or fulfill the request provided in English, you are translating the request itself into ${language}. You should try to maintain the original meaning, deviating as little as possible from the original text.`
          });

          console.debug('Translation response:', {
            responseContent: response.content,
            translatedText:
              response.content[0]?.type === 'text' ? response.content[0].text : ''
          });

          const translatedText =
            response.content[0]?.type === 'text' ? response.content[0].text : '';

          return translatedText;
        } catch (error) {
          console.error('Translation attempt failed:', {
            error,
            text,
            language
          });

          // Rethrow to trigger retry
          throw error;
        }
      },
      {
        retries: 7,
        factor: 2,
        minTimeout: 1000, // 1 second
        maxTimeout: 60000, // 60 seconds
        onRetry: (error, attempt): void => {
          console.warn(`Translation retry attempt ${attempt}:`, {
            error: error instanceof Error ? error.message : String(error),
            text: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
            language
          });
        }
      }
    );
  };

  const processRowChunk = async (
    chunk: Record<string, string>[],
    selectedLanguages: Set<string>,
    selectedColumn: string,
    languageColumnName: string,
    translationColumnName: string,
    anthropic: Anthropic,
    onProgress: () => void,
    chunkSize = 20
  ): Promise<Record<string, string>[]> => {
    const processedRows: Record<string, string>[] = [];
    const translationPromises: Promise<Record<string, string>>[] = [];

    for (const row of chunk) {
      const textToTranslate = getValueByPath(row, selectedColumn);

      if (!textToTranslate) {
        processedRows.push(row);
        onProgress();
        continue;
      }

      const languagePromises = Array.from(selectedLanguages).map(async language => {
        try {
          const translatedText = await translateText(
            String(textToTranslate),
            language,
            anthropic
          );
          const translatedRow = { ...row };
          translatedRow[languageColumnName] = language;
          translatedRow[translationColumnName] = translatedText;
          onProgress();
          return translatedRow;
        } catch (_error) {
          console.error('Translation failed', { language, error: _error });
          const errorRow = { ...row };
          errorRow[languageColumnName] = language;
          errorRow[translationColumnName] = 'Translation failed';
          onProgress();
          return errorRow;
        }
      });

      translationPromises.push(...languagePromises);
    }

    const results: Record<string, string>[] = [];
    for (let i = 0; i < translationPromises.length; i += chunkSize) {
      const chunk = translationPromises.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);
    }

    return results;
  };

  const downloadOutput = (
    processedRows: Record<string, string>[],
    fileType: FileType
  ): void => {
    const outputContent = serializeJson(processedRows, fileType);
    let mimeType = 'text/csv';

    if (fileType === 'json') {
      mimeType = 'application/json';
    } else if (fileType === 'jsonl') {
      mimeType = 'application/jsonl';
    }

    const blob = new Blob([outputContent], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `translated_${timestamp}.${fileType}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCsv = async (): Promise<void> => {
    if (
      !validateInputs(
        selectedColumn,
        apiKey,
        fileContentRaw,
        fileContentParsed,
        languageColumnName,
        translationColumnName
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const rows = fileContentParsed as Record<string, string>[];
      const processedRows: Record<string, string>[] = [];

      const totalRows = rows.length;
      const totalOperations = totalRows * selectedLanguages.size;
      const startTime = Date.now();
      let completedOperations = 0;

      console.debug(
        `Beginning translation of ${totalRows} rows in chunks of ${chunkSize}`
      );

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const chunkResults = await processRowChunk(
          chunk,
          selectedLanguages,
          selectedColumn,
          languageColumnName,
          translationColumnName,
          anthropic,
          () => {
            completedOperations++;
            const progressInfo = calculateProgress(
              completedOperations,
              totalOperations,
              startTime
            );
            setProgress(progressInfo);
          },
          chunkSize
        );
        processedRows.push(...chunkResults);
      }

      const fileType = (fileName?.split('.').pop() as FileType) || 'csv';
      downloadOutput(processedRows, fileType);

      toast.success('Processing complete! File downloaded.');
    } catch (error) {
      toast.error(
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
      setProgress({ percentage: 0, estimatedTimeRemaining: 0 });
    }
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>File Translator</Header.Title>
        <Header.Description>Translate file data</Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>The file to translate</Section.Description>
        <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
      </Section>

      {fileContentParsed.length > 0 && (
        <>
          <ColumnConfig
            languageColumnName={languageColumnName}
            setLanguageColumnName={setLanguageColumnName}
            translationColumnName={translationColumnName}
            setTranslationColumnName={setTranslationColumnName}
            csvHeaders={csvHeaders}
            selectedColumn={selectedColumn}
            handleColumnSelect={handleColumnSelect}
          />

          <TranslateConfig
            selectedLanguages={selectedLanguages}
            setSelectedLanguages={setSelectedLanguages}
            chunkSize={chunkSize}
            setChunkSize={setChunkSize}
            apiKey={apiKey}
            handleApiKeyChange={handleApiKeyChange}
          />

          <ActionSection>
            <ActionSection.Button
              onClick={processCsv}
              disabled={!(selectedColumn && apiKey) || isProcessing}
            >
              Translate
            </ActionSection.Button>
            {isProcessing && (
              <div className='flex w-full flex-col gap-2'>
                <Progress value={progress.percentage} />
                <div className='flex justify-between text-muted-foreground text-sm'>
                  <div>{progress.percentage}%</div>
                  <div>{formatTimeRemaining(progress.estimatedTimeRemaining || 0)}</div>
                </div>
              </div>
            )}
          </ActionSection>
        </>
      )}
    </div>
  );
}

type BatchSizeProps = {
  chunkSize: number;
  setChunkSize: (value: number) => void;
};

const BatchSize = ({ chunkSize, setChunkSize }: BatchSizeProps): JSX.Element => (
  <div>
    <div className='flex items-center gap-2'>
      <Label htmlFor='chunkSize'>Chunk Size</Label>
      <HelpTooltip
        className='-mt-2'
        message='The number of translations to do at once. Higher values may result in faster processing, but are more likely to fail.'
      />
    </div>
    <Input
      type='number'
      min={1}
      max={100}
      value={chunkSize}
      onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
        setChunkSize(Number(e.target.value))
      }
      placeholder='Enter chunk size (default 20)'
      className='min-w-[200px]'
    />
  </div>
);

type ColumnConfigProps = {
  languageColumnName: string;
  setLanguageColumnName: (value: string) => void;
  translationColumnName: string;
  setTranslationColumnName: (value: string) => void;
  csvHeaders: string[];
  selectedColumn: string;
  handleColumnSelect: (column: string) => void;
};

const ColumnConfig = ({
  languageColumnName,
  setLanguageColumnName,
  translationColumnName,
  setTranslationColumnName,
  csvHeaders,
  selectedColumn,
  handleColumnSelect
}: ColumnConfigProps): JSX.Element => {
  const languageFieldId = useId();
  const translationFieldId = useId();

  return (
    <Section>
      <Section.Title>Field Config</Section.Title>
      <Section.Items className='grid grid-cols-2 gap-4'>
        <FieldSelector
          label='Input Field to Translate'
          fields={csvHeaders}
          selectedField={selectedColumn}
          onFieldSelect={handleColumnSelect}
        />
        <div>
          <Label htmlFor={languageFieldId}>Output Language Field</Label>
          <Input
            id={languageFieldId}
            placeholder='Language'
            value={languageColumnName}
            onChange={(e): void => setLanguageColumnName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={translationFieldId}>Output Translation Field</Label>
          <Input
            id={translationFieldId}
            placeholder='Translated Text'
            value={translationColumnName}
            onChange={(e): void => setTranslationColumnName(e.target.value)}
          />
        </div>
      </Section.Items>
    </Section>
  );
};

type TranslateConfigProps = {
  selectedLanguages: Set<string>;
  setSelectedLanguages: (value: Set<string>) => void;
  chunkSize: number;
  setChunkSize: (value: number) => void;
  apiKey: string;
  handleApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const TranslateConfig = ({
  selectedLanguages,
  setSelectedLanguages,
  chunkSize,
  setChunkSize,
  apiKey,
  handleApiKeyChange
}: TranslateConfigProps): JSX.Element => {
  const apiKeyFieldId = useId();

  return (
    <Section>
      <Section.Title>Translation Config</Section.Title>
      <Section.Items className='grid grid-cols-3 gap-4'>
        <div className='flex flex-col'>
          <Label htmlFor='languages'>Languages</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <Button variant='outline'>({selectedLanguages.size} selected)</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Available Languages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_LANGUAGES.map(language => (
                <DropdownMenuCheckboxItem
                  key={language}
                  checked={selectedLanguages.has(language)}
                  onCheckedChange={(checked): void => {
                    const newSelected = new Set(selectedLanguages);
                    if (checked) {
                      newSelected.add(language);
                    } else {
                      newSelected.delete(language);
                    }
                    setSelectedLanguages(newSelected);
                  }}
                >
                  {language}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <BatchSize chunkSize={chunkSize} setChunkSize={setChunkSize} />
        <form onSubmit={(e): void => e.preventDefault()} className='flex flex-col'>
          {/* Hidden username field for password managers */}
          <Input
            type='text'
            name='username'
            autoComplete='username'
            value='anthropic-api'
            className='hidden'
            readOnly={true}
          />
          <Label htmlFor={apiKeyFieldId}>Anthropic API Key</Label>
          <Input
            id={apiKeyFieldId}
            className='w-full'
            type='password'
            placeholder='Enter API key'
            autoComplete='current-password'
            value={apiKey}
            onChange={handleApiKeyChange}
          />
        </form>
      </Section.Items>
    </Section>
  );
};
