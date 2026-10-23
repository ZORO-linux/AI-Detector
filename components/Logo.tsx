export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" role="img" aria-label="AI Scam Shield logo">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6bff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 6 10v13c0 11 7.6 19.3 18 22 10.4-2.7 18-11 18-22V10L24 3Z"
        fill="url(#shieldGrad)"
        fillOpacity="0.16"
        stroke="url(#shieldGrad)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="21" r="3" fill="#22d3ee" />
      <circle cx="15" cy="16" r="2" fill="#2f6bff" />
      <circle cx="33" cy="16" r="2" fill="#2f6bff" />
      <circle cx="17" cy="29" r="2" fill="#2f6bff" />
      <circle cx="31" cy="29" r="2" fill="#2f6bff" />
      <g stroke="#22d3ee" strokeWidth="1.4" strokeOpacity="0.75">
        <path d="M24 21 15 16M24 21l9-5M24 21l-7 8M24 21l7 8M15 16v13M33 16v13" />
      </g>
    </svg>
  );
}

export function LogoWordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight text-white">AI Scam Shield</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">Detect · Verify · Protect</span>
      </span>
    </span>
  );
}
