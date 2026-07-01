import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Recommendation } from '../services/claudeService';
import { useSummaryStore } from '../store/summaryStore';
import { colors, font, radius } from '../theme';
import { KoodapHeader } from '../components/KoodapHeader';

const CATEGORY_META: Record<Recommendation['category'], { icon: string; color: string; bg: string }> = {
  physical:     { icon: '🏃', color: '#3AB54A', bg: '#0A2010' },
  mental:       { icon: '🧘', color: '#7C6FCD', bg: '#12102A' },
  productivity: { icon: '🎯', color: '#1A4FD6', bg: '#0A1428' },
};

export function SummaryScreen() {
  const { summary, isGenerating, error, loadSummary, generateSummary } = useSummaryStore();

  useEffect(() => { loadSummary(); }, []);

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe}>
      <KoodapHeader subtitle="Daily Debrief" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.dateText}>{dateStr}</Text>

        {isGenerating && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingTitle}>Analysing your day…</Text>
            <Text style={styles.loadingText}>Koodap is reading your transcripts and building your debrief</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {summary && !isGenerating && (
          <>
            {/* Emotion arc */}
            <View style={styles.emotionCard}>
              <Text style={styles.sectionLabel}>Emotion Arc</Text>
              <Text style={styles.emotionArc}>{summary.emotionArc}</Text>
            </View>

            {/* Narrative */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>How Your Day Went</Text>
              <Text style={styles.narrative}>{summary.narrative}</Text>
            </View>

            {/* Highlights */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Highlights</Text>
              {summary.highlights.map((h, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </View>

            {/* Recommendations */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Tomorrow's Plan</Text>
              {summary.recommendations.map((r, i) => {
                const meta = CATEGORY_META[r.category];
                return (
                  <View key={i} style={[styles.recRow, { backgroundColor: meta.bg, borderLeftColor: meta.color }]}>
                    <Text style={styles.recIcon}>{meta.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recCategory, { color: meta.color }]}>{r.category.toUpperCase()}</Text>
                      <Text style={styles.recText}>{r.text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {!summary && !isGenerating && !error && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>No debrief yet</Text>
            <Text style={styles.emptyText}>Record your day then tap Generate to get your AI debrief</Text>
          </View>
        )}

        <Pressable
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={() => generateSummary()}
          disabled={isGenerating}
        >
          {isGenerating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.generateBtnText}>{summary ? '🔄 Regenerate Debrief' : '✨ Generate Today\'s Debrief'}</Text>
          }
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  dateText: { color: colors.textMuted, fontSize: font.sm, marginBottom: 4 },

  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: { color: colors.text, fontSize: font.lg, fontWeight: '700' },
  loadingText: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center' },

  errorCard: {
    backgroundColor: '#2A0A0A',
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5A1A1A',
  },
  errorIcon: { fontSize: 20 },
  errorText: { color: '#FF6B6B', fontSize: font.sm, flex: 1 },

  emotionCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    padding: 16,
    gap: 8,
  },
  emotionArc: { color: colors.text, fontSize: font.lg, fontWeight: '700' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  narrative: { color: colors.text, fontSize: font.md, lineHeight: 24 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  bulletText: { color: colors.text, fontSize: font.md, lineHeight: 22, flex: 1 },

  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    padding: 12,
  },
  recIcon: { fontSize: 20, marginTop: 2 },
  recCategory: { fontSize: font.xs, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  recText: { color: colors.text, fontSize: font.sm, lineHeight: 20 },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: font.lg, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center', paddingHorizontal: 30 },

  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
