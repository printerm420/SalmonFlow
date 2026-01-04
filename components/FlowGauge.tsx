import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

// ------------------------------------------------------------------
// CONFIG - Horizontal Semi-Circle (180°) - BIG and Bold
// ------------------------------------------------------------------
const GAUGE_WIDTH = 360;
const GAUGE_HEIGHT = 200;
const RADIUS = 160;
const STROKE_WIDTH = 32;
const CENTER_X = GAUGE_WIDTH / 2;
const CENTER_Y = GAUGE_HEIGHT; // Bottom edge - arc curves upward

const MAX_CFS = 2000;

// Zone definitions
const ZONES = [
  { label: 'LOW', min: 0, max: 350, color: '#3B82F6' },
  { label: 'PRIME', min: 350, max: 750, color: '#10B981' },
  { label: 'CAUTION', min: 750, max: 1200, color: '#F59E0B' },
  { label: 'BLOWN OUT', min: 1200, max: MAX_CFS, color: '#EF4444' },
];

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

// Get status from CFS value
const getStatus = (cfs: number) => {
  if (cfs < 350) return { label: 'LOW', color: '#3B82F6' };
  if (cfs < 750) return { label: 'PRIME', color: '#10B981' };
  if (cfs < 1200) return { label: 'CAUTION', color: '#F59E0B' };
  return { label: 'BLOWN OUT', color: '#EF4444' };
};

// Create arc path for a zone segment
const createArcPath = (startCfs: number, endCfs: number): string => {
  const startRatio = startCfs / MAX_CFS;
  const endRatio = endCfs / MAX_CFS;
  
  // Angles: 180° (left) to 0° (right), measured from positive X axis
  const startAngle = Math.PI * (1 - startRatio);
  const endAngle = Math.PI * (1 - endRatio);
  
  const x1 = CENTER_X + RADIUS * Math.cos(startAngle);
  const y1 = CENTER_Y - RADIUS * Math.sin(startAngle);
  const x2 = CENTER_X + RADIUS * Math.cos(endAngle);
  const y2 = CENTER_Y - RADIUS * Math.sin(endAngle);
  
  const largeArc = Math.abs(endRatio - startRatio) > 0.5 ? 1 : 0;
  
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`;
};

// Calculate needle endpoint from CFS
const getNeedlePosition = (cfs: number) => {
  const clampedCfs = Math.min(Math.max(cfs, 0), MAX_CFS);
  const ratio = clampedCfs / MAX_CFS;
  const angle = Math.PI * (1 - ratio); // 180° to 0° in radians
  const needleLength = RADIUS - 15;
  
  return {
    x: CENTER_X + needleLength * Math.cos(angle),
    y: CENTER_Y - needleLength * Math.sin(angle),
  };
};

const AnimatedLine = Animated.createAnimatedComponent(Line);

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------

interface FlowGaugeProps {
  currentCFS: number;
}

export default function FlowGauge({ currentCFS }: FlowGaugeProps) {
  const animatedCFS = useSharedValue(0);

  useEffect(() => {
    animatedCFS.value = withTiming(currentCFS, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentCFS]);

  const animatedNeedleProps = useAnimatedProps(() => {
    const cfs = animatedCFS.value;
    const clampedCfs = Math.min(Math.max(cfs, 0), MAX_CFS);
    const ratio = clampedCfs / MAX_CFS;
    const angle = Math.PI * (1 - ratio);
    const needleLength = RADIUS - 15;
    
    return {
      x2: CENTER_X + needleLength * Math.cos(angle),
      y2: CENTER_Y - needleLength * Math.sin(angle),
    };
  });

  const status = getStatus(currentCFS);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_WIDTH} height={GAUGE_HEIGHT + 10}>
        {/* Zone arcs */}
        {ZONES.map((zone) => (
          <Path
            key={zone.label}
            d={createArcPath(zone.min, zone.max)}
            stroke={zone.color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {/* Animated needle */}
        <AnimatedLine
          x1={CENTER_X}
          y1={CENTER_Y}
          animatedProps={animatedNeedleProps}
          stroke="#FFFFFF"
          strokeWidth={5}
          strokeLinecap="round"
        />

        {/* Center pivot */}
        <Circle cx={CENTER_X} cy={CENTER_Y} r={10} fill="#FFFFFF" />
      </Svg>

      {/* Text Container - Below Gauge */}
      <View style={styles.textContainer}>
        {/* Number */}
        <Text style={styles.cfsValue}>{currentCFS}</Text>
        
        {/* Status */}
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </Text>
        
        {/* Label */}
        <Text style={styles.cfsLabel}>CURRENT CFS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: GAUGE_WIDTH,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  cfsValue: {
    color: '#FFFFFF',
    fontSize: 80,
    fontWeight: 'bold',
    letterSpacing: -3,
    lineHeight: 80,
  },
  statusText: {
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: 8,
  },
  cfsLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
