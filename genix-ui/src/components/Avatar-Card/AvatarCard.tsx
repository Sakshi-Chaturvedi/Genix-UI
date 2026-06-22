import React, { useState } from "react";

export type AvatarCardProps = {
  name?: string;
  role?: string;
  followers?: number;
  following?: number;
  projects?: number;
  bio?: string;
  avatar?: string;
  accent?: string;
  bg?: string;
  radius?: string;
  buttonText?: string;
};

export const AvatarCard: React.FC<AvatarCardProps> = ({
  name = "Aryan Sharma",
  role = "Frontend Developer",
  followers = 2400,
  following = 180,
  projects = 34,
  bio = "Building beautiful UIs one component at a time.",
  avatar = "",
  accent = "#6366f1",
  bg = "#0f172a",
  radius = "24px",
  buttonText = "Follow",
}) => {
  const [followed, setFollowed] = useState<boolean>(false);

  const alpha = (hex: string, op: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${op})`;
  };

  const initials: string = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatNumber = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return String(value);
  };

  const stats = [
    {
      label: "Followers",
      value: followed ? followers + 1 : followers,
    },
    {
      label: "Following",
      value: following,
    },
    {
      label: "Projects",
      value: projects,
    },
  ];

  return (
    <>
      <style>{`
        .gx-avatar-card {
          transform: translateY(0);
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease;
        }

        .gx-avatar-card:hover {
          transform: translateY(-8px);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.55),
            0 0 60px var(--gx-avatar-glow);
          border-color: var(--gx-avatar-border-hover);
        }

        .gx-avatar-card-avatar {
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease;
        }

        .gx-avatar-card:hover .gx-avatar-card-avatar {
          transform: scale(1.06);
          box-shadow: 0 0 0 8px var(--gx-avatar-ring-soft);
        }

        .gx-avatar-card-btn {
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }

        .gx-avatar-card-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px var(--gx-avatar-button-shadow);
        }

        .gx-avatar-card-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <div
        className="gx-avatar-card"
        style={
          {
            "--gx-avatar-glow": alpha(accent, 0.16),
            "--gx-avatar-border-hover": alpha(accent, 0.45),
            "--gx-avatar-ring-soft": alpha(accent, 0.12),
            "--gx-avatar-button-shadow": alpha(accent, 0.35),

            width: "310px",
            borderRadius: radius,
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            background: `linear-gradient(180deg, ${alpha(
              accent,
              0.14
            )} 0%, ${bg} 34%, ${bg} 100%)`,
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
          } as React.CSSProperties
        }
      >
        {/* Soft background glow */}
        <div
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: alpha(accent, 0.28),
            filter: "blur(55px)",
            top: "-70px",
            right: "-70px",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            background: alpha(accent, 0.16),
            filter: "blur(45px)",
            bottom: "-55px",
            left: "-45px",
            pointerEvents: "none",
          }}
        />

        {/* Cover */}
        <div
          style={{
            height: "86px",
            background: `
              radial-gradient(circle at 20% 20%, ${alpha(
                accent,
                0.55
              )}, transparent 35%),
              linear-gradient(135deg, ${alpha(accent, 0.42)}, rgba(255,255,255,0.04))
            `,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage:
                "linear-gradient(to bottom, black, transparent 85%)",
              opacity: 0.35,
            }}
          />
        </div>

        {/* Avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "-42px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            className="gx-avatar-card-avatar"
            style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              background: avatar
                ? `url(${avatar}) center/cover`
                : `linear-gradient(135deg, ${accent}, ${alpha(
                    accent,
                    0.55
                  )})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "27px",
              fontWeight: 850,
              color: "#fff",
              border: "4px solid rgba(15,23,42,0.95)",
              outline: `1px solid ${alpha(accent, 0.45)}`,
            }}
          >
            {!avatar && initials}
          </div>

          {/* Online badge */}
          <span
            style={{
              position: "absolute",
              bottom: "8px",
              right: "108px",
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              background: "#22c55e",
              border: "3px solid #0f172a",
              boxShadow: "0 0 0 4px rgba(34,197,94,0.14)",
            }}
          />
        </div>

        <div
          style={{
            padding: "14px 22px 22px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Name + role */}
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 850,
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </h3>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "7px",
                fontSize: "12px",
                fontWeight: 700,
                color: accent,
                background: alpha(accent, 0.12),
                border: `1px solid ${alpha(accent, 0.22)}`,
                padding: "5px 11px",
                borderRadius: "999px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 12px ${accent}`,
                }}
              />
              {role}
            </div>
          </div>

          {/* Bio */}
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.62)",
              textAlign: "center",
              lineHeight: 1.6,
              margin: "0 0 18px",
            }}
          >
            {bio}
          </p>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  textAlign: "center",
                  padding: "12px 8px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 850,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatNumber(s.value)}
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.42)",
                    marginTop: "3px",
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 46px",
              gap: "10px",
            }}
          >
            <button
              type="button"
              className="gx-avatar-card-btn"
              onClick={() => setFollowed((prev) => !prev)}
              style={{
                border: "none",
                borderRadius: "14px",
                padding: "12px 16px",
                cursor: "pointer",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 800,
                background: followed
                  ? "rgba(255,255,255,0.1)"
                  : `linear-gradient(135deg, ${accent}, ${alpha(
                      accent,
                      0.72
                    )})`,
                borderColor: followed
                  ? "rgba(255,255,255,0.12)"
                  : "transparent",
              }}
            >
              {followed ? "Following" : buttonText}
            </button>

            <button
              type="button"
              aria-label="Message"
              className="gx-avatar-card-btn"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                cursor: "pointer",
                color: "#fff",
                background: "rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};