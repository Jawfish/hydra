import { type Route, routes } from '@/routes';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator
} from '@/shadcn/components/ui/sidebar';
import React from 'react';
import { Link } from 'react-router-dom';

const SidebarRouteItem: React.FC<{ route: Route }> = ({ route }) => {
  const handleRouteClick = () => {
    document.title = `Hydra - ${route.title}`;
  };

  return (
    <SidebarMenuItem>
      <Link
        to={route.path}
        onClick={handleRouteClick}
        className='flex items-center gap-2'
      >
        <route.icon />
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
