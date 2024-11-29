import { APP_CONFIG } from '@/config';
import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps): null {
  useEffect(() => {
    document.title = `${APP_CONFIG.name} - ${title}`;
  }, [title]);

  return null;
}
