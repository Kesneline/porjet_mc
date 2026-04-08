import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";

const { width: W } = Dimensions.get("window");
const PRIMARY = "#7C3AED";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "studio", label: "Studio" },
  { id: "shared", label: "Shared" },
  { id: "apartment", label: "Apartment" },
  { id: "furnished", label: "Furnished" },
];

const CITIES = [
  { id: "yaounde", name: "Yaoundé", count: 124, top: "#312e81", bot: "#6d28d9" },
  { id: "douala", name: "Douala", count: 98, top: "#064e3b", bot: "#059669" },
  { id: "bafoussam", name: "Bafoussam", count: 41, top: "#78350f", bot: "#d97706" },
  { id: "buea", name: "Buea", count: 28, top: "#1e3a8a", bot: "#3b82f6" },
];

const RESULTS = [
  { id: "r1", title: "Luxury Studio Near UY1", location: "Ngoa-Ekélé", type: "Studio", price: "75,000", rating: 4.9, reviews: 56, furnished: true, src: require("../../assets/images/bright_studio.png") },
  { id: "r2", title: "Spacious Shared Room", location: "Melen", type: "Shared", price: "28,000", rating: 4.5, reviews: 34, furnished: false, src: require("../../assets/images/cozy_room.png") },
  { id: "r3", title: "2-Bedroom Apartment", location: "Bastos", type: "Apartment", price: "145,000", rating: 4.8, reviews: 89, furnished: true, src: require("../../assets/images/modern_apt.png") },
  { id: "r4", title: "Student Furnished Room", location: "Mvog-Ada", type: "Studio", price: "42,000", rating: 4.6, reviews: 22, furnished: true, src: require("../../assets/images/bright_studio.png") },
];

function AptThumb({ src, style }: { src: any; style?: any }) {
  return (
    <View style={[{ backgroundColor: "#e2e8f0", overflow: "hidden" }, style]}>
      <Image source={src} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)" }} />
    </View>
  );
}

function ResultCard({ item, delay }: { item: (typeof RESULTS)[0]; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const [saved, setSaved] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, damping: 20, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleSave = () => {
    setSaved((v) => !v);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, damping: 5 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.resultCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Pressable style={{ flex: 1 }} onPress={() => router.push(`/listing/${item.id}`)}>
        <AptThumb src={item.src} style={styles.resultImg} />

        {/* Controls overlay */}
        <View style={styles.resultControls}>
          {item.furnished && (
            <View style={styles.furnishedBadge}>
              <Text style={styles.furnishedText}>Furnished</Text>
            </View>
          )}
          <Pressable onPress={toggleSave} hitSlop={10} style={styles.saveBtn}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={saved ? "heart" : "heart-outline"} size={18} color={saved ? "#EF4444" : "#fff"} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.resultBody}>
          <View style={styles.resultTopRow}>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{item.type}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.rating} ({item.reviews})</Text>
            </View>
          </View>
          <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.resultLocRow}>
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text style={styles.resultLoc}>{item.location}</Text>
          </View>
          <View style={styles.resultFooter}>
            <Text style={styles.resultPrice}>{item.price} <Text style={styles.resultPer}>FCFA/mo</Text></Text>
            <View style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>View</Text>
              <Ionicons name="arrow-forward" size={13} color={PRIMARY} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showResults, setShowResults] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <Text style={styles.headerTitle}>Find a home</Text>
          <Text style={styles.headerSub}>300+ listings across Cameroon</Text>
        </Animated.View>

        {/* Search bar */}
        <Animated.View style={[styles.searchWrap, { opacity: headerFade }]}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="City, university, neighborhood…"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={(t) => { setQuery(t); setShowResults(t.length > 0); }}
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(""); setShowResults(false); }} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color="#c4c4c9" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <Pressable key={f.id} onPress={() => setActiveFilter(f.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!showResults ? (
          <>
            {/* City grid */}
            <Text style={styles.sectionTitle}>Browse by city</Text>
            <View style={styles.cityGrid}>
              {CITIES.map((city) => (
                <Pressable key={city.id} style={styles.cityCard}
                  onPress={() => { setQuery(city.name); setShowResults(true); }}>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: city.top, borderRadius: 20 }]} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: city.bot, opacity: 0.55, borderRadius: 20 }]} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 20 }]} />
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.cityCount}>{city.count} listings</Text>
                </Pressable>
              ))}
            </View>

            {/* Popular searches */}
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Trending searches</Text>
            {["Studio near UY1", "Furnished room Douala", "Shared apt Bastos", "Budget room Melen"].map((q, i) => (
              <Animated.View key={q} style={{
                opacity: headerFade,
                transform: [{ translateY: headerSlide }],
              }}>
                <Pressable style={styles.popularItem} onPress={() => { setQuery(q); setShowResults(true); }}>
                  <View style={styles.trendIcon}>
                    <Ionicons name="trending-up-outline" size={15} color={PRIMARY} />
                  </View>
                  <Text style={styles.popularText}>{q}</Text>
                  <Ionicons name="arrow-forward-outline" size={14} color="#d1d5db" />
                </Pressable>
              </Animated.View>
            ))}
          </>
        ) : (
          <>
            <View style={styles.resultsHead}>
              <Text style={styles.sectionTitle}>{RESULTS.length} results</Text>
              <Pressable style={styles.sortBtn}>
                <Ionicons name="options-outline" size={15} color={PRIMARY} />
                <Text style={styles.sortText}>Filter</Text>
              </Pressable>
            </View>
            {RESULTS.map((item, idx) => (
              <ResultCard key={item.id} item={item} delay={idx * 70} />
            ))}
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  scroll: { paddingTop: Platform.OS === "ios" ? 60 : 40 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1a1c1d", fontFamily: "SpaceMono" },
  headerSub: { fontSize: 14, color: "#9ca3af", marginTop: 5 },
  searchWrap: { paddingHorizontal: 24, marginBottom: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1a1c1d", padding: 0, outlineStyle: "none" } as any,
  filtersRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 20 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.09)",
  },
  filterChipActive: { backgroundColor: "#1a1c1d", borderColor: "#1a1c1d" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1c1d", paddingHorizontal: 24, marginBottom: 14 },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 24, gap: 12 },
  cityCard: {
    width: (W - 48 - 12) / 2,
    height: 108,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    justifyContent: "flex-end",
  },
  cityName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  cityCount: { fontSize: 12, color: "rgba(255,255,255,0.72)" },
  popularItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    gap: 12,
  },
  trendIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  popularText: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1a1c1d" },
  resultsHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 24,
    marginBottom: 4,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sortText: { fontSize: 13, fontWeight: "600", color: PRIMARY },
  resultCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  resultImg: { height: 170, width: "100%" },
  resultControls: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  furnishedBadge: {
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  furnishedText: { fontSize: 11, fontWeight: "700", color: "#1a1c1d" },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultBody: { padding: 14, gap: 5 },
  resultTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typePill: { backgroundColor: "#F3F0FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 10, fontWeight: "700", color: PRIMARY, letterSpacing: 0.4, textTransform: "uppercase" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#1a1c1d" },
  resultLocRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  resultLoc: { fontSize: 12, color: "#9ca3af" },
  resultFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  resultPrice: { fontSize: 16, fontWeight: "800", color: "#1a1c1d" },
  resultPer: { fontSize: 12, fontWeight: "400", color: "#9ca3af" },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailsBtnText: { fontSize: 12, fontWeight: "700", color: PRIMARY },
});
