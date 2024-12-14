import { APP_CONFIG } from '@/config';
import { Layout } from '@/components/Layout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { defaultRoute, routes } from '@/routes';
import { SidebarProvider } from '@/shadcn/components/ui/sidebar';
import { Toaster } from '@/shadcn/components/ui/sonner';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme={APP_CONFIG.THEME.DEFAULT} storageKey={APP_CONFIG.THEME.STORAGE_KEY}>
        <SidebarProvider>
          <Routes>
            <Route element={<Layout />}>
              {routes.map(route => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route path={defaultRoute.path} element={defaultRoute.element} />
            </Route>
          </Routes>
        </SidebarProvider>
        <Toaster position='top-right' richColors={true} />
      </ThemeProvider>
    </Router>
  );
}

// biome-ignore lint/style/noDefaultExport: React convention
export default App;
