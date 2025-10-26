import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function TabIconWithBadge({ name, color, size = 24 }) {
  const [count, setCount] = useState(0);
  // entrance scale/opacity for badge when it appears
  const entrance = useRef(new Animated.Value(0)).current; // 0 -> hidden, 1 -> shown
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pendingRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const unread = data.unreadCount?.[uid] || 0;
        total += unread;
      });
      // debounce rapid changes to reduce re-renders
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        setCount(total);
        pendingRef.current = null;
      }, 300);
    });

    return () => unsubscribe();
  }, []);

  // Pulse animation when there are unread messages
  useEffect(() => {
    let loop;
    if (count > 0) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.12, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseScale.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [count]);

  // Entrance animation when badge appears from 0 -> >0
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (prevCountRef.current === 0 && count > 0) {
      entrance.setValue(0);
      Animated.parallel([
        Animated.timing(entrance, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(pulseScale, { toValue: 1.08, useNativeDriver: true }),
      ]).start(() => {
        // settle back to looped pulse
        Animated.timing(pulseScale, { toValue: 1.0, duration: 200, useNativeDriver: true }).start();
      });
    } else if (prevCountRef.current > 0 && count === 0) {
      // hide badge
      Animated.timing(entrance, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    prevCountRef.current = count;
  }, [count]);

  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size} color={color} />
      {count > 0 && (
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              transform: [
                { scale: Animated.multiply(entrance.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }), pulseScale) },
              ],
              opacity: entrance,
            },
          ]}
        >
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});