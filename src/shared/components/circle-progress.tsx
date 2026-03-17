import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type GradientColors = {
  start: string;
  end: string;
};

type CircleProgressProps = {
  size: number;
  strokeWidth: number;
  progress: number; // 0-100
  color: string | GradientColors;
  backgroundColor?: string;
  mode?: 'full' | 'semi';
};

export function CircleProgress({
  size,
  strokeWidth,
  progress,
  color,
  backgroundColor = 'transparent',
  mode = 'full',
}: CircleProgressProps): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const isSemi = mode === 'semi';
  const circumference = 2 * Math.PI * radius;
  const arcLength = isSemi ? circumference / 2 : circumference;

  const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;
  const strokeDashoffset = arcLength * (1 - normalizedProgress);

  // Semi: show only top half, start from left
  // Full: show entire circle, start from top
  const svgHeight = isSemi ? size / 2 + strokeWidth / 2 : size;
  const rotation = isSemi ? 180 : -90;

  const isGradient = typeof color === 'object';
  const strokeColor = isGradient ? 'url(#progress-gradient)' : color;

  return (
    <Svg width={size} height={svgHeight}>
      {isGradient && (
        <Defs>
          <LinearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color.start} />
            <Stop offset="100%" stopColor={color.end} />
          </LinearGradient>
        </Defs>
      )}
      {/* Background arc */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={isSemi ? `${arcLength} ${circumference}` : undefined}
        rotation={rotation}
        origin={`${cx}, ${cy}`}
        strokeLinecap="round"
      />
      {/* Progress arc */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={isSemi ? `${arcLength} ${circumference}` : circumference}
        strokeDashoffset={strokeDashoffset}
        rotation={rotation}
        origin={`${cx}, ${cy}`}
        strokeLinecap="round"
      />
    </Svg>
  );
}
