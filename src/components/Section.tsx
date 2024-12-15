import type React from 'react';
import type { JSX } from 'react';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

type SectionTitleProps = {
  children: React.ReactNode;
};

type SectionDescriptionProps = {
  children: React.ReactNode;
};

type SectionItemsProps = {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  className?: string;
};

export const Section = ({ children, className }: SectionProps): JSX.Element => (
  <div className={`flex flex-col gap-2 ${className || ''}`}>{children}</div>
);

Section.Title = ({ children }: SectionTitleProps): JSX.Element => (
  <h2 className='font-semibold text-lg'>{children}</h2>
);

Section.Description = ({ children }: SectionDescriptionProps): JSX.Element => (
  <p className='text-muted-foreground text-sm'>{children}</p>
);

Section.Items = ({ children, direction = 'col', className }: SectionItemsProps): JSX.Element => (
  <div className={`flex flex-${direction} gap-4 ${className || ''}`}>{children}</div>
);
