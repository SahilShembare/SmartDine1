import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTable } from '../../context/TableContext';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  ChevronRight, 
  Utensils, 
  ShoppingBag,
  RotateCcw
} from 'lucide-react-native';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders } = useTable();
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);

  useEffect(() => {
    loadLocalOrders();
  }, [orders]);

  const loadLocalOrders = async () => {
    try {
      const saved = await AsyncStorage.getItem('smartdine_order_history');
      if (saved) {
        setHistoryOrders(JSON.parse(saved));
      } else {
        setHistoryOrders(orders.slice(0, 3));
      }
    } catch (e) {
      setHistoryOrders(orders.slice(0, 3));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'preparing': return '#f97316';
      case 'ready': return '#10b981';
      case 'completed': return '#64748b';
      default: return '#94a3b8';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History & Live Status</Text>
        <Text style={styles.headerSub}>Track active orders or review past dining history</Text>
      </View>

      {historyOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#64748b" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan a table QR code and place your food order to track live preparation!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.browseButtonText}>Explore Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        >
          {historyOrders.map((item) => {
            const statusColor = getStatusColor(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.orderCard}
                onPress={() => router.push({ pathname: '/track/[id]', params: { id: item.id } })}
                activeOpacity={0.85}
              >
                {/* Order Top Row */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>#{item.id}</Text>
                    <Text style={styles.orderDate}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}25`, borderColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {item.status ? item.status.toUpperCase() : 'PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Table & Total */}
                <View style={styles.orderTableInfo}>
                  <View style={styles.tableTag}>
                    <Text style={styles.tableTagText}>Table {item.tableNumber || '01'}</Text>
                  </View>
                  <Text style={styles.orderTotal}>₹{item.total?.toFixed(0)}</Text>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsSummary}>
                  {item.items?.map((food: any, idx: number) => (
                    <Text key={idx} style={styles.itemText} numberOfLines={1}>
                      • {food.quantity}x {food.name}
                    </Text>
                  ))}
                </View>

                {/* Track CTA */}
                <View style={styles.trackActionRow}>
                  <Text style={styles.trackActionText}>
                    {item.status === 'completed' ? 'View Receipt Details' : 'Live Kitchen Tracker'}
                  </Text>
                  <ChevronRight size={16} color="#f97316" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  ordersList: {
    padding: 18,
    gap: 14,
  },
  orderCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    gap: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  orderDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderTableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableTag: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableTagText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  itemsSummary: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    gap: 3,
  },
  itemText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  trackActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  trackActionText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseButton: {
    marginTop: 10,
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
