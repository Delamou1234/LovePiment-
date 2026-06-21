import type { LucideIcon } from 'lucide-react';

type TrustItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type Props = {
  items: TrustItem[];
};

export function HomeTrustStrip({ items }: Props) {
  return (
    <section className="border-y border-beige-border/50 bg-white/80 backdrop-blur-sm">
      <div className="container-kabishop">
        <ul className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-beige-border/60">
          {items.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="flex items-start gap-3 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 first:pl-4 lg:first:pl-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-olive-light text-olive">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">{title}</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-relaxed hidden sm:block">
                  {desc}
                </p>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
