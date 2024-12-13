import { Header } from '@/components/Header';
import { Separator } from '@/components/ui/separator';

export function Backfill() {
  return (
    <div className='flex flex-col mb-12'>
      <Header>
        <Header.Title>Backfill</Header.Title>
        <Header.Description>
          Backfill data from one file into another
        </Header.Description>
      </Header>
      <Separator className='my-14 h-[1px]' />
    </div>
  );
}
