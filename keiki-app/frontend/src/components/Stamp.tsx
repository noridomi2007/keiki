import { vi } from '../i18n/vi';

interface StampProps {
  animate?: boolean;
}

export function Stamp({ animate = true }: StampProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 border-[#0F7B5F] bg-[#0F7B5F]/10 px-2.5 py-0.5 text-xs font-bold tracking-wider text-[#0F7B5F] uppercase rounded ${
        animate ? 'stamp-animate' : '-rotate-6'
      }`}
    >
      <span className="material-symbols-rounded text-sm">verified</span>
      {vi.stampText}
    </span>
  );
}
