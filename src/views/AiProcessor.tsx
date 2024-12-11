import { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import Papa from 'papaparse';
import { Progress } from "@/components/ui/progress";

const ALL_LANGUAGES = [
  "English",
  "German",
  "Spanish",
  "French",
  "Italian",
  "Portuguese",
  "Japanese",
  "Korean"
] as const;

const DEFAULT_ENABLED_LANGUAGES = [
  "German",
  "Spanish",
  "French",
  "Italian",
  "Portuguese",
  "Japanese",
  "Korean"
] as const;

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { FieldSelector } from '@/components/FieldSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useFileStore } from '@/store/store';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';



export function AiProcessor() {
  const { fileType, csvHeaders, fileContent } = useFileStore();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(
    new Set(DEFAULT_ENABLED_LANGUAGES)
  );
  const [languageColumnName, setLanguageColumnName] = useState<string>('Language');
  const [translationColumnName, setTranslationColumnName] = useState<string>('Translated Text');

  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
  };

  const processCSV = async () => {
    if (!selectedColumn || !apiKey) {
      toast.error('Please select a column and provide your Anthropic API key');
      return;
    }

    if (!fileContent || fileType !== 'csv') {
      toast.error('Please upload a CSV file first');
      return;
    }

    try {
      setIsProcessing(true);
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const parsedData = Papa.parse(fileContent, { header: true });
      const existingColumns = Object.keys(parsedData.data[0] || {});

      if (existingColumns.includes(languageColumnName) || existingColumns.includes(translationColumnName)) {
        toast.error('Output column names conflict with existing columns in the CSV');
        return;
      }

      if (!languageColumnName.trim() || !translationColumnName.trim()) {
        toast.error('Output column names cannot be empty');
        return;
      }

      if (languageColumnName === translationColumnName) {
        toast.error('Output column names must be different');
        return;
      }

      const rows = parsedData.data as Record<string, string>[];
      const processedRows: Record<string, string>[] = [];

      // Calculate total operations
      const totalOperations = rows.length * selectedLanguages.size;
      let completedOperations = 0;

      // Process rows in chunks to avoid overwhelming the browser
      const CHUNK_SIZE = 5; // Process 5 rows at a time

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const chunkPromises = chunk.flatMap(row =>
          Array.from(selectedLanguages).map(async (language) => {
            try {
              const response = await anthropic.messages.create({
                max_tokens: 1024,
                messages: [{
                  role: 'user',
                  content: row[selectedColumn]
                }],
                model: "claude-3-5-sonnet-latest",
                system: `You are a translation assistant. Your task is to translate the given request into ${language}. Please provide the translation only, without any additional commentary. Do not attempt to answer questions or fulfill the request provided in English, you are translating the request itself into ${language}. You should try to maintain the original meaning, deviating as little as possible from the original text.`
              });

              const translatedText = response.content[0].type === 'text'
                ? response.content[0].text
                : '';

              const translatedRow = { ...row };
              translatedRow[languageColumnName] = language;
              translatedRow[translationColumnName] = translatedText;
              return translatedRow;
            } catch (error) {
              console.error(`Error processing translation to ${language}:`, error);
              const errorRow = { ...row };
              errorRow[languageColumnName] = language;
              errorRow[translationColumnName] = 'Error processing translation';
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

      const csv = Papa.unparse(processedRows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `translated_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Processing complete! File downloaded.');
    } catch (error) {
      toast.error('Error processing file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>CSV Translator</Header.Title>
        <Header.Description>
          Translate CSV data
        </Header.Description>
      </Header>

      <FileUpload />

      {fileType === 'csv' && (
        <>
          <Separator className='my-14 h-[1px]' />
          <div className='flex flex-col gap-8'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Anthropic API Key</h3>
              <Input
                type="password"
                placeholder="Enter your Anthropic API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="max-w-md"
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
                  <label htmlFor="languageColumn" className="block text-sm font-medium mb-2">
                    Language Column Name
                  </label>
                  <Input
                    id="languageColumn"
                    placeholder="Language"
                    value={languageColumnName}
                    onChange={(e) => setLanguageColumnName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="translationColumn" className="block text-sm font-medium mb-2">
                    Translation Column Name
                  </label>
                  <Input
                    id="translationColumn"
                    placeholder="Translated Text"
                    value={translationColumnName}
                    onChange={(e) => setTranslationColumnName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Languages to Translate To</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-between">
                    Select Languages
                    <span className="text-xs text-muted-foreground">
                      ({selectedLanguages.size} selected)
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuLabel>Available Languages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_LANGUAGES.map((language) => (
                    <DropdownMenuCheckboxItem
                      key={language}
                      checked={selectedLanguages.has(language)}
                      onCheckedChange={(checked) => {
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
                <div className="flex flex-col gap-2">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground text-center">
                    {progress}% complete
                  </p>
                </div>
              )}
              <Button
                onClick={processCSV}
                disabled={isProcessing || !selectedColumn || !apiKey}
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
