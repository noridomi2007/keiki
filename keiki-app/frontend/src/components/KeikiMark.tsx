interface KeikiMarkProps {
  className?: string;
}

/**
 * Custom architectural ledger emblem for Keiki brand headers.
 */
export function KeikiMark({ className = 'h-9 w-9' }: KeikiMarkProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="9" fill="#2E2396" />
      <path d="M11 7.5V28.5" stroke="#FCA5A5" strokeWidth="1.25" strokeOpacity="0.85" />
      <path
        d="M14.5 12.5H26M14.5 18H26M14.5 23.5H20"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.5 20.5L19 24L26.5 14"
        stroke="#FDE047"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
