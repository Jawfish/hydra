import { AppSidebar } from '@/components/AppSidebar';
import { WorkingFileDownloader } from '@/components/WorkingFileDownloader';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <>
      <AppSidebar />
      <div className='p-8 xl:mx-auto w-full max-w-4xl mb-10'>
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
