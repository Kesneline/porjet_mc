import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { width: W, height: H } = Dimensions.get("window");
const PRIMARY = "#7C3AED";
const BG_COLOR = "#FCFCFF";

type PaymentMethod = "momo" | "om" | "card" | "paypal" | null;

export default function PaymentFlowScreen() {
  const router = useRouter();
  const { id, price, title } = useLocalSearchParams();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [method, setMethod] = useState<PaymentMethod>(null);

  // Form states
  const [senderName, setSenderName] = useState("");
  const [phone, setPhone] = useState("");

  // Loading animation state
  const [progress] = useState(new Animated.Value(0));
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const handleSelectMethod = (type: PaymentMethod) => {
    if (type === "card" || type === "paypal") {
      Alert.alert("Méthode indisponible", "Cette méthode n'est pas encore active dans votre région.");
      return;
    }
    setMethod(type);
    setStep(2);
  };

  const processPayment = () => {
    if (!senderName || !phone) {
      Alert.alert("Erreur", "Veuillez remplir toutes les informations recquieres.");
      return;
    }
    setStep(3);
    
    // Simulate payment loading via progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      // Logic for Success vs Failure
      // If phone starts with 999 fake a failure, otherwise success
      const successStatus = !phone.includes("0000");
      setIsSuccess(successStatus);
      setStep(4);
    });
  };

  const renderStep1 = () => (
    <View style={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backCircle}>
        <Ionicons name="chevron-back" size={24} color="#6b7280" />
      </Pressable>

      <Text style={styles.title}>Choose payment method:</Text>

      <View style={{ gap: 16 }}>
        {/* Mobile Money */}
        <Pressable style={styles.methodCard} onPress={() => handleSelectMethod("momo")}>
          <View style={[styles.methodIconBox, { backgroundColor: "#FFCC00" }]}>
            <Ionicons name="phone-portrait" size={20} color="#000" />
          </View>
          <Text style={styles.methodName}>MTN Mobile Money</Text>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
        </Pressable>

        {/* Orange Money */}
        <Pressable style={styles.methodCard} onPress={() => handleSelectMethod("om")}>
          <View style={[styles.methodIconBox, { backgroundColor: "#FF6600" }]}>
            <Ionicons name="phone-portrait" size={20} color="#fff" />
          </View>
          <Text style={styles.methodName}>Orange Money</Text>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
        </Pressable>

        {/* Credit Card */}
        <Pressable style={styles.methodCard} onPress={() => handleSelectMethod("card")}>
          <View style={[styles.methodIconBox, { backgroundColor: "#f3f4f6" }]}>
            <Ionicons name="card" size={20} color="#1a1c1d" />
          </View>
          <Text style={styles.methodName}>Credit Card</Text>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
        </Pressable>

        {/* PayPal */}
        <Pressable style={styles.methodCard} onPress={() => handleSelectMethod("paypal")}>
          <View style={[styles.methodIconBox, { backgroundColor: "#003087" }]}>
            <Ionicons name="logo-paypal" size={20} color="#fff" />
          </View>
          <Text style={styles.methodName}>PayPal</Text>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
        </Pressable>
      </View>

      <Text style={styles.subscriptionTerms}>
        Data securely handled via local merchants. Service strictly processed by verified StudHousing channels.
      </Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.content}>
      <Pressable onPress={() => setStep(1)} style={styles.backCircle}>
        <Ionicons name="chevron-back" size={24} color="#6b7280" />
      </Pressable>

      <Text style={styles.title}>Payment Details</Text>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={24} color="#1a1c1d" />
        <Text style={styles.infoBannerText}>You won't be charged until booking is verified.</Text>
      </View>

      <View style={styles.sectionForm}>
        <Text style={styles.sectionTitle}>Appartement: {title}</Text>
        <Text style={[styles.sectionTitle, { color: PRIMARY, fontSize: 20 }]}>Montant: {price || "N/A"}</Text>

        <Text style={styles.inputLabel}>Nom complet de l'émetteur</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Ex: Jean Dupont"
          value={senderName}
          onChangeText={setSenderName}
        />

        <Text style={styles.inputLabel}>Numéro de téléphone ({method === "momo" ? "MTN" : "Orange"})</Text>
        <View style={styles.phoneInputWrap}>
          <View style={styles.phonePrefix}>
            <Text style={styles.phonePrefixText}>+237</Text>
          </View>
          <TextInput
            style={[styles.inputField, { borderWidth: 0, paddingHorizontal: 0, flex: 1, backgroundColor: "transparent" }]}
            placeholder="6XX XX XX XX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

      </View>

      <Pressable style={styles.payBtn} onPress={processPayment}>
        <Text style={styles.payBtnText}>Confirmer le paiement</Text>
      </Pressable>
    </View>
  );

  const renderStep3 = () => {
    const width = progress.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"]
    });

    return (
      <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginBottom: 40 }} />
        <Text style={styles.loadingTitle}>Traitement en cours</Text>
        <Text style={styles.loadingSub}>Veuillez patienter pendant que nous communiquons avec l'opérateur...</Text>

        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width }]} />
        </View>
      </View>
    );
  };

  const renderStep4 = () => {
    if (isSuccess === true) {
      return (
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <View style={[styles.resultIconWrap, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="checkmark-sharp" size={40} color="#22C55E" />
            </View>
            <Text style={styles.resultTitle}>Paiement réussi</Text>
            <Text style={styles.resultAmt}>{price}</Text>

            <Pressable onPress={() => router.push("/(tabs)/reservations")} style={styles.resultBtn}>
              <Text style={styles.resultBtnText}>Fermer</Text>
            </Pressable>
            <Pressable style={styles.resultBtnAlt}>
              <Text style={styles.resultBtnAltText}>Voir la facture</Text>
            </Pressable>
          </View>
        </View>
      );
    } else {
      return (
        <View style={[styles.resultContainer, { backgroundColor: "#FEF2F2" }]}>
          <View style={styles.resultCard}>
            <View style={[styles.resultIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="cash-outline" size={40} color="#DC2626" />
            </View>
            <Text style={[styles.resultTitle, { color: "#DC2626" }]}>Solde insuffisant</Text>
            <Text style={styles.resultAmt}>Échec de la transaction</Text>

            <Pressable onPress={() => setStep(2)} style={[styles.resultBtn, { backgroundColor: "#DC2626" }]}>
              <Text style={styles.resultBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {step === 4 && isSuccess && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PRIMARY + "15" }]} />
      )}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
  },
  backCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: "800", color: "#1a1c1d", marginBottom: 30,
  },
  methodCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    padding: 16, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
  },
  methodIconBox: {
    width: 40, height: 40, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
    marginRight: 16,
  },
  methodName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1a1c1d" },
  subscriptionTerms: {
    marginTop: 60, fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 18,
  },
  
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F3F4F6", padding: 14, borderRadius: 12, marginBottom: 30,
  },
  infoBannerText: { fontSize: 14, color: "#1a1c1d", fontWeight: "500", flex: 1 },

  sectionForm: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1c1d", marginBottom: 6 },
  
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginTop: 24, marginBottom: 8 },
  inputField: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    paddingHorizontal: 16, height: 50, borderRadius: 12,
    fontSize: 15, color: "#1a1c1d",
  },
  phoneInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    height: 50, borderRadius: 12,
  },
  phonePrefix: {
    paddingHorizontal: 16, borderRightWidth: 1, borderRightColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
  },
  phonePrefixText: { fontSize: 15, fontWeight: "600", color: "#1a1c1d" },

  payBtn: {
    backgroundColor: PRIMARY,
    height: 56, borderRadius: 9999,
    justifyContent: "center", alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 40 : 20,
  },
  payBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loadingTitle: { fontSize: 20, fontWeight: "700", color: "#1a1c1d", marginBottom: 12 },
  loadingSub: { fontSize: 14, color: "#6b7280", textAlign: "center", paddingHorizontal: 20 },
  progressBarBg: {
    width: "80%", height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, marginTop: 40,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%", backgroundColor: PRIMARY,
  },

  resultContainer: {
    flex: 1,
    backgroundColor: PRIMARY,
    justifyContent: "flex-end",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 30, alignItems: "center",
    minHeight: H * 0.5,
  },
  resultIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  resultTitle: { fontSize: 18, color: "#6b7280", fontWeight: "600", marginBottom: 8 },
  resultAmt: { fontSize: 28, color: "#1a1c1d", fontWeight: "800", marginBottom: 40 },
  
  resultBtn: {
    width: "100%", backgroundColor: PRIMARY, height: 56, borderRadius: 9999,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  resultBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resultBtnAlt: {
    width: "100%", backgroundColor: "#F3F4F6", height: 56, borderRadius: 9999,
    justifyContent: "center", alignItems: "center",
  },
  resultBtnAltText: { color: PRIMARY, fontSize: 16, fontWeight: "700" },
});
