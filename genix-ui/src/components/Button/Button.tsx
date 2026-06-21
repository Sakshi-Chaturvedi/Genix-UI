import React, { useState } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
  },
  outline: {
    background: "transparent",
    color: "#2563eb",
    border: "1px solid #2563eb",
  },
  ghost: {
    background: "transparent",
    color: "#111",
    border: "none",
  },
  gradient: {
    background: "linear-gradient(135deg, #6366f1, #06b6d4)",
    color: "#fff",
    border: "none",
  },
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "6px 12px",
    fontSize: "12px",
  },
  md: {
    padding: "10px 18px",
    fontSize: "14px",
  },
  lg: {
    padding: "14px 24px",
    fontSize: "16px",
  },
};

export const Button = ({
  text = "Click Me",
  variant = "gradient",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  style,
  ...rest
}: ButtonProps) => {
  const [hovered, setHovered] = useState<boolean>(false);

  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...variants[variant],
        ...sizes[size],

        borderRadius: "10px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 600,
        fontFamily: "sans-serif",

        transform: hovered && !isDisabled ? "translateY(-2px) scale(1.02)" : "scale(1)",
        boxShadow:
          hovered && !isDisabled
            ? "0 10px 20px rgba(0,0,0,0.15)"
            : "0 2px 6px rgba(0,0,0,0.1)",

        transition: "all 0.2s ease",
        opacity: isDisabled ? 0.6 : 1,
        position: "relative",
        overflow: "hidden",

        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.2)",
          opacity: hovered && !isDisabled ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />

      {loading ? (
        <span style={{ position: "relative", zIndex: 1 }}>Loading...</span>
      ) : (
        <>
          {icon && (
            <span style={{ position: "relative", zIndex: 1 }}>{icon}</span>
          )}
          <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
        </>
      )}
    </button>
  );
};