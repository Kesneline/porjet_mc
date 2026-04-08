import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#7C3AED";

const STATS = [
  { label: "Bookings", value: "3", icon: "calendar-outline" as const },
  { label: "Saved", value: "12", icon: "heart-outline" as const },
  { label: "Reviews", value: "5", icon: "star-outline" as const },
];

const MENU = [
  {
    title: "Account",
    items: [
      { id: "personal", label: "Personal Information", icon: "person-outline" as const },
      { id: "security", label: "Security & Password", icon: "lock-closed-outline" as const },
      { id: "notif", label: "Notifications", icon: "notifications-outline" as const },
      { id: "lang", label: "Language", icon: "language-outline" as const, value: "English" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "housing", label: "Housing Preferences", icon: "home-outline" as const },
      { id: "budget", label: "Budget Settings", icon: "wallet-outline" as const },
      { id: "payment", label: "Payment Methods", icon: "card-outline" as const },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help Center", icon: "help-circle-outline" as const },
      { id: "privacy", label: "Privacy Policy", icon: "shield-outline" as const },
    ],
  },
];

function MenuItem({ item, isLast }: { item: any; isLast: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <View>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <Animated.View style={[styles.menuItem, { transform: [{ scale }] }]}>
          <View style={styles.menuIconWrap}>
            <Ionicons name={item.icon} size={16} color={PRIMARY} />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
          {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
          <Ionicons name="chevron-forward" size={14} color="#c4c4c9" />
        </Animated.View>
      </Pressable>
      {!isLast && <View style={styles.menuDivider} />}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;
  const blockA = useRef(new Animated.Value(0)).current;
  const blockA_y = useRef(new Animated.Value(16)).current;
  const blockB = useRef(new Animated.Value(0)).current;
  const blockB_y = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(blockA, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(blockA_y, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(blockB, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(blockB_y, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Header & Settings Button */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#1a1c1d" />
          </Pressable>
        </Animated.View>

        {/* Avatar block */}
        <Animated.View style={[styles.avatarSect, { opacity: blockA, transform: [{ translateY: blockA_y }] }]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarGlass} />
            <Text style={styles.avatarInitials}>JD</Text>
            <Pressable style={styles.cameraBtn}>
              <Ionicons name="camera-outline" size={13} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.name}>Jean Dupont</Text>
          <Text style={styles.email}>jean.dupont@student.cm</Text>
          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={12} color="#059669" />
            <Text style={styles.verifiedTxt}>Verified Student</Text>
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View style={[{ opacity: blockA, transform: [{ translateY: blockA_y }] }, styles.statsRow]}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={18} color="#9ca3af" style={{ marginBottom: 4 }} />
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLab}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Upgrade Banner */}
        <Animated.View style={[{ opacity: blockA, transform: [{ translateY: blockA_y }] }, styles.banner]}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIcon}>
              <Ionicons name="school-outline" size={20} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Student Plan</Text>
              <Text style={styles.bannerSub}>Université de Yaoundé I</Text>
            </View>
          </View>
        </Animated.View>

        {/* Menus */}
        <Animated.View style={{ opacity: blockB, transform: [{ translateY: blockB_y }] }}>
          {MENU.map((section) => (
            <View key={section.title} style={styles.menuSect}>
              <Text style={styles.menuSectTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((it, idx) => (
                  <MenuItem key={it.id} item={it} isLast={idx === section.items.length - 1} />
                ))}
              </View>
            </View>
          ))}

          {/* Theme */}
          <View style={styles.menuSect}>
            <Text style={styles.menuSectTitle}>Display</Text>
            <View style={styles.menuCard}>
              <Pressable style={styles.menuItem} onPress={() => setIsDark(!isDark)}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="moon-outline" size={16} color={PRIMARY} />
                </View>
                <Text style={styles.menuLabel}>Dark Mode</Text>
                <View style={[styles.toggle, isDark && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, isDark && styles.toggleThumbOn]} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Sign Out */}
          <Pressable
            style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.replace("/")}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.signOutTxt}>Sign Out</Text>
          </Pressable>
          <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  scroll: { paddingTop: Platform.OS === "ios" ? 60 : 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1a1c1d", fontFamily: "SpaceMono" },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)",
  },
  avatarSect: { alignItems: "center", paddingBottom: 24 },
  avatarWrap: { width: 90, height: 90, borderRadius: 28, backgroundColor: "#1e1b4b", justifyContent: "center", alignItems: "center", overflow: "visible" },
  avatarGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: PRIMARY, opacity: 0.55, borderRadius: 28 },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: "#fff", zIndex: 2 },
  cameraBtn: {
    position: "absolute", bottom: -6, right: -6, width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#1a1c1d", justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#f7f7fb", zIndex: 3,
  },
  name: { fontSize: 20, fontWeight: "700", color: "#1a1c1d", marginTop: 14, marginBottom: 2 },
  email: { fontSize: 13, color: "#9ca3af", marginBottom: 8 },
  verifiedPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verifiedTxt: { fontSize: 11, fontWeight: "600", color: "#059669" },
  statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
  },
  statVal: { fontSize: 18, fontWeight: "800", color: "#1a1c1d" },
  statLab: { fontSize: 11, fontWeight: "600", color: "#9ca3af" },
  banner: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    marginHorizontal: 24, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  bannerIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#F3F0FF", justifyContent: "center", alignItems: "center" },
  bannerTitle: { fontSize: 15, fontWeight: "700", color: "#1a1c1d" },
  bannerSub: { fontSize: 12, color: PRIMARY, fontWeight: "500" },
  menuSect: { marginHorizontal: 24, marginBottom: 20 },
  menuSectTitle: { fontSize: 11, fontWeight: "800", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
  menuCard: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  menuDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.04)", marginLeft: 46 },
  menuIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#F3F0FF", justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#1a1c1d" },
  menuValue: { fontSize: 13, color: "#9ca3af" },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: "#e5e7eb", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: PRIMARY },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", alignSelf: "flex-start" },
  toggleThumbOn: { alignSelf: "flex-end" },
  signOut: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 24, marginBottom: 12, paddingVertical: 14, borderRadius: 16,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(220,38,38,0.2)",
  },
  signOutTxt: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  version: { fontSize: 11, color: "#c4c4c9", textAlign: "center" },
});
