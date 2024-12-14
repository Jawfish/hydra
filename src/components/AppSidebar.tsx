import React from 'react';
import { Link } from 'react-router-dom';

import { routes } from '@/routes';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/shadcn/components/ui/sidebar';

export function AppSidebar() {
  const handleRouteClick = (title: string) => {
    document.title = `Hydra - ${title}`;
  };

  return (
    <Sidebar collapsible='icon'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map(route => (
                <React.Fragment key={route.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild={true}>
                      <Link
                        to={route.path}
                        onClick={() => handleRouteClick(route.title)}
                      >
                        <route.icon />
                        <span>{route.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {routes.indexOf(route) < routes.length - 1 && <SidebarSeparator />}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
