import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  showArea?: boolean;
  className?: string;
}

// Simple, dependency-free sparkline using SVG. Expects numeric data; ignores NaN.
const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 160,
  height = 48,
  stroke = '#0D47A1',
  strokeWidth = 2,
  fill = 'rgba(13,71,161,0.15)',
  showArea = true,
  className,
}) => {
  const cleaned = (data || []).map((n) => (Number.isFinite(n) ? Number(n) : 0));
  const len = cleaned.length;
  if (!len) {
    return (
      <svg width={width} height={height} className={className} />
    );
  }

  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  const range = max - min || 1;

  const points = cleaned.map((v, i) => {
    const x = (i / (len - 1)) * (width - 2) + 1; // padding 1px
    const y = height - 1 - ((v - min) / range) * (height - 2); // invert Y, padding 1px
    return [x, y] as const;
  });

  const pathD = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ');

  const areaD = showArea
    ? `${pathD} L ${points[len - 1][0]} ${height - 1} L ${points[0][0]} ${height - 1} Z`
    : undefined;

  // Highlight last point
  const [lastX, lastY] = points[len - 1];

  return (
    <svg width={width} height={height} className={className} role="img" aria-label="trend sparkline">
      {showArea && (
        <path d={areaD} fill={fill} stroke="none" />
      )}
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} />
    </svg>
  );
};

export default Sparkline;
