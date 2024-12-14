import { APP_CONFIG } from '@/config';
import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    document.title = `${APP_CONFIG.NAME} - ${title}`;
  }, [title]);

  return null;
}
