import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const PRIMARY = "#7C3AED";
const ON_SURFACE = "#1a1c1d";
const ON_SURFACE_VARIANT = "#6b6b70";
const SLIDE_DURATION = 4000;

const slides = [
  {
    id: 1,
    title: "Find Your\nPerfect Space",
    subtitle: "Discover student housing that matches your lifestyle and budget",
    illustration: require("../assets/illustration_3D_overboarding/recree_cette_image_202603310343.png"),
  },
  {
    id: 2,
    title: "Pay Rent\nSecurely",
    subtitle: "Send your rent directly to your landlord with complete security and transparency",
    illustration: require("../assets/illustration_3D_overboarding/African_woman_holding_202603311619.png"),
  },
  {
    id: 3,
    title: "Your Journey\nStarts Here",
    subtitle: "Join a community of students who chose quality living",
    illustration: require("../assets/illustration_3D_overboarding/reproduis_cette_image_202603310331.png"),
  },
  {
    id: 4,
    title: "Welcome to\nStudHousing",
    subtitle: "Register or login to access all our premium student housing services",
    illustration: require("../assets/illustration_3D_overboarding/auth-slide.png"),
    isAuthSlide: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isLastSlide = currentIndex === slides.length - 1;

  useEffect(() => {
    if (isLastSlide) return;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => prev + 1);
        slideAnim.setValue(0);
        opacityAnim.setValue(0);

        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const slide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.slideContent,
            {
              transform: [{ translateX }],
              opacity: opacityAnim,
            },
          ]}
        >
          {"isAuthSlide" in slide && slide.isAuthSlide ? (
            <>
              <Image
                source={slide.illustration}
                style={styles.authIllustration}
                resizeMode="contain"
              />

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>

              <View style={styles.authButtonsContainer}>
                <Pressable
                  onPress={() => router.push("/register")}
                  hitSlop={16}
                  style={({ pressed }) => [
                    styles.authButton,
                    styles.primaryButton,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Register</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/login")}
                  hitSlop={16}
                  style={({ pressed }) => [
                    styles.authButton,
                    styles.secondaryButton,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Login</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Image
                source={slide.illustration}
                style={styles.illustration}
                resizeMode="contain"
              />

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </>
          )}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  slideContent: {
    width: "100%",
    alignItems: "center",
  },
  illustration: {
    width: width * 0.95,
    height: width * 0.95,
    marginBottom: 32,
  },
  authIllustration: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 16,
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
    marginBottom: 32,
  },
  authButtonsContainer: {
    width: "100%",
    gap: 16,
    paddingHorizontal: 20,
  },
  authButton: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 28,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E0D4FC",
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 22,
    fontWeight: "600",
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
    backgroundColor: "#7C3AED",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#E0D4FC",
    opacity: 0.3,
  },
});
