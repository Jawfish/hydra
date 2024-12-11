import { FieldSelector } from '@/components/FieldSelector';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';

export function DeduplicateCsv() {
  // State for primary CSV (the one to be deduplicated)
  const [primaryCsv, setPrimaryCsv] = useState<string>('');
  const [primaryHeaders, setPrimaryHeaders] = useState<string[]>([]);
  const [primaryMatchColumn, setPrimaryMatchColumn] = useState<string>('');

  // State for secondary CSV (the reference for duplicates)
  const [secondaryCsv, setSecondaryCsv] = useState<string>('');
  const [secondaryHeaders, setSecondaryHeaders] = useState<string[]>([]);
  const [secondaryMatchColumn, setSecondaryMatchColumn] = useState<string>('');

  const handleFileUpload = (file: File, isPrimary: boolean) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (isPrimary) {
        setPrimaryCsv(content);
        const result = Papa.parse(content, { header: true });
        setPrimaryHeaders(Object.keys(result.data[0] || {}));
      } else {
        setSecondaryCsv(content);
        const result = Papa.parse(content, { header: true });
        setSecondaryHeaders(Object.keys(result.data[0] || {}));
      }
    };
    reader.readAsText(file);
  };

  const processDeduplicate = () => {
    if (!(primaryCsv && secondaryCsv)) {
      toast.error('Please upload both CSV files');
      return;
    }

    if (!(primaryMatchColumn && secondaryMatchColumn)) {
      toast.error('Please select match columns for both files');
      return;
    }

    try {
      // Parse both CSVs
      const primaryData = Papa.parse(primaryCsv, { header: true }).data as Record<
        string,
        string
      >[];
      const secondaryData = Papa.parse(secondaryCsv, { header: true }).data as Record<
        string,
        string
      >[];

      // Create a Set of values from secondary CSV for O(1) lookup
      const secondaryValues = new Set(
        secondaryData.map(row => row[secondaryMatchColumn])
      );

      // Filter primary CSV to keep only rows that don't have matching values in secondary CSV
      const dedupedData = primaryData.filter(
        row => !secondaryValues.has(row[primaryMatchColumn])
      );

      // Generate new CSV
      const csv = Papa.unparse(dedupedData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `deduplicated_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        `Deduplication complete! Removed ${
          primaryData.length - dedupedData.length
        } duplicate rows.`
      );
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
          <Header.Title>Deduplicate CSV</Header.Title>
          <Header.Description>
            Remove rows from a CSV if they match values in another CSV
          </Header.Description>
        </Header>
      </div>

      <div className='flex flex-col gap-14'>
        {/* Primary CSV Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>
            Primary CSV (To Be Deduplicated)
          </h3>
          <div className='flex items-center gap-4'>
            <Button variant='outline' asChild={true}>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='.csv'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, true);
                    }
                  }}
                  className='hidden'
                />
                Choose File
              </label>
            </Button>
          </div>
          {primaryHeaders.length > 0 && (
            <div className='mt-6'>
              <h4 className='font-medium mb-2'>Match Column</h4>
              <FieldSelector
                fields={primaryHeaders}
                selectedField={primaryMatchColumn}
                onFieldSelect={setPrimaryMatchColumn}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Secondary CSV Section */}
        <div>
          <h3 className='text-lg font-semibold mb-4'>
            Secondary CSV (Reference for Duplicates)
          </h3>
          <div className='flex items-center gap-4'>
            <Button variant='outline' asChild={true}>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='.csv'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, false);
                    }
                  }}
                  className='hidden'
                />
                Choose File
              </label>
            </Button>
          </div>
          {secondaryHeaders.length > 0 && (
            <div className='mt-6'>
              <h4 className='font-medium mb-2'>Match Column</h4>
              <FieldSelector
                fields={secondaryHeaders}
                selectedField={secondaryMatchColumn}
                onFieldSelect={setSecondaryMatchColumn}
              />
            </div>
          )}
        </div>

        <Button
          onClick={processDeduplicate}
          disabled={
            !(primaryCsv && secondaryCsv && primaryMatchColumn && secondaryMatchColumn)
          }
          className='max-w-min'
        >
          Process Deduplication
        </Button>
      </div>
    </div>
  );
}
