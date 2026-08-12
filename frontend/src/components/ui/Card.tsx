import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden transition-all duration-200', className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn('px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('text-base font-bold text-slate-800 tracking-tight leading-snug', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-slate-500 mt-0.5', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export default Card;
