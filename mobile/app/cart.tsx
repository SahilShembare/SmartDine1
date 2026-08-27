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
import { useTable } from '../context/TableContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Receipt, 
  Utensils, 
  ChevronRight,
  Lock,
  LogIn 
} from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTable } = useTable();
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartSubtotal, 
    cartTax, 
    cartTotal 
  } = useCart();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContent}>
          <Lock size={48} color="#f97316" />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptyDesc}>
            Please sign in to access your dining cart and place orders.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.browseButtonText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContent}>
          <ShoppingBag size={54} color="#64748b" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyDesc}>
            Looks like you haven't added any dishes to your cart yet.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.browseButtonText}>Browse Digital Menu</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Cart ({cart.length})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Table Lock Banner */}
      <View style={styles.tableLockBanner}>
        <View style={styles.tableLockLeft}>
          <View style={styles.tableNumberPill}>
            <Text style={styles.tableNumberText}>TABLE {currentTable || '01'}</Text>
          </View>
          <Text style={styles.tableLockText}>
            Ordering directly for Table {currentTable || '01'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/scanner')}>
          <Text style={styles.changeTableLink}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Items Scroll */}
      <ScrollView 
        contentContainerStyle={styles.cartItemsScroll}
        showsVerticalScrollIndicator={false}
      >
        {cart.map((item) => (
          <View key={item.id} style={styles.cartCard}>
            {/* Image */}
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            )}

            {/* Middle info */}
            <View style={styles.itemInfo}>
              <View style={styles.itemNameRow}>
                <View style={[styles.vegDotSmall, item.isVeg !== false ? styles.vegDotGreen : styles.vegDotRed]} />
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price} each</Text>
              {item.instructions ? (
                <Text style={styles.itemNotes} numberOfLines={1}>"{item.instructions}"</Text>
              ) : null}
            </View>

            {/* Stepper */}
            <View style={styles.stepper}>
              <TouchableOpacity 
                style={styles.stepperAction}
                onPress={() => updateQuantity(item.id, -1)}
              >
                <Minus size={14} color="#94a3b8" />
              </TouchableOpacity>
              <Text style={styles.stepperText}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.stepperAction}
                onPress={() => updateQuantity(item.id, 1)}
              >
                <Plus size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <View style={styles.billHeader}>
            <Receipt size={16} color="#f97316" />
            <Text style={styles.billTitle}>Bill Breakdown</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{cartSubtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Restaurant GST (5%)</Text>
            <Text style={styles.billValue}>₹{cartTax.toFixed(2)}</Text>
          </View>

          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.placeOrderAmount}>₹{cartTotal.toFixed(0)}</Text>
            <Text style={styles.placeOrderSub}>Table {currentTable || '01'} • Taxes Included</Text>
          </View>
          <View style={styles.placeOrderRight}>
            <Text style={styles.placeOrderText}>Proceed to Checkout</Text>
            <ChevronRight size={18} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

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
  clearText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  tableLockBanner: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.3)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableLockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableNumberPill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  tableLockText: {
    color: '#fed7aa',
    fontSize: 11,
    fontWeight: '600',
  },
  changeTableLink: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  cartItemsScroll: {
    padding: 18,
    gap: 12,
    paddingBottom: 110,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegDotGreen: {
    backgroundColor: '#10b981',
  },
  vegDotRed: {
    backgroundColor: '#ef4444',
  },
  itemName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  itemPrice: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  itemNotes: {
    color: '#94a3b8',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 4,
    height: 34,
  },
  stepperAction: {
    padding: 6,
  },
  stepperText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  billCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
    marginTop: 6,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  billTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  billValue: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 2,
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 16,
  },
  placeOrderButton: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeOrderAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  placeOrderSub: {
    color: '#fed7aa',
    fontSize: 10,
  },
  placeOrderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeOrderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseButton: {
    marginTop: 10,
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
