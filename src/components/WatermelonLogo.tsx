import React from 'react';

interface WatermelonLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const WatermelonLogo: React.FC<WatermelonLogoProps> = ({
  className = '',
  size = 40,
  animate = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${animate ? 'hover:rotate-6 hover:scale-110 transition-transform duration-300' : ''} ${className}`}
    >
      <defs>
        {/* Soft drop shadow for sticker depth */}
        <filter id="wm-shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        {/* Red pulp gradient */}
        <linearGradient id="wm-pulp" x1="50" y1="15" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF4B63" />
          <stop offset="60%" stopColor="#E61E43" />
          <stop offset="100%" stopColor="#D91438" />
        </linearGradient>
        {/* Green rind gradient */}
        <linearGradient id="wm-rind" x1="10" y1="80" x2="90" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>

      <g filter="url(#wm-shadow)">
        {/* White die-cut sticker outline contour */}
        <path
          d="M 50 10 L 89 79 C 78 86, 22 86, 11 79 Z"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Outer Green Rind */}
        <path
          d="M 12 78 C 24 85, 76 85, 88 78 L 84 84 C 72 90, 28 90, 16 84 Z"
          fill="url(#wm-rind)"
        />

        {/* Inner Yellowish-White Rind line */}
        <path
          d="M 15 76 C 26 82, 74 82, 85 76 L 87 78 C 76 84, 24 84, 13 78 Z"
          fill="#FEF08A"
        />

        {/* Red Watermelon Pulp */}
        <path
          d="M 50 14 L 85 75 C 74 81, 26 81, 15 75 Z"
          fill="url(#wm-pulp)"
        />

        {/* Watermelon Seeds */}
        {/* Top left seed */}
        <path d="M 48 30 C 47 27, 49 26, 50 26 C 51 26, 53 27, 52 30 C 51 32, 49 32, 48 30 Z" fill="#18181B" />
        {/* Mid left seed */}
        <path d="M 33 60 C 31 57, 34 56, 35 56 C 36 56, 38 57, 37 60 C 36 62, 34 62, 33 60 Z" fill="#18181B" />
        {/* Mid right seed */}
        <path d="M 67 60 C 65 57, 68 56, 69 56 C 70 56, 72 57, 71 60 C 70 62, 68 62, 67 60 Z" fill="#18181B" />
        {/* Lower center seeds */}
        <path d="M 44 68 C 43 66, 45 65, 46 65 C 47 65, 48 66, 47 68 C 46 70, 44 70, 44 68 Z" fill="#18181B" />
        <path d="M 56 68 C 55 66, 57 65, 58 65 C 59 65, 60 66, 59 68 C 58 70, 56 70, 56 68 Z" fill="#18181B" />

        {/* Sunglasses Left Arm */}
        <path d="M 22 52 L 31 50" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
        {/* Sunglasses Right Arm */}
        <path d="M 69 50 L 78 52" stroke="#000000" strokeWidth="3" strokeLinecap="round" />

        {/* Sunglasses Frame and Bridge */}
        {/* Left lens */}
        <path
          d="M 29 46 L 47 45 C 48 54, 30 58, 29 46 Z"
          fill="#000000"
          stroke="#18181B"
          strokeWidth="1.5"
        />
        {/* Right lens */}
        <path
          d="M 53 45 L 71 46 C 70 58, 52 54, 53 45 Z"
          fill="#000000"
          stroke="#18181B"
          strokeWidth="1.5"
        />
        {/* Bridge */}
        <path d="M 47 46 L 53 46" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

        {/* Sunglasses Lens Glare / Reflection lines */}
        <path d="M 33 48 L 41 47" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d="M 57 47 L 65 48" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />

        {/* Smug Smirking Smile */}
        <path
          d="M 43 62 C 48 66, 54 66, 58 62"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cute stick legs & arms */}
        {/* Left leg */}
        <path d="M 28 84 C 26 90, 20 92, 14 91" stroke="#000000" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Right leg */}
        <path d="M 72 84 C 74 90, 80 92, 86 91" stroke="#000000" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Left hand propping up */}
        <path d="M 18 73 C 14 77, 10 84, 8 89" stroke="#000000" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Right hand propping up */}
        <path d="M 82 73 C 86 77, 90 84, 92 89" stroke="#000000" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
};
