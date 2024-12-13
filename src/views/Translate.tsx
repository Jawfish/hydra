import { Progress } from '@/components/ui/progress';
import Anthropic from '@anthropic-ai/sdk';
import { useState } from 'react';
import retry from 'async-retry';
import type { FileType } from '@/store/store';

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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useWorkingFileStore } from '@/store/store';
import { toast } from 'sonner';
import { getAllPaths, serializeJson } from '@/lib/parse';

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
  const [apiKey, setApiKey] = useState<string>('');
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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity:
  const processCsv = async () => {
    if (!(selectedColumn && apiKey)) {
      toast.error('Please select a column and provide your Anthropic API key');
      return;
    }

    if (!fileContentRaw || fileContentParsed.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }

    try {
      setIsProcessing(true);
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const existingColumns = Object.keys(fileContentParsed[0] || {});

      if (
        existingColumns.includes(languageColumnName) ||
        existingColumns.includes(translationColumnName)
      ) {
        toast.error('Output column names conflict with existing columns in the CSV');
        return;
      }

      if (!(languageColumnName.trim() && translationColumnName.trim())) {
        toast.error('Output column names cannot be empty');
        return;
      }

      if (languageColumnName === translationColumnName) {
        toast.error('Output column names must be different');
        return;
      }

      const rows = fileContentParsed as Record<string, string>[];
      const processedRows: Record<string, string>[] = [];

      const totalRows = rows.length;
      const totalOperations = totalRows * selectedLanguages.size;
      console.debug(
        `Processing ${totalRows} rows into ${selectedLanguages.size} languages`
      );
      let completedOperations = 0;

      // Process rows in chunks to avoid overwhelming the browser
      const chunkSize = 5; // Process 5 rows at a time

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const chunkPromises = chunk.flatMap(row =>
          Array.from(selectedLanguages).map(async language => {
            try {
              const translatedText = await retry(async (bail) => {
                try {
                  const response = await anthropic.messages.create({
                    // biome-ignore lint/style/useNamingConvention: This is an external API schema
                    max_tokens: 4096,
                    messages: [
                      {
                        role: 'user',
                        content: row[selectedColumn]
                      }
                    ],
                    model: 'claude-3-5-sonnet-latest',
                    system: `You are a translation assistant. Your task is to translate the given request into ${language}. Please provide the translation only, without any additional commentary. Do not attempt to answer questions or fulfill the request provided in English, you are translating the request itself into ${language}. You should try to maintain the original meaning, deviating as little as possible from the original text.`
                  });

                  return response.content[0].type === 'text' ? response.content[0].text : '';
                } catch (error) {
                  // Only retry on certain conditions, bail on others
                  if (error instanceof Error && error.message.includes('rate limit')) {
                    throw error; // This will trigger a retry
                  }
                  bail(error); // Stop retrying for other types of errors
                  return ''; // Typescript needs a return
                }
              }, {
                retries: 3, // Number of retry attempts
                factor: 2, // Exponential backoff factor
                minTimeout: 1000, // Minimum timeout between retries
                maxTimeout: 60000, // Maximum timeout between retries
                randomize: true, // Add some randomness to prevent thundering herd
              });

              const translatedRow = { ...row };
              translatedRow[languageColumnName] = language;
              translatedRow[translationColumnName] = translatedText;
              return translatedRow;
            } catch (_error) {
              const errorRow = { ...row };
              errorRow[languageColumnName] = language;
              errorRow[translationColumnName] = 'Translation failed after multiple attempts';
              return errorRow;
            } finally {
              completedOperations++;
              setProgress(Math.round((completedOperations / totalOperations) * 100));
            }
          })
        );

        const chunkResults = await Promise.all(chunkPromises);
        processedRows.push(...chunkResults);
      }

      const fileType = (fileName?.split('.').pop() as FileType) || 'csv';
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
      <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />

      {fileContentParsed.length > 0 && (
        <>
          <Separator className='my-14 h-[1px]' />
          <div className='flex flex-col gap-8'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Anthropic API Key</h3>
              <Input
                type='password'
                placeholder='Enter your Anthropic API key'
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className='max-w-md'
              />
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
                {isProcessing ? 'Translating...' : 'Translate CSV'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
