import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTable } from '../../context/TableContext';
import { useCart } from '../../context/CartContext';
import { 
  QrCode, 
  Search, 
  Flame, 
  Sparkles, 
  Utensils, 
  ChevronRight, 
  Clock, 
  ShoppingBag,
  User as UserIcon,
  Tag
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTable, menuItems, categories } = useTable();
  const { cartCount, addToCart } = useCart();
  const [search, setSearch] = useState('');

  const popularDishes = menuItems.filter(item => item.popular).slice(0, 6);
  const recommendedDishes = menuItems.filter(item => !item.popular).slice(0, 6);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Top Header with Profile Avatar on Top Right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Utensils size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.logoTitle}>SMART DINE</Text>
            <Text style={styles.logoSubtitle}>Grand Continental Dining</Text>
          </View>
        </View>

        {/* Top-Right Profile Avatar */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={18} color="#f97316" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting Banner */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.subGreetingText}>What would you like to order today?</Text>
        </View>

        {/* Active Table Badge / Scan Table Callout */}
        {currentTable ? (
          <View style={styles.activeTableCard}>
            <View style={styles.tableInfoLeft}>
              <View style={styles.tablePill}>
                <Text style={styles.tablePillText}>TABLE {currentTable}</Text>
              </View>
              <View>
                <Text style={styles.tableConnectedTitle}>Connected & Active</Text>
                <Text style={styles.tableConnectedSub}>Your orders will be served directly to Table {currentTable}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.changeTableButton}
              onPress={() => router.push('/scanner')}
            >
              <Text style={styles.changeTableText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.scanCtaCard}
            onPress={() => router.push('/scanner')}
            activeOpacity={0.9}
          >
            <View style={styles.scanIconBg}>
              <QrCode size={26} color="#ffffff" />
            </View>
            <View style={styles.scanTextContainer}>
              <Text style={styles.scanTitle}>Scan Restaurant Table QR</Text>
              <Text style={styles.scanSubtitle}>Scan the QR on your table standee to begin ordering</Text>
            </View>
            <ChevronRight size={20} color="#fb923c" />
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pizza, biryani, starters..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              if (text.length > 0) {
                router.push('/(tabs)/menu');
              }
            }}
          />
        </View>

        {/* Special Offer Banner */}
        <View style={styles.offerBanner}>
          <View style={styles.offerTag}>
            <Tag size={12} color="#f97316" />
            <Text style={styles.offerTagText}>OFFER OF THE DAY</Text>
          </View>
          <Text style={styles.offerTitle}>Get 15% OFF on Chef's Dum Biryani</Text>
          <Text style={styles.offerSubtitle}>Use contactless dining & receive instant reward points</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={styles.categoryCard}
              onPress={() => router.push('/(tabs)/menu')}
              activeOpacity={0.8}
            >
              <Image source={{ uri: cat.imageUrl }} style={styles.categoryImage} />
              <View style={styles.categoryOverlay} />
              <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Dishes Carousel */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWithIcon}>
            <Flame size={18} color="#f97316" />
            <Text style={styles.sectionTitle}>Popular Bestsellers</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.seeAllText}>View Menu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dishesScroll}
        >
          {popularDishes.map((dish) => (
            <TouchableOpacity
              key={dish.id}
              style={styles.dishCard}
              onPress={() => router.push({ pathname: '/food/[id]', params: { id: dish.id } })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
              
              <View style={styles.dishBadgeRow}>
                <View style={[styles.vegBadge, dish.isVeg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                  <View style={[styles.vegDot, dish.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                </View>
                <View style={styles.bestsellerPill}>
                  <Text style={styles.bestsellerText}>BESTSELLER</Text>
                </View>
              </View>

              <View style={styles.dishInfo}>
                <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                <Text style={styles.dishDesc} numberOfLines={2}>{dish.description}</Text>
                
                <View style={styles.dishPriceRow}>
                  <Text style={styles.dishPrice}>₹{dish.price}</Text>
                  <TouchableOpacity 
                    style={styles.addDishButton}
                    onPress={() => addToCart(dish, 1)}
                  >
                    <Text style={styles.addDishText}>+ ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended Dishes */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWithIcon}>
            <Sparkles size={18} color="#fbbf24" />
            <Text style={styles.sectionTitle}>Chef's Recommendations</Text>
          </View>
        </View>

        <View style={styles.recommendedList}>
          {recommendedDishes.map((dish) => (
            <TouchableOpacity
              key={dish.id}
              style={styles.recommendedCard}
              onPress={() => router.push({ pathname: '/food/[id]', params: { id: dish.id } })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: dish.imageUrl }} style={styles.recommendedImage} />
              <View style={styles.recommendedDetails}>
                <View style={styles.vegBadgeSmall}>
                  <View style={[styles.vegDot, dish.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                  <Text style={styles.vegText}>{dish.isVeg ? 'VEG' : 'NON-VEG'}</Text>
                </View>
                <Text style={styles.recommendedName} numberOfLines={1}>{dish.name}</Text>
                <Text style={styles.recommendedDesc} numberOfLines={1}>{dish.description}</Text>
                <Text style={styles.recommendedPrice}>₹{dish.price}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addMiniButton}
                onPress={() => addToCart(dish, 1)}
              >
                <Text style={styles.addMiniText}>ADD</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartCountCircle}>
            <Text style={styles.cartCountText}>{cartCount}</Text>
          </View>
          <Text style={styles.floatingCartText}>View Cart & Order</Text>
          <ChevronRight size={18} color="#ffffff" />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  profileButton: {
    padding: 2,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  greetingSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subGreetingText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  activeTableCard: {
    marginHorizontal: 18,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tablePill: {
    backgroundColor: '#f97316',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tablePillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  tableConnectedTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tableConnectedSub: {
    color: '#fdba74',
    fontSize: 10,
    marginTop: 1,
  },
  changeTableButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeTableText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  scanCtaCard: {
    marginHorizontal: 18,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scanIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  scanSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  searchContainer: {
    marginHorizontal: 18,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  offerBanner: {
    marginHorizontal: 18,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#182234',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  offerTagText: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  offerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesScroll: {
    paddingHorizontal: 18,
    gap: 12,
  },
  categoryCard: {
    width: 90,
    height: 90,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 8,
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  categoryName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  dishesScroll: {
    paddingHorizontal: 18,
    gap: 14,
  },
  dishCard: {
    width: 200,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: 120,
  },
  dishBadgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vegBadge: {
    width: 18,
    height: 18,
    borderRadius: 5,
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vegDotGreen: {
    backgroundColor: '#10b981',
  },
  vegDotRed: {
    backgroundColor: '#ef4444',
  },
  bestsellerPill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestsellerText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dishDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  dishPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dishPrice: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '800',
  },
  addDishButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#f97316',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addDishText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
  },
  recommendedList: {
    paddingHorizontal: 18,
    gap: 12,
  },
  recommendedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  recommendedImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
  },
  recommendedDetails: {
    flex: 1,
  },
  vegBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vegText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  recommendedName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  recommendedDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
  recommendedPrice: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  addMiniButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addMiniText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    right: 18,
    backgroundColor: '#ea580c',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cartCountCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    fontSize: 14,
    fontWeight: '800',
  },
});
