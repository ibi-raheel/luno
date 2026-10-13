import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

interface InsightCardProps {
  creativity_summary: string;
  learning_themes: string[];
  emotional_tone: 'calm' | 'cheerful' | 'thoughtful' | 'curious' | 'mixed';
  parent_note?: string;
  childName?: string;
}

const emotionalToneColors = {
  calm: { primary: colors.success[600], secondary: colors.success[100] },
  cheerful: { primary: colors.warning[600], secondary: colors.warning[100] },
  thoughtful: { primary: colors.primary[600], secondary: colors.primary[100] },
  curious: { primary: colors.info[600], secondary: colors.info[100] },
  mixed: { primary: colors.primary[500], secondary: colors.primary[50] },
};

export function InsightCard({
  creativity_summary,
  learning_themes,
  emotional_tone,
  parent_note,
  childName,
}: InsightCardProps) {
  const toneColors = emotionalToneColors[emotional_tone];

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={colors.gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Today's Insights</Text>
            {childName && (
              <Text style={styles.headerSubtitle}>{childName}'s creativity & exploration</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Emotional Tone Badge */}
      <View style={styles.content}>
        <View style={[styles.toneBadge, { backgroundColor: toneColors.secondary }]}>
          <Text style={[styles.toneText, { color: toneColors.primary }]}>
            {emotional_tone.charAt(0).toUpperCase() + emotional_tone.slice(1)}
          </Text>
        </View>

        {/* Creativity Summary */}
        <Text style={styles.summary}>{creativity_summary}</Text>

        {/* Learning Themes */}
        {learning_themes.length > 0 && (
          <View style={styles.themesContainer}>
            <Text style={styles.themesLabel}>Learning themes:</Text>
            <View style={styles.themesGrid}>
              {learning_themes.map((theme, index) => (
                <View key={index} style={styles.themeTag}>
                  <Text style={styles.themeText}>{theme}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Parent Note */}
        {parent_note && (
          <View style={styles.parentNoteContainer}>
            <Text style={styles.parentNoteText}>{parent_note}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  header: {
    padding: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + 'E6',
  },
  content: {
    padding: spacing[5],
  },
  toneBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
  },
  toneText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  summary: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    color: colors.neutral[700],
    marginBottom: spacing[4],
  },
  themesContainer: {
    marginBottom: spacing[4],
  },
  themesLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  themeTag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  themeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  parentNoteContainer: {
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[600],
  },
  parentNoteText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    color: colors.neutral[700],
  },
});
