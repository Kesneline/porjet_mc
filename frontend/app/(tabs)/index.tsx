import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Platform,
  Dimensions,
  Image,
  Animated,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { CustomIcon } from "../../components/CustomIcons";

const { width: W, height: H } = Dimensions.get("window");
const PRIMARY = "#7C3AED";
const CARD_W = W - 48;
const CARD_SMALL_W = W * 0.58;

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "studio", label: "Studio" },
  { id: "shared", label: "Shared room" },
  { id: "apartment", label: "Apartment" },
  { id: "furnished", label: "Furnished" },
];

// Apartment "image" palettes – rich gradients simulating real photos
const APTS = [
  {
    id: "a1",
    title: "Bright Studio — Bastos",
    location: "Bastos · Yaoundé",
    price: "85,000",
    type: "Studio",
    rating: 4.92,
    reviews: 84,
    badge: "Guest favourite",
    src: require("../../assets/images/bright_studio.png"),
    saved: false,
  },
  {
    id: "a2",
    title: "Modern 2BR · Bonapriso",
    location: "Bonapriso · Douala",
    price: "130,000",
    type: "Apartment",
    rating: 4.87,
    reviews: 126,
    badge: null,
    src: require("../../assets/images/modern_apt.png"),
    saved: true,
  },
  {
    id: "a3",
    title: "Cosy Room — Ngoa-Ekélé",
    location: "Ngoa-Ekélé · Yaoundé",
    price: "32,000",
    type: "Shared",
    rating: 4.75,
    reviews: 55,
    badge: "New",
    src: require("../../assets/images/cozy_room.png"),
    saved: false,
  },
  {
    id: "a4",
    title: "Loft near UY1",
    location: "Melen · Yaoundé",
    price: "60,000",
    type: "Studio",
    rating: 4.81,
    reviews: 39,
    badge: null,
    src: require("../../assets/images/cozy_room.png"),
    saved: false,
  },
];

const NEARBY = [
  { id: "n1", title: "Student room", location: "Mvog-Ada", price: "25,000", rating: 4.6, src: require("../../assets/images/cozy_room.png") },
  { id: "n2", title: "Furnished studio", location: "Ekounou", price: "48,000", rating: 4.8, src: require("../../assets/images/bright_studio.png") },
  { id: "n3", title: "Shared 3BR", location: "Santa Barbara", price: "20,000", rating: 4.5, src: require("../../assets/images/modern_apt.png") },
];

// ─── Apartment Image display ──────────────────────────────────────────────

function AptIllustration({ src, style }: { src: any; style?: any }) {
  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#e2e8f0" }, style]}>
      <Image source={src} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
    </View>
  );
}

// ─── Glass overlay pill ───────────────────────────────────────────────────────

function GlassBadge({ label }: { label: string }) {
  return (
    <View style={styles.glassBadge}>
      <Text style={styles.glassBadgeText}>{label}</Text>
    </View>
  );
}

// ─── Featured card (full width) ───────────────────────────────────────────────

function FeaturedCard({
  item,
  index,
  scrollX,
}: {
  item: (typeof APTS)[0];
  index: number;
  scrollX: Animated.Value;
}) {
  const [saved, setSaved] = useState(item.saved);
  const heartScale = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const inputRange = [(index - 1) * (CARD_W + 16), index * (CARD_W + 16), (index + 1) * (CARD_W + 16)];
  const scale = scrollX.interpolate({ inputRange, outputRange: [0.93, 1, 0.93], extrapolate: "clamp" });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: "clamp" });

  const toggleSave = () => {
    setSaved((v) => !v);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.32, useNativeDriver: true, damping: 6 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, damping: 10 }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.featuredCard, { transform: [{ scale }], opacity }]}>
      <Pressable style={{ flex: 1 }} onPress={() => router.push(`/listing/${item.id}`)}>
        {/* Apartment visual */}
        <AptIllustration src={item.src} style={styles.cardImg} />

        {/* Top overlay controls */}
        <View style={styles.cardTopRow}>
          {item.badge ? <GlassBadge label={item.badge} /> : <View />}
          <Pressable onPress={toggleSave} hitSlop={12} style={styles.heartBtn}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={22}
                color={saved ? "#EF4444" : "#fff"}
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Bottom info glass panel */}
        <View style={styles.cardInfoGlass}>
          <BlurView intensity={45} tint="dark" style={styles.cardInfoGlassBg} />
          <View style={styles.cardInfoRow}>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{item.type}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingTxt}>{item.rating} · {item.reviews} reviews</Text>
            </View>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardBottom}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={styles.cardLocation}>{item.location}</Text>
            </View>
            <Text style={styles.cardPrice}>{item.price} <Text style={styles.cardPricePer}>FCFA/mo</Text></Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Nearby card (small horizontal) ─────────────────────────────────────────

function NearbyCard({ item, delay }: { item: (typeof NEARBY)[0]; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const [saved, setSaved] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, damping: 18, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleSave = () => {
    setSaved((v) => !v);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, damping: 5 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.nearbyCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Pressable style={{ flex: 1 }} onPress={() => router.push(`/listing/${item.id}`)}>
        <AptIllustration src={item.src} style={styles.nearbyImg} />
        <Pressable style={styles.nearbyHeartBtn} onPress={toggleSave} hitSlop={10}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={17} color={saved ? "#EF4444" : "#fff"} />
          </Animated.View>
        </Pressable>
        <View style={styles.nearbyBody}>
          <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.nearbyLocRow}>
            <Ionicons name="location-outline" size={11} color="#9ca3af" />
            <Text style={styles.nearbyLoc}>{item.location}</Text>
          </View>
          <View style={styles.nearbyFooter}>
            <Text style={styles.nearbyPrice}>{item.price}<Text style={styles.nearPricePer}> FCFA</Text></Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Ionicons name="star" size={10} color="#FBBF24" />
              <Text style={styles.nearbyRating}>{item.rating}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeKanban, setActiveKanban] = useState(0);

  // Stagger fade-in for sections
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const catFade = useRef(new Animated.Value(0)).current;
  const featFade = useRef(new Animated.Value(0)).current;
  const nearFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(heroSlide, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
      ]),
      Animated.timing(catFade, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(featFade, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(nearFade, { toValue: 1, duration: 340, useNativeDriver: true }),
    ]).start();
  }, []);

  // Top bar opacity from scroll
  const topBarBg = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: ["rgba(248,248,252,0)", "rgba(248,248,252,0.95)"],
    extrapolate: "clamp",
  });

  // Kanban tabs
  const KANBANS = ["Homes", "Studios", "Shared"];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Sticky top bar (appears on scroll) ── */}
      <Animated.View style={[styles.topBar, { backgroundColor: topBarBg }]}>
        <View style={styles.topBarInner}>
          {/* Search pill */}
          <Pressable onPress={() => router.push("/(tabs)/search")} style={styles.searchPill}>
            <Ionicons name="search-outline" size={16} color="#6b7280" />
            <Text style={styles.searchPillText}>Start your search</Text>
          </Pressable>
          {/* Notifications */}
          <Pressable style={styles.notifBtn}>
            <CustomIcon name="notifications" size={20} color="#1a1c1d" />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {/* Kanban tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanRow}
        >
          {KANBANS.map((k, i) => (
            <Pressable
              key={k}
              onPress={() => setActiveKanban(i)}
              style={styles.kanbanTab}
            >
              <Text style={[styles.kanbanLabel, activeKanban === i && styles.kanbanLabelActive]}>
                {k}
              </Text>
              {activeKanban === i && <View style={styles.kanbanUnderline} />}
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.topBarDivider} />
      </Animated.View>

      {/* ── Main scroll ── */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero header */}
        <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>Good morning 👋</Text>
              <Text style={styles.heroTitle}>Find your{"\n"}perfect home</Text>
            </View>
            <Pressable style={styles.avatarBtn}>
            </Pressable>
          </View>


        </Animated.View>

        {/* Category chips */}
        <Animated.View style={{ opacity: catFade }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map((c) => {
              const active = activeCategory === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setActiveCategory(c.id)}
                  style={[styles.catChip, active && styles.catChipActive]}
                >
                  <Text style={[styles.catLabel, active && styles.catLabelActive]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Featured section ── */}
        <Animated.View style={{ opacity: featFade }}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Popular in your city</Text>
            <Pressable onPress={() => router.push("/(tabs)/search")}>
              <Text style={styles.seeAll}>Show all</Text>
            </Pressable>
          </View>

          {/* Full-width horizontal paging cards */}
          <Animated.FlatList
            data={APTS}
            keyExtractor={(i) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <FeaturedCard item={item} index={index} scrollX={scrollX} />
            )}
          />

          {/* Pagination dots */}
          <View style={styles.dotsRow}>
            {APTS.map((_, i) => {
              const dotOpacity = scrollX.interpolate({
                inputRange: [(i - 1) * (CARD_W + 16), i * (CARD_W + 16), (i + 1) * (CARD_W + 16)],
                outputRange: [0.25, 1, 0.25],
                extrapolate: "clamp",
              });
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * (CARD_W + 16), i * (CARD_W + 16), (i + 1) * (CARD_W + 16)],
                outputRange: [6, 18, 6],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { opacity: dotOpacity, width: dotWidth }]}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* ── Nearby section ── */}
        <Animated.View style={{ opacity: nearFade }}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Nearby you</Text>
            <Pressable>
              <Text style={styles.seeAll}>Show all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyList}
          >
            {NEARBY.map((item, idx) => (
              <NearbyCard key={item.id} item={item} delay={idx * 80} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── "Available soon" banner ── */}
        <Animated.View style={[styles.promo, { opacity: nearFade }]}>
          <View style={styles.promoGlass} />
          <View style={styles.promoBg} />
          <View style={styles.promoContent}>
            <Ionicons name="flash-outline" size={20} color={PRIMARY} />
            <Text style={styles.promoText}>New listings available next month in Douala</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={PRIMARY} style={{ marginLeft: "auto" }} />
        </Animated.View>

        <View style={{ height: 110 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fb" },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: Platform.OS === "ios" ? 52 : 32,
  },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  searchPillText: { fontSize: 14, color: "#9ca3af", flex: 1 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  // Kanban
  kanbanRow: { paddingHorizontal: 20, gap: 4 },
  kanbanRowHero: { paddingLeft: 0, gap: 4, marginTop: 16 },
  kanbanTab: { paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", position: "relative" },
  kanbanLabel: { fontSize: 15, fontWeight: "500", color: "#9ca3af" },
  kanbanLabelActive: { fontWeight: "700", color: "#1a1c1d" },
  kanbanUnderline: { position: "absolute", bottom: 0, left: 12, right: 12, height: 2, backgroundColor: "#1a1c1d", borderRadius: 1 },
  topBarDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.07)", marginTop: 0 },

  // Scroll
  scroll: { paddingTop: Platform.OS === "ios" ? 140 : 120 },

  // Hero
  hero: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 4 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  greeting: { fontSize: 14, color: "#9ca3af", fontWeight: "500", marginBottom: 5 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#1a1c1d", lineHeight: 34, fontFamily: "SpaceMono" },
  avatarBtn: { marginTop: 4 },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(124,58,237,0.2)",
  },

  // Categories
  catRow: { paddingHorizontal: 24, paddingVertical: 16, gap: 8 },
  catChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  catChipActive: { backgroundColor: "#1a1c1d", borderColor: "#1a1c1d" },
  catLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  catLabelActive: { color: "#fff" },

  // Section head
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#1a1c1d" },
  seeAll: { fontSize: 14, fontWeight: "600", color: "#1a1c1d", textDecorationLine: "underline" },

  // Featured cards
  featuredList: { paddingLeft: 24, paddingRight: 8, gap: 16 },
  featuredCard: {
    width: CARD_W,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cardImg: { width: "100%", height: 220 },
  cardTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  glassBadge: {
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  glassBadgeText: { fontSize: 12, fontWeight: "700", color: "#1a1c1d" },
  cardInfoGlass: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
    overflow: "hidden",
  },
  cardInfoGlassBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,5,25,0.45)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  cardInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typePill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.9)", letterSpacing: 0.4, textTransform: "uppercase" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingTxt: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardLocation: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  cardPrice: { fontSize: 16, fontWeight: "800", color: "#fff" },
  cardPricePer: { fontSize: 12, fontWeight: "400", color: "rgba(255,255,255,0.65)" },

  // Pagination dots
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 12, marginBottom: 28 },
  dot: { height: 4, borderRadius: 2, backgroundColor: PRIMARY },

  // Nearby
  nearbyList: { paddingLeft: 24, paddingRight: 8, gap: 12, paddingBottom: 4 },
  nearbyCard: {
    width: CARD_SMALL_W,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  nearbyImg: { width: "100%", height: 130 },
  nearbyHeartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  nearbyBody: { padding: 12, gap: 3 },
  nearbyTitle: { fontSize: 13, fontWeight: "700", color: "#1a1c1d" },
  nearbyLocRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  nearbyLoc: { fontSize: 11, color: "#9ca3af" },
  nearbyFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  nearbyPrice: { fontSize: 13, fontWeight: "800", color: PRIMARY },
  nearPricePer: { fontSize: 10, fontWeight: "400", color: "#9ca3af" },
  nearbyRating: { fontSize: 11, fontWeight: "600", color: "#6b7280" },

  // Promo banner
  promo: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    overflow: "hidden",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.15)",
  },
  promoBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#F5F3FF" },
  promoGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  promoContent: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  promoText: { fontSize: 13, fontWeight: "600", color: "#4C1D95", flex: 1, lineHeight: 18 },
});
