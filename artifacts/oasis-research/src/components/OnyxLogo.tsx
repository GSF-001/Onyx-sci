import React from "react";

interface OnyxLogoProps {
  size?: number;
  className?: string;
}

export default function OnyxLogo({ size = 36, className = "" }: OnyxLogoProps) {
  return (
    <img
      src="/onyx-logo-transparent.png"
      alt="ONYX Research"
      className={`object-contain flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
