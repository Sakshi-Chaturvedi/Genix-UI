import React from "react";
import "./ProductCard.css";

type ProductCardVariant = "default" | "elevated" | "outlined" | "glass";
type ProductCardSize = "small" | "medium" | "large";

export interface ProductCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  image: string;
  title: string;
  description?: string;
  price: string | number;
  originalPrice?: string | number;
  badge?: string;
  rating?: number;
  reviews?: number;
  buttonText?: string;
  variant?: ProductCardVariant;
  size?: ProductCardSize;
  fullWidth?: boolean;
  onButtonClick?: () => void;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      image,
      title,
      description,
      price,
      originalPrice,
      badge,
      rating,
      reviews,
      buttonText = "Add to Cart",
      variant = "default",
      size = "medium",
      fullWidth = false,
      onButtonClick,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          genix-product-card
          genix-product-card-${variant}
          genix-product-card-${size}
          ${fullWidth ? "genix-product-card-full" : ""}
          ${className}
        `}
        {...props}
      >
        <div className="genix-product-card-image-wrapper">
          {badge && <span className="genix-product-card-badge">{badge}</span>}

          <img
            src={image}
            alt={title}
            className="genix-product-card-image"
          />
        </div>

        <div className="genix-product-card-body">
          <div className="genix-product-card-info">
            <h3 className="genix-product-card-title">{title}</h3>

            {description && (
              <p className="genix-product-card-description">
                {description}
              </p>
            )}
          </div>

          {(rating || reviews) && (
            <div className="genix-product-card-rating">
              {rating && (
                <span className="genix-product-card-stars">
                  ★ {rating}
                </span>
              )}

              {reviews && (
                <span className="genix-product-card-reviews">
                  ({reviews} reviews)
                </span>
              )}
            </div>
          )}

          <div className="genix-product-card-footer">
            <div className="genix-product-card-price-box">
              <span className="genix-product-card-price">
                {price}
              </span>

              {originalPrice && (
                <span className="genix-product-card-original-price">
                  {originalPrice}
                </span>
              )}
            </div>

            <button
              type="button"
              className="genix-product-card-button"
              onClick={onButtonClick}
            >
              <span className="genix-product-card-button-shine"></span>
              <span className="genix-product-card-button-text">
                {buttonText}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
export type { ProductCardVariant, ProductCardSize };