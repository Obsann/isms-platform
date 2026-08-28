import type { ReactNode } from 'react';

export function MemberPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">{eyebrow}</p>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-serif mt-0.5">
        {title}
      </h1>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

export function MemberPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <MemberPageHeader eyebrow={eyebrow} title={title} description={description} />
      {children}
    </div>
  );
}
