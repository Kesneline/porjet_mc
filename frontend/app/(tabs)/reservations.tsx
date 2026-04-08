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
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";

const PRIMARY = "#7C3AED";
const { width: W, height: H } = Dimensions.get("window");

type Status = "upcoming" | "active" | "completed" | "cancelled";

const TABS: { id: Status; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const BOOKINGS = [
  { id: "b1", title: "Luxury Studio – Bastos", location: "Bastos, Yaoundé", dates: "Apr 15 – Jul 14, 2026", price: "85,000 FCFA/mo", status: "upcoming" as Status, src: require("../../assets/images/modern_apt.png") },
  { id: "b2", title: "Modern Apt – Bonapriso", location: "Bonapriso, Douala", dates: "Jan 1 – Mar 31, 2026", price: "120,000 FCFA/mo", status: "active" as Status, src: require("../../assets/images/bright_studio.png") },
  { id: "b3", title: "Student Room – Melen", location: "Melen, Yaoundé", dates: "Oct 1 – Dec 31, 2025", price: "28,000 FCFA/mo", status: "completed" as Status, src: require("../../assets/images/cozy_room.png") },
  { id: "b4", title: "Shared Room – Ekounou", location: "Ekounou, Yaoundé", dates: "Sep 1 – Nov 30, 2025", price: "22,000 FCFA/mo", status: "cancelled" as Status, src: require("../../assets/images/cozy_room.png") },
];

const STATUS_CONFIG: Record<Status, { bg: string; text: string; dot: string; label: string }> = {
  upcoming: { bg: "#EEF2FF", text: "#6366F1", dot: "#6366F1", label: "Upcoming" },
  active: { bg: "#ECFDF5", text: "#059669", dot: "#059669", label: "Active" },
  completed: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF", label: "Completed" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444", label: "Cancelled" },
};

function AptBanner({ src }: { src: any }) {
  return (
    <View style={[styles.banner, { backgroundColor: "#e2e8f0" }]}>
      <Image source={src} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
    </View>
  );
}

function BookingCard({ item, delay, onView }: { item: (typeof BOOKINGS)[0]; delay: number; onView: (b: any) => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const cfg = STATUS_CONFIG[item.status];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay, damping: 20, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <AptBanner src={item.src} />

      {/* Status pill */}
      <View style={[styles.statusPill, { backgroundColor: cfg.bg, position: "absolute", top: 12, right: 14 }]}>
        <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
        <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color="#9ca3af" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
          <Text style={styles.infoText}>{item.dates}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>{item.price}</Text>
          <View style={styles.actions}>
            {item.status === "upcoming" && (
              <>
                <Pressable style={styles.btnOutline} onPress={() => onView(item)}>
                  <Text style={styles.btnOutlineText}>View info</Text>
                </Pressable>
                <Pressable style={styles.btnPrimary} onPress={() => onView(item)}>
                  <Text style={styles.btnPrimaryText}>Options</Text>
                </Pressable>
              </>
            )}
            {item.status === "active" && (
              <Pressable style={styles.btnPrimary} onPress={() => onView(item)}>
                <Ionicons name="chatbubble-outline" size={14} color="#fff" />
                <Text style={styles.btnPrimaryText}>Manage</Text>
              </Pressable>
            )}
            {item.status === "completed" && (
              <Pressable style={[styles.btnPrimary, { backgroundColor: "#1a1c1d" }]} onPress={() => onView(item)}>
                <Ionicons name="star-outline" size={14} color="#fff" />
                <Text style={styles.btnPrimaryText}>Leave a review</Text>
              </Pressable>
            )}
            {item.status === "cancelled" && (
              <Pressable style={styles.btnPrimary} onPress={() => onView(item)}>
                <Text style={styles.btnPrimaryText}>Rebook</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyState({ tab }: { tab: Status }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 140, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: true }),
    ]).start();
  }, [tab]);
  return (
    <Animated.View style={[styles.emptyState, { opacity: fade, transform: [{ scale }] }]}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={32} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyText}>Your {tab} bookings will appear here.</Text>
    </Animated.View>
  );
}

export default function ReservationsScreen() {
  const [activeTab, setActiveTab] = useState<Status>("upcoming");
  const [bookingsData, setBookingsData] = useState([...BOOKINGS]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (params.newBooking && params.aptTitle) {
      setBookingsData((prev) => {
        // Prevent duplicate append on reload
        if (prev.find(b => b.id === params.newBooking)) return prev;
        
        const newEntry = {
          id: params.newBooking as string,
          title: params.aptTitle as string,
          location: params.aptLoc as string,
          dates: `${params.date} at ${params.time}`,
          price: params.aptPrice as string,
          status: "upcoming" as Status,
          src: require("../../assets/images/modern_apt.png"), // fallback
        };
        return [newEntry, ...prev];
      });
      setActiveTab("upcoming");
    }
  }, [params]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const filtered = bookingsData.filter((b) => b.status === activeTab);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSub}>{bookingsData.length} total reservations</Text>
        </Animated.View>

        {/* Summary chips */}
        <Animated.View style={{ opacity: headerFade }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
            {TABS.map((t) => {
              const cnt = bookingsData.filter((b) => b.status === t.id).length;
              const cfg = STATUS_CONFIG[t.id];
              const active = activeTab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setActiveTab(t.id)}
                  style={[styles.summaryChip, active && styles.summaryChipActive]}
                >
                  {cnt > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: active ? "rgba(255,255,255,0.25)" : cfg.bg }]}>
                      <Text style={[styles.countText, { color: active ? "#fff" : cfg.text }]}>{cnt}</Text>
                    </View>
                  )}
                  <Text style={[styles.summaryLabel, active && styles.summaryLabelActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cardList}>
          {filtered.length > 0
            ? filtered.map((b, idx) => <BookingCard key={b.id} item={b} delay={idx * 80} onView={setSelectedBooking} />)
            : <EmptyState tab={activeTab} />}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={!!selectedBooking} transparent animationType="slide">
        {selectedBooking && (
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailTitle} numberOfLines={1}>{selectedBooking.title}</Text>
                  <Text style={styles.detailSub}>{selectedBooking.location}</Text>
                </View>
                <Pressable onPress={() => setSelectedBooking(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#1a1c1d" />
                </Pressable>
              </View>
              
              <Image source={selectedBooking.src} style={styles.detailBanner} />

              <View style={styles.detailInfoBox}>
                <View style={styles.detailInfoRow}>
                  <Ionicons name="calendar" size={18} color={PRIMARY} />
                  <Text style={styles.detailInfoText}>{selectedBooking.dates}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailInfoRow}>
                  <Ionicons name="card" size={18} color={PRIMARY} />
                  <Text style={styles.detailInfoText}>{selectedBooking.price}</Text>
                </View>
              </View>

              <Text style={styles.actionTitle}>Actions rapides</Text>

              <View style={styles.actionGrid}>
                {/* 1. Contacter */}
                <Pressable 
                  style={styles.gridBtn}
                  onPress={() => {
                    setSelectedBooking(null);
                    router.push(`/chat/${selectedBooking.id}`);
                  }}
                >
                  <View style={[styles.gridIconWrap, { backgroundColor: "#EEF2FF" }]}>
                    <Ionicons name="mail" size={22} color="#6366F1" />
                  </View>
                  <Text style={styles.gridBtnText}>Contacter</Text>
                </Pressable>

                {/* 2. Modifier */}
                <Pressable style={styles.gridBtn}>
                  <View style={[styles.gridIconWrap, { backgroundColor: "#FFFBEB" }]}>
                    <Ionicons name="create" size={22} color="#D97706" />
                  </View>
                  <Text style={styles.gridBtnText}>Modifier</Text>
                </Pressable>

                {/* 3. Payer */}
                <Pressable 
                  style={styles.gridBtn}
                  onPress={() => {
                    const priceRaw = selectedBooking.price;
                    const bId = selectedBooking.id;
                    const bTitle = selectedBooking.title;
                    setSelectedBooking(null);
                    router.push(`/payment/${bId}?price=${encodeURIComponent(priceRaw)}&title=${encodeURIComponent(bTitle)}`);
                  }}
                >
                  <View style={[styles.gridIconWrap, { backgroundColor: PRIMARY + "15" }]}>
                    <Ionicons name="wallet" size={22} color={PRIMARY} />
                  </View>
                  <Text style={styles.gridBtnText}>Payer</Text>
                </Pressable>

                {/* 4. Supprimer */}
                <Pressable style={styles.gridBtn} onPress={() => {
                  setBookingsData(prev => prev.filter(b => b.id !== selectedBooking.id));
                  setSelectedBooking(null);
                }}>
                  <View style={[styles.gridIconWrap, { backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="trash" size={22} color="#DC2626" />
                  </View>
                  <Text style={[styles.gridBtnText, { color: "#DC2626" }]}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  scroll: { paddingTop: Platform.OS === "ios" ? 60 : 40 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1a1c1d", fontFamily: "SpaceMono" },
  headerSub: { fontSize: 14, color: "#9ca3af", marginTop: 5 },
  summaryRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 20 },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  summaryChipActive: { backgroundColor: "#1a1c1d", borderColor: "#1a1c1d" },
  summaryLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  summaryLabelActive: { color: "#fff" },
  countBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: { fontSize: 11, fontWeight: "700" },
  cardList: { paddingHorizontal: 24, gap: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  banner: { height: 120, justifyContent: "center", alignItems: "center" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardBody: { padding: 16, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1c1d" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 13, color: "#6b7280" },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceText: { fontSize: 15, fontWeight: "700", color: PRIMARY },
  actions: { flexDirection: "row", gap: 8 },
  btnOutline: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  btnOutlineText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: PRIMARY,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1a1c1d" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },

  // Details Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  detailTitle: { fontSize: 22, fontWeight: "800", color: "#1a1c1d", width: W * 0.7 },
  detailSub: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center",
  },
  detailBanner: {
    width: "100%", height: 140, borderRadius: 20, marginBottom: 20,
  },
  detailInfoBox: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailInfoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  detailInfoText: { fontSize: 15, fontWeight: "600", color: "#1a1c1d" },
  actionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1c1d", marginBottom: 16 },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  gridBtn: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  gridBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1c1d",
  },
});
