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
  <header className='flex flex-col gap-1 mb-10'>{children}</header>
);

Header.Title = ({ children }: TitleProps) => (
  <h1 className='text-2xl font-bold'>{children}</h1>
);

Header.Description = function Description({ children }: DescriptionProps) {
  return <p className='text-muted-foreground text-sm'>{children}</p>;
};
