import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTable } from '../../context/TableContext';
import { useCart } from '../../context/CartContext';
import { 
  X, 
  Plus, 
  Minus, 
  Flame, 
  Clock, 
  Utensils, 
  Check, 
  Sparkles 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function FoodDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { menuItems } = useTable();
  const { addToCart } = useCart();
  
  const dish = menuItems.find((item) => item.id === id);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState('');

  if (!dish) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Dish not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAdd = () => {
    addToCart(dish, qty, instructions);
    router.back();
  };

  return (
    <View style={styles.container}>
      
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: dish.imageUrl }} style={styles.heroImage} />
        
        {/* Close Button */}
        <SafeAreaView style={styles.closeButtonContainer} edges={['top']}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Content Scroll */}
      <ScrollView 
        contentContainerStyle={styles.detailsContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Veg Badge & Popular */}
        <View style={styles.badgeRow}>
          <View style={[styles.vegBadge, dish.isVeg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
            <View style={[styles.vegDot, dish.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
            <Text style={styles.vegText}>{dish.isVeg ? 'VEGETARIAN' : 'NON-VEGETARIAN'}</Text>
          </View>

          {dish.popular && (
            <View style={styles.popularBadge}>
              <Flame size={12} color="#f97316" />
              <Text style={styles.popularText}>CHEF'S SPECIAL</Text>
            </View>
          )}
        </View>

        {/* Title & Price */}
        <View style={styles.titleRow}>
          <Text style={styles.dishTitle}>{dish.name}</Text>
          <Text style={styles.dishPrice}>₹{dish.price}</Text>
        </View>

        {/* Description */}
        <Text style={styles.dishDescription}>{dish.description}</Text>

        {/* Ingredients */}
        {dish.ingredients && (
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Key Ingredients & Flavors</Text>
            <View style={styles.ingredientsGrid}>
              {(Array.isArray(dish.ingredients) ? dish.ingredients : [dish.ingredients]).map((ing: string, i: number) => (
                <View key={i} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cooking Notes Input */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Cooking Customization Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Mild spice, less oil, extra lemon..."
            placeholderTextColor="#64748b"
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

      </ScrollView>

      {/* Bottom Floating Bar */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {/* Stepper */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity 
            style={styles.stepperBtn}
            onPress={() => setQty(Math.max(1, qty - 1))}
          >
            <Minus size={18} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.stepperCount}>{qty}</Text>
          <TouchableOpacity 
            style={styles.stepperBtn}
            onPress={() => setQty(qty + 1)}
          >
            <Plus size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Add to Cart CTA */}
        <TouchableOpacity 
          style={styles.addCtaButton}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Text style={styles.addCtaText}>Add to Cart • ₹{(dish.price * qty).toFixed(0)}</Text>
        </TouchableOpacity>
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  imageContainer: {
    width: '100%',
    height: 260,
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 16,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 110,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  vegBadgeGreen: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  vegBadgeRed: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  vegDot: {
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
  vegText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  dishTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  dishPrice: {
    color: '#f97316',
    fontSize: 20,
    fontWeight: '800',
  },
  dishDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  ingredientsSection: {
    gap: 8,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ingredientChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  notesSection: {
    gap: 8,
    marginTop: 6,
  },
  notesInput: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    height: 48,
  },
  stepperBtn: {
    padding: 8,
  },
  stepperCount: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  addCtaButton: {
    flex: 1,
    backgroundColor: '#ea580c',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  notFoundText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
