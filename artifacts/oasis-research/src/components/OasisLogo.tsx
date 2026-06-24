import React from "react";

interface OasisLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function OasisLogo({ size = 32, color = "currentColor", className = "" }: OasisLogoProps) {
  const cx = 24;
  const cy = 24;
  const outerR = 16;
  const innerR = 10;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OASIS-Research logo"
    >
      {/* Outer thick ring */}
      <circle cx={cx} cy={cy} r={outerR} stroke={color} strokeWidth="3.2" fill="none" />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={innerR} stroke={color} strokeWidth="2.2" fill="none" />
      {/* Diagonal slash — lower-left to upper-right, extending well past both rings */}
      <line
        x1="3"
        y1="36"
        x2="45"
        y2="12"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
