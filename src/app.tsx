import { AppSidebar } from '@/components/AppSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { UUIDExtractor } from '@/views/UUIDExtractor';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
        <SidebarProvider>
          <AppSidebar />
          <div className='p-8 xl:mx-auto w-full max-w-4xl'>
            <Routes>
              <Route path='/uuid-extractor' element={<UUIDExtractor />} />
              <Route path='/' element={<Navigate to='/uuid-extractor' replace />} />
              {/* Add more routes here as you create new views */}
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

export default App;
