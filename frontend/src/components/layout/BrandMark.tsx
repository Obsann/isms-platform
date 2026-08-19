import { cn } from '@/lib/utils';

export default function BrandMark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const box =
    size === 'sm' ? 'w-8 h-8 text-[8px]' : size === 'lg' ? 'w-11 h-11 text-[10px]' : 'w-9 h-9 text-[9px]';

  return (
    <div
      className={cn(
        'rounded-full bg-gold text-midnight flex items-center justify-center shrink-0 font-display font-bold tracking-wider shadow-[0_0_0_3px_rgba(197,155,39,0.2)]',
        box,
        className,
      )}
      aria-hidden="true"
    >
      ISMS
    </div>
  );
}
