import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const STATUS_MAP = {
  opened:  { label: 'Đã mở',        color: '#22c55e', animate: false },
  opening: { label: 'Đang mở...',    color: '#eab308', animate: true },
  closed:  { label: 'Đã đóng',      color: '#6b7280', animate: false },
  closing: { label: 'Đang đóng...', color: '#eab308', animate: true },
};

export default function DoorStatus({ status }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP.closed;
  const pulse = useRef(new Animated.Value(1)).current;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (info.animate) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [info.animate]);

  useEffect(() => {
    if (status === 'opened') {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  return (
    <View style={styles.row}>
      <Animated.View
        style={[styles.dot, { backgroundColor: info.color, opacity: pulse }]}
      />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{info.label}</Text>
        {status === 'opened' && countdown >= 0 && (
          <Text style={styles.countdown}>({countdown}s...)</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  countdown: { fontSize: 18, fontWeight: '600', color: '#000' },
});
