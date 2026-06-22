import React, { useState } from "react";

export type ChartType = "bar" | "line" | "pie" | "area";

export type ChartDataItem = {
  label: string;
  value: number;
};

export interface ChartsProps {
  type?: ChartType;
  data?: ChartDataItem[];
  title?: string;
  accent?: string;
  bg?: string;
  radius?: string;
  showGrid?: boolean;
  showValues?: boolean;
}

const defaultData: ChartDataItem[] = [
  { label: "Jan", value: 40 },
  { label: "Feb", value: 70 },
  { label: "Mar", value: 55 },
  { label: "Apr", value: 90 },
  { label: "May", value: 65 },
  { label: "Jun", value: 80 },
  { label: "Jul", value: 100 },
  { label: "Aug", value: 30 },
];

export const Charts: React.FC<ChartsProps> = ({
  type = "bar",
  data = defaultData,
  title = "Monthly Stats",
  accent = "#6366f1",
  bg = "#ffffff",
  radius = "20px",
  showGrid = true,
  showValues = true,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const alpha = (hex: string, op: number): string => {
    const cleanHex = hex.replace("#", "");

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${op})`;
  };

  const safeData = data.length > 0 ? data : defaultData;

  const max = Math.max(...safeData.map((d) => d.value));
  const min = Math.min(...safeData.map((d) => d.value));

  const W = 320;
  const H = 170;

  const padL = 32;
  const padR = 14;
  const padT = 18;
  const padB = 32;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const getX = (i: number): number => {
    if (safeData.length === 1) return padL + chartW / 2;
    return padL + (i / (safeData.length - 1)) * chartW;
  };

  const getY = (value: number): number => {
    return padT + chartH - ((value - min) / (max - min || 1)) * chartH;
  };

  const points = safeData
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(" ");

  const areaPoints = `${padL},${padT + chartH} ${points} ${getX(
    safeData.length - 1
  )},${padT + chartH}`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + chartH * (1 - t),
    value: Math.round(min + t * (max - min)),
  }));

  const textMuted = "#94a3b8";
  const textPrimary = "#0f172a";
  const borderColor = "rgba(15, 23, 42, 0.08)";
  const gridColor = "rgba(15, 23, 42, 0.08)";

  const BarChart = () => {
    const barW = Math.min(28, (chartW / safeData.length) * 0.55);

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {showGrid &&
          gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={padL}
                y1={g.y}
                x2={W - padR}
                y2={g.y}
                stroke={gridColor}
                strokeWidth="1"
              />
              <text
                x={padL - 6}
                y={g.y + 4}
                textAnchor="end"
                fill={textMuted}
                fontSize="9"
              >
                {g.value}
              </text>
            </g>
          ))}

        {safeData.map((d, i) => {
          const sectionW = chartW / safeData.length;
          const x = padL + i * sectionW + (sectionW - barW) / 2;
          const barH = ((d.value - min) / (max - min || 1)) * chartH;
          const y = padT + chartH - barH;
          const isHovered = hovered === i;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x}
                y={padT}
                width={barW}
                height={chartH}
                fill="transparent"
                rx="8"
              />

              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={isHovered ? accent : alpha(accent, 0.55)}
                rx="8"
                style={{
                  transition: "all 0.2s ease",
                  filter: isHovered
                    ? `drop-shadow(0 8px 14px ${alpha(accent, 0.28)})`
                    : "none",
                }}
              />

              {showValues && isHovered && (
                <text
                  x={x + barW / 2}
                  y={y - 7}
                  textAnchor="middle"
                  fill={textPrimary}
                  fontSize="10"
                  fontWeight="700"
                >
                  {d.value}
                </text>
              )}

              <text
                x={x + barW / 2}
                y={H - 8}
                textAnchor="middle"
                fill={textMuted}
                fontSize="9"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const LineChart = () => (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="genix-line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.24" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {showGrid &&
        gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={g.y}
              x2={W - padR}
              y2={g.y}
              stroke={gridColor}
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={g.y + 4}
              textAnchor="end"
              fill={textMuted}
              fontSize="9"
            >
              {g.value}
            </text>
          </g>
        ))}

      <polygon points={areaPoints} fill="url(#genix-line-gradient)" />

      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {safeData.map((d, i) => {
        const isHovered = hovered === i;

        return (
          <g
            key={d.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            <circle cx={getX(i)} cy={getY(d.value)} r="12" fill="transparent" />

            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r={isHovered ? 5 : 3.5}
              fill={isHovered ? "#ffffff" : accent}
              stroke={accent}
              strokeWidth="2"
              style={{
                transition: "all 0.2s ease",
                filter: isHovered
                  ? `drop-shadow(0 6px 12px ${alpha(accent, 0.35)})`
                  : "none",
              }}
            />

            {showValues && isHovered && (
              <text
                x={getX(i)}
                y={getY(d.value) - 12}
                textAnchor="middle"
                fill={textPrimary}
                fontSize="10"
                fontWeight="700"
              >
                {d.value}
              </text>
            )}

            <text
              x={getX(i)}
              y={H - 8}
              textAnchor="middle"
              fill={textMuted}
              fontSize="9"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );

  const AreaChart = () => (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="genix-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {showGrid &&
        gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={g.y}
              x2={W - padR}
              y2={g.y}
              stroke={gridColor}
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={g.y + 4}
              textAnchor="end"
              fill={textMuted}
              fontSize="9"
            >
              {g.value}
            </text>
          </g>
        ))}

      <polygon points={areaPoints} fill="url(#genix-area-gradient)" />

      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {safeData.map((d, i) => (
        <g
          key={d.label}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={getX(i) - 12}
            y={padT}
            width={24}
            height={chartH}
            fill="transparent"
          />

          {hovered === i && (
            <>
              <line
                x1={getX(i)}
                y1={padT}
                x2={getX(i)}
                y2={padT + chartH}
                stroke={alpha(accent, 0.25)}
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {showValues && (
                <text
                  x={getX(i)}
                  y={getY(d.value) - 12}
                  textAnchor="middle"
                  fill={textPrimary}
                  fontSize="10"
                  fontWeight="700"
                >
                  {d.value}
                </text>
              )}
            </>
          )}

          <text
            x={getX(i)}
            y={H - 8}
            textAnchor="middle"
            fill={textMuted}
            fontSize="9"
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );

  const PieChart = () => {
    const cx = W / 2;
    const cy = H / 2 - 6;
    const r = Math.min(H, W) / 2 - 28;

    const total = safeData.reduce((sum, d) => sum + d.value, 0) || 1;

    const colors = [
      accent,
      alpha(accent, 0.8),
      alpha(accent, 0.65),
      alpha(accent, 0.5),
      alpha(accent, 0.38),
      alpha(accent, 0.28),
      alpha(accent, 0.2),
      alpha(accent, 0.14),
    ];

    let startAngle = -Math.PI / 2;

    const slices = safeData.map((d, i) => {
      const angle = (d.value / total) * 2 * Math.PI;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(startAngle + angle);
      const y2 = cy + r * Math.sin(startAngle + angle);

      const midAngle = startAngle + angle / 2;
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      startAngle += angle;

      return {
        path,
        color: colors[i % colors.length],
        item: d,
        index: i,
        midAngle,
      };
    });

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {slices.map((slice) => {
          const isHovered = hovered === slice.index;

          return (
            <path
              key={slice.item.label}
              d={slice.path}
              fill={slice.color}
              stroke={bg}
              strokeWidth="3"
              onMouseEnter={() => setHovered(slice.index)}
              onMouseLeave={() => setHovered(null)}
              transform={
                isHovered
                  ? `translate(${Math.cos(slice.midAngle) * 5}, ${
                      Math.sin(slice.midAngle) * 5
                    })`
                  : undefined
              }
              style={{
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "pointer",
                opacity: hovered === null || isHovered ? 1 : 0.72,
              }}
            />
          );
        })}

        {hovered !== null ? (
          <>
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              fill={textPrimary}
              fontSize="18"
              fontWeight="800"
            >
              {safeData[hovered]?.value}
            </text>
            <text
              x={cx}
              y={cy + 11}
              textAnchor="middle"
              fill={textMuted}
              fontSize="10"
              fontWeight="600"
            >
              {safeData[hovered]?.label}
            </text>
          </>
        ) : (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={textMuted}
            fontSize="10"
            fontWeight="600"
          >
            Hover
          </text>
        )}
      </svg>
    );
  };

  const renderChart = () => {
    if (type === "line") return <LineChart />;
    if (type === "pie") return <PieChart />;
    if (type === "area") return <AreaChart />;

    return <BarChart />;
  };

  return (
    <div
      style={{
        background: bg,
        borderRadius: radius,
        padding: "20px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        border: `1px solid ${borderColor}`,
        width: "100%",
        maxWidth: "380px",
        boxSizing: "border-box",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: textPrimary,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </p>

          <p
            style={{
              fontSize: "12px",
              color: textMuted,
              margin: "4px 0 0",
            }}
          >
            Overview analytics
          </p>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: "999px",
            background: alpha(accent, 0.1),
            color: accent,
            border: `1px solid ${alpha(accent, 0.22)}`,
            textTransform: "capitalize",
            flexShrink: 0,
          }}
        >
          {type}
        </span>
      </div>

      {renderChart()}
    </div>
  );
};