import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTable } from '../../context/TableContext';
import { db, isFirebaseConfigured } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  BellRing, 
  CheckCheck, 
  Receipt, 
  Utensils 
} from 'lucide-react-native';

export default function TrackOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { orders } = useTable();
  const [order, setOrder] = useState<any>(() => {
    return orders.find((o) => o.id === id) || null;
  });

  useEffect(() => {
    if (isFirebaseConfigured && id) {
      const unsub = onSnapshot(doc(db, 'orders', id as string), (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
      });
      return () => unsub();
    } else {
      const found = orders.find((o) => o.id === id);
      if (found) setOrder(found);
    }
  }, [id, orders]);

  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received by the kitchen system', icon: CheckCircle2 },
    { key: 'accepted', label: 'Order Accepted', desc: 'Kitchen acknowledged ticket', icon: Clock },
    { key: 'preparing', label: 'Preparing Food', desc: 'Chefs are actively cooking', icon: ChefHat },
    { key: 'ready', label: 'Ready to Serve', desc: 'Dishes are plated and hot', icon: BellRing },
    { key: 'completed', label: 'Completed', desc: 'Served and dining in progress', icon: CheckCheck }
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder: { [key: string]: number } = {
      'pending': 0,
      'placed': 0,
      'accepted': 1,
      'preparing': 2,
      'ready': 3,
      'completed': 4,
      'cancelled': -1
    };

    const targetIdx = steps.findIndex(s => s.key === stepKey);
    const currentIdx = statusOrder[currentStatus] !== undefined ? statusOrder[currentStatus] : 0;

    if (currentStatus === 'cancelled') return 'cancelled';
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Order Tracker</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Syncing live status with kitchen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Order Tracker</Text>
        <View style={styles.tableBadge}>
          <Text style={styles.tableBadgeText}>TABLE {order.tableNumber}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.chefBadge}>
            <ChefHat size={32} color="#f97316" />
          </View>
          <Text style={styles.orderNumber}>ORDER #{order.id}</Text>
          <Text style={styles.orderStatusHeadline}>
            {order.status === 'pending' ? 'Order Sent to Kitchen' :
             order.status === 'accepted' ? 'Order Accepted by Chef' :
             order.status === 'preparing' ? 'Food is Being Prepared 🔥' :
             order.status === 'ready' ? 'Ready to Serve to Table 🛎️' :
             order.status === 'completed' ? 'Order Completed! Enjoy 🍽️' :
             'Order Cancelled'}
          </Text>
          <Text style={styles.orderSub}>
            Real-time synchronization with kitchen displays
          </Text>
        </View>

        {/* Stepper Progression */}
        <View style={styles.stepperCard}>
          <Text style={styles.sectionTitle}>Preparation Pipeline</Text>

          <View style={styles.stepperList}>
            {steps.map((step, idx) => {
              const state = getStepStatus(step.key, order.status);
              const StepIcon = step.icon;

              return (
                <View key={step.key} style={styles.stepRow}>
                  {/* Icon */}
                  <View style={[
                    styles.stepIconCircle,
                    state === 'completed' && styles.stepIconCompleted,
                    state === 'active' && styles.stepIconActive,
                    state === 'upcoming' && styles.stepIconUpcoming,
                  ]}>
                    <StepIcon 
                      size={16} 
                      color={state === 'active' || state === 'completed' ? '#ffffff' : '#64748b'} 
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.stepTextContainer}>
                    <Text style={[
                      styles.stepLabel,
                      state === 'active' && styles.stepLabelActive,
                      state === 'completed' && styles.stepLabelCompleted,
                    ]}>
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Receipt size={16} color="#f97316" />
            <Text style={styles.sectionTitle}>Ordered Dishes</Text>
          </View>

          <View style={styles.itemsList}>
            {order.items?.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  <Text style={styles.itemQty}>{item.quantity}x </Text>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bill</Text>
            <Text style={styles.totalVal}>₹{order.total?.toFixed(0)}</Text>
          </View>
        </View>

        {/* Order More CTA */}
        <TouchableOpacity
          style={styles.orderMoreBtn}
          onPress={() => router.replace('/(tabs)/menu')}
        >
          <Utensils size={16} color="#f97316" />
          <Text style={styles.orderMoreText}>Order More Items for Table {order.tableNumber}</Text>
        </TouchableOpacity>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  tableBadge: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  chefBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  orderStatusHeadline: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  orderSub: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
  },
  stepperCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepperList: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepIconCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepIconActive: {
    backgroundColor: '#ea580c',
    borderColor: '#f97316',
  },
  stepIconUpcoming: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabelActive: {
    color: '#f97316',
    fontWeight: '800',
  },
  stepLabelCompleted: {
    color: '#f1f5f9',
  },
  stepDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  itemQty: {
    color: '#f97316',
    fontWeight: '800',
  },
  itemPrice: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  totalVal: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '800',
  },
  orderMoreBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  orderMoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
