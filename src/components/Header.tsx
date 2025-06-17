import type React from 'react';
import type { JSX } from 'react';
import { Separator } from '@/shadcn/components/ui/separator';

interface HeaderProps {
  children: React.ReactNode;
}

interface TitleProps {
  children: React.ReactNode;
}

interface DescriptionProps {
  children: React.ReactNode;
}

export const Header = ({ children }: HeaderProps): JSX.Element => (
  <div>
    <header className='flex flex-col gap-1'>{children}</header>
    <Separator className='mt-10' />
  </div>
);

Header.Title = ({ children }: TitleProps): JSX.Element => (
  <h1 className='font-bold text-2xl'>{children}</h1>
);

Header.Description = function Description({ children }: DescriptionProps): JSX.Element {
  return <p className='text-muted-foreground text-sm'>{children}</p>;
};
