import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFileStore } from '@/store/store';

export function RouteChangeHandler() {
  const location = useLocation();
  const resetFileState = useFileStore(state => state.resetFileState);

  useEffect(() => {
    resetFileState();
  }, [location.pathname, resetFileState]);

  return null;
}
