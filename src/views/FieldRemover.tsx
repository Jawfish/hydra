import { ActionSection } from '@/components/ActionSection';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { useFileUpload } from '@/hooks/useFileUpload';
import { normalizeString, serializeJson } from '@/lib/parse';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shadcn/components/ui/select';
import { type FileType, useWorkingFileStore } from '@/store/store';
import { RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { toast } from 'sonner';

type ComparisonType =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'notEquals'
  | 'notContains'
  | 'isEmpty'
  | 'always';

type LogicalOperator = 'AND' | 'OR';

type FieldCondition = {
  field: string;
  comparison: ComparisonType;
  value: string;
};

type FieldFilterGroup = {
  operator: LogicalOperator;
  conditions: FieldCondition[];
};

export function FieldRemover(): JSX.Element {
  const { fileName: workingFileName, fileContentParsed: workingFileContent } =
    useWorkingFileStore();
  const [workingFileSchema, setWorkingFileSchema] = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState<FieldFilterGroup>({
    operator: 'AND',
    conditions: [{ field: '', comparison: 'always', value: '' }]
  });

  useEffect(() => {
    if (workingFileContent.length > 0) {
      const schema = Object.keys(workingFileContent[0] || {});
      setWorkingFileSchema(schema);
    }
  }, [workingFileContent]);

  const handleWorkingFileUpload = useFileUpload('working');

  const addCondition = (): void => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', comparison: 'equals', value: '' }]
    }));
  };

  const removeCondition = (index: number): void => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, updates: Partial<FieldCondition>): void => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const evaluateCondition = (value: unknown, condition: FieldCondition): boolean => {
    if (condition.comparison === 'always') {
      return true;
    }

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
      case 'isEmpty':
        return (
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' &&
            value !== null &&
            Object.keys(value).length === 0)
        );
      default:
        return false;
    }
  };

  const processFieldRemoval = (): void => {
    if (!workingFileName) {
      toast.error('Please upload a file to process');
      return;
    }

    try {
      const filteredContent = workingFileContent.map(row => {
        const filteredRow: Record<string, unknown> = {};

        for (const [field, value] of Object.entries(row)) {
          const fieldConditions = filterGroup.conditions.filter(c => c.field === field);

          if (fieldConditions.length === 0) {
            filteredRow[field] = value;
            continue;
          }

          const shouldRemove =
            filterGroup.operator === 'AND'
              ? fieldConditions.every(condition => evaluateCondition(value, condition))
              : fieldConditions.some(condition => evaluateCondition(value, condition));

          if (!shouldRemove) {
            filteredRow[field] = value;
          }
        }

        return filteredRow;
      });

      const fileType = (workingFileName?.split('.').pop() as FileType) || 'csv';
      const output = serializeJson(filteredContent, fileType);
      const contentType = fileType === 'csv' ? 'text/csv' : 'application/json';
      const blob = new Blob([output], { type: contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `filtered-fields_${timestamp}.${fileType}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Processed ${workingFileContent.length} entries`);
    } catch (error) {
      console.error('Field Removal Error:', error);
      toast.error(
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Field Remover</Header.Title>
        <Header.Description>
          Remove fields from entries based on their values
        </Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>The file to process</Section.Description>
        <FileUpload onFileUpload={handleWorkingFileUpload} fileName={workingFileName} />
      </Section>

      {workingFileName && (
        <>
          <Section>
            <Section.Title>Removal Conditions</Section.Title>
            <Section.Items className='grid-cols-1'>
              <LogicalOperatorSelector
                operator={filterGroup.operator}
                onOperatorChange={(value): void => {
                  setFilterGroup({ ...filterGroup, operator: value });
                }}
              />

              <div className='grid w-full items-center gap-4'>
                {filterGroup.conditions.map((condition, index) => (
                  <ConditionRow
                    key={`${condition.field}-${condition.comparison}-${index}`}
                    condition={condition}
                    index={index}
                    workingFileSchema={workingFileSchema}
                    updateCondition={updateCondition}
                    removeCondition={removeCondition}
                  />
                ))}
              </div>

              <div className='mt-4'>
                <Button onClick={addCondition} variant='outline'>
                  Add Condition
                </Button>
              </div>
            </Section.Items>
          </Section>

          <ActionSection>
            <ActionSection.Button
              onClick={processFieldRemoval}
              disabled={filterGroup.conditions.some(condition => !condition.field)}
            >
              Process Fields
            </ActionSection.Button>
          </ActionSection>
        </>
      )}
    </div>
  );
}

const LogicalOperatorSelector = ({
  operator,
  onOperatorChange
}: {
  operator: LogicalOperator;
  onOperatorChange: (value: LogicalOperator) => void;
}): JSX.Element => (
  <Select value={operator} onValueChange={onOperatorChange}>
    <SelectTrigger className='w-full truncate'>
      <SelectValue placeholder='Select operator' className='truncate' />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value='AND'>Remove if ALL conditions match</SelectItem>
      <SelectItem value='OR'>Remove if ANY condition matches</SelectItem>
    </SelectContent>
  </Select>
);

const ConditionRow = ({
  condition,
  index,
  workingFileSchema,
  updateCondition,
  removeCondition
}: {
  condition: FieldCondition;
  index: number;
  workingFileSchema: string[];
  updateCondition: (index: number, updates: Partial<FieldCondition>) => void;
  removeCondition: (index: number) => void;
}): JSX.Element => (
  <div className='relative w-full'>
    <X
      size={16}
      className='-right-14 -translate-y-1/2 absolute top-1/2 cursor-pointer text-primary/75'
      onClick={(): void => removeCondition(index)}
    />
    <RefreshCw
      size={16}
      className='-right-7 -translate-y-1/2 absolute top-1/2 cursor-pointer text-primary/75'
      onClick={(): void =>
        updateCondition(index, { field: '', value: '', comparison: 'equals' })
      }
    />
    <div className='grid w-full grid-cols-[1fr_1fr_1fr] items-center gap-4'>
      <FieldSelector
        fields={workingFileSchema}
        selectedField={condition.field}
        onFieldSelect={(value): void => updateCondition(index, { field: value })}
        placeholder='Select field'
      />

      <Select
        value={condition.comparison}
        onValueChange={(value: ComparisonType): void =>
          updateCondition(index, { comparison: value })
        }
      >
        <SelectTrigger className='w-full truncate'>
          <SelectValue placeholder='Select comparison' className='truncate' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='always'>Always Remove</SelectItem>
          <SelectItem value='equals'>Equals</SelectItem>
          <SelectItem value='notEquals'>Does not equal</SelectItem>
          <SelectItem value='contains'>Contains</SelectItem>
          <SelectItem value='notContains'>Does not contain</SelectItem>
          <SelectItem value='startsWith'>Starts with</SelectItem>
          <SelectItem value='endsWith'>Ends with</SelectItem>
          <SelectItem value='greaterThan'>Greater than</SelectItem>
          <SelectItem value='lessThan'>Less than</SelectItem>
          <SelectItem value='isEmpty'>Is Empty</SelectItem>
        </SelectContent>
      </Select>

      {condition.comparison !== 'isEmpty' && condition.comparison !== 'always' && (
        <Input
          type='text'
          placeholder='Value'
          value={condition.value}
          onChange={(e): void => updateCondition(index, { value: e.target.value })}
        />
      )}
    </div>
  </div>
);
