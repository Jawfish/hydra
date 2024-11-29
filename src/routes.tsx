import {
  BarChart,
  Bot,
  FileDown,
  Filter as FileFilter,
  FileText,
  IdCard,
  type LucideProps,
  Map as MapIcon,
  Scissors
} from 'lucide-react';
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import { Navigate } from 'react-router-dom';

import { Backfill } from '@/views/Backfill';
import { Convert } from '@/views/Convert';
import { Filter } from '@/views/Filter';
import { MapValues } from '@/views/MapValues';
import { Split } from '@/views/Split';
import { Stats } from '@/views/Stats';
import { Translate } from '@/views/Translate';
import { UuidExtractor } from '@/views/UuidExtractor';

type Icon = ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

export interface Route {
  path: string;
  element: ReactNode;
  title: string;
  icon: Icon;
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
    path: '/stats',
    element: <Stats />,
    title: 'Stats',
    icon: BarChart
  },
  {
    path: '/filter',
    element: <Filter />,
    title: 'Filter',
    icon: FileFilter
  },
  {
    path: '/split',
    element: <Split />,
    title: 'Split',
    icon: Scissors
  },
  {
    path: '/convert',
    element: <Convert />,
    title: 'Convert',
    icon: FileDown
  }
];

export const defaultRoute = {
  path: '/',
  element: <Navigate to='/filter' replace={true} />
};
