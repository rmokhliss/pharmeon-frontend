type LogoProps = { size?: number; className?: string };

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Pill capsule shape */}
      <rect x="4" y="14" width="32" height="12" rx="6" fill="#6366f1" />
      <rect x="4" y="14" width="16" height="12" rx="0" fill="#818cf8" />
      <rect x="4" y="14" width="10" height="12" rx="6" fill="#818cf8" />
      <rect x="26" y="14" width="10" height="12" rx="6" fill="#4f46e5" />
      {/* Center divider line */}
      <line x1="20" y1="14" x2="20" y2="26" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
      {/* Cross/plus symbol */}
      <rect x="8" y="18.5" width="7" height="3" rx="1.5" fill="white" fillOpacity="0.9" />
      <rect x="10.5" y="16" width="2" height="8" rx="1" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
