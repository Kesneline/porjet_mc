import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const PRIMARY = "#4400b6";
const SURFACE_LOW = "#f3f3f5";
const ON_SURFACE = "#1a1c1d";
const ON_SURFACE_VARIANT = "#6b6b70";

export default function OnboardingScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    router.push("/onboarding-secure");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>StudHousing</Text>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.illustrationContainer}>
          <Text style={styles.illustration}>🏠</Text>
        </View>

        <Text style={styles.title}>Find Your{"\n"}Perfect Space</Text>
        <Text style={styles.subtitle}>
          Discover student housing that matches your lifestyle and budget
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>

        <TouchableOpacity
          style={styles.buttonContainer}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <View style={styles.button}>
            <Text style={styles.buttonText}>Next</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY,
    fontFamily: "SpaceMono",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: SURFACE_LOW,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  illustration: {
    fontSize: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: ON_SURFACE,
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 16,
    fontFamily: "SpaceMono",
  },
  subtitle: {
    fontSize: 16,
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: PRIMARY,
  },
  dotInactive: {
    width: 8,
    backgroundColor: ON_SURFACE_VARIANT,
    opacity: 0.3,
  },
  buttonContainer: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: PRIMARY,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
