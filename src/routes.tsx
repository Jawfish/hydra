import {
  BarChart,
  Bot,
  Combine as CombineIcon,
  FileDown,
  Filter as FileFilter,
  FileText,
  IdCard,
  type LucideProps,
  Map as MapIcon,
  Scissors,
  Trash2
} from 'lucide-react';
import {
  type ForwardRefExoticComponent,
  lazy,
  type ReactNode,
  type RefAttributes
} from 'react';
import { Navigate } from 'react-router-dom';

const Backfill = lazy(() =>
  import('@/views/Backfill').then(module => ({ default: module.Backfill }))
);
const Combine = lazy(() =>
  import('@/views/Combine').then(module => ({ default: module.Combine }))
);
const Convert = lazy(() =>
  import('@/views/Convert').then(module => ({ default: module.Convert }))
);
const FieldRemover = lazy(() =>
  import('@/views/FieldRemover').then(module => ({ default: module.FieldRemover }))
);
const Filter = lazy(() =>
  import('@/views/Filter').then(module => ({ default: module.Filter }))
);
const MapValues = lazy(() =>
  import('@/views/MapValues').then(module => ({ default: module.MapValues }))
);
const Split = lazy(() =>
  import('@/views/Split').then(module => ({ default: module.Split }))
);
const Stats = lazy(() =>
  import('@/views/Stats').then(module => ({ default: module.Stats }))
);
const Translate = lazy(() =>
  import('@/views/Translate').then(module => ({ default: module.Translate }))
);
const UuidExtractor = lazy(() =>
  import('@/views/UuidExtractor').then(module => ({ default: module.UuidExtractor }))
);

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
  },
  {
    path: '/field-remover',
    element: <FieldRemover />,
    title: 'Field Remover',
    icon: Trash2
  },
  {
    path: '/combine',
    element: <Combine />,
    title: 'Combine',
    icon: CombineIcon
  }
];

export const defaultRoute = {
  path: '/',
  element: <Navigate to='/filter' replace={true} />
};
