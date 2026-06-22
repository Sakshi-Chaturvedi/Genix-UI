import React, { useState } from "react";

export type AnimatedFormValues = {
  name: string;
  email: string;
  message: string;
};

export type AnimatedFormProps = {
  title?: string;
  description?: string;
  submitText?: string;
  accent?: string;
  bg?: string;
  radius?: string;
  width?: string;
  onSubmit?: (values: AnimatedFormValues) => void;
};

export const AnimatedForm: React.FC<AnimatedFormProps> = ({
  title = "Contact Us",
  description = "We'll get back to you shortly.",
  submitText = "Send Message",
  accent = "#6366f1",
  bg = "#ffffff",
  radius = "24px",
  width = "420px",
  onSubmit = () => {},
}) => {
  const [formData, setFormData] = useState<AnimatedFormValues>({
    name: "",
    email: "",
    message: "",
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const alpha = (hex: string, opacity: number): string => {
    const cleanHex = hex.replace("#", "");

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputStyle = (fieldName: string): React.CSSProperties => ({
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border:
      focusedField === fieldName
        ? `1px solid ${alpha(accent, 0.65)}`
        : "1px solid rgba(15, 23, 42, 0.1)",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    boxShadow:
      focusedField === fieldName
        ? `0 0 0 4px ${alpha(accent, 0.1)}`
        : "none",
  });

  return (
    <>
      <style>{`
        .gx-form-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .gx-form-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
        }

        .gx-form-input::placeholder {
          color: rgba(15, 23, 42, 0.38);
        }

        .gx-form-button {
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .gx-form-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px ${alpha(accent, 0.28)};
        }

        .gx-form-button:active {
          transform: translateY(0);
          opacity: 0.9;
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="gx-form-card"
        style={{
          width: "100%",
          maxWidth: width,
          background: bg,
          borderRadius: radius,
          padding: "28px",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <span
            style={{
              display: "inline-flex",
              width: "38px",
              height: "4px",
              borderRadius: "999px",
              background: accent,
              marginBottom: "16px",
            }}
          />

          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#0f172a",
              margin: "0 0 8px",
            }}
          >
            {title}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <input
            className="gx-form-input"
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            style={inputStyle("name")}
          />

          <input
            className="gx-form-input"
            type="email"
            name="email"
            placeholder="Your email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            style={inputStyle("email")}
          />

          <textarea
            className="gx-form-input"
            name="message"
            placeholder="Write your message..."
            value={formData.message}
            onChange={handleChange}
            onFocus={() => setFocusedField("message")}
            onBlur={() => setFocusedField(null)}
            style={{
              ...inputStyle("message"),
              minHeight: "120px",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />

          <button
            type="submit"
            className="gx-form-button"
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: "14px",
              border: "none",
              background: accent,
              color: "#fff",
              fontSize: "14px",
              fontWeight: 750,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: "4px",
            }}
          >
            {submitText}
          </button>
        </div>
      </form>
    </>
  );
};