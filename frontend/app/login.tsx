import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import Input from "@/components/ui/Input";

const { width, height } = Dimensions.get("window");

const PRIMARY = "#7c4dff";
const PRIMARY_CONTAINER = "#5d21df";
const ON_SURFACE = "#1a1c1d";
const ON_SURFACE_VARIANT = "#6b6b70";
const SURFACE_CONTAINER_LOW = "#f3f3f5";
const SURFACE_CONTAINER = "#e8e8ec";
const OUTLINE_VARIANT = "#c4c4c9";
const TERTIARY = "#7d0036";

type LoginMethod = "email" | "phone" | null;
type Step = 1 | 2 | 3;

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<LoginMethod>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Method drawer
  const [showMethodDrawer, setShowMethodDrawer] = useState(false);
  const methodDrawerAnim = useRef(new Animated.Value(height)).current;
  const methodBackdropAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Auto-open on mount
  useEffect(() => {
    const t = setTimeout(() => openMethodDrawer(), 120);
    return () => clearTimeout(t);
  }, []);

  const openMethodDrawer = () => {
    setShowMethodDrawer(true);
    Animated.parallel([
      Animated.spring(methodDrawerAnim, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true }),
      Animated.timing(methodBackdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeMethodDrawer = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(methodDrawerAnim, { toValue: height, duration: 280, useNativeDriver: true }),
      Animated.timing(methodBackdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => { setShowMethodDrawer(false); cb && cb(); });
  };

  const emailForm = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });

  const phoneForm = useForm<{ phone: string }>({
    defaultValues: { phone: "" },
  });

  const passwordForm = useForm<{ password: string }>({
    defaultValues: { password: "" },
  });

  const animateToNext = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(width);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateToPrev = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(-width);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleMethodSelect = (selected: LoginMethod) => {
    closeMethodDrawer(() => {
      setMethod(selected);
      animateToNext(() => setStep(2));
    });
  };

  const handleIdentitySubmit = () => {
    if (method === "email") {
      emailForm.handleSubmit(() => {
        animateToNext(() => setStep(3));
      })();
    } else {
      phoneForm.handleSubmit(() => {
        animateToNext(() => setStep(3));
      })();
    }
  };

  const handlePasswordSubmit = () => {
    passwordForm.handleSubmit((data) => {
      const identity =
        method === "email"
          ? emailForm.getValues().email
          : phoneForm.getValues().phone;
      console.log("Login:", { method, identity, password: data.password });
      router.replace("/(tabs)");
    })();
  };

  const handleBack = () => {
    if (step === 1) {
      openMethodDrawer();
    } else {
      animateToPrev(() => setStep((step - 1) as Step));
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "How do you\nwant to login?";
      case 2:
        return method === "email"
          ? "Your email\naddress?"
          : "Your phone\nnumber?";
      case 3:
        return "Enter your\npassword";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return "Choose your preferred login method";
      case 2:
        return method === "email"
          ? "We'll send a verification link"
          : "We'll send you an SMS code";
      case 3:
        return "Secure access to your account";
    }
  };

  const getProgressWidth = () => {
    return `${step * 33.33}%`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: getProgressWidth() as any }]} />
      </View>

      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step}/3</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
        </View>

        {/* STEP 1: placeholder (drawer handles selection) */}
        {step === 1 && (
          <View style={styles.methodSection}>
            <Text style={styles.methodPlaceholderText}>Sélectionnez une méthode ci-dessous</Text>
          </View>
        )}

        {/* STEP 2: Email or Phone input */}
        {step === 2 && method === "email" && (
          <View style={styles.inputSection}>
            <Controller
              control={emailForm.control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="your.email@university.edu"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={emailForm.formState.errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={ON_SURFACE_VARIANT}
                    />
                  }
                />
              )}
            />
            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable
                onPress={handleIdentitySubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === 2 && method === "phone" && (
          <View style={styles.inputSection}>
            <Controller
              control={phoneForm.control}
              name="phone"
              rules={{
                required: "Phone number is required",
                minLength: { value: 8, message: "Enter a valid phone number" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+237 6XX XXX XXX"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={phoneForm.formState.errors.phone?.message}
                  keyboardType="phone-pad"
                  leftIcon={
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={ON_SURFACE_VARIANT}
                    />
                  }
                />
              )}
            />
            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable
                onPress={handleIdentitySubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: Password */}
        {step === 3 && (
          <View style={styles.inputSection}>
            <View style={styles.identityBadge}>
              <Ionicons
                name={method === "email" ? "mail-outline" : "call-outline"}
                size={18}
                color={PRIMARY}
              />
              <Text style={styles.identityText}>
                {method === "email"
                  ? emailForm.getValues().email
                  : phoneForm.getValues().phone}
              </Text>
              <Pressable onPress={() => animateToPrev(() => setStep(2))}>
                <Text style={styles.identityEdit}>Edit</Text>
              </Pressable>
            </View>

            <Controller
              control={passwordForm.control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={passwordForm.formState.errors.password?.message}
                  secureTextEntry={!showPassword}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={ON_SURFACE_VARIANT}
                    />
                  }
                  rightIcon={
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={
                          showPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={ON_SURFACE_VARIANT}
                      />
                    </Pressable>
                  }
                />
              )}
            />

            <Pressable
              onPress={() => {
                /* TODO: Forgot password */
              }}
              style={({ pressed }) => [
                styles.forgotPassword,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable
                onPress={handlePasswordSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Pressable onPress={() => router.replace("/register")} hitSlop={16}>
          <Text style={styles.footerLink}>Register</Text>
        </Pressable>
      </View>

      {/* ── METHOD DRAWER (auto-open on step 1) ── */}
      <Modal visible={showMethodDrawer} transparent animationType="none" statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: methodBackdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMethodDrawer(() => router.back())} />
          </Animated.View>
          <Animated.View style={[styles.methodDrawer, { transform: [{ translateY: methodDrawerAnim }] }]}>
            <View style={styles.drawerPill} />
            <Pressable onPress={() => closeMethodDrawer(() => router.back())} hitSlop={12}
              style={styles.methodDrawerBack}>
              <Ionicons name="arrow-back" size={20} color={ON_SURFACE_VARIANT} />
              <Text style={styles.methodDrawerBackText}>Back</Text>
            </Pressable>
            <Text style={styles.methodDrawerTitle}>Sign In</Text>
            <Text style={styles.methodDrawerSub}>Choose your login method</Text>
            <Pressable onPress={() => handleMethodSelect("email")}
              style={({ pressed }) => [styles.methodDrawerCard, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <View style={styles.methodDrawerIconWrap}>
                <Ionicons name="mail-outline" size={22} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodDrawerCardTitle}>Email Address</Text>
                <Text style={styles.methodDrawerCardSub}>Sign in with your email</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={ON_SURFACE_VARIANT} />
            </Pressable>
            <Pressable onPress={() => handleMethodSelect("phone")}
              style={({ pressed }) => [styles.methodDrawerCard, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <View style={styles.methodDrawerIconWrap}>
                <Ionicons name="call-outline" size={22} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodDrawerCardTitle}>Phone Number</Text>
                <Text style={styles.methodDrawerCardSub}>Sign in with your mobile number</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={ON_SURFACE_VARIANT} />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  progressBar: {
    height: 3,
    backgroundColor: SURFACE_CONTAINER_LOW,
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 34,
    left: 24,
    right: 24,
    borderRadius: 2,
    zIndex: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 8,
  },
  stepIndicator: {
    backgroundColor: SURFACE_CONTAINER_LOW,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "700",
    color: ON_SURFACE,
    fontFamily: "SpaceMono",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: ON_SURFACE,
    lineHeight: 50,
    fontFamily: "SpaceMono",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: ON_SURFACE_VARIANT,
    lineHeight: 24,
  },
  methodSection: {
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  methodPlaceholderText: {
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
    opacity: 0.4,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE_CONTAINER_LOW,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: ON_SURFACE,
  },
  // Method drawer
  methodDrawer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: OUTLINE_VARIANT,
    alignSelf: "center",
    marginBottom: 16,
  },
  methodDrawerBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  methodDrawerBackText: {
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
    fontWeight: "500",
  },
  methodDrawerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: ON_SURFACE,
    fontFamily: "SpaceMono",
    marginBottom: 6,
  },
  methodDrawerSub: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
    marginBottom: 24,
  },
  methodDrawerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: SURFACE_CONTAINER_LOW,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  methodDrawerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  methodDrawerCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ON_SURFACE,
    marginBottom: 2,
  },
  methodDrawerCardSub: {
    fontSize: 13,
    color: ON_SURFACE_VARIANT,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: OUTLINE_VARIANT,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 13,
    color: ON_SURFACE_VARIANT,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 64,
    height: 56,
    borderRadius: 16,
    backgroundColor: SURFACE_CONTAINER_LOW,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    opacity: 0.15,
  },
  inputSection: {
    gap: 16,
    flex: 1,
  },
  identityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: SURFACE_CONTAINER_LOW,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  identityText: {
    fontSize: 14,
    color: ON_SURFACE,
    fontWeight: "500",
  },
  identityEdit: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "700",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: SURFACE_CONTAINER_LOW,
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  footerText: {
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
  },
  footerLink: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: "700",
  },
});
