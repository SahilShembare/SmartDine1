import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { localStore, isFirebaseConfigured, db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Flame, 
  Check, 
  X, 
  Image as ImageIcon,
  Sparkles,
  Filter
} from 'lucide-react';

export default function AdminMenu() {
  const { menuItems, setMenuItems, categories } = useTableOrder();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegFilter, setVegFilter] = useState('all'); // all, veg, non-veg

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: categories[0]?.id || 'starters',
    imageUrl: '',
    isVeg: true,
    available: true,
    popular: false,
    ingredients: ''
  });

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesVeg = vegFilter === 'all' || 
                       (vegFilter === 'veg' && item.isVeg) || 
                       (vegFilter === 'non-veg' && !item.isVeg);
    return matchesSearch && matchesCategory && matchesVeg;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?.id || 'starters',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      available: true,
      popular: false,
      ingredients: 'Fresh spices, herbs, garlic'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId || 'starters',
      imageUrl: item.imageUrl || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      available: item.available !== undefined ? item.available : true,
      popular: item.popular || false,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price) || 0,
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      isVeg: formData.isVeg,
      available: formData.available,
      popular: formData.popular,
      ingredients: formData.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), itemData);
      } else {
        const updated = menuItems.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i);
        setMenuItems(updated);
        localStore.saveMenuItems(updated);
      }
    } else {
      itemData.createdAt = new Date().toISOString();
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'menuItems'), itemData);
      } else {
        const newItem = { id: `item-${Date.now()}`, ...itemData };
        const updated = [newItem, ...menuItems];
        setMenuItems(updated);
        localStore.saveMenuItems(updated);
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      if (isFirebaseConfigured) {
        await deleteDoc(doc(db, 'menuItems', id));
      } else {
        const updated = menuItems.filter(i => i.id !== id);
        setMenuItems(updated);
        localStore.saveMenuItems(updated);
      }
    }
  };

  const toggleAvailability = async (item) => {
    const updatedStatus = !item.available;
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'menuItems', item.id), { available: updatedStatus });
    } else {
      const updated = menuItems.map(i => i.id === item.id ? { ...i, available: updatedStatus } : i);
      setMenuItems(updated);
      localStore.saveMenuItems(updated);
    }
  };

  const handleClearAll = async () => {
    if (confirm('⚠️ Are you sure you want to delete ALL menu items? This will remove all dishes.')) {
      if (isFirebaseConfigured) {
        for (const item of menuItems) {
          try {
            await deleteDoc(doc(db, 'menuItems', item.id));
          } catch {}
        }
      }
      setMenuItems([]);
      localStore.saveMenuItems([]);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <Sidebar mode="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Menu Item Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, edit, toggle availability, and organize restaurant dishes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {menuItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Dishes</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-glow transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-48 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Categories ({menuItems.length})</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Veg/NonVeg Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setVegFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                vegFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                vegFilter === 'veg' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Veg Only
            </button>
            <button
              onClick={() => setVegFilter('non-veg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                vegFilter === 'non-veg' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Non-Veg
            </button>
          </div>

          <div className="ml-auto text-xs text-slate-400 hidden lg:block">
            Showing <strong>{filteredItems.length}</strong> items
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border bg-slate-900/90 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-slate-700 ${
                !item.available ? 'opacity-60 border-slate-800/60' : 'border-slate-800'
              }`}
            >
              {/* Image & Badges */}
              <div className="relative h-44 bg-slate-800 overflow-hidden group">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

                {/* Veg / Non-Veg Indicator */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    item.isVeg ? 'border-emerald-500' : 'border-red-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </span>
                  <span className="text-[11px] font-bold text-white">
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </span>
                </div>

                {/* Popular Badge */}
                {item.popular && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                    <Flame className="w-3 h-3" />
                    BESTSELLER
                  </div>
                )}

                {/* Price in Bottom Overlay */}
                <div className="absolute bottom-3 left-3">
                  <span className="text-xl font-extrabold text-white">
                    ₹{item.price}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-100 leading-snug">
                    {item.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Ingredients chips */}
                {item.ingredients && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(Array.isArray(item.ingredients) ? item.ingredients : [item.ingredients]).slice(0, 3).map((ing, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons & Stock Switch */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-800/20 flex items-center justify-between">
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    item.available 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {item.available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {item.available ? 'In Stock' : 'Out of Stock'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white">
                {editingItem ? 'Edit Dish' : 'Add New Dish'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="280"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Appetizing description of ingredients, cooking style, and flavors..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ingredients (comma separated)</label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="Paneer, Cashew cream, Butter, Kasturi methi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-200">Is Veg</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-200">Popular</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-slate-200">In Stock</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-glow transition active:scale-95"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
