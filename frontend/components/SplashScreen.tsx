import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const SPLASH_DURATION = 7000;
const FADE_DURATION = 800;

export default function SplashScreen() {
  const router = useRouter();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    const timer = setTimeout(() => {
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        spinLoop.stop();
        pulseLoop.stop();
        router.replace("/onboarding");
      });
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(timer);
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityValue,
        },
      ]}
    >
      <Image
        source={require("../Doc_UI/fontOverboardingInit.png")}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              transform: [{ scale: pulseValue }],
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  image: {
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 80,
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
