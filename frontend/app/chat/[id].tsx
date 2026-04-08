import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { width: W, height: H } = Dimensions.get("window");

// Snapchat-like modern chat config
const PRIMARY = "#7C3AED";
const SNAP_BG = "#F8FAFC"; // ultra minimal
const SENDER_BUBBLE = "#7C3AED"; // Violet
const RECEIVER_BUBBLE = "#E2E8F0";

const INITIAL_MESSAGES = [
  { id: "m1", text: "Bonjour, je suis très intéressé par le studio.", sender: "me", time: "10:20" },
  { id: "m2", text: "Salut ! C'est toujours disponible. Tu as des questions ?", sender: "them", time: "10:21" },
  { id: "m3", text: "Super ! Est-ce que les charges sont incluses ?", sender: "me", time: "10:25" },
];

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: input, sender: "me", time: "Maintenant" }
    ]);
    setInput("");
  };

  return (
    <View style={styles.container}>
      {/* HEADER GLASS */}
      <BlurView intensity={90} tint="light" style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#1a1c1d" />
          </Pressable>
          <View style={styles.headerProfile}>
            <View style={styles.avatar}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>SD</Text>
            </View>
            <View>
              <Text style={styles.headerName}>Bailleur</Text>
              <Text style={styles.headerStatus}>En ligne</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Ionicons name="call" size={24} color="#1a1c1d" />
            <Ionicons name="videocam" size={24} color="#1a1c1d" />
          </View>
        </View>
      </BlurView>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, gap: 12 }}>
            {messages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <View key={msg.id} style={[styles.msgRow, isMe ? styles.msgMe : styles.msgThem]}>
                  {!isMe && (
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>B</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.msgText, isMe ? { color: "#fff" } : { color: "#1a1c1d" }]}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>

        {/* INPUT BAR (Snapchat style action icons) */}
        <BlurView intensity={100} tint="prominent" style={styles.inputBar}>
          <Image source={require("../../assets/Pack-icone/5074065.png")} style={{ width: 28, height: 28, tintColor: "#9ca3af" }} />
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Envoyer un Chat"
              placeholderTextColor="#9ca3af"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
            />
            <Ionicons name="mic" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
          </View>
          <Pressable onPress={sendMessage}>
            <Ionicons name="send" size={24} color={input.length > 0 ? PRIMARY : "#9ca3af"} />
          </Pressable>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SNAP_BG },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: { padding: 4, marginLeft: -8 },
  headerProfile: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginLeft: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: "center", alignItems: "center",
  },
  headerName: { fontSize: 18, fontWeight: "700", color: "#1a1c1d" },
  headerStatus: { fontSize: 12, color: PRIMARY, fontWeight: "600" },
  
  scrollContent: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 20 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8 },
  msgMe: { justifyContent: "flex-end" },
  msgThem: { justifyContent: "flex-start", gap: 8 },
  
  avatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#d1d5db",
    justifyContent: "center", alignItems: "center",
  },
  avatarSmallText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  
  bubble: {
    maxWidth: W * 0.7,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bubbleMe: {
    backgroundColor: SENDER_BUBBLE,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 4, // snapchat style pointy corner
  },
  bubbleThem: {
    backgroundColor: RECEIVER_BUBBLE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 15, lineHeight: 20 },
  
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#1a1c1d",
  },
});
