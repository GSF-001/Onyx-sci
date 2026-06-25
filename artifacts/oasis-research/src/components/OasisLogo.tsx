import React from "react";

interface OasisLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function OasisLogo({ size = 32, color, className = "" }: OasisLogoProps) {
  if (color === "white") {
    return (
      <div
        className={`flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src="/oasis-logo.png"
          alt="OASIS Research"
          style={{ width: size, height: size, objectFit: "contain", filter: "invert(1)" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/oasis-logo.png"
        alt="OASIS Research"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    </div>
  );
}
