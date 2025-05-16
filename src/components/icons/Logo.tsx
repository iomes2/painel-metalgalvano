
import type React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  textColor?: string;
  iconColor?: string;
}

const Logo: React.FC<LogoProps> = ({ width = 150, height = 30, textColor = "hsl(var(--primary))", iconColor = "hsl(var(--accent))", ...props }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Metalgalvano Forms Logo"
      {...props}
    >
      <path d="M5 10 L15 5 L15 25 L5 20 Z" fill={iconColor} />
      <path d="M18 10 L28 5 L28 25 L18 20 Z" fill={iconColor} opacity="0.7" />
      <text x="35" y="20" fontFamily="var(--font-geist-sans), Arial, sans-serif" fontSize="16" fontWeight="bold" fill={textColor}>
        Metalgalvano Forms
      </text>
    </svg>
  );
};

export default Logo;
