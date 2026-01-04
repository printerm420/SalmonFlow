import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

// ------------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------------
const GAUGE_WIDTH = 300;
const GAUGE_HEIGHT = 160; // Slightly more than half width to accommodate needle center
const RADIUS = 140;
const STROKE_WIDTH = 30;
const CENTER_X = GAUGE_WIDTH / 2;
const CENTER_Y = GAUGE_HEIGHT - 10; // Bottom centered

const MAX_CFS = 2000;

// Zones logic
const ZONES = [
  { label: 'LOW', max: 350, color: '#3B82F6' },       // Blue
  { label: 'PRIME', max: 750, color: '#10B981' },     // Green
  { label: 'CAUTION', max: 1200, color: '#F59E0B' },  // Orange
  { label: 'BLOWN', max: MAX_CFS, color: '#EF4444' }, // Red
];

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

// Convert value to degrees (0 to 180)
const valueToDegrees = (val: number) => {
  const clamped = Math.min(Math.max(val, 0), MAX_CFS);
  return (clamped / MAX_CFS) * 180;
};

// Convert polar to cartesian
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  // SVG angle: 0 is 3 o'clock, clockwise.
  // We want 0 input to be 9 o'clock (180 deg in SVG) and 180 input to be 3 o'clock (360/0 deg).
  // Actually simpler: 
  // 0 CFS -> 180 degrees (Left)
  // Max CFS -> 0 degrees (Right)
  // Wait, standard gauge: 
  // 0 value = 180 deg (Left)
  // Max value = 360 deg (Right) -> or 0 depending on implementation.
  // Let's use: -180 to 0 (which is top half semicircle if we rotate coordinate system?)
  
  // Let's stick to standard math:
  // Angle 0 = Right (3 o'clock)
  // Angle 180 = Left (9 o'clock)
  // We want 0 value at 180 degrees, and Max value at 360 (or 0) degrees.
  
  const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Create SVG Path for an arc
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d;       
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------

interface FlowGaugeProps {
  currentCFS: number;
}

export default function FlowGauge({ currentCFS }: FlowGaugeProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(valueToDegrees(currentCFS), {
      duration: 1200,
      easing: Easing.out(Easing.exp),
    });
  }, [currentCFS]);

  // Animated Props for the needle rotation
  const needleStyle = useAnimatedProps(() => {
    return {
      transform: [{ rotate: `${rotation.value - 90}deg` }, { translateX: 0 }, { translateY: 0 }], 
      // Note: SVG rotation origin is tricky. It's often easier to rotate a Group <G> around a pivot.
    };
  });
  
  // We will rotate the G containing the needle
  // The needle points up (at 0 deg relative to G).
  // We want 0 CFS (Left) -> Rotation -90 deg
  // We want Max CFS (Right) -> Rotation +90 deg
  // My valueToDegrees gives 0 to 180.
  // So we want rotation to be (value - 90).

  const animatedProps = useAnimatedProps(() => {
    return {
      transform: [
         { translateX: CENTER_X },
         { translateY: CENTER_Y },
         { rotate: `${rotation.value - 90}deg` },
         { translateX: -CENTER_X },
         { translateY: -CENTER_Y },
      ]
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_WIDTH} height={GAUGE_HEIGHT}>
        {/* Background Tracks (Zones) */}
        {(() => {
          let startCfs = 0;
          return ZONES.map((zone, index) => {
            const startAngle = valueToDegrees(startCfs);
            const endAngle = valueToDegrees(zone.max);
            const path = describeArc(CENTER_X, CENTER_Y, RADIUS, startAngle, endAngle);
            startCfs = zone.max;
            
            return (
              <Path
                key={zone.label}
                d={path}
                stroke={zone.color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeLinecap={index === 0 ? "butt" : "butt"} // Round only ends if desired
              />
            );
          });
        })()}

        {/* Needle */}
        <AnimatedG animatedProps={animatedProps}>
           {/* Needle Shape */}
           <Path
             d={`M ${CENTER_X - 5} ${CENTER_Y} L ${CENTER_X} ${CENTER_Y - RADIUS + 10} L ${CENTER_X + 5} ${CENTER_Y} Z`}
             fill="white"
           />
           <Circle cx={CENTER_X} cy={CENTER_Y} r={8} fill="white" />
        </AnimatedG>
      </Svg>

      {/* Text Overlay */}
      <View style={styles.textOverlay}>
        <Text style={styles.cfsValue}>
          {currentCFS}
        </Text>
        <Text style={styles.cfsLabel}>
          CFS
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
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  cfsValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: -2,
  },
  cfsLabel: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '500',
    marginTop: -4,
  },
});

