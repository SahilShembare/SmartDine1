import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTable } from '../context/TableContext';
import { 
  CheckCircle2, 
  Utensils, 
  ArrowRight, 
  RotateCcw, 
  Sparkles,
  Users
} from 'lucide-react-native';

export default function TableConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setTable, tables } = useTable();
  const tableNum = String(params.table || '01').padStart(2, '0');
  const matchedTable = tables.find(t => t.tableNumber === tableNum);

  const handleContinue = async () => {
    await setTable(tableNum);
    router.replace('/(tabs)/menu');
  };

  const handleCancel = () => {
    router.replace('/scanner');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        
        {/* Glow Badge */}
        <View style={styles.iconContainer}>
          <Utensils size={36} color="#f97316" />
        </View>

        {/* Table Details */}
        <View style={styles.tableNumberBadge}>
          <Text style={styles.tableNumberText}>TABLE {tableNum}</Text>
        </View>

        <Text style={styles.title}>You are ordering from Table {tableNum}</Text>
        <Text style={styles.subtitle}>
          {matchedTable?.location ? `${matchedTable.location} • ` : ''}
          {matchedTable?.capacity ? `${matchedTable.capacity} Seats • ` : ''}
          Active Dining Session
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            All dishes added to your cart will be routed to the kitchen for Table {tableNum}.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue to Menu</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCancel}
            activeOpacity={0.85}
          >
            <RotateCcw size={16} color="#94a3b8" />
            <Text style={styles.secondaryButtonText}>Scan Another Table</Text>
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
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tableNumberBadge: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tableNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoBoxText: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
});
