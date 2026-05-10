export default function Logo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const dimensions = {
    small: { width: 32, height: 32, fontSize: 14 },
    medium: { width: 48, height: 48, fontSize: 18 },
    large: { width: 64, height: 64, fontSize: 24 }
  };

  const { width, height, fontSize } = dimensions[size];

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Custom city mark: bridge + waves (not an official logo) */}
        <circle cx="32" cy="32" r="28" fill="#0f4c81" stroke="#1d4ed8" strokeWidth="2" />
        <path
          d="M12 36C20 32 28 32 36 36C44 40 52 40 52 36"
          stroke="#93c5fd"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M12 42C20 38 28 38 36 42C44 46 52 46 52 42"
          stroke="#60a5fa"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M18 28C24 22 40 22 46 28"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="22" y="26" width="2.5" height="10" fill="#fbbf24" />
        <rect x="39.5" y="26" width="2.5" height="10" fill="#fbbf24" />
        <circle cx="32" cy="24" r="2" fill="#fbbf24" />
      </svg>

      <div className="flex flex-col leading-tight">
        <span className="font-semibold tracking-wide" style={{ fontSize: fontSize }}>
          GTOP
        </span>
        <span className="text-xs text-gray-500 tracking-tight">
          Gothenburg Mobility Lab
        </span>
      </div>
    </div>
  );
}
