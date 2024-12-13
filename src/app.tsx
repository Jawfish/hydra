import { AppSidebar } from '@/components/AppSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { WorkingFileDownloader } from '@/components/WorkingFileDownloader';
import { Stats } from '@/views/Stats';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Backfill } from '@/views/Backfill';
import { Deduplicate } from '@/views/Deduplicate';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
        <SidebarProvider>
          <AppSidebar />
          <div className='p-8 xl:mx-auto w-full max-w-4xl'>
            <Routes>
              {/* <Route path='/extract' element={<UuidExtractor />} /> */}
              {/* <Route path='/map' element={<MapValues />} /> */}
              {/* <Route path='/translate' element={<Translate />} /> */}
              {/* <Route path='/convert' element={<Convert />} /> */}
              <Route path='/backfill' element={<Backfill />} />
              <Route path='/deduplicate' element={<Deduplicate />} />
              <Route path='/stats' element={<Stats />} />
              <Route path='/' element={<Navigate to='/extract' replace={true} />} />
            </Routes>
          </div>

          {/* Hack to offset the right side by the sidebar's width */}
          <div className='hidden 2xl:block'>
            <AppSidebar />
          </div>

          {/* Global file downloader */}
          <WorkingFileDownloader />
        </SidebarProvider>
        <Toaster />
      </ThemeProvider>
    </Router>
  );
}

// biome-ignore lint/style/noDefaultExport: React convention
export default App;
