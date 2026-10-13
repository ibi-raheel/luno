import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }: any) {
  const { currentUser, signOut, isDemoMode } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', action: () => {} },
        { label: 'Change Password', action: () => {} },
        { label: 'Email Preferences', action: () => {} },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          label: 'Notifications',
          toggle: true,
          value: notificationsEnabled,
          onChange: setNotificationsEnabled,
        },
        {
          label: 'Sound Effects',
          toggle: true,
          value: soundEnabled,
          onChange: setSoundEnabled,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', action: () => {} },
        { label: 'Contact Support', action: () => {} },
        { label: 'Rate App', action: () => {} },
      ],
    },
  ];

  return (
    <LinearGradient colors={['#faf5ff', '#fce7f3', '#dbeafe']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              Demo Mode - Sign up to save your progress!
            </Text>
          </View>
        )}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#9333ea', '#ec4899']}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.profileName}>{currentUser?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email}</Text>
          </LinearGradient>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={item.action}
                    disabled={item.toggle}
                  >
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    {item.toggle ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onChange}
                        trackColor={{ false: '#e5e7eb', true: '#9333ea' }}
                        thumbColor="white"
                      />
                    ) : (
                      <Text style={styles.settingArrow}>›</Text>
                    )}
                  </TouchableOpacity>
                  {itemIndex < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
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
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileGradient: {
    padding: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  settingArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 52,
  },
  signOutButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 24,
  },
  demoBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  demoBannerText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
