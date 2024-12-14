import { BarChart, Bot, FileText, FileX, IdCard, Map as MapIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { Backfill } from '@/views/Backfill';
import { Deduplicate } from '@/views/Deduplicate';
import { MapValues } from '@/views/MapValues';
import { Stats } from '@/views/Stats';
import { Translate } from '@/views/Translate';
import { UuidExtractor } from '@/views/UuidExtractor';

export interface Route {
  path: string;
  element: ReactNode;
  title: string;
  icon: any;
}

export const routes: Route[] = [
  {
    path: '/extract',
    element: <UuidExtractor />,
    title: 'Extract UUIDs',
    icon: IdCard
  },
  {
    path: '/map',
    element: <MapValues />,
    title: 'Map Values',
    icon: MapIcon
  },
  {
    path: '/translate',
    element: <Translate />,
    title: 'Translate',
    icon: Bot
  },
  {
    path: '/backfill',
    element: <Backfill />,
    title: 'Backfill',
    icon: FileText
  },
  {
    path: '/deduplicate',
    element: <Deduplicate />,
    title: 'Deduplicate',
    icon: FileX
  },
  {
    path: '/stats',
    element: <Stats />,
    title: 'Stats',
    icon: BarChart
  }
];

export const defaultRoute = {
  path: '/',
  element: <Navigate to='/extract' replace={true} />
};
