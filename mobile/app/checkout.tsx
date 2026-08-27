import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTable } from '../context/TableContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Phone, 
  Receipt, 
  Utensils, 
  CreditCard 
} from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTable } = useTable();
  const { 
    cart, 
    cartSubtotal, 
    cartTax, 
    cartTotal, 
    placeOrder 
  } = useCart();

  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pay after Dining');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmOrder = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter customer name.');
      return;
    }

    Alert.alert(
      'Confirm Order Placement',
      `Send order to Kitchen for Table ${currentTable || '01'} totaling ₹${cartTotal.toFixed(0)}?`,
      [
        { text: 'Go Back', style: 'cancel' },
        { 
          text: 'Confirm & Place', 
          onPress: executeOrderPlacement 
        }
      ]
    );
  };

  const executeOrderPlacement = async () => {
    setSubmitting(true);
    try {
      const orderId = await placeOrder({
        name: name.trim(),
        phone: phone.trim(),
        customerId: user?.uid || null,
        notes: notes.trim(),
        paymentMethod: paymentMethod
      });

      router.replace({
        pathname: '/order-success',
        params: { orderId: orderId, table: currentTable || '01', total: cartTotal.toFixed(0) }
      });
    } catch (e: any) {
      Alert.alert('Order Failed', e.message || 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout & Confirm</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Table Banner */}
        <View style={styles.tableCard}>
          <View style={styles.tablePill}>
            <Text style={styles.tablePillText}>TABLE {currentTable || '01'}</Text>
          </View>
          <View>
            <Text style={styles.tableTitle}>Dine-In Table Connected</Text>
            <Text style={styles.tableSub}>Your order will be prepared and brought to your table</Text>
          </View>
        </View>

        {/* Customer Information Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Name *</Text>
            <View style={styles.inputContainer}>
              <User size={16} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
            <View style={styles.inputContainer}>
              <Phone size={16} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cooking / Delivery Note</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Extra napkins, less spicy, water on table"
              placeholderTextColor="#64748b"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Payment Options */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodsRow}>
            {['Pay after Dining', 'Pay at Counter / UPI'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.paymentBtn, paymentMethod === m && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.paymentBtnText, paymentMethod === m && styles.paymentBtnTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.formCard}>
          <View style={styles.summaryHeader}>
            <Receipt size={16} color="#f97316" />
            <Text style={styles.sectionTitle}>Order Summary ({cart.length} items)</Text>
          </View>

          <View style={styles.itemsList}>
            {cart.map((item) => (
              <View key={item.id} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemText}>
                  <Text style={styles.summaryQty}>{item.quantity}x </Text>
                  {item.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ₹{(item.price * item.quantity).toFixed(0)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsContainer}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>₹{cartSubtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>GST (5%)</Text>
              <Text style={styles.totalVal}>₹{cartTax.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalLine, styles.grandTotalLine]}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalVal}>₹{cartTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Place Order Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmOrder}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.confirmBtnText}>
                Confirm Order • ₹{cartTotal.toFixed(0)}
              </Text>
            </>
          )}
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
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 110,
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    gap: 12,
  },
  tablePill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tablePillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  tableTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tableSub: {
    color: '#fed7aa',
    fontSize: 10,
    marginTop: 1,
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  notesInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  paymentBtnActive: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  paymentBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  paymentBtnTextActive: {
    color: '#f97316',
  },
  summaryHeader: {
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
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  summaryQty: {
    color: '#f97316',
    fontWeight: '800',
  },
  summaryItemPrice: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  totalsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    gap: 4,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  totalVal: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  grandTotalLine: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  grandTotalVal: {
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
  confirmBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
