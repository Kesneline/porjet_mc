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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#7C3AED";

const CONVOS = [
  { id: "c1", name: "Marie Dupont", role: "Landlord", lastMsg: "The room is available from April 10th, feel free to visit!", time: "2m ago", unread: 3, online: true, top: "#4C1D95", bot: "#7C3AED" },
  { id: "c2", name: "StudHousing", role: "Support", lastMsg: "Your account has been verified successfully.", time: "1h ago", unread: 1, online: true, top: "#7C3AED", bot: "#a78bfa" },
  { id: "c3", name: "Jean-Paul Nkomo", role: "Landlord", lastMsg: "Yes, utilities are included in the rent.", time: "Yesterday", unread: 0, online: false, top: "#065F46", bot: "#059669" },
  { id: "c4", name: "Anne Belibi", role: "Co-tenant", lastMsg: "Did you already pay this month's rent?", time: "Mon", unread: 0, online: false, top: "#92400E", bot: "#d97706" },
  { id: "c5", name: "Pierre Kamdem", role: "Landlord", lastMsg: "Sure, I'll send you the lease agreement.", time: "Sun", unread: 0, online: false, top: "#1E3A8A", bot: "#3b82f6" },
];

function Avatar({ name, top, bot, size = 46, online = false }: { name: string; top: string; bot: string; size?: number; online?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={{ position: "relative" }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: top, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: bot, opacity: 0.6 }} />
        <Text style={{ fontSize: size * 0.35, fontWeight: "700", color: "#fff" }}>{initials}</Text>
      </View>
      {online && (
        <View style={{
          position: "absolute", bottom: -1, right: -1,
          width: size * 0.28, height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: "#22C55E",
          borderWidth: 2, borderColor: "#f7f7fb",
        }} />
      )}
    </View>
  );
}

function ConvoItem({ item, delay }: { item: (typeof CONVOS)[0]; delay: number }) {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay, damping: 20, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <Pressable
        onPress={() => router.push(`/chat/${item.id}`)}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={({ pressed }) => [styles.convoItem]}
      >
        <Animated.View style={[styles.convoInner, { transform: [{ scale }] }]}>
          <Avatar name={item.name} top={item.top} bot={item.bot} online={item.online} />
          <View style={styles.convoBody}>
            <View style={styles.convoTop}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flex: 1 }}>
                <Text style={[styles.convoName, item.unread > 0 && styles.convoBold]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[styles.rolePill, item.role === "Support" && styles.rolePillSupport]}>
                  <Text style={[styles.roleText, item.role === "Support" && styles.roleTextSupport]}>{item.role}</Text>
                </View>
              </View>
              <Text style={styles.convoTime}>{item.time}</Text>
            </View>
            <View style={styles.convoBottom}>
              <Text style={[styles.convoMsg, item.unread > 0 && styles.convoMsgBold]} numberOfLines={1}>
                {item.lastMsg}
              </Text>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
        <View style={styles.convoDivider} />
      </Pressable>
    </Animated.View>
  );
}

export default function MessagesScreen() {
  const [searchQ, setSearchQ] = useState("");
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const filtered = CONVOS.filter(
    (c) => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.lastMsg.toLowerCase().includes(searchQ.toLowerCase())
  );

  const totalUnread = CONVOS.reduce((a, c) => a + c.unread, 0);
  const onlineConvos = CONVOS.filter((c) => c.online);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && <Text style={styles.unreadSub}>{totalUnread} unread</Text>}
          </View>
          <Pressable style={styles.composeBtn}>
            <Ionicons name="create-outline" size={19} color={PRIMARY} />
          </Pressable>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[{ opacity: headerFade }, styles.searchWrap]}>
          <Ionicons name="search-outline" size={15} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor="#9ca3af"
            value={searchQ}
            onChangeText={setSearchQ}
            underlineColorAndroid="transparent"
          />
          {searchQ.length > 0 && (
            <Pressable onPress={() => setSearchQ("")} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color="#c4c4c9" />
            </Pressable>
          )}
        </Animated.View>

        {/* Online now */}
        {!searchQ && (
          <Animated.View style={{ opacity: headerFade }}>
            <Text style={styles.sectionLabel}>Online now</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onlineRow}>
              {onlineConvos.map((c) => (
                <View key={c.id} style={styles.onlineItem}>
                  <Avatar name={c.name} top={c.top} bot={c.bot} size={52} online />
                  <Text style={styles.onlineName} numberOfLines={1}>{c.name.split(" ")[0]}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Conversations */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
          {searchQ ? `Results (${filtered.length})` : "Recent"}
        </Text>

        <View style={styles.convoList}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#e5e7eb" />
              <Text style={styles.emptyText}>No conversations found</Text>
            </View>
          ) : (
            filtered.map((conv, idx) => (
              <ConvoItem key={conv.id} item={conv} delay={idx * 60} />
            ))
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  scroll: { paddingTop: Platform.OS === "ios" ? 60 : 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1a1c1d", fontFamily: "SpaceMono" },
  unreadSub: { fontSize: 13, color: PRIMARY, fontWeight: "600", marginTop: 3 },
  composeBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    gap: 8,
    marginBottom: 22,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1a1c1d", padding: 0, outlineStyle: "none" } as any,
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", paddingHorizontal: 24, marginBottom: 14, letterSpacing: 0.5, textTransform: "uppercase" },
  onlineRow: { paddingHorizontal: 24, gap: 18, marginBottom: 8 },
  onlineItem: { alignItems: "center", gap: 5, width: 56 },
  onlineName: { fontSize: 11, fontWeight: "500", color: "#6b7280", textAlign: "center" },
  convoList: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  convoItem: {},
  convoInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  convoDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginLeft: 74 },
  convoBody: { flex: 1, gap: 4 },
  convoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoName: { fontSize: 14, fontWeight: "500", color: "#1a1c1d", flex: 1 },
  convoBold: { fontWeight: "700" },
  rolePill: { backgroundColor: "#F3F0FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  rolePillSupport: { backgroundColor: "#ECFDF5" },
  roleText: { fontSize: 9, fontWeight: "700", color: PRIMARY, textTransform: "uppercase", letterSpacing: 0.3 },
  roleTextSupport: { color: "#059669" },
  convoTime: { fontSize: 11, color: "#9ca3af" },
  convoBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convoMsg: { flex: 1, fontSize: 13, color: "#9ca3af", marginRight: 8 },
  convoMsgBold: { color: "#374151", fontWeight: "600" },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
