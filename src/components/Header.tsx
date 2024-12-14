import { Separator } from '@/shadcn/components/ui/separator';
import type React from 'react';

interface HeaderProps {
  children: React.ReactNode;
}

interface TitleProps {
  children: React.ReactNode;
}

interface DescriptionProps {
  children: React.ReactNode;
}

export const Header = ({ children }: HeaderProps) => (
  <>
    <header className='flex flex-col gap-1'>{children}</header>
    <Separator className='my-10' />
  </>
);

Header.Title = ({ children }: TitleProps) => (
  <h1 className='font-bold text-2xl'>{children}</h1>
);

Header.Description = function Description({ children }: DescriptionProps) {
  return <p className='text-muted-foreground text-sm'>{children}</p>;
};
