import React from "react";
import "./Card.css";

type CardVariant = "default" | "elevated" | "outlined" | "glass";
type CardPadding = "small" | "medium" | "large";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: CardVariant;
  padding?: CardPadding;
  fullWidth?: boolean;
  hoverable?: boolean;
}

interface CardSubComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      title,
      description,
      variant = "default",
      padding = "medium",
      fullWidth = false,
      hoverable = true,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          genix-card
          genix-card-${variant}
          genix-card-padding-${padding}
          ${fullWidth ? "genix-card-full" : ""}
          ${hoverable ? "genix-card-hoverable" : ""}
          ${className}
        `}
        {...props}
      >
        {(title || description) && (
          <div className="genix-card-header">
            {title && <h3 className="genix-card-title">{title}</h3>}
            {description && (
              <p className="genix-card-description">{description}</p>
            )}
          </div>
        )}

        {children}
      </div>
    );
  }
);

CardRoot.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardSubComponentProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`genix-card-header ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "Card.Header";

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`genix-card-title ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "Card.Title";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`genix-card-description ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "Card.Description";

const CardContent = React.forwardRef<HTMLDivElement, CardSubComponentProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`genix-card-content ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "Card.Content";

const CardFooter = React.forwardRef<HTMLDivElement, CardSubComponentProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`genix-card-footer ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "Card.Footer";

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});

export type {
  CardVariant,
  CardPadding,
  CardSubComponentProps,
  CardTitleProps,
  CardDescriptionProps,
};