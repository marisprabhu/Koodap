import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KoodapHeader } from '../components/KoodapHeader';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTranscriptStore } from '../store/transcriptStore';
import { colors, font, radius } from '../theme';

export function HomeScreen() {
  const { recording, transcriptionStatus, startRecording, stopAndTranscribe, togglePause } =
    useAudioRecorder();
  const { todayTranscripts, loadToday } = useTranscriptStore();

  useEffect(() => { loadToday(); }, []);
  useEffect(() => { if (transcriptionStatus === 'done') loadToday(); }, [transcriptionStatus]);

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe}>
      <KoodapHeader subtitle={dateStr} />

      <FlatList
        data={todayTranscripts}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{todayTranscripts.length}</Text>
              <Text style={styles.statLabel}>Recordings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {Math.round(todayTranscripts.reduce((s, t) => s + t.durationMs, 0) / 60000)}m
              </Text>
              <Text style={styles.statLabel}>Logged</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {todayTranscripts.reduce((s, t) => s + t.text.split(' ').length, 0)}
              </Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyText}>Tap Record below to start capturing your day</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTimeBadge}>
                <Text style={styles.cardTime}>
                  {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {item.speakerLabel && (
                <View style={styles.speakerBadge}>
                  <Text style={styles.speakerText}>👤 {item.speakerLabel}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardText}>{item.text}</Text>
            <Text style={styles.cardDuration}>{Math.round(item.durationMs / 1000)}s recorded</Text>
          </View>
        )}
      />

      {transcriptionStatus === 'transcribing' && (
        <View style={styles.statusBar}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.statusText}>Transcribing with Whisper…</Text>
        </View>
      )}
      {transcriptionStatus === 'error' && (
        <View style={[styles.statusBar, { backgroundColor: '#2A0A0A' }]}>
          <Text style={styles.statusText}>⚠️ Transcription failed — is the Whisper server running?</Text>
        </View>
      )}

      <View style={styles.controls}>
        {!recording.isRecording ? (
          <Pressable style={styles.recordBtn} onPress={startRecording}>
            <Text style={styles.recordBtnIcon}>⏺</Text>
            <Text style={styles.recordBtnText}>Start Recording</Text>
          </Pressable>
        ) : (
          <View style={styles.activeControls}>
            <RecordingIndicator state={recording} />
            <View style={styles.actionBtns}>
              <Pressable style={styles.btnSecondary} onPress={togglePause}>
                <Text style={styles.btnSecText}>{recording.isPaused ? '▶ Resume' : '⏸ Pause'}</Text>
              </Pressable>
              <Pressable style={styles.btnStop} onPress={stopAndTranscribe}>
                <Text style={styles.btnStopText}>⏹ Stop & Save</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, paddingBottom: 20 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { color: colors.primary, fontSize: font.xl, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: font.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.cardBorder },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: font.lg, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center', paddingHorizontal: 30 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTimeBadge: {
    backgroundColor: colors.primary + '25',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cardTime: { color: colors.primary, fontSize: font.xs, fontWeight: '700' },
  speakerBadge: {
    backgroundColor: colors.accent + '25',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  speakerText: { color: colors.accent, fontSize: font.xs, fontWeight: '600' },
  cardText: { color: colors.text, fontSize: font.md, lineHeight: 22 },
  cardDuration: { color: colors.textMuted, fontSize: font.xs },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  statusText: { color: colors.textSub, fontSize: font.sm, flex: 1 },
  controls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.bg,
  },
  recordBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  recordBtnIcon: { fontSize: 20 },
  recordBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
  activeControls: { gap: 12, alignItems: 'center' },
  actionBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  btnSecText: { color: colors.text, fontWeight: '600', fontSize: font.md },
  btnStop: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnStopText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
