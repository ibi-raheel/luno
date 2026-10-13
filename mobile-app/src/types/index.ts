/**
 * TypeScript Types & Interfaces
 * Data models for Luno Toys mobile app
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// User & Authentication
// ============================================

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  role: 'parent' | 'admin';
  subscriptionStatus: 'active' | 'trial' | 'expired';
  subscriptionTier: 'basic' | 'premium';
  preferences: UserPreferences;
  mfaEnabled: boolean;
  lastLoginAt: Timestamp;
}

export interface UserPreferences {
  notifications: boolean;
  emailReports: boolean;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  language: 'en' | 'es' | 'fr';
  timezone: string;
}

// ============================================
// Child Profiles
// ============================================

export interface Child {
  childId: string;
  name: string;
  dateOfBirth: Timestamp;
  age: number;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  createdAt: Timestamp;
  assignedToys: string[];
  contentFilter: ContentFilter;
  quietHours: QuietHours;
  sessionLimits: SessionLimits;
  privacySettings: PrivacySettings;
  interests: string[];
  skillLevels: SkillLevels;
}

export interface ContentFilter {
  ageLevel: 'preschool' | 'early-elementary' | 'elementary';
  blockedTopics: string[];
  approvedTopics?: string[];
  allowCreativeMode: boolean;
}

export interface QuietHours {
  enabled: boolean;
  schedule: QuietHourSchedule[];
}

export interface QuietHourSchedule {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "20:00"
  endTime: string; // "07:00"
}

export interface SessionLimits {
  dailyMinutes: number;
  sessionMinutes: number;
  warningThreshold: number;
}

export interface PrivacySettings {
  recordConversations: boolean;
  allowVoiceData: boolean;
  shareAnalytics: boolean;
}

export interface SkillLevels {
  vocabulary: number; // 1-10 scale
  math: number;
  creativity: number;
  emotionalIntelligence: number;
}

// ============================================
// Toys
// ============================================

export interface Toy {
  toyId: string;
  serialNumber: string;
  name: string;
  type: 'unicorn' | 'dragon' | 'bear' | 'robot';
  model: string;
  firmwareVersion: string;
  purchaseDate: Timestamp;
  registrationDate: Timestamp;
  warrantyExpires: Timestamp;
  assignedToChildId: string;
  status: ToyStatus;
  macAddress: string;
  bluetoothId: string;
  volume: number; // 0-100
  brightness: number; // 0-100
  voiceGender: 'male' | 'female' | 'neutral';
  totalPlaytimeMinutes: number;
  totalConversations: number;
  lastPlayedAt: Timestamp;
}

export interface ToyStatus {
  online: boolean;
  lastSeen: Timestamp;
  batteryLevel: number; // 0-100
  connectionType: 'bluetooth' | 'wifi';
  ipAddress?: string;
  wifiConnected: boolean;
  wifiSSID?: string;
  wifiSignalStrength?: number; // -100 to 0 dBm
}

// ============================================
// Activities
// ============================================

export interface Activity {
  activityId: string;
  toyId: string;
  childId: string;
  type: 'conversation' | 'game' | 'story' | 'learning' | 'creative';
  category: 'educational' | 'entertainment' | 'social' | 'physical';
  title: string;
  description: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationMinutes: number;
  metadata: ActivityMetadata;
  flagged: boolean;
  flagReasons?: string[];
  reviewedByParent: boolean;
  createdAt: Timestamp;
}

export interface ActivityMetadata {
  gameScore?: number;
  wordsLearned?: string[];
  skillsPracticed?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ============================================
// Conversations
// ============================================

export interface Conversation {
  conversationId: string;
  toyId: string;
  childId: string;

  // Status & Metadata
  status: 'active' | 'ended';
  type: 'conversation' | 'story' | 'game';

  // Timing
  startTime: Timestamp;
  lastActivityAt: Timestamp;
  endTime: Timestamp | null;
  durationMinutes: number;

  // Content
  title: string;
  titleGeneratedAt: Timestamp | null;
  messageCount: number;
  firstMessagePreview: string;

  // Safety/Flags
  flagged: boolean;
  flagType: string | null;
  flagReason: string | null;
  severity: string | null;
  flagStatus: 'unreviewed' | 'reviewed' | 'dismissed';

  // Legacy fields (for backwards compatibility)
  activityId?: string;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  messages?: Message[];
  flags?: Flag[];
  totalMessages?: number;
  childMessages?: number;
  toyMessages?: number;
  deleted?: boolean;
  deletedAt?: Timestamp;
}

export interface Message {
  messageId: string;
  sender: 'child' | 'toy';
  text: string;
  audioUrl?: string;
  timestamp: Timestamp;
  intent?: 'question' | 'statement' | 'request';
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics?: string[];
}

// ============================================
// Flags & Safety
// ============================================

export interface Flag {
  flagId: string;
  childId: string;
  toyId: string;
  conversationId: string;
  messageId: string;
  type: FlagType;
  severity: FlagSeverity;
  status: FlagStatus;
  detectedAt: Timestamp;
  notificationSent: boolean;
  context: FlagContext;
  parentAction?: ParentAction;
  reviewedAt?: Timestamp;
}

export type FlagType =
  | 'personal_info'
  | 'inappropriate'
  | 'distress'
  | 'mature_topic'
  | 'unusual_behavior';

export type FlagSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FlagStatus = 'unreviewed' | 'reviewed' | 'dismissed' | 'escalated';

export interface FlagContext {
  messageText: string;
  previousMessages: string[];
  detectedKeywords: string[];
  aiExplanation: string;
}

export interface ParentAction {
  action: 'dismissed' | 'blocked_topic' | 'adjusted_filter' | 'contacted_support';
  notes?: string;
  actionTakenAt: Timestamp;
}

// ============================================
// Analytics
// ============================================

export interface Analytics {
  date: string; // "2025-01-15"
  childId: string;
  totalPlaytimeMinutes: number;
  totalConversations: number;
  totalActivities: number;
  toyUsage: ToyUsage[];
  activityTypes: ActivityTypeBreakdown;
  skillsProgress: SkillsProgress;
  flagsGenerated: number;
  flagsByType: Record<FlagType, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ToyUsage {
  toyId: string;
  minutes: number;
  activities: number;
}

export interface ActivityTypeBreakdown {
  conversation: number;
  games: number;
  stories: number;
  learning: number;
  creative: number;
}

export interface SkillsProgress {
  vocabulary: { wordsLearned: string[]; count: number };
  math: { problemsSolved: number };
  creativity: { projectsCompleted: number };
}

// ============================================
// Notifications
// ============================================

export interface Notification {
  notificationId: string;
  type: NotificationType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  relatedEntityType?: 'child' | 'toy' | 'conversation' | 'activity';
  relatedEntityId?: string;
  read: boolean;
  readAt?: Timestamp;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export type NotificationType =
  | 'flag_alert'
  | 'time_limit'
  | 'milestone'
  | 'system'
  | 'firmware_update';

// ============================================
// UI/Component Types
// ============================================

export interface DashboardStats {
  totalPlaytimeMinutes: number;
  totalActivities: number;
  unreviewedFlags: number;
}

export interface ChildSummary {
  child: Child;
  toys: Toy[];
  todayStats: {
    playtimeMinutes: number;
    activitiesCount: number;
    lastActivityTime?: Timestamp;
  };
  unreviewedFlagsCount: number;
}
