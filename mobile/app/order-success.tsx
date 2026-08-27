import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  CheckCircle2, 
  Clock, 
  Utensils, 
  ArrowRight, 
  Sparkles,
  Receipt
} from 'lucide-react-native';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId || 'ORD-9823';
  const table = params.table || '01';
  const total = params.total || '0';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        
        {/* Celebration Badge */}
        <View style={styles.badge}>
          <CheckCircle2 size={48} color="#10b981" />
        </View>

        <Text style={styles.title}>Order Placed Successfully 🎉</Text>
        <Text style={styles.subtitle}>
          Your order has been transmitted directly to the kitchen chef.
        </Text>

        {/* Order Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValueHighlight}>#{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Table Number</Text>
            <View style={styles.tablePill}>
              <Text style={styles.tablePillText}>Table {table}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Bill</Text>
            <Text style={styles.infoValue}>₹{total}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Status</Text>
            <Text style={styles.statusValue}>Pending Approval</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.replace({ pathname: '/track/[id]', params: { id: orderId } })}
            activeOpacity={0.85}
          >
            <Clock size={18} color="#ffffff" />
            <Text style={styles.trackButtonText}>Track Live Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.replace('/(tabs)/menu')}
            activeOpacity={0.85}
          >
            <Utensils size={16} color="#94a3b8" />
            <Text style={styles.menuButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  infoValueHighlight: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statusValue: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  tablePill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tablePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  trackButton: {
    backgroundColor: '#ea580c',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  menuButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  menuButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
});
