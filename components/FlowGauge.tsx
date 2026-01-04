import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

// ------------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------------
const GAUGE_SIZE = 280;
const RADIUS = 120;
const STROKE_WIDTH = 24;
const CENTER_X = GAUGE_SIZE / 2;
const CENTER_Y = GAUGE_SIZE / 2;

const MAX_CFS = 2000;

// Zone definitions with CFS ranges
const ZONES = [
  { label: 'LOW', min: 0, max: 350, color: '#3B82F6' },
  { label: 'PRIME', min: 350, max: 750, color: '#10B981' },
  { label: 'CAUTION', min: 750, max: 1200, color: '#F59E0B' },
  { label: 'BLOWN OUT', min: 1200, max: MAX_CFS, color: '#EF4444' },
];

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

// Convert CFS value to angle (270° range: -135° to +135°)
const cfsToAngle = (cfs: number): number => {
  const clampedCfs = Math.min(Math.max(cfs, 0), MAX_CFS);
  const ratio = clampedCfs / MAX_CFS;
  return -135 + (ratio * 270); // -135° to +135° (270° total)
};

// Convert angle to radians for SVG calculations
const angleToRadians = (angle: number): number => {
  return (angle * Math.PI) / 180;
};

// Create SVG arc path
const createArcPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string => {
  const startRad = angleToRadians(startAngle);
  const endRad = angleToRadians(endAngle);
  
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);
  
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
};

// Get status from CFS value
const getStatus = (cfs: number) => {
  for (const zone of ZONES) {
    if (cfs >= zone.min && cfs < zone.max) {
      return { label: zone.label, color: zone.color };
    }
  }
  return ZONES[ZONES.length - 1]; // Default to last zone
};

const AnimatedG = Animated.createAnimatedComponent(G);

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------

interface FlowGaugeProps {
  currentCFS: number;
}

export default function FlowGauge({ currentCFS }: FlowGaugeProps) {
  const needleRotation = useSharedValue(-135); // Start at minimum position

  useEffect(() => {
    const targetAngle = cfsToAngle(currentCFS);
    needleRotation.value = withTiming(targetAngle, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentCFS]);

  const animatedNeedleProps = useAnimatedProps(() => {
    return {
      transform: `rotate(${needleRotation.value} ${CENTER_X} ${CENTER_Y})`,
    };
  });

  const status = getStatus(currentCFS);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={styles.svg}>
        {/* Background circle (optional, for visual reference) */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="none"
          stroke="#2D2D2D"
          strokeWidth={2}
          opacity={0.3}
        />
        
        {/* Zone arcs */}
        {ZONES.map((zone, index) => {
          const startAngle = -135 + ((zone.min / MAX_CFS) * 270);
          const endAngle = -135 + ((zone.max / MAX_CFS) * 270);
          const arcPath = createArcPath(CENTER_X, CENTER_Y, RADIUS, startAngle, endAngle);
          
          return (
            <Path
              key={zone.label}
              d={arcPath}
              stroke={zone.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle */}
        <AnimatedG animatedProps={animatedNeedleProps}>
          <Path
            d={`M ${CENTER_X} ${CENTER_Y - RADIUS + 15} L ${CENTER_X - 4} ${CENTER_Y + 8} L ${CENTER_X + 4} ${CENTER_Y + 8} Z`}
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={1}
          />
        </AnimatedG>

        {/* Center dot */}
        <Circle cx={CENTER_X} cy={CENTER_Y} r={8} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      </Svg>

      {/* Center text */}
      <View style={styles.centerText}>
        <Text style={styles.cfsValue}>{currentCFS}</Text>
        <Text style={styles.cfsLabel}>CFS</Text>
      </View>

      {/* Status text below gauge */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    // Add any SVG-specific styles here if needed
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: GAUGE_SIZE / 2 - 20,
  },
  cfsValue: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: 'bold',
    letterSpacing: -2,
    textAlign: 'center',
  },
  cfsLabel: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: -8,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
});

