import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  components,
  shadows,
} from '../constants/theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleResetPassword() {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert(
        'Success',
        'Password reset email sent! Check your inbox.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🔑</Text>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.neutral[400]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Reset Button */}
            <Button
              title={loading ? 'Sending...' : 'Send Reset Email'}
              onPress={handleResetPassword}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
            />

            {/* Back Link */}
            <View style={styles.backContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: spacing[5],
  },

  // Form
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing[5],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: components.input.borderRadius,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: components.input.fontSize,
    height: components.input.height,
    borderWidth: 1,
    borderColor: components.input.borderColor,
    color: colors.neutral[900],
    ...shadows.sm,
  },

  // Back Link
  backContainer: {
    alignItems: 'center',
    marginTop: spacing[6],
  },
  backLink: {
    color: colors.primary[600],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
