// Mock child stats data for development

export interface ChildStats {
  childId: string;
  childName: string;
  age: number;
  mood: 'happy' | 'calm' | 'excited' | 'thoughtful' | 'energetic';
  status: 'online' | 'offline';
  toyName: string;
  screenTime: string;
  conversationsCount: number;
  activitiesCompleted: number;
  daySummary: string;
}

export const mockChildStats: ChildStats[] = [
  {
    childId: 'emma',
    childName: 'Emma',
    age: 7,
    mood: 'excited',
    status: 'online',
    toyName: 'Luna',
    screenTime: '2h 15m',
    conversationsCount: 8,
    activitiesCompleted: 5,
    daySummary:
      "Emma is having a creative day! She's been engaged in storytelling and art activities, showing lots of enthusiasm and imagination.",
  },
  {
    childId: 'max',
    childName: 'Max',
    age: 5,
    mood: 'calm',
    status: 'offline',
    toyName: 'Spark',
    screenTime: '1h 09m',
    conversationsCount: 4,
    activitiesCompleted: 3,
    daySummary:
      "Max had a peaceful morning exploring colors and patterns. He's been thoughtful and focused during his playtime.",
  },
];

// Helper function to get stats for a specific child
export function getChildStats(childName: string): ChildStats | undefined {
  return mockChildStats.find(
    (stats) => stats.childName.toLowerCase() === childName.toLowerCase()
  );
}

// Helper function to get all children's stats
export function getAllChildrenStats(): ChildStats[] {
  return mockChildStats;
}
