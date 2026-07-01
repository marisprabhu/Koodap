import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { audioService } from '../services/audioService';
import { databaseService } from '../services/databaseService';
import { voiceIdService } from '../services/voiceIdService';
import { RecordingState } from '../types';

export function VoiceEnrollScreen() {
  const [label, setLabel] = useState('');
  const [recording, setRecording] = useState<RecordingState>({ isRecording: false, isPaused: false, durationMs: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; label: string }[]>([]);

  const loadProfiles = async () => {
    const all = await databaseService.getAllVoiceProfiles();
    setProfiles(all.map((p) => ({ id: p.id, label: p.label })));
  };

  useEffect(() => { loadProfiles(); }, []);

  const startEnroll = async () => {
    if (!label.trim()) { Alert.alert('Name required', 'Enter a name for this voice profile.'); return; }
    const granted = await audioService.requestPermissions();
    if (!granted) return;
    await audioService.start();
    const timer = setInterval(() => setRecording((s) => ({ ...s, durationMs: s.durationMs + 500 })), 500);
    setRecording({ isRecording: true, isPaused: false, durationMs: 0 });
    // store timer ref in a closure — we stop in stopEnroll
    (startEnroll as any)._timer = timer;
  };

  const stopEnroll = async () => {
    clearInterval((startEnroll as any)._timer);
    setRecording({ isRecording: false, isPaused: false, durationMs: 0 });
    setIsSaving(true);
    try {
      const uri = await audioService.stop();
      if (!uri) throw new Error('No audio captured');
      await voiceIdService.enroll(uri, label.trim());
      await audioService.deleteFile(uri);
      setLabel('');
      Alert.alert('Enrolled', `Voice profile saved for "${label.trim()}".`);
      await loadProfiles();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Enrollment failed');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfile = (profileLabel: string) => {
    Alert.alert('Delete profile', `Remove voice profile for "${profileLabel}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await databaseService.deleteVoiceProfile(profileLabel);
          await loadProfiles();
        },
      },
    ]);
  };

  const seconds = Math.floor(recording.durationMs / 1000);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Voice Profiles</Text>
      <Text style={styles.sub}>
        Enroll a speaker so LifeLog can tag transcripts with their name.{'\n'}
        Speak naturally for 15–30 seconds in a quiet environment.
      </Text>

      {/* Enrollment card */}
      <View style={styles.card}>
        <Text style={styles.label}>Speaker name</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Me, Priya, John…"
          placeholderTextColor="#555"
          editable={!recording.isRecording && !isSaving}
        />

        {recording.isRecording ? (
          <View style={styles.recordingRow}>
            <View style={styles.recDot} />
            <Text style={styles.recTimer}>{seconds}s recorded</Text>
            <Pressable style={[styles.btn, styles.btnDanger]} onPress={stopEnroll}>
              <Text style={styles.btnText}>Stop & Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.btn, styles.btnPrimary, isSaving && styles.btnDisabled]}
            onPress={startEnroll}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Start Recording</Text>}
          </Pressable>
        )}
      </View>

      {/* Saved profiles */}
      <Text style={styles.listHeading}>Saved Profiles ({profiles.length})</Text>
      <FlatList
        data={profiles}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No profiles yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.profileRow}>
            <Text style={styles.profileIcon}>🎤</Text>
            <Text style={styles.profileLabel}>{item.label}</Text>
            <Pressable onPress={() => deleteProfile(item.label)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#666', fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, gap: 12 },
  label: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  recTimer: { color: '#aaa', fontSize: 14, flex: 1 },
  btn: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnDanger: { backgroundColor: '#dc2626' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  listHeading: { color: '#666', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 28, marginBottom: 10 },
  list: { gap: 10 },
  empty: { color: '#444', fontSize: 14 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  profileIcon: { fontSize: 20 },
  profileLabel: { color: '#e0e0e0', fontSize: 15, flex: 1 },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#2a1a1a', borderRadius: 8 },
  deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
