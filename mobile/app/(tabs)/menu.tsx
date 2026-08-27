import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTable } from '../../context/TableContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Flame, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ChevronRight, 
  Filter,
  Lock,
  LogIn 
} from 'lucide-react-native';

export default function MenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { menuItems, categories, currentTable } = useTable();
  const { cart, addToCart, cartCount, cartTotal } = useCart();
  
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const filteredDishes = menuItems.filter((item) => {
    const matchesCat = selectedCat === 'all' || item.categoryId === selectedCat;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesCat && matchesSearch && matchesVeg;
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loginGateContainer}>
          <View style={styles.loginGateIconBg}>
            <Lock size={36} color="#f97316" />
          </View>
          <Text style={styles.loginGateTitle}>Login Required to View Menu</Text>
          <Text style={styles.loginGateDesc}>
            Please sign in or create a customer account to browse our digital menu and order dishes.
          </Text>
          <TouchableOpacity
            style={styles.loginGateButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <LogIn size={18} color="#ffffff" />
            <Text style={styles.loginGateButtonText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Digital Menu</Text>
          <Text style={styles.headerSub}>
            {currentTable ? `Ordering for Table ${currentTable}` : 'Grand Continental Dining'}
          </Text>
        </View>

        {currentTable && (
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>TABLE {currentTable}</Text>
          </View>
        )}
      </View>

      {/* Search & Filter bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={[styles.vegFilterButton, vegOnly && styles.vegFilterButtonActive]}
          onPress={() => setVegOnly(!vegOnly)}
        >
          <View style={[styles.vegDot, vegOnly ? styles.vegDotActive : styles.vegDotInactive]} />
          <Text style={[styles.vegFilterText, vegOnly && styles.vegFilterTextActive]}>Veg</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoriesBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          <TouchableOpacity
            style={[styles.categoryPill, selectedCat === 'all' && styles.categoryPillActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.categoryPillText, selectedCat === 'all' && styles.categoryPillTextActive]}>
              All ({menuItems.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            const isActive = selectedCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCat(cat.id)}
              >
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dishes List */}
      <ScrollView
        contentContainerStyle={styles.dishesList}
        showsVerticalScrollIndicator={false}
      >
        {filteredDishes.map((dish) => {
          const cartItem = cart.find((i) => i.id === dish.id);
          return (
            <TouchableOpacity
              key={dish.id}
              style={styles.dishCard}
              onPress={() => router.push({ pathname: '/food/[id]', params: { id: dish.id } })}
              activeOpacity={0.85}
            >
              {/* Left Info */}
              <View style={styles.dishInfo}>
                <View style={styles.dishBadgeRow}>
                  <View style={[styles.vegBadge, dish.isVeg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                    <View style={[styles.vegDot, dish.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                  </View>
                  {dish.popular && (
                    <View style={styles.popularBadge}>
                      <Flame size={10} color="#f97316" />
                      <Text style={styles.popularText}>BESTSELLER</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.dishName}>{dish.name}</Text>
                <Text style={styles.dishPrice}>₹{dish.price}</Text>
                <Text style={styles.dishDesc} numberOfLines={2}>{dish.description}</Text>

                {dish.ingredients && (
                  <View style={styles.ingredientsRow}>
                    {(Array.isArray(dish.ingredients) ? dish.ingredients : [dish.ingredients]).slice(0, 2).map((ing: string, idx: number) => (
                      <Text key={idx} style={styles.ingredientTag}>{ing}</Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Right Image & Add Controls */}
              <View style={styles.dishImageContainer}>
                <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToCart(dish, 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>
                    {cartItem ? `ADD (${cartItem.quantity})` : '+ ADD'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartCountCircle}>
            <Text style={styles.cartCountText}>{cartCount}</Text>
          </View>
          <View>
            <Text style={styles.floatingCartText}>View Cart ({cartCount} items)</Text>
            <Text style={styles.floatingCartSub}>Total: ₹{cartTotal.toFixed(0)}</Text>
          </View>
          <ChevronRight size={20} color="#ffffff" />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
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
  tableBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableBadgeText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
  },
  vegFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
  },
  vegFilterButtonActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  vegFilterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  vegFilterTextActive: {
    color: '#10b981',
  },
  categoriesBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  categoryPillsScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#f97316',
  },
  categoryPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  dishesList: {
    padding: 18,
    gap: 14,
    paddingBottom: 100,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    gap: 12,
  },
  dishInfo: {
    flex: 1,
  },
  dishBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegBadge: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBadgeGreen: {
    borderColor: '#10b981',
  },
  vegBadgeRed: {
    borderColor: '#ef4444',
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
  vegDotActive: {
    backgroundColor: '#10b981',
  },
  vegDotInactive: {
    backgroundColor: '#64748b',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    color: '#f97316',
    fontSize: 8,
    fontWeight: '800',
  },
  dishName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dishPrice: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  dishDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  ingredientTag: {
    fontSize: 9,
    color: '#64748b',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dishImageContainer: {
    width: 95,
    height: 95,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: '#ea580c',
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    right: 18,
    backgroundColor: '#ea580c',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  cartCountCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '800',
  },
  floatingCartText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  floatingCartSub: {
    color: '#fed7aa',
    fontSize: 10,
  },
  loginGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  loginGateIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  loginGateTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  loginGateDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  loginGateButton: {
    backgroundColor: '#ea580c',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    width: '100%',
    maxWidth: 280,
    justifyContent: 'center',
  },
  loginGateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
