import { Icon } from './ui';

export type Tab = 'kelder' | 'spijs' | 'overzicht' | 'instellingen';

const tabs: { id: Tab; label: string; icon: (p: { size?: number }) => JSX.Element }[] = [
  { id: 'kelder', label: 'Kelder', icon: Icon.Cellar },
  { id: 'spijs', label: 'Spijs & wijn', icon: Icon.Fork },
  { id: 'overzicht', label: 'Overzicht', icon: Icon.Chart },
  { id: 'instellingen', label: 'Instellingen', icon: Icon.Gear },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="Hoofdmenu"
      className="shrink-0 bg-[#FAF9F7]/95 backdrop-blur border-t border-edge"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-xl mx-auto grid grid-cols-4 px-2 pt-1.5">
        {tabs.map(({ id, label, icon: TabIcon }) => {
          const on = id === active;
          return (
            <button
              key={id}
              type="button"
              aria-current={on ? 'page' : undefined}
              onClick={() => onChange(id)}
              className={`h-[50px] flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                on ? 'text-wine font-semibold' : 'text-muted font-medium'
              }`}
            >
              <TabIcon size={26} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
