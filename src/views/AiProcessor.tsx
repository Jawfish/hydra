import { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import Papa from 'papaparse';
import { Progress } from "@/components/ui/progress";

const LANGUAGES = [
  "German",
  "Spanish", 
  "French",
  "Italian",
  "Portuguese", 
  "Japanese",
  "Korean"
] as const;

import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { FieldSelector } from '@/components/FieldSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useFileStore } from '@/store/store';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CLAUDE_MODELS = [
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  { id: 'claude-2.1', name: 'Claude 2.1' }
] as const;

export function AiProcessor() {
  const { fileType, csvHeaders, fileContent } = useFileStore();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(CLAUDE_MODELS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
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

    if (!apiKey) {
      toast.error('Please enter your Anthropic API key');
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
      const processedRows = [];
      
      // Calculate total operations for progress
      const totalOperations = rows.length * LANGUAGES.length;
      let completedOperations = 0;

      for (const row of rows) {
        // Create translations for each language
        for (const language of LANGUAGES) {
          try {
            const response = await anthropic.messages.create({
              max_tokens: 1024,
              messages: [{
                role: 'user',
                content: row[selectedColumn]
              }],
              model: selectedModel,
              system: `You are a translation assistant. Your task is to translate the given request into ${language}. Please provide the translation only, without any additional commentary. Do not attempt to answer questions or fulfill the request provided in English, you are translating the request itself into ${language}. You should try to maintain the original meaning, deviating as little as possible from the original text.`
            });

            const translatedRow = { ...row };
            // Add language and translation columns using configured names
            translatedRow[languageColumnName] = language;
            translatedRow[translationColumnName] = response.content[0].text;
            processedRows.push(translatedRow);

            completedOperations++;
            setProgress(Math.round((completedOperations / totalOperations) * 100));
          } catch (error) {
            console.error(`Error processing translation to ${language}:`, error);
            const errorRow = { ...row };
            errorRow[languageColumnName] = language;
            errorRow[translationColumnName] = 'Error processing translation';
            processedRows.push(errorRow);
            completedOperations++;
          }
        }
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
          Translate CSV data into {LANGUAGES.length} languages using Claude AI
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
              <h3 className='text-lg font-semibold mb-4'>Select Model</h3>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {CLAUDE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
