import React from "react";

interface OasisLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function OasisLogo({ size = 32, color = "currentColor", className = "" }: OasisLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring - split by diagonal */}
      <path
        d="M24 6 A18 18 0 1 1 6 24"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 24 A18 18 0 0 1 24 6"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      {/* Inner ring */}
      <circle cx="24" cy="24" r="10" stroke={color} strokeWidth="2" fill="none" />
      {/* Diagonal line (accretion disk / orbital plane) */}
      <line
        x1="2"
        y1="34"
        x2="46"
        y2="14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
