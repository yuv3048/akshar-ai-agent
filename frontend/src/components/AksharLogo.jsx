function AksharLogo({ className = "h-8 w-8" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Akshar AI logo"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="akshar-logo-gradient" x1="7" y1="4" x2="41" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <g stroke="url(#akshar-logo-gradient)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 38 23.8 7 40 38" />
        <path d="M14.5 25.5h19" />
        <path d="M23.8 7v12.5l-8.5 8.2" />
        <path d="M23.8 19.5 33 28" />
        <path d="M23.8 30v10" />
      </g>
      <g fill="#fb923c" stroke="#0a0a0a" strokeWidth="1.4">
        <circle cx="23.8" cy="7" r="3.5" />
        <circle cx="8" cy="38" r="3.5" />
        <circle cx="40" cy="38" r="3.5" />
        <circle cx="14.5" cy="25.5" r="3" />
        <circle cx="33.5" cy="28" r="3" />
        <circle cx="23.8" cy="40" r="3" />
      </g>
    </svg>
  );
}

export default AksharLogo;
