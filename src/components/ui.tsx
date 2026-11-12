import type { ReactNode, SVGProps } from 'react';
import type { WineType } from '../types/wine';

// --- Iconen (lijn-iconen, erven de tekstkleur) ---

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, strokeWidth = 1.8, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Cellar: (p: IconProps) => (
    <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></Svg>
  ),
  Fork: (p: IconProps) => (
    <Svg {...p}><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3 3.5-3 7h3" /></Svg>
  ),
  Chart: (p: IconProps) => (
    <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>
  ),
  Gear: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Svg>
  ),
  Plus: (p: IconProps) => <Svg strokeWidth={2.2} {...p}><path d="M12 5v14M5 12h14" /></Svg>,
  Minus: (p: IconProps) => <Svg strokeWidth={2.2} {...p}><path d="M5 12h14" /></Svg>,
  Search: (p: IconProps) => <Svg strokeWidth={2} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>,
  Sort: (p: IconProps) => <Svg {...p}><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" /></Svg>,
  Back: (p: IconProps) => <Svg strokeWidth={2.4} {...p}><path d="M15 4l-8 8 8 8" /></Svg>,
  Check: (p: IconProps) => <Svg strokeWidth={2.4} {...p}><path d="M5 12l5 5L20 7" /></Svg>,
  Close: (p: IconProps) => <Svg strokeWidth={2.2} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>,
  Star: ({ filled, ...p }: IconProps & { filled?: boolean }) => (
    <Svg strokeWidth={1.6} fill={filled ? 'currentColor' : 'none'} {...p}>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </Svg>
  ),
  Trash: (p: IconProps) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>,
};

export function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-faint shrink-0">
      <path d="M1 1l6 6-6 6" />
    </svg>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// --- Wijnsoort ---

export const typeLabels: Record<WineType, string> = {
  rood: 'Rood',
  wit: 'Wit',
  rosé: 'Rosé',
  bruisend: 'Bruisend',
};

const typeDotClass: Record<WineType, string> = {
  rood: 'bg-type-rood',
  wit: 'bg-type-wit',
  rosé: 'bg-type-rose',
  bruisend: 'bg-type-bruisend',
};

export function TypeDot({ type, size = 10 }: { type: WineType; size?: number }) {
  const light = type !== 'rood';
  return (
    <span
      aria-hidden="true"
      className={`${typeDotClass[type] ?? 'bg-faint'} shrink-0 rounded-full`}
      style={{ width: size, height: size, boxShadow: light ? 'inset 0 0 0 1px rgba(0,0,0,0.12)' : undefined }}
    />
  );
}

export function typeBarClass(type: WineType) {
  return typeDotClass[type] ?? 'bg-faint';
}

// --- Schermopbouw ---

/** Scrollend scherm met grote titel (hoofdschermen achter de tabbalk) */
export function Screen({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="max-w-xl mx-auto px-5 pt-3 pb-10">
        {actions && <div className="flex justify-between items-center h-11 -mx-1">{actions}</div>}
        <header className={actions ? 'mt-1 mb-4' : 'mt-4 mb-4'}>
          <h1 className="text-[34px] leading-10 font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-[15px] text-muted mt-0.5">{subtitle}</p>}
        </header>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

export function SectionHeader({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex justify-between items-baseline px-1 mb-2">
      <h2 className="text-[13px] font-semibold tracking-wide uppercase text-muted">{children}</h2>
      {trailing && <span className="text-[13px] text-muted">{trailing}</span>}
    </div>
  );
}

export function Section({ title, trailing, footer, children }: {
  title?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      {title && <SectionHeader trailing={trailing}>{title}</SectionHeader>}
      {children}
      {footer && <p className="text-[13px] leading-[18px] text-muted px-1 mt-2">{footer}</p>}
    </section>
  );
}

/** Witte gegroepeerde lijst; directe kinderen krijgen een scheidingslijn */
export function Group({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-[14px] overflow-hidden divide-y divide-line ${className}`}>
      {children}
    </div>
  );
}

export function Row({ label, value, onClick, chevron, children }: {
  label: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  children?: ReactNode;
}) {
  const content = (
    <>
      <span className="text-base">{label}</span>
      <span className="flex items-center gap-2 text-muted text-[15px] min-w-0">
        {value !== undefined && <span className="truncate">{value}</span>}
        {children}
        {chevron && <Chevron />}
      </span>
    </>
  );
  const cls = 'w-full flex items-center justify-between gap-4 min-h-12 px-4 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} active:bg-control`}>{content}</button>
  ) : (
    <div className={cls}>{content}</div>
  );
}

export function Stepper({ value, onChange, min = 0, label }: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}) {
  return (
    <div className="flex items-center bg-control rounded-[10px]" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Eén minder"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-10 flex items-center justify-center disabled:text-faint"
      >
        <Icon.Minus size={16} />
      </button>
      <span className="w-px h-5 bg-edge" />
      <button
        type="button"
        aria-label="Eén meer"
        onClick={() => onChange(value + 1)}
        className="w-12 h-10 flex items-center justify-center"
      >
        <Icon.Plus size={16} />
      </button>
    </div>
  );
}

export function Stars({ value, onChange, size = 22 }: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  if (!onChange) {
    return (
      <span className="flex text-warn" aria-label={`${value} van 5 sterren`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon.Star key={n} size={size} filled={n <= value} className={n <= value ? '' : 'text-edge'} />
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" aria-label="Beoordeling" className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} ${n === 1 ? 'ster' : 'sterren'}`}
          // Nog eens op dezelfde ster tikken haalt de beoordeling weg
          onClick={() => onChange(n === value ? 0 : n)}
          className={`w-[30px] h-9 flex items-center justify-center ${n <= value ? 'text-warn' : 'text-faint'}`}
        >
          <Icon.Star size={size - 2} filled={n <= value} />
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex p-0.5 bg-control rounded-[9px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-8 px-3.5 rounded-[7px] text-sm font-semibold ${
            o.value === value ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-[15px] text-danger px-1">
      {children}
    </p>
  );
}

export const inputClass = 'flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-muted/70 outline-none';
