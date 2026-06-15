import React from "react";
import "./Button.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type ButtonSize = "small" | "medium" | "large";
type ButtonRounded = "small" | "medium" | "large";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children = "Click Me",
  variant = "primary",
  size = "medium",
  rounded = "medium",
  fullWidth = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        genix-btn
        genix-btn-${variant}
        genix-btn-${size}
        genix-btn-rounded-${rounded}
        ${fullWidth ? "genix-btn-full" : ""}
        ${className}
      `}
      {...props}
    >
      <span className="genix-btn-shine"></span>
      <span className="genix-btn-text">{children}</span>
    </button>
  );
};

export default Button;