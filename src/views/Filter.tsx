import { ActionSection } from '@/components/ActionSection';
import { FieldSelector } from '@/components/FieldSelector';
import { FileUpload } from '@/components/FileUpload';
import { Header } from '@/components/Header';
import { Section } from '@/components/Section';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  getAllPaths,
  getParsedContentFromFile,
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
import { type FileType, useWorkingFileStore } from '@/store/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { JSX } from 'react';

type ComparisonType =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'notEquals'
  | 'notContains'
  | 'inFile'
  | 'notInFile'
  | 'isEmpty';

type LogicalOperator = 'AND' | 'OR';

type FilterCondition = {
  field: string;
  comparison: ComparisonType;
  value: string;
  referenceField?: string;
  referenceFileContent?: Record<string, unknown>[];
  referenceFileName?: string;
  lookupStructure?: Set<string>;
};

type FilterGroup = {
  operator: LogicalOperator;
  mode?: 'keep' | 'remove';
  conditions: FilterCondition[];
};

const createLookupMap = (
  fileContent: Record<string, unknown>[],
  field: string
): Set<string> => {
  return new Set(
    fileContent.map(row => normalizeString(String(getValueByPath(row, field))))
  );
};

const evaluateCondition = (value: unknown, condition: FilterCondition): boolean => {
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
        (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
      );
    case 'inFile':
      return condition.lookupStructure
        ? condition.lookupStructure.has(normalizeString(String(value)))
        : false;
    case 'notInFile':
      return condition.lookupStructure
        ? !condition.lookupStructure.has(normalizeString(String(value)))
        : true;
    default:
      return false;
  }
};

const evaluateFilterGroup = (
  row: Record<string, unknown>,
  group: FilterGroup
): boolean => {
  const evaluateConditionWithRef = (condition: FilterCondition): boolean => {
    const value = getValueByPath(row, condition.field);
    return evaluateCondition(value, condition);
  };

  return group.operator === 'AND'
    ? group.conditions.every(evaluateConditionWithRef)
    : group.conditions.some(evaluateConditionWithRef);
};

export function Filter(): JSX.Element {
  const { fileName: workingFileName, fileContentParsed: workingFileContent } =
    useWorkingFileStore();

  const [workingFileSchema, setWorkingFileSchema] = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    operator: 'AND',
    mode: 'keep',
    conditions: [{ field: '', comparison: 'equals', value: '' }]
  });

  useEffect(() => {
    if (workingFileContent.length > 0) {
      const schema = getAllPaths(workingFileContent[0] || {});
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

  const updateCondition = (index: number, updates: Partial<FilterCondition>): void => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const processFilter = (): void => {
    if (!workingFileName) {
      toast.error('Please upload a file to filter');
      return;
    }

    if (
      filterGroup.conditions.some(condition => {
        // Check basic conditions for non-file comparisons
        if (!['inFile', 'notInFile'].includes(condition.comparison)) {
          return !(condition.field && condition.value);
        }

        // For file-based comparisons, check additional conditions
        return !(
          condition.field &&
          condition.comparison &&
          condition.referenceFileContent &&
          condition.referenceField
        );
      })
    ) {
      toast.error('Please complete all filter conditions');
      return;
    }

    try {
      const filteredContent = workingFileContent.filter(row => {
        const matchesConditions = evaluateFilterGroup(row, filterGroup);
        return filterGroup.mode === 'remove' ? !matchesConditions : matchesConditions;
      });

      const fileType = (workingFileName?.split('.').pop() as FileType) || 'csv';
      const output = serializeJson(filteredContent, fileType);
      let mimeType = 'text/csv';

      if (fileType === 'json') {
        mimeType = 'application/json';
      } else if (fileType === 'jsonl') {
        mimeType = 'application/jsonl';
      }

      const blob = new Blob([output], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `filtered_${timestamp}.${fileType}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        `Removed ${workingFileContent.length - filteredContent.length} entries`
      );
    } catch (error) {
      console.error('Filter Error:', error);
      toast.error(
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div className='mb-12 flex flex-col gap-16'>
      <Header>
        <Header.Title>Filter</Header.Title>
        <Header.Description>
          Filter entries based on conditions across one or more files
        </Header.Description>
      </Header>

      <Section>
        <Section.Title>Working File</Section.Title>
        <Section.Description>The file to apply filters to</Section.Description>
        <FileUpload onFileUpload={handleWorkingFileUpload} fileName={workingFileName} />
      </Section>

      {workingFileName && (
        <>
          <FilterConditions
            filterGroup={filterGroup}
            setFilterGroup={setFilterGroup}
            updateCondition={updateCondition}
            addCondition={addCondition}
            removeCondition={removeCondition}
            workingFileSchema={workingFileSchema}
          />
          <ActionSection>
            <ActionSection.Button
              onClick={processFilter}
              disabled={filterGroup.conditions.some(condition => {
                // Check basic conditions for non-file comparisons
                if (!['inFile', 'notInFile'].includes(condition.comparison)) {
                  return !(condition.field && condition.value);
                }

                // For file-based comparisons, check additional conditions
                return !(
                  condition.field &&
                  condition.comparison &&
                  condition.referenceFileContent &&
                  condition.referenceField
                );
              })}
            >
              Apply Filters
            </ActionSection.Button>
          </ActionSection>
        </>
      )}
    </div>
  );
}

const renderConditionValue = (
  condition: FilterCondition,
  index: number,
  updateCondition: (index: number, updates: Partial<FilterCondition>) => void
): JSX.Element | null => {
  if (['inFile', 'notInFile'].includes(condition.comparison)) {
    return (
      <>
        {!condition.referenceFileName && (
          <FileUpload
            onFileUpload={(fileName, fileContent, fileType): void => {
              try {
                const parsedContent = getParsedContentFromFile(fileContent, fileType);
                // Don't create lookup structure yet since we don't have
                // the reference field
                updateCondition(index, {
                  referenceFileContent: parsedContent,
                  referenceFileName: fileName,
                  referenceField: '',
                  lookupStructure: undefined
                });
              } catch (error) {
                toast.error(
                  `Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            }}
            fileName={null}
          />
        )}
        {condition.referenceFileContent && (
          <FieldSelector
            fields={getAllPaths(condition.referenceFileContent[0] || {})}
            selectedField={condition.referenceField || ''}
            onFieldSelect={(value): void => {
              const newField = value;
              updateCondition(index, {
                referenceField: newField,
                lookupStructure: condition.referenceFileContent
                  ? createLookupMap(condition.referenceFileContent, newField)
                  : undefined
              });
            }}
            placeholder='Select reference field'
          />
        )}
      </>
    );
  }

  if (['isEmpty'].includes(condition.comparison)) {
    return null;
  }

  return (
    <Input
      type='text'
      placeholder='Value'
      value={condition.value}
      onChange={(e): void => updateCondition(index, { value: e.target.value })}
      className='w-[200px]'
    />
  );
};

const FilterModeSelector = ({
  mode,
  onModeChange
}: {
  mode: 'keep' | 'remove';
  onModeChange: (value: 'keep' | 'remove') => void;
}): JSX.Element => (
  <Select value={mode} onValueChange={onModeChange}>
    <SelectTrigger>
      <SelectValue placeholder='Select mode' />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value='keep'>Keep matches</SelectItem>
      <SelectItem value='remove'>Remove matches</SelectItem>
    </SelectContent>
  </Select>
);

const LogicalOperatorSelector = ({
  operator,
  onOperatorChange
}: {
  operator: LogicalOperator;
  onOperatorChange: (value: LogicalOperator) => void;
}): JSX.Element => (
  <Select value={operator} onValueChange={onOperatorChange}>
    <SelectTrigger>
      <SelectValue placeholder='Select operator' />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value='AND'>Match ALL conditions</SelectItem>
      <SelectItem value='OR'>Match ANY condition</SelectItem>
    </SelectContent>
  </Select>
);

const ConditionRow = ({
  condition,
  index,
  workingFileSchema,
  updateCondition,
  removeCondition,
  isOnlyCondition
}: {
  condition: FilterCondition;
  index: number;
  workingFileSchema: string[];
  updateCondition: (index: number, updates: Partial<FilterCondition>) => void;
  removeCondition: (index: number) => void;
  isOnlyCondition: boolean;
}): JSX.Element => (
  <div className='grid grid-cols-[2fr,2fr,3fr,1fr] gap-4 items-center'>
    <FieldSelector
      fields={workingFileSchema}
      selectedField={condition.field}
      onFieldSelect={(value): void => updateCondition(index, { field: value })}
      placeholder='Select field'
      className='w-full'
    />

    <Select
      value={condition.comparison}
      onValueChange={(value: ComparisonType): void =>
        updateCondition(index, { comparison: value })
      }
    >
      <SelectTrigger className='w-full'>
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
        <SelectItem value='isEmpty'>Is Empty</SelectItem>
        <SelectItem value='inFile'>In File</SelectItem>
        <SelectItem value='notInFile'>Not in File</SelectItem>
      </SelectContent>
    </Select>

    <div className='w-full'>
      {renderConditionValue(condition, index, updateCondition)}
    </div>

    <Button
      variant='destructive'
      onClick={(): void => removeCondition(index)}
      disabled={isOnlyCondition}
      className='justify-self-end'
    >
      Remove
    </Button>
  </div>
);

type FilterConditionsProps = {
  filterGroup: FilterGroup;
  updateCondition: (index: number, updates: Partial<FilterCondition>) => void;
  addCondition: () => void;
  removeCondition: (index: number) => void;
  setFilterGroup: (group: FilterGroup) => void;
  workingFileSchema: string[];
};

const FilterConditions = ({
  filterGroup,
  setFilterGroup,
  updateCondition,
  addCondition,
  removeCondition,
  workingFileSchema
}: FilterConditionsProps): JSX.Element => (
  <Section>
    <Section.Title>Filter Conditions</Section.Title>
    <Section.Items className='grid-cols-1'>
      <div className='flex items-center gap-4'>
        <FilterModeSelector
          mode={filterGroup.mode || 'keep'}
          onModeChange={(value): void => {
            setFilterGroup({ ...filterGroup, mode: value });
          }}
        />

        <LogicalOperatorSelector
          operator={filterGroup.operator}
          onOperatorChange={(value): void => {
            setFilterGroup({ ...filterGroup, operator: value });
          }}
        />
      </div>

      {filterGroup.conditions.map((condition, index) => (
        <ConditionRow
          // biome-ignore lint/suspicious/noArrayIndexKey: order is not expected to change
          key={index}
          condition={condition}
          index={index}
          workingFileSchema={workingFileSchema}
          updateCondition={updateCondition}
          removeCondition={removeCondition}
          isOnlyCondition={filterGroup.conditions.length === 1}
        />
      ))}

      <div className='mt-4'>
        <Button onClick={addCondition} variant='outline'>
          Add Condition
        </Button>
      </div>
    </Section.Items>
  </Section>
);
