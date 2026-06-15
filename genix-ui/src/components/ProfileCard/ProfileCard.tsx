import React from "react";
import "./ProfileCard.css";

type ProfileCardVariant = "default" | "outlined" | "elevated";

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  variant?: ProfileCardVariant;
  fullWidth?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  (
    {
      name,
      role,
      bio,
      avatar,
      location,
      variant = "default",
      fullWidth = false,
      buttonText = "View Profile",
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
          genix-profile-card
          genix-profile-card-${variant}
          ${fullWidth ? "genix-profile-card-full" : ""}
          ${className}
        `}
        {...props}
      >
        <div className="genix-profile-card-avatar-wrap">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="genix-profile-card-avatar"
            />
          ) : (
            <div className="genix-profile-card-avatar-fallback">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="genix-profile-card-content">
          <h3 className="genix-profile-card-name">{name}</h3>

          {role && <p className="genix-profile-card-role">{role}</p>}

          {location && (
            <p className="genix-profile-card-location">{location}</p>
          )}

          {bio && <p className="genix-profile-card-bio">{bio}</p>}
        </div>

        <button
          type="button"
          className="genix-profile-card-button"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      </div>
    );
  }
);

ProfileCard.displayName = "ProfileCard";

export default ProfileCard;
export type { ProfileCardVariant };