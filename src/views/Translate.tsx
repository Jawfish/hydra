import { Progress } from '@/shadcn/components/ui/progress';
import type { FileType } from '@/store/store';
import Anthropic from '@anthropic-ai/sdk';
import retry from 'async-retry';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

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

import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
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
import { Separator } from '@/shadcn/components/ui/separator';
import { useWorkingFileStore } from '@/store/store';
import { toast } from 'sonner';

export function Translate() {
  const { fileName, fileContentRaw, fileContentParsed, setFileName, setFileContent } =
    useWorkingFileStore();

  const handleFileUpload = (name: string, content: string, fileType: FileType) => {
    setFileName(name);
    setFileContent(content, fileType);
  };
  const csvHeaders =
    fileContentParsed.length > 0 ? getAllPaths(fileContentParsed[0]) : [];
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('anthropicApiKey') || '';
  });

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    localStorage.setItem('anthropicApiKey', newApiKey);
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(
    new Set(DEFAULT_ENABLED_LANGUAGES)
  );
  const [languageColumnName, setLanguageColumnName] = useState<string>('Language');
  const [translationColumnName, setTranslationColumnName] =
    useState<string>('Translated Text');

  const handleColumnSelect = (column: string) => {
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
    return await retry(
      async () => {
        try {
          const response = await anthropic.messages.create({
            // biome-ignore lint/style/useNamingConvention: API requires snake_case
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: text
              }
            ],
            model: 'claude-3-5-sonnet-latest',
            system: `You are a translation assistant. Your task is to translate the given request into ${language}. Please provide the translation only, without any additional commentary. Do not attempt to answer questions or fulfill the request provided in English, you are translating the request itself into ${language}. You should try to maintain the original meaning, deviating as little as possible from the original text.`
          });

          return response.content[0].type === 'text' ? response.content[0].text : '';
        } catch (error) {
          // Log the error for debugging
          console.warn('Translation attempt failed:', error);
          // Rethrow to trigger retry
          throw error;
        }
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        randomize: true
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
    onProgress: () => void
  ): Promise<Record<string, string>[]> => {
    const chunkPromises = chunk.flatMap(row =>
      Array.from(selectedLanguages).map(async language => {
        try {
          const translatedText = await translateText(
            row[selectedColumn],
            language,
            anthropic
          );
          const translatedRow = { ...row };
          translatedRow[languageColumnName] = language;
          translatedRow[translationColumnName] = translatedText;
          return translatedRow;
        } catch (_error) {
          const errorRow = { ...row };
          errorRow[languageColumnName] = language;
          errorRow[translationColumnName] =
            'Translation failed after multiple attempts';
          return errorRow;
        } finally {
          onProgress();
        }
      })
    );

    return Promise.all(chunkPromises);
  };

  const downloadOutput = (
    processedRows: Record<string, string>[],
    fileType: FileType
  ) => {
    const outputContent = serializeJson(processedRows, fileType);
    const blob = new Blob([outputContent], {
      type:
        fileType === 'json'
          ? 'application/json'
          : fileType === 'jsonl'
            ? 'application/jsonl'
            : 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `translated_${timestamp}.${fileType}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCsv = async () => {
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
      console.debug(
        `Processing ${totalRows} rows into ${selectedLanguages.size} languages`
      );
      let completedOperations = 0;

      const chunkSize = 20;

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
            setProgress(Math.round((completedOperations / totalOperations) * 100));
          }
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
      setProgress(0);
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>File Translator</Header.Title>
        <Header.Description>Translate file data</Header.Description>
      </Header>

      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>Working File</h3>
        <p className='text-muted-foreground text-sm'>
          The file to translate
        </p>
      </div>
      <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />

      {fileContentParsed.length > 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <div className='flex flex-col gap-8'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Anthropic API Key</h3>
              <form onSubmit={e => e.preventDefault()} className='max-w-md'>
                {/* Hidden username field for password managers */}
                <input
                  type='text'
                  name='username'
                  autoComplete='username'
                  value='anthropic-api'
                  className='hidden'
                  readOnly={true}
                />
                <label
                  htmlFor='anthropicApiKey'
                  className='block text-sm font-medium mb-2'
                >
                  Anthropic API Key
                </label>
                <Input
                  id='anthropicApiKey'
                  type='password'
                  placeholder='Enter your Anthropic API key'
                  autoComplete='current-password'
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className='w-full'
                />
              </form>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Select Column to Process</h3>
              <FieldSelector
                fields={csvHeaders}
                selectedField={selectedColumn}
                onFieldSelect={handleColumnSelect}
              />
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Output Column Names</h3>
              <div className='flex flex-col gap-4 max-w-md'>
                <div>
                  <label
                    htmlFor='languageColumn'
                    className='block text-sm font-medium mb-2'
                  >
                    Language Column Name
                  </label>
                  <Input
                    id='languageColumn'
                    placeholder='Language'
                    value={languageColumnName}
                    onChange={e => setLanguageColumnName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor='translationColumn'
                    className='block text-sm font-medium mb-2'
                  >
                    Translation Column Name
                  </label>
                  <Input
                    id='translationColumn'
                    placeholder='Translated Text'
                    value={translationColumnName}
                    onChange={e => setTranslationColumnName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Languages to Translate To</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild={true}>
                  <Button variant='outline'>
                    Select Languages
                    <span className='text-xs text-muted-foreground'>
                      ({selectedLanguages.size} selected)
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-[200px]'>
                  <DropdownMenuLabel>Available Languages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_LANGUAGES.map(language => (
                    <DropdownMenuCheckboxItem
                      key={language}
                      checked={selectedLanguages.has(language)}
                      onCheckedChange={checked => {
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

            <div className='flex flex-col gap-4'>
              {isProcessing && (
                <div className='flex flex-col gap-2'>
                  <Progress value={progress} />
                  <p className='text-sm text-muted-foreground text-center'>
                    {progress}% complete
                  </p>
                </div>
              )}
              <Button
                onClick={processCsv}
                disabled={isProcessing || !selectedColumn || !apiKey}
                className='max-w-min'
              >
                {isProcessing ? (
                  <div className='flex items-center'>
                    <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                    Translating...
                  </div>
                ) : (
                  'Translate'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
