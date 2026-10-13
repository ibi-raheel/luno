// Mock insights data for development
// Based on the Parent-Insight Generator specification

export interface DailyInsight {
  id: string;
  childId: string;
  childName: string;
  date: string;
  creativity_summary: string;
  learning_themes: string[];
  emotional_tone: 'calm' | 'cheerful' | 'thoughtful' | 'curious' | 'mixed';
  parent_note?: string;
}

export const mockInsights: DailyInsight[] = [
  {
    id: '1',
    childId: 'emma',
    childName: 'Emma',
    date: '2025-01-15',
    creativity_summary:
      "Today Emma explored several imaginative scenarios, including building a make-believe forest and inventing characters with unique roles. She showed strong narrative thinking and enjoyed adding details to her ideas.",
    learning_themes: ['story-building', 'problem solving', 'emotional expression'],
    emotional_tone: 'curious',
    parent_note:
      "You can encourage this creative momentum by asking her about the characters she invented today.",
  },
  {
    id: '2',
    childId: 'max',
    childName: 'Max',
    date: '2025-01-15',
    creativity_summary:
      "Max engaged in playful exploration today, focusing on colors and shapes. He asked thoughtful questions about how things work and showed patience when working through challenges.",
    learning_themes: ['pattern recognition', 'color exploration', 'curiosity'],
    emotional_tone: 'cheerful',
    parent_note:
      "His interest in how things work suggests he might enjoy simple science experiments or building activities.",
  },
  {
    id: '3',
    childId: 'emma',
    childName: 'Emma',
    date: '2025-01-14',
    creativity_summary:
      "Emma spent time creating a detailed adventure story with multiple settings. She demonstrated strong sequencing skills and showed empathy when discussing character feelings.",
    learning_themes: ['sequencing', 'empathy', 'creative writing'],
    emotional_tone: 'thoughtful',
  },
  {
    id: '4',
    childId: 'max',
    childName: 'Max',
    date: '2025-01-14',
    creativity_summary:
      "Today's play included singing, rhythm exploration, and imaginative movement. Max showed enthusiasm for musical patterns and enjoyed expressing ideas through sound.",
    learning_themes: ['music & rhythm', 'physical expression', 'pattern play'],
    emotional_tone: 'cheerful',
    parent_note: "Consider incorporating more music and movement activities into playtime.",
  },
];

// Helper function to get today's insights for all children
export function getTodaysInsights(): DailyInsight[] {
  const today = new Date().toISOString().split('T')[0];
  return mockInsights.filter((insight) => insight.date === today);
}

// Helper function to get insights for a specific child
export function getInsightsForChild(childName: string): DailyInsight[] {
  return mockInsights.filter(
    (insight) => insight.childName.toLowerCase() === childName.toLowerCase()
  );
}

// Helper function to get the most recent insight for a child
export function getLatestInsightForChild(childName: string): DailyInsight | undefined {
  const insights = getInsightsForChild(childName);
  return insights.length > 0 ? insights[0] : undefined;
}
