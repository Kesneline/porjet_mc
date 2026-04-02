import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  type TextInputProps,
  type ViewStyle,
  type ReactNode,
} from "react-native";

const ON_SURFACE = "#1a1c1d";
const ON_SURFACE_VARIANT = "#6b6b70";
const SURFACE_CONTAINER_LOW = "#f3f3f5";
const PRIMARY = "#4400b6";
const ERROR = "#ba1a1a";
const OUTLINE_VARIANT = "#c4c4c9";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SURFACE_CONTAINER_LOW, "#ffffff"],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[styles.label, { color: error ? ERROR : ON_SURFACE_VARIANT }]}
      >
        {label}
      </Text>

      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { paddingLeft: leftIcon ? 0 : 16, paddingRight: rightIcon ? 0 : 16 },
          ]}
          placeholderTextColor={ON_SURFACE_VARIANT + "80"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 0,
    height: 56,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: ON_SURFACE,
    paddingRight: 16,
    borderWidth: 0,
    outlineStyle: "none" as any,
  },
  leftIcon: {
    paddingLeft: 16,
    paddingRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rightIcon: {
    paddingRight: 16,
    paddingLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
  },
});
