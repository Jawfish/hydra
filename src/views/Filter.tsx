import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  getAllPaths,
  getValueByPath,
  normalizeString,
  serializeJson
} from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
import {
  type FileType,
  useReferenceFileStore,
  useWorkingFileStore
} from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type ComparisonType =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'notEquals'
  | 'notContains';

type LogicalOperator = 'AND' | 'OR';

type FilterCondition = {
  field: string;
  comparison: ComparisonType;
  value: string;
  referenceField?: string;
  useReference?: boolean;
};

type FilterGroup = {
  operator: LogicalOperator;
  conditions: FilterCondition[];
};

const evaluateCondition = (
  value: unknown,
  condition: FilterCondition
): boolean => {
  const normalizedValue = normalizeString(String(value));
  const normalizedTestValue = normalizeString(condition.value);

  switch (condition.comparison) {
    case 'equals':
      return normalizedValue === normalizedTestValue;
    case 'notEquals':
      return normalizedValue !== normalizedTestValue;
    case 'contains':
      return normalizedValue.includes(normalizedTestValue);
    case 'notContains':
      return !normalizedValue.includes(normalizedTestValue);
    case 'startsWith':
      return normalizedValue.startsWith(normalizedTestValue);
    case 'endsWith':
      return normalizedValue.endsWith(normalizedTestValue);
    case 'greaterThan':
      return Number(value) > Number(condition.value);
    case 'lessThan':
      return Number(value) < Number(condition.value);
    default:
      return false;
  }
};

const evaluateFilterGroup = (
  row: Record<string, unknown>,
  group: FilterGroup
): boolean => {
  const evaluateConditionWithRef = (condition: FilterCondition) => {
    const value = getValueByPath(row, condition.field);
    return evaluateCondition(value, condition);
  };

  return group.operator === 'AND'
    ? group.conditions.every(evaluateConditionWithRef)
    : group.conditions.some(evaluateConditionWithRef);
};

export function Filter() {
  const { fileName: workingFileName, fileContentParsed: workingFileContent } =
    useWorkingFileStore();

  const [workingFileSchema, setWorkingFileSchema] = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    operator: 'AND',
    conditions: [{ field: '', comparison: 'equals', value: '' }]
  });

  useEffect(() => {
    if (workingFileContent.length > 0) {
      const schema = getAllPaths(workingFileContent[0] || {});
      setWorkingFileSchema(schema);
    }
  }, [workingFileContent]);

  useEffect(() => {
    if (referenceFileContent.length > 0) {
      const schema = getAllPaths(referenceFileContent[0] || {});
      setReferenceFileSchema(schema);
    }
  }, [referenceFileContent]);

  const handleWorkingFileUpload = useFileUpload('working');

  const addCondition = () => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', comparison: 'equals', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const processFilter = () => {
    if (!workingFileName) {
      toast.error('Please upload a file to filter');
      return;
    }

    if (filterGroup.conditions.some(c => !(c.field && c.value))) {
      toast.error('Please complete all filter conditions');
      return;
    }

    try {
      const filteredContent = workingFileContent.filter(row =>
        evaluateFilterGroup(row, filterGroup)
      );

      const fileType = (workingFileName?.split('.').pop() as FileType) || 'csv';
      const output = serializeJson(filteredContent, fileType);
      const blob = new Blob([output], {
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
      a.download = `filtered_${timestamp}.${fileType}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        `Filtered ${workingFileContent.length - filteredContent.length} entries`
      );
    } catch (error) {
      console.error('Filter Error:', error);
      toast.error(
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Filter</Header.Title>
        <Header.Description>
          Filter entries based on conditions across one or more files
        </Header.Description>
      </Header>

      <div className='mb-8'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold'>Working File</h3>
          <p className='text-muted-foreground text-sm'>The file to apply filters to</p>
        </div>
        <FileUpload onFileUpload={handleWorkingFileUpload} fileName={workingFileName} />
      </div>


      {workingFileName && (
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <h3 className='text-lg font-semibold'>Filter Conditions</h3>
            <Select
              value={filterGroup.operator}
              onValueChange={(value: LogicalOperator) =>
                setFilterGroup(prev => ({ ...prev, operator: value }))
              }
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select operator' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='AND'>Match ALL conditions</SelectItem>
                <SelectItem value='OR'>Match ANY condition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-4'>
            {filterGroup.conditions.map((condition, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is not expected to change
              <div key={index} className='flex gap-4 items-start'>
                <FieldSelector
                  fields={workingFileSchema}
                  selectedField={condition.field}
                  onFieldSelect={value => updateCondition(index, { field: value })}
                  placeholder='Select field'
                />

                <Select
                  value={condition.comparison}
                  onValueChange={(value: ComparisonType) =>
                    updateCondition(index, { comparison: value })
                  }
                >
                  <SelectTrigger className='w-[200px]'>
                    <SelectValue placeholder='Select comparison' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='equals'>Equals</SelectItem>
                    <SelectItem value='notEquals'>Does not equal</SelectItem>
                    <SelectItem value='contains'>Contains</SelectItem>
                    <SelectItem value='notContains'>Does not contain</SelectItem>
                    <SelectItem value='startsWith'>Starts with</SelectItem>
                    <SelectItem value='endsWith'>Ends with</SelectItem>
                    <SelectItem value='greaterThan'>Greater than</SelectItem>
                    <SelectItem value='lessThan'>Less than</SelectItem>
                  </SelectContent>
                </Select>

                {(
                  <Input
                    type='text'
                    placeholder='Value'
                    value={condition.value}
                    onChange={e => updateCondition(index, { value: e.target.value })}
                    className='w-[200px]'
                  />
                )}

                <Button
                  variant='destructive'
                  onClick={() => removeCondition(index)}
                  disabled={filterGroup.conditions.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className='mt-4'>
            <Button onClick={addCondition} variant='outline'>
              Add Condition
            </Button>
          </div>

          <div className='mt-8'>
            <Button
              onClick={processFilter}
              disabled={filterGroup.conditions.some(c => !(c.field && c.value))}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
