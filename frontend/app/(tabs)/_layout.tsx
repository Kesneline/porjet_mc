import { Tabs } from "expo-router";
import React, { useRef } from "react";
import {
  Platform,
  View,
  StyleSheet,
  Animated,
  Pressable,
  Text,
} from "react-native";
import { CustomIcon, IconName } from "../../components/CustomIcons";

const PRIMARY = "#7C3AED";
const INACTIVE = "#a0aec0";

interface TabConfig {
  name: string;
  label: string;
  icon: IconName;
}

const TABS: TabConfig[] = [
  { name: "index", label: "Home", icon: "home" },
  { name: "search", label: "Search", icon: "search" },
  { name: "reservations", label: "Bookings", icon: "booking" },
  { name: "messages", label: "Messages", icon: "chat" },
  { name: "profile", label: "Profile", icon: "profile" },
];

function AnimatedTabIcon({
  name,
  focused,
  label,
}: {
  name: IconName;
  focused: boolean;
  label: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.72)).current;

  React.useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.25,
            damping: 15,
            stiffness: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 15,
            stiffness: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 14,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.tabIconWrap,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <CustomIcon
        name={name}
        size={22}
        color={focused ? PRIMARY : INACTIVE}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBg}>
            {/* Multi-layer glass effect */}
            <View style={styles.glassLayer1} />
            <View style={styles.glassLayer2} />
            <View style={styles.glassTopBorder} />
          </View>
        ),
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon
                name={tab.icon}
                focused={focused}
                label={tab.label}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 86 : 66,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    elevation: 0,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glassLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  glassLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 248, 255, 0.45)",
  },
  glassTopBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: "rgba(180, 180, 220, 0.35)",
  },
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 0,
    gap: 0,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY,
    marginTop: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: -6,
  },
});
