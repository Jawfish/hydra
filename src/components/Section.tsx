import type React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

interface SectionTitleProps {
  children: React.ReactNode;
}

interface SectionDescriptionProps {
  children: React.ReactNode;
}

export const Section = ({ children, className }: SectionProps) => (
  <div className={`flex flex-col gap-2 ${className || ''}`}>
    {children}
  </div>
);

Section.Title = ({ children }: SectionTitleProps) => (
  <h2 className='text-xl font-semibold'>{children}</h2>
);

Section.Description = ({ children }: SectionDescriptionProps) => (
  <p className='text-muted-foreground text-sm'>{children}</p>
);
