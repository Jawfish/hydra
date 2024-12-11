import { Bot, IdCard, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/components/ui/sidebar';

const items = [
  {
    title: 'Extract UUIDs',
    url: '/extract',
    icon: IdCard
  },
  {
    title: 'Map Values',
    url: '/map',
    icon: MapIcon
  },
  {
    title: 'Translate',
    url: '/translate',
    icon: Bot
  }
];

export function AppSidebar() {
  return (
    <Sidebar collapsible='icon'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <>
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild={true}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {items.indexOf(item) < items.length - 1 && <SidebarSeparator />}
                </>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
