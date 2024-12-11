import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';

export function BackfillCsv() {
  const [primaryCsv, setPrimaryCsv] = useState<string>('');
  const [secondaryCsv, setSecondaryCsv] = useState<string>('');
  const [primaryHeaders, setPrimaryHeaders] = useState<string[]>([]);
  const [secondaryHeaders, setSecondaryHeaders] = useState<string[]>([]);
  
  // Selected columns for matching
  const [primaryMatchColumn, setPrimaryMatchColumn] = useState<string>('');
  const [secondaryMatchColumn, setSecondaryMatchColumn] = useState<string>('');
  
  // Columns to backfill
  const [primaryTargetColumn, setPrimaryTargetColumn] = useState<string>('');
  const [secondarySourceColumn, setSecondarySourceColumn] = useState<string>('');

  const handlePrimaryCsvUpload = (content: string) => {
    setPrimaryCsv(content);
    const result = Papa.parse(content, { header: true });
    setPrimaryHeaders(Object.keys(result.data[0] || {}));
  };

  const handleSecondaryCsvUpload = (content: string) => {
    setSecondaryCsv(content);
    const result = Papa.parse(content, { header: true });
    setSecondaryHeaders(Object.keys(result.data[0] || {}));
  };

  const processBackfill = () => {
    if (!primaryCsv || !secondaryCsv) {
      toast.error('Please upload both CSV files');
      return;
    }

    if (!primaryMatchColumn || !secondaryMatchColumn || !primaryTargetColumn || !secondarySourceColumn) {
      toast.error('Please select all required columns');
      return;
    }

    try {
      // Parse both CSVs
      const primaryData = Papa.parse(primaryCsv, { header: true }).data as Record<string, string>[];
      const secondaryData = Papa.parse(secondaryCsv, { header: true }).data as Record<string, string>[];

      // Create lookup map from secondary CSV
      const lookupMap = new Map(
        secondaryData.map(row => [row[secondaryMatchColumn], row[secondarySourceColumn]])
      );

      // Process primary CSV
      const updatedData = primaryData.map(row => {
        const newRow = { ...row };
        if (!row[primaryTargetColumn] || row[primaryTargetColumn].trim() === '') {
          const matchValue = row[primaryMatchColumn];
          const backfillValue = lookupMap.get(matchValue);
          if (backfillValue) {
            newRow[primaryTargetColumn] = backfillValue;
          }
        }
        return newRow;
      });

      // Generate new CSV
      const csv = Papa.unparse(updatedData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `backfilled_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Processing complete! File downloaded.');
    } catch (error) {
      toast.error(
        `Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <div className='mb-10'>
        <Header>
          <Header.Title>Backfill CSV</Header.Title>
          <Header.Description>
            Backfill empty values in a CSV using data from another CSV
          </Header.Description>
        </Header>
      </div>

      <div className='flex flex-col gap-14'>
        {/* Primary CSV Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>Primary CSV (To Be Updated)</h3>
          <FileUpload 
            onFileContent={handlePrimaryCsvUpload}
            accept='.csv'
          />
          {primaryHeaders.length > 0 && (
            <div className='mt-6 flex flex-col gap-6'>
              <div>
                <h4 className='font-medium mb-2'>Match Column</h4>
                <FieldSelector
                  fields={primaryHeaders}
                  selectedField={primaryMatchColumn}
                  onFieldSelect={setPrimaryMatchColumn}
                />
              </div>
              <div>
                <h4 className='font-medium mb-2'>Column to Backfill</h4>
                <FieldSelector
                  fields={primaryHeaders}
                  selectedField={primaryTargetColumn}
                  onFieldSelect={setPrimaryTargetColumn}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Secondary CSV Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>Secondary CSV (Source of Data)</h3>
          <FileUpload 
            onFileContent={handleSecondaryCsvUpload}
            accept='.csv'
          />
          {secondaryHeaders.length > 0 && (
            <div className='mt-6 flex flex-col gap-6'>
              <div>
                <h4 className='font-medium mb-2'>Match Column</h4>
                <FieldSelector
                  fields={secondaryHeaders}
                  selectedField={secondaryMatchColumn}
                  onFieldSelect={setSecondaryMatchColumn}
                />
              </div>
              <div>
                <h4 className='font-medium mb-2'>Source Column</h4>
                <FieldSelector
                  fields={secondaryHeaders}
                  selectedField={secondarySourceColumn}
                  onFieldSelect={setSecondarySourceColumn}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={processBackfill}
          disabled={
            !primaryCsv ||
            !secondaryCsv ||
            !primaryMatchColumn ||
            !secondaryMatchColumn ||
            !primaryTargetColumn ||
            !secondarySourceColumn
          }
        >
          Process Backfill
        </Button>
      </div>
    </div>
  );
}
