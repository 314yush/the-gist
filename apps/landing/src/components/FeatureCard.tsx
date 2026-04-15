import { useState, type ReactNode } from 'react';

interface FeatureCardProps {
  mod: string;
  label: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ mod, label, icon, title, description }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative flex cursor-default flex-col gap-6 overflow-hidden rounded-[14px] border bg-dark p-8 transition-colors duration-300 ${
        hovered ? 'border-white/20' : 'border-white/10'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: '#1c1a19' }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_70%)]"
        aria-hidden
      />
      <div className="flex justify-between border-b border-white/10 pb-2 font-mono text-xs tracking-wider text-terracotta">
        <span>{mod}</span>
        <span>{label}</span>
      </div>
      <div className="flex h-8 w-8 items-center justify-center text-white [&_svg]:h-full [&_svg]:w-full [&_svg]:stroke-[1.5] [&_svg]:stroke-current [&_svg]:fill-none">
        {icon}
      </div>
      <div>
        <h4 className="mb-2 font-serif text-xl font-normal italic text-white">{title}</h4>
        <p className="text-[0.9rem] leading-relaxed text-white/65">{description}</p>
      </div>
    </div>
  );
}
