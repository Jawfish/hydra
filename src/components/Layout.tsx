import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { WorkingFileDownloader } from '@/components/WorkingFileDownloader';

export function Layout(): JSX.Element {
  return (
    <>
      <AppSidebar />
      <div className='mb-10 w-full max-w-4xl p-8 xl:mx-auto'>
        <Outlet />
      </div>

      {/* Hack to offset the right side by the sidebar's width */}
      <div className='hidden 2xl:block'>
        <AppSidebar />
      </div>

      {/* Global file downloader */}
      <WorkingFileDownloader />
    </>
  );
}
