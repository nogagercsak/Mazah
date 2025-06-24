import { Colors } from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

const proto = Colors.proto;

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = (current / total) * 100;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 20,
      friction: 7,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View 
          style={[
            styles.progress, 
            { 
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              })
            }
          ]} 
        />
      </View>
      <View style={styles.stepsContainer}>
        {Array.from({ length: total }).map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.step,
              index < current && styles.stepCompleted,
              index === current - 1 && styles.stepCurrent,
            ]} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  track: {
    height: 6,
    backgroundColor: proto.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: proto.accent,
    borderRadius: 3,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  step: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: proto.border,
  },
  stepCompleted: {
    backgroundColor: proto.accent,
    transform: [{ scale: 0.8 }],
  },
  stepCurrent: {
    backgroundColor: proto.accent,
    transform: [{ scale: 1.2 }],
    shadowColor: proto.accent,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
}); 