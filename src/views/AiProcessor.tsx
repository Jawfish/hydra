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

export function AiProcessor() {
  const { fileType, csvHeaders, fileContent } = useFileStore();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [newColumnName, setNewColumnName] = useState<string>('');
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

    if (!fileContent || fileType !== 'csv') {
      toast.error('Please upload a CSV file first');
      return;
    }

    try {
      setIsProcessing(true);
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
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
            model: 'claude-3-opus-20240229'
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
                disabled={isProcessing || !selectedColumn || !newColumnName}
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
