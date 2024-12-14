import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    const appName = 'Hydra';
    document.title = `${appName} - ${title}`;
  }, [title]);

  return null;
}
