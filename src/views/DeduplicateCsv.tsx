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

  const processBackfill = () => {
    if (!(primaryCsv && secondaryCsv)) {
      toast.error('Please upload both files');
      return;
    }

    if (
      !(
        primaryMatchColumn &&
        secondaryMatchColumn &&
        primaryTargetColumn &&
        secondarySourceColumn
      )
    ) {
      toast.error('Please select all required columns');
      return;
    }

    try {
      // Parse secondary file for lookup
      let lookupMap = new Map();
      
      if (secondaryFileType === 'csv') {
        const secondaryData = Papa.parse(secondaryCsv, { header: true }).data as Record<
          string,
          string
        >[];
        lookupMap = new Map(
          secondaryData.map(row => [
            normalizeString(row[secondaryMatchColumn]),
            row[secondarySourceColumn]
          ])
        );
      } else {
        const secondaryData = secondaryFileType === 'jsonl' 
          ? parseJsonl(secondaryCsv)
          : JSON.parse(secondaryCsv);
        const secondaryObjects = Array.isArray(secondaryData) ? secondaryData : [secondaryData];
        
        lookupMap = new Map(
          secondaryObjects.map(obj => [
            normalizeString(getValueByPath(obj, secondaryMatchColumn)),
            getValueByPath(obj, secondarySourceColumn)
          ])
        );
      }

      // Process primary file
      let updatedData;
      
      if (primaryFileType === 'csv') {
        const primaryData = Papa.parse(primaryCsv, { header: true }).data as Record<
          string,
          string
        >[];
        
        updatedData = primaryData.map(row => {
          const newRow = { ...row };
          if (!row[primaryTargetColumn] || row[primaryTargetColumn].trim() === '') {
            const matchValue = normalizeString(row[primaryMatchColumn]);
            const backfillValue = lookupMap.get(matchValue);
            if (backfillValue) {
              newRow[primaryTargetColumn] = backfillValue;
            }
          }
          return newRow;
        });
      } else {
        const primaryData = primaryFileType === 'jsonl'
          ? parseJsonl(primaryCsv)
          : JSON.parse(primaryCsv);
        const primaryObjects = Array.isArray(primaryData) ? primaryData : [primaryData];
        
        updatedData = primaryObjects.map(obj => {
          const newObj = { ...obj };
          const currentValue = getValueByPath(obj, primaryTargetColumn);
          
          if (!currentValue || String(currentValue).trim() === '') {
            const matchValue = normalizeString(getValueByPath(obj, primaryMatchColumn));
            const backfillValue = lookupMap.get(matchValue);
            
            if (backfillValue) {
              // Set nested value
              let current = newObj;
              const parts = primaryTargetColumn.split('.');
              const lastPart = parts.pop()!;
              
              for (const part of parts) {
                current = current[part] = current[part] || {};
              }
              
              current[lastPart] = backfillValue;
            }
          }
          return newObj;
        });
      }

      // Generate output file
      const output = primaryFileType === 'csv' 
        ? Papa.unparse(updatedData)
        : JSON.stringify(updatedData, null, 2);
      
      const blob = new Blob([output], { 
        type: primaryFileType === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = primaryFileType === 'csv' ? 'csv' : 'json';
      a.download = `backfilled_${timestamp}.${extension}`;
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
            <Button variant='secondary' asChild={true}>
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
                Select File
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
            <Button variant='secondary' asChild={true}>
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
                Select File
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
