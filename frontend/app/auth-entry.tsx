import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ImageBackground,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = 350;

export default function AuthEntryScreen() {
  const router = useRouter();
  const drawerAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Petit délai pour que la page soit bien rendue avant l'animation
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(drawerAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 160,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 500,
          delay: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }, 80);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ImageBackground
      source={require("../Doc_UI/fond-register.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Overlay sombre */}
      <View style={styles.overlay} />

      {/* Bouton retour en haut à gauche */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={16}
        style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Ionicons name="arrow-back" size={22} color="#ffffff" />
      </Pressable>

      {/* Texte central haut de page */}
      <Animated.View style={[styles.heroSection, { opacity: contentAnim }]}>
        <Text style={styles.heroTitle}>StudHousing</Text>
        <Text style={styles.heroSubtitle}>
          Your premium student living{"\n"}experience starts here
        </Text>
      </Animated.View>

      {/* Drawer animé */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateY: drawerAnim }] },
        ]}
      >
        {/* Handle pill */}
        <View style={styles.drawerHandle} />

        <Text style={styles.drawerTitle}>Welcome</Text>
        <Text style={styles.drawerSubtitle}>
          Join thousands of students finding{"\n"}their perfect home
        </Text>

        {/* Bouton Register — iOS 26 Water Glass */}
        <Pressable
          onPress={() => router.push("/register")}
          hitSlop={8}
          style={({ pressed }) => [
            styles.glassButton,
            styles.registerButton,
            { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Ionicons name="person-add-outline" size={20} color="#ffffff" style={styles.btnIcon} />
          <Text style={styles.glassButtonText}>Register</Text>
        </Pressable>

        {/* Bouton Login — iOS 26 Water Glass outline */}
        <Pressable
          onPress={() => router.push("/login")}
          hitSlop={8}
          style={({ pressed }) => [
            styles.glassButton,
            styles.loginButton,
            { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Ionicons name="log-in-outline" size={20} color="rgba(255,255,255,0.9)" style={styles.btnIcon} />
          <Text style={[styles.glassButtonText, styles.loginButtonText]}>Login</Text>
        </Pressable>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 4, 22, 0.45)",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 42,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heroSection: {
    position: "absolute",
    top: Platform.OS === "ios" ? 130 : 110,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 1,
    fontFamily: "SpaceMono",
    marginBottom: 14,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 70 : 50,
    // Effet verre givré simulé par la transparence + bordure
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  drawerHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignSelf: "center",
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: "SpaceMono",
  },
  drawerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  // iOS 26 Water Glass button base
  glassButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 9999,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  btnIcon: {
    marginRight: 10,
  },
  // Register: subtile blanc plus opaque
  registerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderColor: "rgba(255, 255, 255, 0.55)",
  },
  // Login: encore plus translucide, effacé
  loginButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.30)",
  },
  glassButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  loginButtonText: {
    color: "rgba(255,255,255,0.88)",
  },
});
