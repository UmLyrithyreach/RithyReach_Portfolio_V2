import React from "react";

export interface CornerBracketsProps {
  className?: string;
  size?: string;
  strokeWidth?: number;
}

export function CornerBrackets({
  className = "text-foreground",
  size = "0.625rem",
  strokeWidth = 1,
}: CornerBracketsProps) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    pointerEvents: "none",
  };

  return (
    <>
      <svg
        className={`hero-corner hero-corner--tl ${className}`}
        style={{ ...baseStyle, top: 0, left: 0, transform: "scaleX(-1)" }}
        viewBox="0 0 10.5 10.5"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 0.5H10V10.5" />
      </svg>
      <svg
        className={`hero-corner hero-corner--tr ${className}`}
        style={{ ...baseStyle, top: 0, right: 0 }}
        viewBox="0 0 10.5 10.5"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 0.5H10V10.5" />
      </svg>
      <svg
        className={`hero-corner hero-corner--bl ${className}`}
        style={{ ...baseStyle, bottom: 0, left: 0, transform: "scale(-1)" }}
        viewBox="0 0 10.5 10.5"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 0.5H10V10.5" />
      </svg>
      <svg
        className={`hero-corner hero-corner--br ${className}`}
        style={{ ...baseStyle, bottom: 0, right: 0, transform: "scaleY(-1)" }}
        viewBox="0 0 10.5 10.5"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 0.5H10V10.5" />
      </svg>
    </>
  );
}
