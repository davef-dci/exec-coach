// app/(tabs)/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
const coachThumbs = {
  Nia: require("../../assets/coaches/nia.jpg"),
  Raya: require("../../assets/coaches/raya.jpg"),
  Vera: require("../../assets/coaches/vera.jpg"),
  Lyra: require("../../assets/coaches/lyra.jpg"),
  Athena: require("../../assets/coaches/athena.jpg"),
  Kora: require("../../assets/coaches/kora.jpg"),
};


const profileData = require("../../assets/weiman_profile.json");
const KEY_LAST_EXPANDED = "execCoach:lastExpandedSkill";
const KEY_LAST_CHALLENGE = "execCoach:lastDailyChallenge";
// --- Remote Coach Endpoint (Vercel) ---
// --- Remote Coach Endpoint (Vercel) ---
// --- Remote Coach Endpoint (Vercel) ---
const ASK_COACH_URL = "/api/ask-coach";





// Types that reflect your KnowingMe JSON
type KeyTrait = { trait: string; description?: string };
type Caution = { area: string; description?: string };

type Profile = {
  name?: string;
  fullName?: string;
  coreTheme?: string;
  theme?: string;
  motivations?: string;
  abilities?: string;
  personality?: string;
  keyTraits?: KeyTrait[];
  leadershipAnchors?: string[];
  educationKeys?: string[];
  cautionAreas?: Caution[];
};

const textOr = (...vals: (string | undefined)[]) =>
  vals.find((v) => v && v.trim().length) ?? "";

const pickOne = <T,>(arr: T[] | undefined): T | null =>
  arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

// add param "formatMode"
async function askCoachRemote(
  question: string,
  profile: any,
  coachStyle: string,
  formatMode: "structured" | "free"
): Promise<string> {
  try {
    const resp = await fetch("/api/ask-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, profile, coachStyle, formatMode }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return `Error: ${resp.status} ${text}`;
    }
    const data = (await resp.json()) as { answer?: string };
    return data.answer ?? "No answer generated.";
  } catch (e: any) {
    return `Network error: ${e?.message || e}`;
  }
}



export default function HomeTab() {
  const profile = profileData as Profile;

  const displayName = textOr(profile.name, profile.fullName, "Unknown");
  const coreTheme = textOr(profile.coreTheme, profile.theme, "—");

  const traits: KeyTrait[] = useMemo(() => profile.keyTraits ?? [], [profile]);

  const [expandedSkill, setExpandedSkill] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const [dailyChallenge, setDailyChallenge] = useState<string | null>(null);

  const [askText, setAskText] = useState("");
const [askReply, setAskReply] = useState<string | null>(null);

type CoachStyleKey = "Nia" | "Raya" | "Vera" | "Lyra" | "Athena" | "Kora";

const COACH_STYLES: { key: CoachStyleKey; label: string }[] = [
  { key: "Nia", label: "Motivational" },
  { key: "Raya", label: "Supportive" },
  { key: "Vera", label: "Collaborative" },
  { key: "Lyra", label: "Strategic" },
  { key: "Athena", label: "Transformational" },
  { key: "Kora", label: "Directive" },
];

const [coachStyle, setCoachStyle] = useState<CoachStyleKey>("Vera"); // default




useEffect(() => {
  async function loadSaved() {
    try {
      const savedExpanded = await AsyncStorage.getItem("execCoach:lastExpandedSkill");
      const savedChallenge = await AsyncStorage.getItem("execCoach:lastDailyChallenge");
      const savedAskReply = await AsyncStorage.getItem("execCoach:lastAskReply"); // ✅ add

      if (savedExpanded) setExpandedSkill(JSON.parse(savedExpanded));
      if (savedChallenge) setDailyChallenge(JSON.parse(savedChallenge));
      if (savedAskReply) setAskReply(JSON.parse(savedAskReply)); // ✅ add
    } catch (err) {
      console.warn("Error loading saved data", err);
    }
  }
  loadSaved();
}, []);


// app/(tabs)/index.tsx

async function onAskCoach() {
  const q = askText.trim();
  if (!q) return;

  setAskReply("⏳ Thinking…");

  // If we already have a reply, treat this as a follow-up -> free mode
  const formatMode = askReply ? "free" : "structured";

  const answer = await askCoachRemote(q, profileData, coachStyle, formatMode);

  if (answer.startsWith("Error:") || answer.startsWith("Network error:")) {
    setAskReply("⚠️ Sorry — something went wrong connecting to the coach. Try again in a moment.");
  } else {
    setAskReply(answer);
    AsyncStorage.setItem("execCoach:lastAskReply", JSON.stringify(answer));
  }

  setAskText("");
}



//   function onExpandSkill() {
//   if (!traits.length) {
//     const fallback = {
//       title: "No traits found",
//       body:
//         "Your profile doesn’t include keyTraits yet. Add keyTraits[] with { trait, description } objects.",
//     };
//     setExpandedSkill(fallback);
//     // SAVE to storage
//     AsyncStorage.setItem("execCoach:lastExpandedSkill", JSON.stringify(fallback));
//     return;
//   }

//   const t = traits[Math.floor(Math.random() * traits.length)];
//   const next = {
//     title: t.trait,
//     body:
//       textOr(t.description) ||
//       `Consider where “${t.trait}” shows up in your week. Note one concrete behavior that demonstrates it.`,
//   };

//   setExpandedSkill(next);
//   // SAVE to storage
//   AsyncStorage.setItem("execCoach:lastExpandedSkill", JSON.stringify(next));
// }


//  function onChallengeOfDay() {
//   const anchors = profile.leadershipAnchors ?? [];
//   const edus = profile.educationKeys ?? [];
//   const cautions = profile.cautionAreas ?? [];

//   const pick = <T,>(arr: T[]) =>
//     arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;

//   const anchor = pick(anchors);
//   const edu = pick(edus);
//   const caution = pick(cautions);

//   let challenge =
//     (anchor &&
//       `Demonstrate “${anchor}” today: choose one decision or meeting and make a clear move that reflects it. Block 15 minutes to prep.`) ||
//     (edu &&
//       `Practice “${edu}”: identify one moment today to apply it intentionally. Write what you’ll do in 1 sentence and schedule it.`) ||
//     (caution &&
//       `Balance your caution area (“${(caution as any).area}”): define a small guardrail you’ll use in the next meeting, then reflect for 2 minutes after.`);

//   if (!challenge) {
//     const t = traits.length ? traits[Math.floor(Math.random() * traits.length)] : undefined;
//     challenge = t
//       ? `Apply “${t.trait}” on a live task: spend 15 minutes using it to move something forward, then capture one takeaway.`
//       : "Pick one small improvement you can ship before noon. Make it visible, even if rough.";
//   }





//   setDailyChallenge(challenge);
//   // SAVE to storage
//   AsyncStorage.setItem("execCoach:lastDailyChallenge", JSON.stringify(challenge));
// }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 36, fontWeight: "700" }}>
            Andrew Weiman's Virtual AI Executive Coach (MVP)
          </Text>
<Text style={{ fontSize: 16 }}>
  Here is your profile summary:
</Text>

          <Text style={{ fontSize: 16 }}>
            Core Theme: <Text style={{ fontWeight: "600" }}>{coreTheme}</Text>
          </Text>

          {/* (Optional) Show quick context */}
          {profile.motivations && (
            <Mini blabel="Motivations" text={profile.motivations} />
          )}
          {profile.abilities && <Mini blabel="Abilities" text={profile.abilities} />}
          {profile.personality && (
            <Mini blabel="Personality" text={profile.personality} />
          )}
        </View>



<Card title="Choose a Coach Style">
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
    {COACH_STYLES.map((s) => {
      const selected = coachStyle === s.key;
      return (
        <Pressable
          key={s.key}
          onPress={() => setCoachStyle(s.key)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: selected ? "#6366f1" : "#e5e7eb",
            backgroundColor: selected ? "#eef" : "#fff",
          }}
        >
<View style={{ alignItems: "center" }}>
  <Image
    source={coachThumbs[s.key]}
    style={{
      width: 64,
      height: 64,
      borderRadius: 12,
      borderWidth: selected ? 2 : 0,
      borderColor: selected ? "#6366f1" : "transparent",
    }}
    resizeMode="cover"
  />
  <Text style={{ fontWeight: "600", marginTop: 4 }}>
    {s.label}
  </Text>
</View>

        </Pressable>
      );
    })}
  </View>
  <Text style={{ opacity: 0.7, marginTop: 6 }}>
    Selected: <Text style={{ fontWeight: "700" }}>{coachStyle}</Text>
  </Text>
</Card>



        <Card title="Ask one of Andrew's Coaches a question! - v1.2">
<TextInput
  value={askText}
  onChangeText={setAskText}
  placeholder="Describe a challenge or decision…"
  multiline
  onKeyPress={(e) => {
    // On web/desktop: Enter submits; Shift+Enter makes a newline
    if (Platform.OS === "web" && e.nativeEvent.key === "Enter" && !e.shiftKey) {
      e.preventDefault?.();
      onAskCoach();
    }
  }}
  blurOnSubmit={false}
  style={{
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
  }}
/>

  <View style={{ height: 8 }} />
<ActionButton
  label="Get Advice"
  onPress={onAskCoach}
  disabled={!askText.trim()}
/>

<ActionButton
  label="Clear this discussion and start Fresh"
  onPress={async () => {
    await AsyncStorage.multiRemove([
      "execCoach:lastExpandedSkill",
      "execCoach:lastDailyChallenge",
      "execCoach:lastAskReply",
    ]);
    setExpandedSkill(null);
    setDailyChallenge(null);
    setAskReply(null);
  }}
/>


</Card>

{askReply && (
  <Card title="Coach Reply">
    <Text style={{ fontSize: 16, lineHeight: 22 }}>{askReply}</Text>
  </Card>
)}


        {expandedSkill && (
          <Card title={`Expanded: ${expandedSkill.title}`}>
            <Text style={{ fontSize: 16, lineHeight: 22 }}>{expandedSkill.body}</Text>
          </Card>
        )}

        {dailyChallenge && (
          <Card title="Today's Challenge">
            <Text style={{ fontSize: 16, lineHeight: 22 }}>{dailyChallenge}</Text>
          </Card>
        )}

        {!traits.length && (
          <Card title="Heads up">
            <Text style={{ fontSize: 16, lineHeight: 22 }}>
              Add a <Text style={{ fontWeight: "600" }}>keyTraits</Text> array like:
              {"\n\n"}
              {`"keyTraits": [
  { "trait": "Creative Problem Solving", "description": "..." },
  { "trait": "Strategic Curiosity", "description": "..." }
]`}
            </Text>



          </Card>
        )}


      </ScrollView>
    </SafeAreaView>

    
  );
}

function ActionButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={!disabled ? onPress : undefined}
      style={({ pressed }) => ({
        backgroundColor: disabled
          ? "#ddd"
          : pressed
          ? "#e9e9ff"
          : "#eef",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: disabled ? "#ccc" : "#c9ccff",
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          textAlign: "center",
          fontSize: 16,
          fontWeight: "600",
          color: disabled ? "#777" : "#000",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}


function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "700", opacity: 0.8 }}>{title}</Text>
      {children}
    </View>
  );
}

function Mini({ blabel, text }: { blabel: string; text: string }) {
  return (
    <Text style={{ fontSize: 14, opacity: 0.8 }}>
      <Text style={{ fontWeight: "700" }}>{blabel}:</Text> {text}
    </Text>
  );
}

async function saveJson(key: string, value: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}



