import { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import Papa from 'papaparse';

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
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(CLAUDE_MODELS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
  };

  const processCSV = async () => {
    if (!selectedColumn || !newColumnName) {
      toast.error('Please select a column and provide a name for the new column');
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
        apiKey: apiKey
      });

      const parsedData = Papa.parse(fileContent, { header: true });
      const rows = parsedData.data as Record<string, string>[];
      const processedRows = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const response = await anthropic.messages.create({
            max_tokens: 1024,
            messages: [{ 
              role: 'user', 
              content: `Process this text: ${row[selectedColumn]}`
            }],
            model: selectedModel
          });

          const processedRow = { ...row };
          processedRow[newColumnName] = response.content[0].text;
          processedRows.push(processedRow);
          
          setProgress(Math.round(((i + 1) / rows.length) * 100));
        } catch (error) {
          console.error(`Error processing row ${i}:`, error);
          processedRows.push({ ...row, [newColumnName]: 'Error processing row' });
        }
      }

      const csv = Papa.unparse(processedRows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processed.csv';
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
        <Header.Title>AI Processor</Header.Title>
        <Header.Description>
          Process CSV data with Claude AI and add results as a new column
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
              <h3 className='text-lg font-semibold mb-4'>New Column Name</h3>
              <Input
                placeholder="Enter name for the new column"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className='flex flex-col gap-4'>
              <Button 
                onClick={processCSV} 
                disabled={isProcessing || !selectedColumn || !newColumnName || !apiKey}
              >
                {isProcessing ? `Processing... ${progress}%` : 'Process CSV'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
