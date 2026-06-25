import React from "react";

interface OasisLogoProps {
  size?: number;
  color?: string;
  className?: string;
  zoom?: number;
}

export default function OasisLogo({ size = 32, color, className = "", zoom = 2.8 }: OasisLogoProps) {
  const imgStyle: React.CSSProperties = {
    width: size * zoom,
    height: size * zoom,
    objectFit: "contain",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    ...(color === "white" ? { filter: "invert(1)" } : {}),
  };

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{ width: size, height: size, overflow: "hidden", position: "relative" }}
    >
      <img src="/oasis-logo.png" alt="OASIS Research" style={imgStyle} />
    </div>
  );
}
