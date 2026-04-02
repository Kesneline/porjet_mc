import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";


const { width, height } = Dimensions.get("window");

const SPLASH_DURATION = 3000;
const FADE_DURATION = 500;

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

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
});
