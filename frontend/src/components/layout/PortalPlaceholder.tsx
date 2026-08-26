interface PortalPlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
}

/**
 * Empty portal page body. Shared so route groups stay placeholders until the
 * owning vertical lands (Melkamu, Jerry, Biruk, Liya).
 */
export default function PortalPlaceholder({
  eyebrow,
  title,
  description,
}: PortalPlaceholderProps) {
  return (
    <div className="flex-1 flex items-center justify-center py-10">
      <div className="w-full max-w-lg text-center">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card px-8 py-12">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {description}
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-muted border border-amber-100 px-3.5 py-1.5 text-xs font-medium text-amber-900/70">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              Empty shell — ready for this vertical
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
