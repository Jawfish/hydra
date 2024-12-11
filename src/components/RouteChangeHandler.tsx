import { useFileStore } from '@/store/store';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteChangeHandler() {
  const location = useLocation();
  const resetFileState = useFileStore(state => state.resetFileState);

  // biome-ignore lint/correctness/useExhaustiveDependencies: desired behavior
  useEffect(() => {
    resetFileState();
  }, [location.pathname, resetFileState]);

  return null;
}
