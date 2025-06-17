import { useEffect } from 'react';
import { APP_CONFIG } from '@/config';

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps): null {
  useEffect(() => {
    document.title = `${APP_CONFIG.name} - ${title}`;
  }, [title]);

  return null;
}
