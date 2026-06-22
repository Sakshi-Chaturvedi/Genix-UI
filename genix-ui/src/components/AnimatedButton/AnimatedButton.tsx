import React, { useState } from "react";

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  variant?:
    | "primary"
    | "secondary"
    | "gradient"
    | "dark"
    | "success"
    | "danger"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

type ButtonVisualState = {
  background: string;
  color: string;
  border: string;
  shadow: string;
  hoverBackground: string;
  hoverShadow: string;
  focusRing: string;
};

const variantStyles: Record<
  NonNullable<AnimatedButtonProps["variant"]>,
  ButtonVisualState
> = {
  primary: {
    background: "#4f46e5",
    color: "#ffffff",
    border: "1px solid transparent",
    shadow: "0 10px 24px rgba(79, 70, 229, 0.28)",
    hoverBackground: "#4338ca",
    hoverShadow: "0 14px 32px rgba(79, 70, 229, 0.34)",
    focusRing: "rgba(79, 70, 229, 0.28)",
  },
  secondary: {
    background: "#f1f5f9",
    color: "#0f172a",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    shadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    hoverBackground: "#e2e8f0",
    hoverShadow: "0 12px 26px rgba(15, 23, 42, 0.12)",
    focusRing: "rgba(100, 116, 139, 0.22)",
  },
  gradient: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    shadow: "0 12px 30px rgba(99, 102, 241, 0.32)",
    hoverBackground:
      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
    hoverShadow: "0 16px 38px rgba(124, 58, 237, 0.38)",
    focusRing: "rgba(139, 92, 246, 0.3)",
  },
  dark: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    shadow: "0 12px 30px rgba(15, 23, 42, 0.32)",
    hoverBackground: "#020617",
    hoverShadow: "0 16px 38px rgba(15, 23, 42, 0.4)",
    focusRing: "rgba(15, 23, 42, 0.28)",
  },
  success: {
    background: "#16a34a",
    color: "#ffffff",
    border: "1px solid transparent",
    shadow: "0 10px 24px rgba(22, 163, 74, 0.26)",
    hoverBackground: "#15803d",
    hoverShadow: "0 14px 32px rgba(22, 163, 74, 0.32)",
    focusRing: "rgba(22, 163, 74, 0.25)",
  },
  danger: {
    background: "#dc2626",
    color: "#ffffff",
    border: "1px solid transparent",
    shadow: "0 10px 24px rgba(220, 38, 38, 0.26)",
    hoverBackground: "#b91c1c",
    hoverShadow: "0 14px 32px rgba(220, 38, 38, 0.32)",
    focusRing: "rgba(220, 38, 38, 0.25)",
  },
  outline: {
    background: "transparent",
    color: "#334155",
    border: "1px solid rgba(15, 23, 42, 0.16)",
    shadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
    hoverBackground: "#f8fafc",
    hoverShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
    focusRing: "rgba(100, 116, 139, 0.22)",
  },
  ghost: {
    background: "transparent",
    color: "#334155",
    border: "1px solid transparent",
    shadow: "none",
    hoverBackground: "rgba(15, 23, 42, 0.06)",
    hoverShadow: "none",
    focusRing: "rgba(100, 116, 139, 0.2)",
  },
};

const sizeStyles: Record<
  NonNullable<AnimatedButtonProps["size"]>,
  {
    padding: string;
    fontSize: string;
    minHeight: string;
    gap: string;
  }
> = {
  sm: {
    padding: "8px 14px",
    fontSize: "13px",
    minHeight: "36px",
    gap: "7px",
  },
  md: {
    padding: "11px 18px",
    fontSize: "14px",
    minHeight: "42px",
    gap: "8px",
  },
  lg: {
    padding: "14px 24px",
    fontSize: "15px",
    minHeight: "50px",
    gap: "10px",
  },
};

const roundedStyles: Record<
  NonNullable<AnimatedButtonProps["rounded"]>,
  string
> = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  full: "999px",
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  text,
  variant = "gradient",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  rounded = "lg",
  className,
  style,
  onClick,
  type = "button",
  ...props
}) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const [pressed, setPressed] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  const isDisabled = disabled || loading;
  const visual = variantStyles[variant];
  const sizing = sizeStyles[size];

  const content = children ?? text ?? "Click Me";

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  const buttonStyle: React.CSSProperties = {
    width: fullWidth ? "100%" : "auto",
    minHeight: sizing.minHeight,
    padding: sizing.padding,
    borderRadius: roundedStyles[rounded],
    border: visual.border,
    background: hovered && !isDisabled ? visual.hoverBackground : visual.background,
    color: visual.color,
    boxShadow:
      focused && !isDisabled
        ? `0 0 0 4px ${visual.focusRing}, ${visual.shadow}`
        : hovered && !isDisabled
          ? visual.hoverShadow
          : visual.shadow,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.62 : 1,
    transform: isDisabled
      ? "translateY(0) scale(1)"
      : pressed
        ? "translateY(1px) scale(0.98)"
        : hovered
          ? "translateY(-2px) scale(1.01)"
          : "translateY(0) scale(1)",
    transition:
      "transform 180ms ease, background 180ms ease, box-shadow 180ms ease, opacity 180ms ease, border-color 180ms ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: sizing.gap,
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    whiteSpace: "nowrap",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: sizing.fontSize,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "-0.01em",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.1em",
    lineHeight: 1,
    flexShrink: 0,
  };

  const spinnerStyle: React.CSSProperties = {
    width: "1em",
    height: "1em",
    borderRadius: "999px",
    border: "2px solid currentColor",
    borderTopColor: "transparent",
    animation: "genix-button-spin 0.75s linear infinite",
    flexShrink: 0,
  };

  return (
    <>
      <style>{`
        @keyframes genix-button-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <button
        {...props}
        type={type}
        className={className}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        onClick={handleClick}
        onMouseEnter={(event) => {
          setHovered(true);
          props.onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHovered(false);
          setPressed(false);
          props.onMouseLeave?.(event);
        }}
        onMouseDown={(event) => {
          if (!isDisabled) setPressed(true);
          props.onMouseDown?.(event);
        }}
        onMouseUp={(event) => {
          setPressed(false);
          props.onMouseUp?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          setPressed(false);
          props.onBlur?.(event);
        }}
        style={buttonStyle}
      >
        {loading ? (
          <span style={spinnerStyle} aria-hidden="true" />
        ) : (
          leftIcon && <span style={iconStyle}>{leftIcon}</span>
        )}

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 1,
          }}
        >
          {content}
        </span>

        {!loading && rightIcon && <span style={iconStyle}>{rightIcon}</span>}
      </button>
    </>
  );
};