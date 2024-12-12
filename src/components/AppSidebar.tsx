import {
  BarChart,
  Bot,
  FileJson,
  FileText,
  FileX,
  IdCard,
  Map as MapIcon
} from 'lucide-react';
import React from 'react';
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
  },
  {
    title: 'JSONL to CSV',
    url: '/convert',
    icon: FileJson
  },
  {
    title: 'Backfill',
    url: '/backfill',
    icon: FileText
  },
  {
    title: 'Deduplicate',
    url: '/deduplicate',
    icon: FileX
  },
  {
    title: 'Stats',
    url: '/stats',
    icon: BarChart
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
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild={true}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {items.indexOf(item) < items.length - 1 && <SidebarSeparator />}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
