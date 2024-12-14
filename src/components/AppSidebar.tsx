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
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

const SidebarRouteItem: React.FC<{ route: Route }> = ({ route }) => {
  const location = useLocation();
  const isActive = location.pathname === route.path;

  const handleRouteClick = () => {
    document.title = `${APP_CONFIG.name} - ${route.title}`;
  };

  return (
    <SidebarMenuItem
      className={`py-2 -my-1 ${isActive ? 'bg-primary/10 font-semibold' : ''}`}
    >
      <Link
        to={route.path}
        onClick={handleRouteClick}
        className='ml-2 flex items-center gap-2'
      >
        <route.icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
        <span>{route.title}</span>
      </Link>
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  return (
    <Sidebar collapsible='icon'>
      <SidebarContent>
        <SidebarMenu>
          {routes.map((route, index) => (
            <React.Fragment key={route.title}>
              <SidebarRouteItem route={route} />
              {index < routes.length - 1 && <SidebarSeparator />}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
