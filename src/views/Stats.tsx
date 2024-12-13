import { useFileUpload } from '@/hooks/use-file-upload';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  type FieldAnalysisDetail,
  analyzeField,
  analyzeFieldDetails
} from '@/lib/fileAnalysis';
import { getAllPaths } from '@/lib/parse';
import { useWorkingFileStore } from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FileStatisticsProps {
  fileName: string;
  rowCount: number;
}

interface SchemaDisplayProps {
  schema: string[];
}

interface FieldAnalysisTableProps {
  schema: string[];
  data: Record<string, unknown>[];
}

interface DetailedAnalysisSectionProps {
  schema: string[];
  data: Record<string, unknown>[];
  selectedIdentifier: string;
  setSelectedIdentifier: (value: string) => void;
  selectedAnalysisField: string;
  setSelectedAnalysisField: (value: string) => void;
  fieldAnalysis: FieldAnalysisDetail[];
}

const FileStatistics: React.FC<FileStatisticsProps> = ({ fileName, rowCount }) => (
  <div className='rounded-lg border p-4'>
    <h3 className='font-medium mb-2'>File Information</h3>
    <p>Name: {fileName}</p>
    <p>Total Rows: {rowCount}</p>
  </div>
);

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schema }) => (
  <div className='rounded-lg border p-4'>
    <h3 className='font-medium mb-2'>Schema</h3>
    <ScrollArea className='h-[100px]'>
      <div className='space-y-1'>
        {schema.map(field => (
          <p key={field} className='text-sm'>
            {field}
          </p>
        ))}
      </div>
    </ScrollArea>
  </div>
);

const FieldAnalysisTable: React.FC<FieldAnalysisTableProps> = ({ schema, data }) => (
  <div className='rounded-lg border p-4'>
    <h3 className='font-medium mb-4'>Field Analysis</h3>
    <div className='grid grid-cols-4 gap-4 text-sm font-medium mb-2'>
      <div>Field</div>
      <div>Non-Empty</div>
      <div>Empty</div>
      <div>Unique Values</div>
    </div>
    <ScrollArea className='h-[300px]'>
      <div className='space-y-2'>
        {schema.map(field => {
          const analysis = analyzeField(data, field);
          return (
            <div key={field} className='grid grid-cols-4 gap-4 text-sm'>
              <div className='truncate' title={field}>
                {field}
              </div>
              <div>{analysis.nonEmptyCount}</div>
              <div>{analysis.emptyCount}</div>
              <div>{analysis.uniqueValues}</div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  </div>
);

const DetailedAnalysisSection: React.FC<DetailedAnalysisSectionProps> = ({
  schema,

  // biome-ignore lint/correctness/noUnusedVariables: might be useful in future
  // biome-ignore lint/correctness/noUnusedFunctionParameters: same as above
  data,
  selectedIdentifier,
  setSelectedIdentifier,
  selectedAnalysisField,
  setSelectedAnalysisField,
  fieldAnalysis
}: {
  schema: string[];
  data: Record<string, unknown>[];
  selectedIdentifier: string;
  setSelectedIdentifier: (value: string) => void;
  selectedAnalysisField: string;
  setSelectedAnalysisField: (value: string) => void;
  fieldAnalysis: FieldAnalysisDetail[];
}) => {
  console.debug('DetailedAnalysisSection props:', {
    selectedIdentifier,
    selectedAnalysisField,
    fieldAnalysisLength: fieldAnalysis.length,
    fieldAnalysisSample: fieldAnalysis.slice(0, 2)
  });

  return (
    <div className='rounded-lg border p-4'>
      <h3 className='font-medium mb-4'>Detailed Analysis</h3>
      <div className='flex gap-4 mb-4'>
        <div className='flex flex-col gap-2'>
          <label htmlFor='identifier-field' className='text-sm font-medium'>
            Identifier Field
          </label>
          <Select value={selectedIdentifier} onValueChange={setSelectedIdentifier}>
            <SelectTrigger>
              <SelectValue placeholder='Select identifier field...' />
            </SelectTrigger>
            <SelectContent>
              {schema.map(field => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2'>
          <label htmlFor='analyze-field' className='text-sm font-medium'>
            Analyze Field
          </label>
          <Select
            value={selectedAnalysisField}
            onValueChange={setSelectedAnalysisField}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select field to analyze...' />
            </SelectTrigger>
            <SelectContent>
              {schema.map(field => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {fieldAnalysis.length > 0 ? (
        <div>
          <h4 className='text-sm font-medium mb-2'>
            Empty values in {selectedAnalysisField} ( {fieldAnalysis.length})
          </h4>
          <ScrollArea className='h-[200px]'>
            <ul className='space-y-2'>
              {fieldAnalysis.map((detail, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static data
                <li key={idx} className='text-sm'>
                  {selectedIdentifier}: {detail.identifier}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      ) : (
        <div className='text-sm text-muted-foreground'>
          {selectedIdentifier && selectedAnalysisField
            ? 'No empty values found for the selected field.'
            : 'Please select both identifier and analysis fields to see results.'}
        </div>
      )}
    </div>
  );
};

export const Stats: React.FC = () => {
  const { fileName, fileContentParsed, setFileContent } = useWorkingFileStore();
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [selectedAnalysisField, setSelectedAnalysisField] = useState<string>('');
  const [fieldAnalysis, setFieldAnalysis] = useState<FieldAnalysisDetail[]>([]);

  const schema = fileName
    ? (() => {
        console.debug('Generating schema from first row:', fileContentParsed[0]);
        const paths = getAllPaths(fileContentParsed[0] || {});
        console.debug('Generated schema paths:', paths);
        return paths;
      })()
    : [];

  useEffect(() => {
    if (fileContentParsed.length > 0) {
      console.debug('Parsed content updated:', fileContentParsed);
      console.debug('Total rows:', fileContentParsed.length);
      console.debug('First few rows:', fileContentParsed.slice(0, 5));
      toast.success(`File analysis complete! ${fileContentParsed.length} rows loaded.`);
    }
  }, [fileContentParsed]);

  useEffect(() => {
    console.debug('Analyzing details:', {
      selectedAnalysisField,
      selectedIdentifier,
      fileContentParsed: fileContentParsed.length
    });

    if (selectedAnalysisField && selectedIdentifier && fileContentParsed.length > 0) {
      console.debug('Calling analyzeFieldDetails with:', {
        data: fileContentParsed[0],
        analysisField: selectedAnalysisField,
        identifierField: selectedIdentifier
      });

      const details = analyzeFieldDetails(
        fileContentParsed,
        selectedAnalysisField,
        selectedIdentifier
      );

      console.debug('Analyzed field details:', details);
      setFieldAnalysis(details);
    }
  }, [selectedAnalysisField, selectedIdentifier, fileContentParsed]);

  const handleFileUpload = useFileUpload('working');

  return (
    <div className='flex flex-col mb-12'>
      <div className='mb-10'>
        <Header>
          <Header.Title>File Statistics</Header.Title>
          <Header.Description>
            Analyze CSV, JSON, or JSONL files to get detailed statistics
          </Header.Description>
        </Header>
      </div>

      <div className='flex flex-col gap-8'>
        <div>
          <FileUpload onFileUpload={handleFileUpload} fileName={fileName} />
        </div>

        {fileName && fileContentParsed.length > 0 && (
          <div className='flex flex-col gap-6'>
            <div className='grid grid-cols-2 gap-4'>
              <FileStatistics fileName={fileName} rowCount={fileContentParsed.length} />
              {schema && <SchemaDisplay schema={schema} />}
            </div>

            <FieldAnalysisTable schema={schema} data={fileContentParsed} />

            <DetailedAnalysisSection
              schema={schema}
              data={fileContentParsed}
              selectedIdentifier={selectedIdentifier}
              setSelectedIdentifier={setSelectedIdentifier}
              selectedAnalysisField={selectedAnalysisField}
              setSelectedAnalysisField={setSelectedAnalysisField}
              fieldAnalysis={fieldAnalysis}
            />
          </div>
        )}
      </div>
    </div>
  );
};
