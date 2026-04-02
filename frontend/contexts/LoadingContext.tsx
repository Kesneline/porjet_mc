import React, { createContext, useContext, useRef, useEffect, useCallback } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";

interface LoadingContextType {
  isLoading: boolean;
  spinnerAnim: Animated.Value;
  pulseAnim: Animated.Value;
  setIsLoading: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const spinnerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = React.useState(true);

  const startAnimations = useCallback(() => {
    Animated.loop(
      Animated.timing(spinnerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [spinnerAnim, pulseAnim]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  return (
    <LoadingContext.Provider value={{ isLoading, spinnerAnim, pulseAnim, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function LoadingOverlay() {
  const { spinnerAnim, pulseAnim } = useLoading();

  const spin = spinnerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.spinnerTrack} />
          <View style={styles.spinnerThumb} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 80,
    pointerEvents: "none",
  },
  spinnerContainer: {
    padding: 10,
  },
  spinner: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerTrack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    position: "absolute",
  },
  spinnerThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderTopColor: "transparent",
    position: "absolute",
  },
});
