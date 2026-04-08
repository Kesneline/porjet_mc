import React, { useState, useRef, useCallback, useEffect } from "react";
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
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import Input from "@/components/ui/Input";

const { width, height } = Dimensions.get("window");

const PRIMARY = "#7c4dff";
const ON_SURFACE = "#1a1c1d";
const ON_SURFACE_VARIANT = "#6b6b70";
const SURFACE_CONTAINER_LOW = "#f3f3f5";
const OUTLINE_VARIANT = "#c4c4c9";

type RegisterMethod = "email" | "phone" | null;
type Step = 1 | 2 | 3 | 4 | 5 | 6;

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ar", label: "العربية", flag: "🇲🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

const HOUSING_TYPES = [
  { id: "studio", label: "Studio", icon: "bed-outline" as const, desc: "Compact & independent space" },
  { id: "chambre", label: "Room", icon: "home-outline" as const, desc: "Shared co-living room" },
  { id: "appartement", label: "Apartment", icon: "business-outline" as const, desc: "Full apartment" },
  { id: "villa", label: "Villa", icon: "umbrella-outline" as const, desc: "House or villa" },
];

const BUDGETS = [
  { id: "non_meuble", label: "Unfurnished", ranges: ["< 30,000 FCFA", "30,000 – 60,000", "60,000 – 100,000", "> 100,000"] },
  { id: "semi_meuble", label: "Semi-furnished", ranges: ["< 50,000 FCFA", "50,000 – 90,000", "90,000 – 150,000", "> 150,000"] },
  { id: "meuble", label: "Fully furnished", ranges: ["< 80,000 FCFA", "80,000 – 130,000", "130,000 – 200,000", "> 200,000"] },
];

interface Option {
  value: string;
  label: string;
}

const REGIONS: Option[] = [
  { value: "centre", label: "Centre" },
  { value: "littoral", label: "Littoral" },
  { value: "sud", label: "South" },
  { value: "est", label: "East" },
  { value: "ouest", label: "West" },
  { value: "nord_ouest", label: "North-West" },
  { value: "sud_ouest", label: "South-West" },
  { value: "adamaoua", label: "Adamaoua" },
  { value: "nord", label: "North" },
  { value: "extreme_nord", label: "Far-North" },
];

const CITIES_MAP: Record<string, Option[]> = {
  centre: [
    { value: "yaounde", label: "Yaoundé" },
    { value: "mbalmayo", label: "Mbalmayo" },
    { value: "obala", label: "Obala" },
    { value: "eseka", label: "Eseka" },
    { value: "akonolinga", label: "Akonolinga" },
    { value: "ntui", label: "Ntui" },
    { value: "bafia", label: "Bafia" },
    { value: "soa", label: "Soa" },
    { value: "nkoteng", label: "Nkoteng" },
    { value: "mbandjock", label: "Mbandjock" },
    { value: "autre", label: "Other city" },
  ],
  littoral: [
    { value: "douala", label: "Douala" },
    { value: "edea", label: "Edéa" },
    { value: "nkongsamba", label: "Nkongsamba" },
    { value: "loum", label: "Loum" },
    { value: "manjo", label: "Manjo" },
    { value: "mbanga", label: "Mbanga" },
    { value: "dibombari", label: "Dibombari" },
    { value: "yabassi", label: "Yabassi" },
    { value: "penja", label: "Penja" },
    { value: "melong", label: "Mélong" },
    { value: "autre", label: "Other city" },
  ],
  sud: [
    { value: "ebolowa", label: "Ebolowa" },
    { value: "kribi", label: "Kribi" },
    { value: "sangmelima", label: "Sangmélima" },
    { value: "ambam", label: "Ambam" },
    { value: "campo", label: "Campo" },
    { value: "lolodorf", label: "Lolodorf" },
    { value: "djoum", label: "Djoum" },
    { value: "mintom", label: "Mintom" },
    { value: "akom_ii", label: "Akom II" },
    { value: "bipindi", label: "Bipindi" },
    { value: "autre", label: "Other city" },
  ],
  est: [
    { value: "bertoua", label: "Bertoua" },
    { value: "yokadouma", label: "Yokadouma" },
    { value: "batouri", label: "Batouri" },
    { value: "abong_mbang", label: "Abong-Mbang" },
    { value: "doume", label: "Doumé" },
    { value: "mindourou", label: "Mindourou" },
    { value: "gendema", label: "Gendema" },
    { value: "lomie", label: "Lomié" },
    { value: "dimako", label: "Dimako" },
    { value: "belabo", label: "Bélabo" },
    { value: "autre", label: "Other city" },
  ],
  ouest: [
    { value: "bafoussam", label: "Bafoussam" },
    { value: "mbouda", label: "Mbouda" },
    { value: "dschang", label: "Dschang" },
    { value: "bandjoun", label: "Bandjoun" },
    { value: "foumban", label: "Foumban" },
    { value: "foumbot", label: "Foumbot" },
    { value: "bangangte", label: "Bangangté" },
    { value: "bafang", label: "Bafang" },
    { value: "santchou", label: "Santchou" },
    { value: "bazou", label: "Bazou" },
    { value: "autre", label: "Other city" },
  ],
  nord_ouest: [
    { value: "bamenda", label: "Bamenda" },
    { value: "kumbo", label: "Kumbo" },
    { value: "wum", label: "Wum" },
    { value: "ndop", label: "Ndop" },
    { value: "nkambe", label: "Nkambe" },
    { value: "bali", label: "Bali" },
    { value: "fundong", label: "Fundong" },
    { value: "mbengwi", label: "Mbengwi" },
    { value: "batibo", label: "Batibo" },
    { value: "bafut", label: "Bafut" },
    { value: "autre", label: "Other city" },
  ],
  sud_ouest: [
    { value: "buea", label: "Buea" },
    { value: "limbe", label: "Limbé" },
    { value: "kumba", label: "Kumba" },
    { value: "mamfe", label: "Mamfé" },
    { value: "tiko", label: "Tiko" },
    { value: "mutengene", label: "Mutengene" },
    { value: "mundemba", label: "Mundemba" },
    { value: "tombel", label: "Tombel" },
    { value: "fontem", label: "Fontem" },
    { value: "idenau", label: "Idenau" },
    { value: "autre", label: "Other city" },
  ],
  adamaoua: [
    { value: "ngaoundere", label: "Ngaoundéré" },
    { value: "meiganga", label: "Meiganga" },
    { value: "tibati", label: "Tibati" },
    { value: "banyo", label: "Banyo" },
    { value: "tignere", label: "Tignère" },
    { value: "ngaoundal", label: "Ngaoundal" },
    { value: "dir", label: "Dir" },
    { value: "kontcha", label: "Kontcha" },
    { value: "martap", label: "Martap" },
    { value: "belel", label: "Belel" },
    { value: "autre", label: "Other city" },
  ],
  nord: [
    { value: "garoua", label: "Garoua" },
    { value: "guider", label: "Guider" },
    { value: "figuil", label: "Figuil" },
    { value: "pitoa", label: "Pitoa" },
    { value: "poli", label: "Poli" },
    { value: "tchollire", label: "Tcholliré" },
    { value: "lagdo", label: "Lagdo" },
    { value: "bibemi", label: "Bibémi" },
    { value: "touroua", label: "Touroua" },
    { value: "dembo", label: "Dembo" },
    { value: "autre", label: "Other city" },
  ],
  extreme_nord: [
    { value: "maroua", label: "Maroua" },
    { value: "kousseri", label: "Kousseri" },
    { value: "mokolo", label: "Mokolo" },
    { value: "mora", label: "Mora" },
    { value: "yagoua", label: "Yagoua" },
    { value: "kaele", label: "Kaélé" },
    { value: "guidiguis", label: "Guidiguis" },
    { value: "maga", label: "Maga" },
    { value: "waza", label: "Waza" },
    { value: "kolofata", label: "Kolofata" },
    { value: "autre", label: "Other city" },
  ],
};

const UNIVERSITIES_MAP: Record<string, Option[]> = {
  yaounde: [
    { value: "uy1", label: "Université de Yaoundé I" },
    { value: "uy2", label: "Université de Yaoundé II" },
    { value: "esstic", label: "ESSTIC" },
    { value: "enas", label: "ENAS" },
    { value: "ens", label: "ENS Yaoundé" },
    { value: "polytech", label: "Polytechnique Yaoundé" },
    { value: "ista", label: "ISTA Yaoundé" },
    { value: "iuc", label: "IUC" },
    { value: "autre", label: "Other university" },
  ],
  douala: [
    { value: "udla", label: "Université de Douala" },
    { value: "iut", label: "IUT Douala" },
    { value: "enspd", label: "ENSPD" },
    { value: "ispm", label: "ISPM Douala" },
    { value: "hgp", label: "HGP Douala" },
    { value: "essec", label: "ESSEC Douala" },
    { value: "ihec", label: "IHEC Douala" },
    { value: "autre", label: "Other university" },
  ],
  bafoussam: [
    { value: "ub", label: "Université de Bafoussam" },
    { value: "ens_baf", label: "ENS Bafoussam" },
    { value: "autre", label: "Other university" },
  ],
  dschang: [
    { value: "uds", label: "Université de Dschang" },
    { value: "ensa", label: "ENSA Dschang" },
    { value: "autre", label: "Other university" },
  ],
  bamenda: [
    { value: "ubd", label: "University of Bamenda" },
    { value: "ens_bam", label: "ENS Bamenda" },
    { value: "autre", label: "Other university" },
  ],
  buea: [
    { value: "ubuea", label: "University of Buea" },
    { value: "ens_buea", label: "ENS Buea" },
    { value: "autre", label: "Other university" },
  ],
  bertoua: [
    { value: "ubert", label: "Université de Bertoua" },
    { value: "autre", label: "Other university" },
  ],
  ebolowa: [
    { value: "ueb", label: "Université d'Ebolowa" },
    { value: "autre", label: "Other university" },
  ],
  garoua: [
    { value: "ugar", label: "Université de Garoua" },
    { value: "autre", label: "Other university" },
  ],
  maroua: [
    { value: "uma", label: "Université de Maroua" },
    { value: "ens_mar", label: "ENS Maroua" },
    { value: "autre", label: "Other university" },
  ],
  ngaoundere: [
    { value: "un", label: "Université de Ngaoundéré" },
    { value: "ens_ndr", label: "ENS Ngaoundéré" },
    { value: "autre", label: "Other university" },
  ],
  autre: [{ value: "other", label: "Other university" }],
};

const getDefaultUniversities = (cityValue: string): Option[] => {
  return UNIVERSITIES_MAP[cityValue] || [{ value: "other", label: "Other university" }];
};

interface DrawerProps {
  visible: boolean;
  title: string;
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function BottomDrawer({ visible, title, options, selectedValue, onSelect, onClose }: DrawerProps) {
  const [search, setSearch] = useState("");
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setSearch("");
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleSelect = (value: string) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onSelect(value));
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={drawerStyles.overlay}>
        <Animated.View style={[drawerStyles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[drawerStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={drawerStyles.handle} />

          <View style={drawerStyles.header}>
            <Text style={drawerStyles.title}>{title}</Text>
            <Pressable onPress={handleClose} style={drawerStyles.closeButton}>
              <Ionicons name="close" size={20} color={ON_SURFACE_VARIANT} />
            </Pressable>
          </View>

          <View style={drawerStyles.searchContainer}>
            <Ionicons name="search" size={18} color={ON_SURFACE_VARIANT} />
            <TextInput
              style={drawerStyles.searchInput}
              placeholder="Search..."
              placeholderTextColor={ON_SURFACE_VARIANT}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={ON_SURFACE_VARIANT} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            style={drawerStyles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selectedValue === item.value;
              return (
                <Pressable
                  onPress={() => handleSelect(item.value)}
                  style={({ pressed }) => [
                    drawerStyles.item,
                    isSelected && drawerStyles.itemSelected,
                    pressed && drawerStyles.itemPressed,
                  ]}
                >
                  <Text style={[drawerStyles.itemText, isSelected && drawerStyles.itemTextSelected]}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={drawerStyles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={drawerStyles.empty}>
                <Ionicons name="search-outline" size={32} color={OUTLINE_VARIANT} />
                <Text style={drawerStyles.emptyText}>No results found</Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.65,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: OUTLINE_VARIANT,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: ON_SURFACE,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SURFACE_CONTAINER_LOW,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE_CONTAINER_LOW,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ON_SURFACE,
    padding: 0,
    borderWidth: 0,
    outlineStyle: "none" as any,
  },
  list: {
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemSelected: {
    backgroundColor: "#F3F0FF",
  },
  itemPressed: {
    backgroundColor: SURFACE_CONTAINER_LOW,
  },
  itemText: {
    fontSize: 15,
    fontWeight: "500",
    color: ON_SURFACE,
  },
  itemTextSelected: {
    color: PRIMARY,
    fontWeight: "600",
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
  },
});

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<RegisterMethod>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedVille, setSelectedVille] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  // Method drawer (step 1)
  const [showMethodDrawer, setShowMethodDrawer] = useState(false);
  const methodDrawerAnim = useRef(new Animated.Value(height)).current;
  const methodBackdropAnim = useRef(new Animated.Value(0)).current;

  // Welcome drawer (after step 6)
  const [showWelcomeDrawer, setShowWelcomeDrawer] = useState(false);
  const welcomeDrawerAnim = useRef(new Animated.Value(height)).current;
  const welcomeBackdropAnim = useRef(new Animated.Value(0)).current;
  const [selectedLang, setSelectedLang] = useState("fr");
  const [selectedHousing, setSelectedHousing] = useState<string | null>(null);
  const [selectedBudgetType, setSelectedBudgetType] = useState("non_meuble");
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string | null>(null);
  const langScrollRef = useRef<ScrollView>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Auto-open method drawer on mount
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

  const openWelcomeDrawer = () => {
    setShowWelcomeDrawer(true);
    Animated.parallel([
      Animated.spring(welcomeDrawerAnim, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
      Animated.timing(welcomeBackdropAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const closeWelcomeDrawer = () => {
    Animated.parallel([
      Animated.timing(welcomeDrawerAnim, { toValue: height, duration: 300, useNativeDriver: true }),
      Animated.timing(welcomeBackdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => { setShowWelcomeDrawer(false); router.replace("/(tabs)"); });
  };

  const nameForm = useForm<{ fullName: string }>({ defaultValues: { fullName: "" } });
  const emailForm = useForm<{ email: string }>({ defaultValues: { email: "" } });
  const phoneForm = useForm<{ phone: string }>({ defaultValues: { phone: "" } });
  const passwordForm = useForm<{ password: string; confirmPassword: string }>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const animateToNext = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -width, duration: 350, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(width);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const animateToPrev = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: width, duration: 350, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(-width);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleMethodSelect = (selected: RegisterMethod) => {
    closeMethodDrawer(() => {
      setMethod(selected);
      animateToNext(() => setStep(2));
    });
  };

  const handleNameSubmit = () => nameForm.handleSubmit(() => animateToNext(() => setStep(3)))();
  const handleIdentitySubmit = () => {
    if (method === "email") {
      emailForm.handleSubmit(() => animateToNext(() => setStep(4)))();
    } else {
      phoneForm.handleSubmit(() => animateToNext(() => setStep(4)))();
    }
  };

  const handlePasswordSubmit = () => {
    passwordForm.handleSubmit((data) => {
      if (data.password !== data.confirmPassword) return;
      animateToNext(() => setStep(5));
    })();
  };

  const handleLocationSubmit = () => {
    if (!selectedRegion || !selectedVille) return;
    animateToNext(() => setStep(6));
  };

  const handleUniversitySubmit = () => {
    if (!selectedUniversity) return;
    console.log("Register:", {
      method,
      name: nameForm.getValues().fullName,
      identity: method === "email" ? emailForm.getValues().email : phoneForm.getValues().phone,
      password: passwordForm.getValues().password,
      region: selectedRegion,
      ville: selectedVille,
      university: selectedUniversity,
    });
    // Show welcome drawer instead of navigating directly
    setTimeout(() => openWelcomeDrawer(), 200);
  };

  const handleBack = () => {
    if (step === 1) {
      // Re-open method drawer instead of going back
      openMethodDrawer();
    } else {
      animateToPrev(() => setStep((step - 1) as Step));
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Create your\naccount";
      case 2: return "What's your\nname?";
      case 3: return method === "email" ? "Your email\naddress?" : "Your phone\nnumber?";
      case 4: return "Secure your\naccount";
      case 5: return "Where are\nyou located?";
      case 6: return "Your\nuniversity?";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Choose how you want to register";
      case 2: return "Tell us how to call you";
      case 3: return method === "email" ? "We'll send a verification link" : "We'll send you an SMS code";
      case 4: return "Create a strong password";
      case 5: return "Select your region and city of residence";
      case 6: return "Select the university in your city";
    }
  };

  const cities = selectedRegion ? CITIES_MAP[selectedRegion] || [] : [];
  const universities = selectedVille ? getDefaultUniversities(selectedVille) : [];

  const getLabel = (list: Option[], value: string | null) => {
    if (!value) return null;
    return list.find((item) => item.value === value)?.label;
  };

  const renderField = (
    label: string,
    placeholder: string,
    value: string | null,
    options: Option[],
    drawerName: string,
    disabled: boolean = false
  ) => {
    const selectedLabel = value ? getLabel(options, value) : null;
    return (
      <View style={styles.fieldWrapper}>
        <Text style={[styles.fieldLabel, disabled && styles.fieldLabelDisabled]}>{label}</Text>
        <Pressable
          onPress={() => !disabled && setActiveDrawer(drawerName)}
          style={({ pressed }) => [
            styles.fieldButton,
            disabled && styles.fieldButtonDisabled,
            { opacity: pressed && !disabled ? 0.9 : 1 },
          ]}
          disabled={disabled}
        >
          <Text style={[styles.fieldText, !value && styles.fieldPlaceholder, disabled && styles.fieldTextDisabled]}>
            {selectedLabel || placeholder}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={disabled ? OUTLINE_VARIANT : ON_SURFACE_VARIANT} />
        </Pressable>
      </View>
    );
  };

  const currentBudgetObj = BUDGETS.find(b => b.id === selectedBudgetType);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
      </View>

      <View style={styles.header}>
        {/* Top back button removed as requested */}
      </View>

      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }], opacity: opacityAnim }]}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
        </View>

        {step === 1 && (
          <View style={styles.methodSection}>
            <Text style={styles.methodPlaceholderText}>Tap a method below to continue</Text>
          </View>
        )}

        {step === 2 && (
          <View style={styles.inputSection}>
            <Controller
              control={nameForm.control}
              name="fullName"
              rules={{ required: "Full name is required", minLength: { value: 2, message: "At least 2 characters" } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Full Name" placeholder="John Doe" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={nameForm.formState.errors.fullName?.message} autoCapitalize="words"
                  leftIcon={<Ionicons name="person-outline" size={20} color={ON_SURFACE_VARIANT} />} />
              )}
            />
            <View style={styles.buttonRow}>
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable onPress={handleNameSubmit} style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && method === "email" && (
          <View style={styles.inputSection}>
            <Controller
              control={emailForm.control}
              name="email"
              rules={{ required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Email Address" placeholder="your.email@university.edu" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={emailForm.formState.errors.email?.message} keyboardType="email-address" autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={ON_SURFACE_VARIANT} />} />
              )}
            />
            <View style={styles.buttonRow}>
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable onPress={handleIdentitySubmit} style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && method === "phone" && (
          <View style={styles.inputSection}>
            <Controller
              control={phoneForm.control}
              name="phone"
              rules={{ required: "Phone number is required", minLength: { value: 8, message: "Enter a valid phone number" } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Phone Number" placeholder="+237 6XX XXX XXX" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={phoneForm.formState.errors.phone?.message} keyboardType="phone-pad"
                  leftIcon={<Ionicons name="call-outline" size={20} color={ON_SURFACE_VARIANT} />} />
              )}
            />
            <View style={styles.buttonRow}>
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable onPress={handleIdentitySubmit} style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.inputSection}>
            <View style={styles.identityBadge}>
              <Ionicons name={method === "email" ? "mail-outline" : "call-outline"} size={18} color={PRIMARY} />
              <Text style={styles.identityText}>{method === "email" ? emailForm.getValues().email : phoneForm.getValues().phone}</Text>
              <Pressable onPress={() => animateToPrev(() => setStep(3))}>
                <Text style={styles.identityEdit}>Edit</Text>
              </Pressable>
            </View>
            <Controller
              control={passwordForm.control}
              name="password"
              rules={{ required: "Password is required", minLength: { value: 6, message: "At least 6 characters" } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Password" placeholder="Create a password" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={passwordForm.formState.errors.password?.message} secureTextEntry={!showPassword}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={ON_SURFACE_VARIANT} />}
                  rightIcon={<Pressable onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={ON_SURFACE_VARIANT} /></Pressable>} />
              )}
            />
            <Controller
              control={passwordForm.control}
              name="confirmPassword"
              rules={{ required: "Please confirm your password", validate: (val) => val === passwordForm.getValues().password || "Passwords don't match" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Confirm Password" placeholder="Confirm your password" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={passwordForm.formState.errors.confirmPassword?.message} secureTextEntry={!showConfirm}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={ON_SURFACE_VARIANT} />}
                  rightIcon={<Pressable onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={ON_SURFACE_VARIANT} /></Pressable>} />
              )}
            />
            <Text style={styles.termsText}>
              By signing up, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
            <View style={styles.buttonRow}>
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable onPress={handlePasswordSubmit} style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.locationSection}>
            {renderField("Region", "Select a region", selectedRegion, REGIONS, "region")}
            {renderField("City", "Select a city", selectedVille, cities, "city", !selectedRegion)}
            <View style={styles.buttonRow}>
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable onPress={handleLocationSubmit}
                style={({ pressed }) => [styles.primaryButton, (!selectedRegion || !selectedVille) && styles.primaryButtonDisabled, { opacity: pressed && selectedRegion && selectedVille ? 0.85 : 1 }]}
                disabled={!selectedRegion || !selectedVille}>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {step === 6 && (
          <View style={styles.locationSection}>
            {renderField("University", "Select your university", selectedUniversity, universities, "university", !selectedVille)}
            <View style={styles.buttonRow}>
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="arrow-back" size={22} color={ON_SURFACE_VARIANT} />
              </Pressable>
              <Pressable onPress={handleUniversitySubmit}
                style={({ pressed }) => [styles.primaryButton, !selectedUniversity && styles.primaryButtonDisabled, { opacity: pressed && selectedUniversity ? 0.85 : 1 }]}
                disabled={!selectedUniversity}>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => router.replace("/login")} hitSlop={16}>
          <Text style={styles.footerLink}>Sign In</Text>
        </Pressable>
      </View>

      <BottomDrawer
        visible={activeDrawer === "region"}
        title="Select Region"
        options={REGIONS}
        selectedValue={selectedRegion}
        onSelect={(val) => { setSelectedRegion(val); setSelectedVille(null); setSelectedUniversity(null); }}
        onClose={() => setActiveDrawer(null)}
      />
      <BottomDrawer
        visible={activeDrawer === "city"}
        title="Select City"
        options={cities}
        selectedValue={selectedVille}
        onSelect={(val) => { setSelectedVille(val); setSelectedUniversity(null); }}
        onClose={() => setActiveDrawer(null)}
      />
      <BottomDrawer
        visible={activeDrawer === "university"}
        title="Select University"
        options={universities}
        selectedValue={selectedUniversity}
        onSelect={(val) => { setSelectedUniversity(val); }}
        onClose={() => setActiveDrawer(null)}
      />

      {/* ── METHOD DRAWER (auto-open on step 1) ── */}
      <Modal visible={showMethodDrawer} transparent animationType="none" statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: methodBackdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMethodDrawer(() => router.back())} />
          </Animated.View>
          <Animated.View style={[styles.methodDrawer, { transform: [{ translateY: methodDrawerAnim }] }]}>
            <View style={styles.drawerPill} />
            {/* Back button */}
            <Pressable onPress={() => closeMethodDrawer(() => router.back())} hitSlop={12}
              style={styles.methodDrawerBack}>
              <Ionicons name="arrow-back" size={20} color={ON_SURFACE_VARIANT} />
              <Text style={styles.methodDrawerBackText}>Back</Text>
            </Pressable>
            <Text style={styles.methodDrawerTitle}>Create your account</Text>
            <Text style={styles.methodDrawerSub}>Choose your registration method</Text>
            <Pressable onPress={() => handleMethodSelect("email")}
              style={({ pressed }) => [styles.methodDrawerCard, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <View style={styles.methodDrawerIconWrap}>
                <Ionicons name="mail-outline" size={22} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodDrawerCardTitle}>Email Address</Text>
                <Text style={styles.methodDrawerCardSub}>Register with your email</Text>
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
                <Text style={styles.methodDrawerCardSub}>Register with your mobile number</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={ON_SURFACE_VARIANT} />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* ── WELCOME DRAWER (after step 6) ── */}
      <Modal visible={showWelcomeDrawer} transparent animationType="none" statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: welcomeBackdropAnim }]} />
          <Animated.View style={[styles.welcomeDrawer, { transform: [{ translateY: welcomeDrawerAnim }] }]}>
            <View style={styles.drawerPill} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Header */}
              <View style={styles.welcomeHeader}>
                <Text style={styles.welcomeTitle}>Welcome aboard!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Your account is ready. Personalize your experience.
                </Text>
              </View>

              {/* Language swipe */}
              <Text style={styles.sectionLabel}>Preferred Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.langScrollContent}>
                {LANGUAGES.map(lang => (
                  <Pressable key={lang.code} onPress={() => setSelectedLang(lang.code)}
                    style={[styles.langChip, selectedLang === lang.code && styles.langChipActive]}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langLabel, selectedLang === lang.code && styles.langLabelActive]}>
                      {lang.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Housing type */}
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Housing Type</Text>
              <View style={styles.housingGrid}>
                {HOUSING_TYPES.map(h => (
                  <Pressable key={h.id} onPress={() => setSelectedHousing(h.id)}
                    style={[styles.housingCard, selectedHousing === h.id && styles.housingCardActive]}>
                    <Ionicons name={h.icon} size={26}
                      color={selectedHousing === h.id ? "#ffffff" : PRIMARY} />
                    <Text style={[styles.housingLabel, selectedHousing === h.id && styles.housingLabelActive]}>
                      {h.label}
                    </Text>
                    <Text style={[styles.housingDesc, selectedHousing === h.id && styles.housingDescActive]}>
                      {h.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Budget */}
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Monthly Budget (FCFA)</Text>
              {/* Furnishing tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.budgetTabsContent}>
                {BUDGETS.map(b => (
                  <Pressable key={b.id} onPress={() => { setSelectedBudgetType(b.id); setSelectedBudgetRange(null); }}
                    style={[styles.budgetTab, selectedBudgetType === b.id && styles.budgetTabActive]}>
                    <Text style={[styles.budgetTabText, selectedBudgetType === b.id && styles.budgetTabTextActive]}>
                      {b.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.budgetRanges}>
                {currentBudgetObj?.ranges.map(r => (
                  <Pressable key={r} onPress={() => setSelectedBudgetRange(r)}
                    style={[styles.budgetRange, selectedBudgetRange === r && styles.budgetRangeActive]}>
                    <Text style={[styles.budgetRangeText, selectedBudgetRange === r && styles.budgetRangeTextActive]}>
                      {r}
                    </Text>
                    {selectedBudgetRange === r && (
                      <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* CTA */}
              <Pressable onPress={closeWelcomeDrawer}
                style={({ pressed }) => [styles.welcomeCTA, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <Text style={styles.welcomeCTAText}>Start Exploring</Text>
              </Pressable>
            </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  topBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SURFACE_CONTAINER_LOW,
    justifyContent: "center",
    alignItems: "center",
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
    opacity: 0.5,
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
  // Method drawer styles
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
  // Welcome drawer styles
  welcomeDrawer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: height * 0.85,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
  },
  welcomeHeader: {
    alignItems: "center",
    paddingVertical: 24,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: ON_SURFACE,
    fontFamily: "SpaceMono",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: ON_SURFACE,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  // Language
  langScrollContent: {
    gap: 10,
    paddingRight: 8,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 40,
    backgroundColor: SURFACE_CONTAINER_LOW,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  langChipActive: {
    backgroundColor: "#F3F0FF",
    borderColor: PRIMARY,
  },
  langFlag: {
    fontSize: 18,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ON_SURFACE_VARIANT,
  },
  langLabelActive: {
    color: PRIMARY,
  },
  // Housing
  housingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  housingCard: {
    width: (width - 48 - 10) / 2,
    backgroundColor: SURFACE_CONTAINER_LOW,
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  housingCardActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  housingLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: ON_SURFACE,
  },
  housingLabelActive: {
    color: "#ffffff",
  },
  housingDesc: {
    fontSize: 12,
    color: ON_SURFACE_VARIANT,
    lineHeight: 17,
  },
  housingDescActive: {
    color: "rgba(255,255,255,0.8)",
  },
  // Budget
  budgetTabsContent: {
    gap: 8,
    paddingRight: 8,
    marginBottom: 12,
  },
  budgetTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 40,
    backgroundColor: SURFACE_CONTAINER_LOW,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  budgetTabActive: {
    backgroundColor: "#F3F0FF",
    borderColor: PRIMARY,
  },
  budgetTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: ON_SURFACE_VARIANT,
  },
  budgetTabTextActive: {
    color: PRIMARY,
  },
  budgetRanges: {
    gap: 8,
  },
  budgetRange: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE_CONTAINER_LOW,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  budgetRangeActive: {
    backgroundColor: "#F3F0FF",
    borderColor: PRIMARY,
  },
  budgetRangeText: {
    fontSize: 15,
    fontWeight: "500",
    color: ON_SURFACE,
  },
  budgetRangeTextActive: {
    color: PRIMARY,
    fontWeight: "700",
  },
  // CTA
  welcomeCTA: {
    marginTop: 28,
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 9999,
    alignItems: "center",
  },
  welcomeCTAText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
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
  termsText: {
    fontSize: 13,
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  termsLink: {
    color: PRIMARY,
    fontWeight: "600",
  },
  locationSection: {
    flex: 1,
    gap: 16,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: ON_SURFACE_VARIANT,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldLabelDisabled: {
    opacity: 0.4,
  },
  fieldButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE_CONTAINER_LOW,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fieldButtonDisabled: {
    opacity: 0.5,
  },
  fieldText: {
    fontSize: 15,
    fontWeight: "500",
    color: ON_SURFACE,
    flex: 1,
  },
  fieldPlaceholder: {
    color: ON_SURFACE_VARIANT,
  },
  fieldTextDisabled: {
    color: OUTLINE_VARIANT,
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
  primaryButtonDisabled: {
    opacity: 0.3,
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
