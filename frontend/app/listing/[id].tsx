import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Pressable,
  Animated,
  StatusBar,
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Calendar } from "react-native-calendars";

const { width: W, height: H } = Dimensions.get("window");
const PRIMARY = "#7C3AED"; // Violet

const MOCK_DATA: Record<string, any> = {
  a1: {
    title: "Bright Studio — Bastos",
    location: "Studio in Yaoundé, Cameroon",
    details: "1 double bed · Individual bathroom",
    rating: 4.92,
    reviews: 84,
    price: "85,000",
    hostName: "Amadou",
    hostLocation: "Lives in Yaoundé, Centre",
    hostExp: "Superhost · 4 years hosting",
    src: require("../../assets/images/bright_studio.png"),
  },
  a2: {
    title: "Modern 2BR Apartment",
    location: "Apartment in Bonapriso, Douala",
    details: "2 beds · 1 private bathroom",
    rating: 4.87,
    reviews: 126,
    price: "130,000",
    hostName: "Franck",
    hostLocation: "Lives in Douala, Littoral",
    hostExp: "Superhost · 3 years hosting",
    src: require("../../assets/images/modern_apt.png"),
  },
  a3: {
    title: "Cosy shared room",
    location: "Room in Ngoa-Ekélé, Yaoundé",
    details: "1 single bed · Shared bathroom",
    rating: 4.75,
    reviews: 55,
    price: "32,000",
    hostName: "Marie",
    hostLocation: "Lives in Yaoundé, Centre",
    hostExp: "Host · 1 year hosting",
    src: require("../../assets/images/cozy_room.png"),
  },
  a4: {
    title: "Loft near UY1",
    location: "Studio in Melen, Yaoundé",
    rating: 4.81,
    details: "1 queen bed · Private bathroom",
    reviews: 39,
    price: "60,000",
    hostName: "Cedric",
    hostLocation: "Lives in Yaoundé, Centre",
    hostExp: "Superhost · 2 years hosting",
    src: require("../../assets/images/cozy_room.png"),
  },
  n1: {
    title: "Student room",
    location: "Room in Mvog-Ada, Yaoundé",
    details: "1 single bed · Shared bathroom",
    rating: 4.6,
    reviews: 23,
    price: "25,000",
    hostName: "Pauline",
    hostLocation: "Lives in Yaoundé, Centre",
    hostExp: "Host · 5 years hosting",
    src: require("../../assets/images/cozy_room.png"),
  },
  n2: {
    title: "Furnished studio",
    location: "Studio in Ekounou, Yaoundé",
    details: "1 double bed · Private bathroom",
    rating: 4.8,
    reviews: 67,
    price: "48,000",
    hostName: "Jean",
    hostLocation: "Lives in Yaoundé, Centre",
    hostExp: "Superhost · 4 years hosting",
    src: require("../../assets/images/bright_studio.png"),
  },
  n3: {
    title: "Shared 3BR",
    location: "Apartment in Santa Barbara, Yaoundé",
    details: "1 room in 3BR · Shared bathroom",
    rating: 4.5,
    reviews: 12,
    price: "20,000",
    hostName: "Aline",
    hostLocation: "Lives in Yaoundé, Centre",
    hostExp: "Host · 2 years hosting",
    src: require("../../assets/images/modern_apt.png"),
  },
};

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [saved, setSaved] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [guests, setGuests] = useState(1);
  const [selectedDay, setSelectedDay] = useState(5);
  const [selectedTime, setSelectedTime] = useState<string | null>("14:00");
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  
  // Use YYYY-MM-DD instead of simple numbers for the real calendar
  const today = new Date().toISOString().split('T')[0];
  const [popupDateStr, setPopupDateStr] = useState(today);
  const selectedDayParsed = selectedDay; // Keep a reference if needed, maybe we can just use the string for display


  const handleConfirmReservation = () => {
    setShowReserveModal(false);
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/reservations",
        params: {
          newBooking: `b_new_${Date.now()}`,
          aptTitle: data.title,
          aptLoc: data.location,
          aptPrice: data.price,
          time: selectedTime,
          date: popupDateStr,
        }
      });
    }, 300);
  };

  const handlePayNow = () => {
    router.push(`/payment/${id}?price=${encodeURIComponent(data.price)}&title=${encodeURIComponent(data.title)}`);
  };
  const fallbackId = typeof id === "string" && MOCK_DATA[id] ? id : "a1";
  const data = MOCK_DATA[fallbackId];

  // Parallax image
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, H * 0.4],
    outputRange: [-50, 0, H * 0.2],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolateRight: "clamp",
  });

  // Top bar background opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [H * 0.3, H * 0.4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── STICKY HEADER FADE IN ── */}
      <Animated.View style={[styles.headerBg, { opacity: headerOpacity }]} />

      {/* ── FLOATING TOP BUTTONS ── */}
      <View style={styles.topActions}>
        <Pressable onPress={() => router.back()} style={styles.circleBtnContainer}>
          <BlurView intensity={60} tint="light" style={styles.circleBtnBlur} />
          <View style={styles.circleBtnInner}>
            <Ionicons name="chevron-back" size={24} color="#1a1c1d" />
          </View>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable style={styles.circleBtnContainer}>
            <BlurView intensity={60} tint="light" style={styles.circleBtnBlur} />
            <View style={styles.circleBtnInner}>
              <Ionicons name="share-outline" size={22} color="#1a1c1d" />
            </View>
          </Pressable>
          <Pressable onPress={() => setSaved(!saved)} style={styles.circleBtnContainer}>
            <BlurView intensity={60} tint="light" style={styles.circleBtnBlur} />
            <View style={styles.circleBtnInner}>
              <Ionicons name={saved ? "heart" : "heart-outline"} size={22} color={saved ? PRIMARY : "#1a1c1d"} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* ── MAIN SCROLL ── */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* PARALLAX HERO IMAGE */}
        <Animated.View style={[styles.heroImgWrapper, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
          <Image source={data.src} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          {/* Subtle gradient overlay at bottom for smoother transition */}
          <View style={styles.heroImgGradient} />
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>1 / 27</Text>
          </View>
        </Animated.View>

        {/* OVERLAPPING CARD SHEET */}
        <View style={styles.sheetLayout}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.location}</Text>
          <Text style={styles.details}>{data.details}</Text>

          {/* RATING BADGE ROW */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingScore}>{data.rating}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(i => <Ionicons key={i} name="star" size={11} color="#1a1c1d" />)}
              </View>
            </View>
            
            <View style={styles.dividerV} />
            
            <View style={styles.guestFavoriteBox}>
              <Ionicons name="leaf" size={20} color="#D97706" style={{ transform: [{ scaleX: -1 }] }} />
              <Text style={styles.guestFavoriteText}>Guest{"\n"}favorite</Text>
              <Ionicons name="leaf" size={20} color="#D97706" />
            </View>

            <View style={styles.dividerV} />

            <View style={styles.ratingBox}>
              <Text style={styles.ratingScore}>{data.reviews}</Text>
              <Text style={styles.reviewLabel}>Reviews</Text>
            </View>
          </View>

          <View style={styles.dividerH} />

          {/* HOST ROW */}
          <Pressable onPress={() => setShowHostModal(true)} style={({ pressed }) => [styles.hostRow, pressed && { opacity: 0.7 }]}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#9ca3af" />
              </View>
              <View style={styles.superhostBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#fff" />
              </View>
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>Stay with {data.hostName}</Text>
              <Text style={styles.hostExp}>{data.hostExp}</Text>
            </View>
          </Pressable>

          <View style={styles.dividerH} />

          {/* RARE FIND */}
          <View style={styles.rareFindBox}>
            <Ionicons name="diamond-outline" size={18} color="#1a1c1d" />
            <Text style={styles.rareFindText}>Rare find! This place is usually booked.</Text>
          </View>

          <View style={styles.dividerH} />

          {/* MORE CONTENT MOCK */}
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Ionicons name="wifi-outline" size={28} color="#1a1c1d" />
              <View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1c1d" }}>Fast wifi</Text>
                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>At 102 Mbps, you can take video calls and stream videos for your whole group.</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Ionicons name="location-outline" size={28} color="#1a1c1d" />
              <View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1c1d" }}>Great location</Text>
                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>100% of recent guests gave the location a 5-star rating.</Text>
              </View>
            </View>
          </View>

          {/* Padding for bottom bar */}
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* ── STICKY BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceRow}>
            <Text style={styles.bottomPrice}>{data.price} FCFA</Text>
            <Text style={{ fontSize: 13, color: "#1a1c1d" }}> /mois</Text>
          </Text>
          <Text style={styles.bottomSubInfo}>1 month min · Deposit required</Text>
          <Text style={styles.bottomCancellation}>✓ Verified Host</Text>
        </View>
        <View style={styles.bottomButtonsRow}>
          <Pressable onPress={() => setShowReserveModal(true)} style={({ pressed }) => [styles.reserveBtnOutline, pressed && { opacity: 0.8 }]}>
            <Text style={styles.reserveTextOutline}>Visit</Text>
          </Pressable>
          <Pressable onPress={handlePayNow} style={({ pressed }) => [styles.reserveBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.reserveText}>Payer</Text>
          </Pressable>
        </View>
      </View>
      {/* ── HOST DETAILS MODAL ── */}
      <Modal visible={showHostModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Standard iOS drag handle */}
            <View style={styles.dragHandle} />

            <Pressable onPress={() => setShowHostModal(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color="#1a1c1d" />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Profile Main Card */}
              <View style={styles.hostProfileCard}>
                <View style={styles.hostProfileCardLeft}>
                  <View style={styles.hostModalAvatarWrapper}>
                    <View style={styles.hostModalAvatar}>
                      <Ionicons name="person" size={40} color="#9ca3af" />
                    </View>
                    <View style={styles.hostModalSuperBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#fff" />
                    </View>
                  </View>
                  <Text style={styles.hostModalName}>{data.hostName}</Text>
                  <View style={styles.hostModalRoleRow}>
                    <Ionicons name="trophy" size={12} color="#6b7280" />
                    <Text style={styles.hostModalRole}>Superhost</Text>
                  </View>
                </View>

                <View style={styles.hostProfileCardRight}>
                  <View style={styles.hostStatItem}>
                    <Text style={styles.hostStatVal}>{data.reviews}</Text>
                    <Text style={styles.hostStatLabel}>Reviews</Text>
                  </View>
                  <View style={styles.hostStatDivider} />
                  <View style={styles.hostStatItem}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Text style={styles.hostStatVal}>{data.rating}</Text>
                      <Ionicons name="star" size={12} color="#1a1c1d" style={{ marginTop: 2 }} />
                    </View>
                    <Text style={styles.hostStatLabel}>Rating</Text>
                  </View>
                  <View style={styles.hostStatDivider} />
                  <View style={styles.hostStatItem}>
                    <Text style={styles.hostStatVal}>7</Text>
                    <Text style={styles.hostStatLabel}>Years hosting</Text>
                  </View>
                </View>
              </View>

              {/* Host Specific Traits */}
              <View style={styles.hostTraitsContainer}>
                <View style={styles.hostTrait}>
                  <Ionicons name="briefcase-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>My work: Teacher</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="musical-notes-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>Favorite song in high school: Alive</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="sparkles-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>What makes my home unique: Windows show sky, not another building</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="paw-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>Pets: Matilda Butters McKelvy</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="school-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>Where I went to school: Southern Methodist University</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="time-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>I spend too much time: On my phone</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="bulb-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>Fun fact: I don't like chocolate</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="chatbubbles-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>Speaks French, English</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="heart-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>I'm obsessed with: Music and Sports</Text>
                </View>
                <View style={styles.hostTrait}>
                  <Ionicons name="globe-outline" size={24} color="#1a1c1d" />
                  <Text style={styles.hostTraitText}>{data.hostLocation}</Text>
                </View>
              </View>

              {/* CONTACT BUTTON */}
              <Pressable 
                style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setShowHostModal(false);
                  router.push(`/chat/${fallbackId}`);
                }}
              >
                <Ionicons name="mail" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.contactBtnText}>Contact Host</Text>
              </Pressable>

              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── RESERVE / SCHEDULE MODAL ── */}
      <Modal visible={showReserveModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: H * 0.94 }]}>
            <Pressable onPress={() => setShowReserveModal(false)} style={styles.resCloseBtn}>
              <Ionicons name="close" size={24} color="#1a1c1d" />
            </Pressable>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resScroll}>
              <Text style={styles.resTitle}>Schedule your visit</Text>

              {/* Guest / Visitor count */}
              <View style={styles.resGuestRow}>
                <Text style={styles.resGuestLabel}>{guests} guest{guests > 1 && 's'}</Text>
                <View style={styles.resStepper}>
                  <Pressable onPress={() => setGuests(Math.max(1, guests - 1))} style={styles.resStepBtn}>
                    <Ionicons name="remove" size={20} color={guests > 1 ? "#1a1c1d" : "#d1d5db"} />
                  </Pressable>
                  <Text style={styles.resStepCount}>{guests}</Text>
                  <Pressable onPress={() => setGuests(guests + 1)} style={styles.resStepBtn}>
                    <Ionicons name="add" size={20} color="#1a1c1d" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.resDivider} />

              {/* Month calendar row */}
              <View style={styles.resMonthRow}>
                <Text style={styles.resMonthText}>{popupDateStr}</Text>
                <Pressable onPress={() => setShowCalendarPopup(true)}>
                  <Ionicons name="calendar-outline" size={24} color="#1a1c1d" />
                </Pressable>
              </View>

              {/* Days wrapper */}
              <View style={styles.resDaysRow}>
                {[
                  { l: "S", n: 31 }, { l: "M", n: 1 }, { l: "T", n: 2 },
                  { l: "W", n: 3 }, { l: "T", n: 4 }, { l: "F", n: 5 }, { l: "S", n: 6 }
                ].map((d, i) => {
                  const isActive = false; // Disable fake grid selection visual
                  return (
                    <View key={i} style={styles.resDayCol}>
                      <Text style={styles.resDayLabel}>{d.l}</Text>
                      {isActive ? (
                        <View style={styles.resDayActiveWrap}>
                          <BlurView intensity={80} tint="prominent" style={StyleSheet.absoluteFillObject} />
                          <View style={styles.resDayActiveColor} />
                          <Text style={styles.resDayNumActive}>{d.n}</Text>
                        </View>
                      ) : (
                        <Text style={styles.resDayNum}>{d.n}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.resDivider} />

              {/* Packages / Slots */}
              {/* Option 1 */}
              <View style={styles.resPackageBox}>
                <View style={styles.resPackageTop}>
                  <Image source={data.src} style={styles.resPackageImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resPackageTitle}>Short Physical Visit</Text>
                    <Text style={styles.resPackageSub}>Free · 30 min</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM"].map((time, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setSelectedTime(time)}
                      style={[
                        styles.resTimePill,
                        selectedTime === time && { borderColor: PRIMARY, backgroundColor: PRIMARY + "10" }
                      ]}
                    >
                      <Text style={[styles.resTimeText, selectedTime === time && { color: PRIMARY, fontWeight: "700" }]}>{time}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Option 2 */}
              <View style={styles.resPackageBox}>
                <View style={styles.resPackageTop}>
                  <Image source={data.src} style={styles.resPackageImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resPackageTitle}>Extended Visit (Area + Apt)</Text>
                    <Text style={styles.resPackageSub}>Guided · 1 hr 30 min</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {["8:00 AM", "10:00 AM", "1:00 PM"].map((time, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setSelectedTime(time)}
                      style={[
                        styles.resTimePill,
                        selectedTime === time && { borderColor: PRIMARY, backgroundColor: PRIMARY + "10" }
                      ]}
                    >
                      <Text style={[styles.resTimeText, selectedTime === time && { color: PRIMARY, fontWeight: "700" }]}>{time}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.resBottomSticky}>
              <Pressable style={styles.resBottomBtn} onPress={handleConfirmReservation}>
                <Text style={styles.resBottomBtnText}>Confirm reservation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Mock Calendar Popup ── */}
      <Modal visible={showCalendarPopup} animationType="fade" transparent={true}>
        <View style={[styles.modalOverlay, { justifyContent: "center", alignItems: "center" }]}>
          <View style={styles.mockCalendarBox}>
            <Calendar
              current={popupDateStr}
              onDayPress={(day: any) => {
                setPopupDateStr(day.dateString);
              }}
              markedDates={{
                [popupDateStr]: { selected: true, selectedColor: PRIMARY }
              }}
              theme={{
                todayTextColor: PRIMARY,
                arrowColor: PRIMARY,
                textMonthFontWeight: 'bold',
              }}
              style={{ width: W * 0.8, borderRadius: 12 }}
            />
            
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%", paddingHorizontal: 12 }}>
              <Pressable onPress={() => setShowCalendarPopup(false)} style={[styles.mockCalendarBtn, { backgroundColor: "#f3f4f6" }]}>
                <Text style={[styles.resBottomBtnText, { color: "#1a1c1d" }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { setShowCalendarPopup(false); }} style={styles.mockCalendarBtn}>
                <Text style={styles.resBottomBtnText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerBg: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: "#fff",
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  topActions: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 20,
  },
  circleBtnContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
  },
  circleBtnBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  circleBtnInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImgWrapper: {
    width: "100%",
    height: H * 0.45,
    backgroundColor: "#e5e7eb",
  },
  heroImgGradient: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  photoCountBadge: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoCountText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  sheetLayout: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 32,
    minHeight: H * 0.6,
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#1a1c1d",
    lineHeight: 33,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: "#1a1c1d", fontWeight: "500", marginTop: 4 },
  details: { fontSize: 15, color: "#6b7280", marginTop: 2 },
  
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 12,
  },
  ratingBox: { alignItems: "center", width: 80 },
  ratingScore: { fontSize: 18, fontWeight: "800", color: "#1a1c1d" },
  stars: { flexDirection: "row", marginTop: 4, gap: 1 },
  reviewLabel: { fontSize: 12, fontWeight: "600", color: "#1a1c1d", marginTop: 4, textDecorationLine: "underline" },
  dividerV: { width: 1, height: 35, backgroundColor: "rgba(0,0,0,0.08)" },
  guestFavoriteBox: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" },
  guestFavoriteText: { fontSize: 14, fontWeight: "800", color: "#1a1c1d", textAlign: "center", lineHeight: 16 },

  dividerH: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 24 },

  hostRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  superhostBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: PRIMARY,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  hostInfo: { flex: 1 },
  hostName: { fontSize: 16, fontWeight: "700", color: "#1a1c1d" },
  hostExp: { fontSize: 14, color: "#6b7280", marginTop: 2 },

  rareFindBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  rareFindText: { fontSize: 15, fontWeight: "600", color: "#1a1c1d", flex: 1 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  bottomPriceRow: { marginBottom: 2 },
  bottomPrice: { fontSize: 16, fontWeight: "700", color: "#1a1c1d" },
  bottomSubInfo: { fontSize: 13, color: "#1a1c1d", textDecorationLine: "underline" },
  bottomCancellation: { fontSize: 13, fontWeight: "600", color: "#1a1c1d", marginTop: 4 },
  reserveBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  reserveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  bottomButtonsRow: { flexDirection: "row", gap: 12 },
  reserveBtnOutline: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: "#1a1c1d",
  },
  reserveTextOutline: { color: "#1a1c1d", fontSize: 16, fontWeight: "700" },

  // Host Details Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F3F3F5",
    height: H * 0.9,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 24,
    left: 24,
    zIndex: 10,
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  hostProfileCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 32,
  },
  hostProfileCardLeft: {
    flex: 1,
    alignItems: "center",
    paddingRight: 16,
  },
  hostModalAvatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  hostModalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  hostModalSuperBadge: {
    position: "absolute",
    bottom: 0,
    right: -5,
    backgroundColor: PRIMARY,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  hostModalName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1c1d",
  },
  hostModalRoleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  hostModalRole: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  hostProfileCardRight: {
    flex: 1,
    paddingLeft: 16,
    gap: 12,
  },
  hostStatItem: {
    alignItems: "flex-start",
  },
  hostStatVal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1c1d",
    letterSpacing: -0.5,
  },
  hostStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1a1c1d",
    marginTop: 2,
  },
  hostStatDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    width: "100%",
  },
  hostTraitsContainer: {
    gap: 20,
    paddingHorizontal: 8,
  },
  hostTrait: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  hostTraitText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#1a1c1d",
    lineHeight: 22,
    marginTop: 2,
  },
  contactBtn: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 9999,
    marginTop: 20,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  contactBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  
  // Reserve Modal Specific UI
  resCloseBtn: {
    position: "absolute",
    top: 24,
    right: 24,
    zIndex: 10,
  },
  resScroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  resTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1c1d",
    letterSpacing: -0.5,
    marginBottom: 36,
  },
  resGuestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resGuestLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1c1d",
  },
  resStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  resStepBtn: {
    padding: 4,
  },
  resStepCount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1c1d",
    width: 20,
    textAlign: "center",
  },
  resDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    width: "100%",
    marginVertical: 24,
  },
  resMonthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  resMonthText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1c1d",
  },
  resDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  resDayCol: {
    alignItems: "center",
    gap: 14,
    width: 44,
  },
  resDayLabel: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },
  resDayNum: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1c1d",
    height: 44,
    lineHeight: 44,
    textAlign: "center",
  },
  resDayActiveWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  resDayActiveColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PRIMARY,
    opacity: 0.85,
  },
  resDayNumActive: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    zIndex: 2,
  },
  resPackageBox: {
    marginBottom: 32,
  },
  resPackageTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  resPackageImg: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  resPackageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1c1d",
  },
  resPackageSub: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  resTimePill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
  },
  resTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1c1d",
  },
  resBottomSticky: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  resBottomBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  resBottomBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  mockCalendarBox: {
    backgroundColor: "#fff",
    width: W * 0.9,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  mockCalendarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1c1d",
    marginBottom: 20,
  },
  gridDaysHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gridDayHeaderText: {
    width: "14%",
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: 14,
  },
  gridDaysBody: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  gridDayEmpty: {
    width: "14%",
    height: 40,
  },
  gridDayCell: {
    width: "14%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  gridDayActive: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
  },
  gridDayText: {
    color: "#1a1c1d",
    fontSize: 16,
    fontWeight: "500",
  },
  gridDayTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  mockCalendarBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    flex: 1,
  },
});
