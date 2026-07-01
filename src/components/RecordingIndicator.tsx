import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../theme';
import { RecordingState } from '../types';

interface Props {
  state: RecordingState;
}

export function RecordingIndicator({ state }: Props) {
  const pulse  = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse,   { toValue: 1.6, duration: 700, useNativeDriver: true }),
            Animated.timing(pulse,   { toValue: 1,   duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      opacity.stopAnimation();
      pulse.setValue(1);
      opacity.setValue(1);
    }
  }, [state.isRecording, state.isPaused]);

  if (!state.isRecording) return null;

  const seconds = Math.floor(state.durationMs / 1000);
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.dotWrapper}>
        <Animated.View style={[styles.dotRing, { transform: [{ scale: pulse }], opacity }]} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.label}>{state.isPaused ? 'PAUSED' : 'REC'}</Text>
      <Text style={styles.timer}>{mins}:{secs}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#2A0A0A',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#5A1A1A',
  },
  dotWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger + '50',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  label: {
    color: colors.danger,
    fontSize: font.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  timer: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
