import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Bookmark, 
  Bell, 
  HelpCircle, 
  Info, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  ChevronRight, 
  Edit3,
  Sparkles
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from Smart Dine?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* User Card */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.displayName || 'Smart Diner'}</Text>
              <Text style={styles.userEmail}>{user.email || 'customer@example.com'}</Text>
              <Text style={styles.userPhone}>{user.phoneNumber || '+91 98765 43210'}</Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Edit3 size={14} color="#f97316" />
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconBg}>
              <User size={30} color="#f97316" />
            </View>
            <View style={styles.guestTextContainer}>
              <Text style={styles.guestTitle}>Welcome, Dining Guest</Text>
              <Text style={styles.guestSubtitle}>
                Sign in to save your order history, favorite dishes, and dining preferences
              </Text>
            </View>
            <TouchableOpacity
              style={styles.loginCtaButton}
              onPress={() => router.push('/auth/login')}
            >
              <LogIn size={16} color="#ffffff" />
              <Text style={styles.loginCtaText}>Login / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Options List */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Dining & Activity</Text>

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.menuRowLeft}>
              <Clock size={18} color="#f97316" />
              <Text style={styles.menuRowLabel}>My Orders & Live Status</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('Saved Information', 'Your saved preferences and dining history are stored securely.')}
          >
            <View style={styles.menuRowLeft}>
              <Bookmark size={18} color="#3b82f6" />
              <Text style={styles.menuRowLabel}>Saved Information</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('Notifications', 'Kitchen order alerts and promotions are enabled.')}
          >
            <View style={styles.menuRowLeft}>
              <Bell size={18} color="#fbbf24" />
              <Text style={styles.menuRowLabel}>Notifications</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Support & Legal */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support & About</Text>

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('Help & Support', 'For assistance during dining, contact restaurant staff or call desk at extension 101.')}
          >
            <View style={styles.menuRowLeft}>
              <HelpCircle size={18} color="#10b981" />
              <Text style={styles.menuRowLabel}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('About Smart Dine', 'Smart Dine v1.0.0 — Next-Generation Contactless QR Food Ordering & Kitchen Platform.')}
          >
            <View style={styles.menuRowLeft}>
              <Info size={18} color="#8b5cf6" />
              <Text style={styles.menuRowLabel}>About Smart Dine</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('Privacy & Terms', 'Smart Dine respects your privacy. All payment transactions and data are protected.')}
          >
            <View style={styles.menuRowLeft}>
              <ShieldCheck size={18} color="#06b6d4" />
              <Text style={styles.menuRowLabel}>Terms & Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {user && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 18,
    gap: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  userPhone: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editProfileText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  guestIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTextContainer: {
    alignItems: 'center',
  },
  guestTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  guestSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  loginCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
    width: '100%',
    justifyContent: 'center',
  },
  loginCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  menuSection: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuRowLabel: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
});
