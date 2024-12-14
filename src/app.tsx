import { Layout } from '@/components/Layout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/shadcn/components/ui/sidebar';
import { Toaster } from '@/shadcn/components/ui/sonner';
import { defaultRoute, routes } from '@/routes';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
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
