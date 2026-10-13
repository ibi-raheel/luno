import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Activity {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
}

export default function ActivitiesScreen({ navigation }: any) {
  const activities: Activity[] = [
    {
      id: '1',
      title: 'Story Time',
      description: 'Listen to magical bedtime stories',
      icon: '📖',
      difficulty: 'Easy',
      duration: '10 min',
    },
    {
      id: '2',
      title: 'Math Adventure',
      description: 'Fun math games and puzzles',
      icon: '🔢',
      difficulty: 'Medium',
      duration: '15 min',
    },
    {
      id: '3',
      title: 'Art Time',
      description: 'Create beautiful drawings together',
      icon: '🎨',
      difficulty: 'Easy',
      duration: '20 min',
    },
    {
      id: '4',
      title: 'Music & Dance',
      description: 'Sing songs and dance along',
      icon: '🎵',
      difficulty: 'Easy',
      duration: '15 min',
    },
    {
      id: '5',
      title: 'Science Lab',
      description: 'Explore fun science experiments',
      icon: '🔬',
      difficulty: 'Hard',
      duration: '25 min',
    },
    {
      id: '6',
      title: 'Memory Game',
      description: 'Test your memory skills',
      icon: '🧩',
      difficulty: 'Medium',
      duration: '10 min',
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#10b981';
      case 'Medium':
        return '#f59e0b';
      case 'Hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <LinearGradient colors={['#faf5ff', '#fce7f3', '#dbeafe']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Choose an activity to play with your toy</Text>

        <View style={styles.grid}>
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.card}
              onPress={() => {
                // Navigate to activity detail or start activity
              }}
            >
              <View style={styles.cardContent}>
                <Text style={styles.activityIcon}>{activity.icon}</Text>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <View style={styles.activityMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(activity.difficulty) },
                    ]}
                  >
                    <Text style={styles.difficultyText}>{activity.difficulty}</Text>
                  </View>
                  <Text style={styles.duration}>{activity.duration}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.playButton}>
                <LinearGradient
                  colors={['#9333ea', '#ec4899']}
                  style={styles.playButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.playButtonText}>Play</Text>
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontSize: 28,
    color: '#9333ea',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  activityIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
    color: '#6b7280',
  },
  playButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
