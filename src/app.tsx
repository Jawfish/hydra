import { AppSidebar } from '@/components/AppSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Translate } from '@/views/Translate';
import { MapValues } from '@/views/MapValues';
import { UuidExtractor } from '@/views/UuidExtractor';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
        <SidebarProvider>
          <AppSidebar />
          <div className='p-8 xl:mx-auto w-full max-w-4xl'>
            <Routes>
              <Route path='/extract' element={<UuidExtractor />} />
              <Route path='/map' element={<MapValues />} />
              <Route path='/translate' element={<Translate />} />
              <Route path='/' element={<Navigate to='/extract' replace={true} />} />
            </Routes>
          </div>

          {/* Hack to offset the right side by the sidebar's width */}
          <div className='hidden 2xl:block'>
            <AppSidebar />
          </div>
        </SidebarProvider>
        <Toaster />
      </ThemeProvider>
    </Router>
  );
}

// biome-ignore lint/style/noDefaultExport: React convention
export default App;
