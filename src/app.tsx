import { Layout } from '@/components/Layout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { APP_CONFIG } from '@/config';
import { defaultRoute, routes } from '@/routes';
import { SidebarProvider } from '@/shadcn/components/ui/sidebar';
import { Toaster } from '@/shadcn/components/ui/sonner';
import { useEffect } from 'react';
import type { JSX } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

function App(): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = routes.find(route => route.path === location.pathname);
    document.title = currentRoute
      ? `${APP_CONFIG.name} - ${currentRoute.title}`
      : APP_CONFIG.name;
  }, [location.pathname]);

  return (
    <ThemeProvider
      defaultTheme={APP_CONFIG.theme.default}
      storageKey={APP_CONFIG.theme.storageKey}
    >
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
      <Toaster className='-z-10 mb-12' position='bottom-center' richColors={true} />
    </ThemeProvider>
  );
}

// biome-ignore lint/style/noDefaultExport: React convention
export default App;
