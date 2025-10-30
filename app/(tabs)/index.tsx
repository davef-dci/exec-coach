// app/(tabs)/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";


const profileData = require("../../assets/weiman_profile.json");
const KEY_LAST_EXPANDED = "execCoach:lastExpandedSkill";
const KEY_LAST_CHALLENGE = "execCoach:lastDailyChallenge";


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


function onAskCoach() {
  if (!askText.trim()) return;
  const reply =
    `Based on your theme — “${coreTheme}” — try this:\n` +
    `• Restate your question in one sentence.\n` +
    `• Identify one concrete next action you can do in 15 minutes.\n` +
    `• Do it, then write one learning.\n\n` +
    `Your question: "${askText.trim()}"`;
  setAskReply(reply);
  AsyncStorage.setItem("execCoach:lastAskReply", JSON.stringify(reply)); // ✅ add
  setAskText("");
}

  function onExpandSkill() {
  if (!traits.length) {
    const fallback = {
      title: "No traits found",
      body:
        "Your profile doesn’t include keyTraits yet. Add keyTraits[] with { trait, description } objects.",
    };
    setExpandedSkill(fallback);
    // SAVE to storage
    AsyncStorage.setItem("execCoach:lastExpandedSkill", JSON.stringify(fallback));
    return;
  }

  const t = traits[Math.floor(Math.random() * traits.length)];
  const next = {
    title: t.trait,
    body:
      textOr(t.description) ||
      `Consider where “${t.trait}” shows up in your week. Note one concrete behavior that demonstrates it.`,
  };

  setExpandedSkill(next);
  // SAVE to storage
  AsyncStorage.setItem("execCoach:lastExpandedSkill", JSON.stringify(next));
}


 function onChallengeOfDay() {
  const anchors = profile.leadershipAnchors ?? [];
  const edus = profile.educationKeys ?? [];
  const cautions = profile.cautionAreas ?? [];

  const pick = <T,>(arr: T[]) =>
    arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;

  const anchor = pick(anchors);
  const edu = pick(edus);
  const caution = pick(cautions);

  let challenge =
    (anchor &&
      `Demonstrate “${anchor}” today: choose one decision or meeting and make a clear move that reflects it. Block 15 minutes to prep.`) ||
    (edu &&
      `Practice “${edu}”: identify one moment today to apply it intentionally. Write what you’ll do in 1 sentence and schedule it.`) ||
    (caution &&
      `Balance your caution area (“${(caution as any).area}”): define a small guardrail you’ll use in the next meeting, then reflect for 2 minutes after.`);

  if (!challenge) {
    const t = traits.length ? traits[Math.floor(Math.random() * traits.length)] : undefined;
    challenge = t
      ? `Apply “${t.trait}” on a live task: spend 15 minutes using it to move something forward, then capture one takeaway.`
      : "Pick one small improvement you can ship before noon. Make it visible, even if rough.";
  }





  setDailyChallenge(challenge);
  // SAVE to storage
  AsyncStorage.setItem("execCoach:lastDailyChallenge", JSON.stringify(challenge));
}


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 24, fontWeight: "700" }}>
            Executive Coach (MVP)
          </Text>
          <Text style={{ fontSize: 16 }}>
            Loaded profile for:{" "}
            <Text style={{ fontWeight: "600" }}>{displayName}</Text>
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

        <View style={{ gap: 12, marginTop: 12 }}>
          <ActionButton label="Expand a Skill" onPress={onExpandSkill} />
          <ActionButton label="Challenge of the Day" onPress={onChallengeOfDay} />



          
        </View>

        <Card title="Ask the Coach">
  <TextInput
    value={askText}
    onChangeText={setAskText}
    placeholder="Describe a challenge or decision…"
    multiline
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

        <Card title="Debug: Profile Introspection">
  <Text>Type: {typeof profileData}</Text>
  <Text>Keys: {Object.keys(profileData || {}).join(", ") || "(none)"}</Text>
  <Text>has traits: {Array.isArray((profileData as any)?.traits) ? "yes" : "no"}</Text>
  <Text>has skills: {Array.isArray((profileData as any)?.skills) ? "yes" : "no"}</Text>
  <Text>has attributes: {Array.isArray((profileData as any)?.attributes) ? "yes" : "no"}</Text>
  <Text>has keyTraits: {Array.isArray((profileData as any)?.keyTraits) ? "yes" : "no"}</Text>
</Card>

      </ScrollView>
    </SafeAreaView>

    
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#e9e9ff" : "#eef",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#c9ccff",
      })}
    >
      <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600" }}>
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



