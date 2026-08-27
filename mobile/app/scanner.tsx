import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Alert,
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTable } from '../context/TableContext';
import { 
  X, 
  Flashlight, 
  FlashlightOff, 
  QrCode, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.72;

export default function ScannerScreen() {
  const router = useRouter();
  const { setTable, validateTable, tables } = useTable();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Parse table number from data
      // E.g. smartdine://table/01 or https://smartdine.netlify.app/menu?table=01 or simply "1" / "01"
      let tableNum: string | null = null;

      if (data.includes('smartdine://table/')) {
        tableNum = data.split('smartdine://table/')[1]?.split('?')[0];
      } else if (data.includes('table=')) {
        const match = data.match(/[?&]table=([^&#]*)/);
        if (match) tableNum = match[1];
      } else if (/^\d+$/.test(data.trim())) {
        tableNum = data.trim();
      }

      if (!tableNum) {
        Alert.alert('Invalid QR Code', 'This QR code does not belong to a Smart Dine table.', [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]);
        return;
      }

      const formatted = String(tableNum).padStart(2, '0');
      const isValid = await validateTable(formatted);

      if (!isValid) {
        Alert.alert(
          'Inactive Table',
          `Table ${formatted} is currently not active or not recognized. Please check with restaurant staff.`,
          [{ text: 'Scan Another', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Redirect to confirmation screen
      router.replace({ pathname: '/table-confirm', params: { table: formatted } });
    } catch (e) {
      Alert.alert('Scan Error', 'Could not read table QR code. Please try again.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;
    const formatted = String(manualInput.trim()).padStart(2, '0');
    const isValid = await validateTable(formatted);

    if (!isValid) {
      Alert.alert('Inactive Table', `Table ${formatted} is not available for ordering.`);
      return;
    }

    router.replace({ pathname: '/table-confirm', params: { table: formatted } });
  };

  return (
    <View style={styles.container}>
      
      {/* Top Controls */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity 
          style={styles.circleButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Scan Table QR</Text>

        <TouchableOpacity 
          style={styles.circleButton}
          onPress={() => setTorch(!torch)}
        >
          {torch ? <FlashlightOff size={20} color="#f97316" /> : <Flashlight size={20} color="#ffffff" />}
        </TouchableOpacity>
      </SafeAreaView>

      {/* Camera Viewport */}
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torch}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      ) : (
        <View style={styles.noCameraContainer}>
          <QrCode size={54} color="#64748b" />
          <Text style={styles.noCameraTitle}>Camera Access Required</Text>
          <Text style={styles.noCameraDesc}>
            Please enable camera permissions to scan restaurant table QR codes.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scanner Frame Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scannerFrame}>
          {/* Corner highlights */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <Text style={styles.instructionText}>
          Align the table standee QR code inside the frame
        </Text>
      </View>

      {/* Bottom Manual Entry & Table Selector */}
      <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
        <TouchableOpacity
          style={styles.manualToggleButton}
          onPress={() => setShowManual(!showManual)}
        >
          <Text style={styles.manualToggleText}>
            {showManual ? 'Hide Quick Select' : 'Cannot scan? Enter Table Number'}
          </Text>
        </TouchableOpacity>

        {showManual && (
          <View style={styles.manualCard}>
            <View style={styles.manualInputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g. 01, 02, 05"
                placeholderTextColor="#64748b"
                value={manualInput}
                onChangeText={setManualInput}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.manualSubmitBtn}
                onPress={handleManualSubmit}
              >
                <Text style={styles.manualSubmitText}>Select</Text>
              </TouchableOpacity>
            </View>

            {/* Quick table chips */}
            <View style={styles.quickChipsRow}>
              {tables.slice(0, 6).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.quickChip}
                  onPress={() => router.replace({ pathname: '/table-confirm', params: { table: t.tableNumber } })}
                >
                  <Text style={styles.quickChipText}>Table {t.tableNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    position: 'relative',
    backgroundColor: 'rgba(249, 115, 22, 0.03)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#f97316',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    padding: 20,
    alignItems: 'center',
  },
  manualToggleButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualToggleText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '700',
  },
  manualCard: {
    marginTop: 12,
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  manualSubmitBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickChipText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  noCameraContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  noCameraTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  noCameraDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  grantButton: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  grantButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
