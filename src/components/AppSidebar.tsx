import { APP_CONFIG } from '@/config';
import { type Route, routes } from '@/routes';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator
} from '@/shadcn/components/ui/sidebar';
import React from 'react';
import type { JSX } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

const SidebarRouteItem: React.FC<{ route: Route }> = ({ route }) => {
  const location = useLocation();
  const isActive = location.pathname === route.path;

  const handleRouteClick = (): void => {
    document.title = `${APP_CONFIG.name} - ${route.title}`;
  };

  return (
    <SidebarMenuItem className={`-my-1 py-2 ${isActive ? 'font-semibold' : ''}`}>
      <Link
        to={route.path}
        onClick={handleRouteClick}
        className='ml-2 flex items-center gap-2'
      >
        <route.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
        <span>{route.title}</span>
      </Link>
    </SidebarMenuItem>
  );
};

export function AppSidebar(): JSX.Element {
  // Sort routes alphabetically by title
  const sortedRoutes = [...routes].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <Sidebar collapsible='icon'>
      <SidebarContent>
        <SidebarMenu>
          {sortedRoutes.map((route, index) => (
            <React.Fragment key={route.title}>
              <SidebarRouteItem route={route} />
              {index < sortedRoutes.length - 1 && <SidebarSeparator />}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
