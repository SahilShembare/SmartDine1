import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Upload, 
  FolderPlus, 
  Tag, 
  IndianRupee,
  Utensils,
  Image as ImageIcon
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import toast from 'react-hot-toast';

export default function MenuManagement({ autoOpenAdd = false }) {
  const { 
    menuItems = [], 
    categories = [], 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleItemAvailability,
    addCategory,
    setCategories 
  } = useTableOrder();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(autoOpenAdd);
  const [editingItem, setEditingItem] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State for Food Item
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    category: '',
    price: '',
    description: '',
    imageUrl: '',
    isVeg: true,
    inStock: true
  });

  // Image upload preview
  const [imagePreview, setImagePreview] = useState('');

  // New Category Form
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || 
        item.categoryId === selectedCategory || 
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Open Add Item Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || 'main-course',
      category: categories[0]?.name || 'Main Course',
      price: '',
      description: '',
      imageUrl: '/dishes/paneer_butter_masala.jpg',
      isVeg: true,
      inStock: true
    });
    setImagePreview('/dishes/paneer_butter_masala.jpg');
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId || (categories[0]?.id || 'main-course'),
      category: item.category || 'Main Course',
      price: item.price,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      inStock: item.inStock !== undefined ? item.inStock : true
    });
    setImagePreview(item.imageUrl || '');
    setIsItemModalOpen(true);
  };

  // Image file handler
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Item (Add or Edit)
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter food item name');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const categoryObj = categories.find(c => c.id === formData.categoryId);
    const categoryName = categoryObj ? categoryObj.name : (formData.category || 'Main Course');

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        ...formData,
        price: Number(formData.price),
        category: categoryName
      });
      toast.success('Food item updated successfully!');
    } else {
      addMenuItem({
        ...formData,
        price: Number(formData.price),
        category: categoryName
      });
      toast.success('Food item added successfully!');
    }

    setIsItemModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (itemId) => {
    deleteMenuItem(itemId);
    toast.success('Food item deleted');
    setDeleteConfirmId(null);
  };

  // Quick Price Update
  const handleQuickPriceUpdate = (item, newPrice) => {
    const parsed = Number(newPrice);
    if (!parsed || parsed <= 0) return;
    updateMenuItem(item.id, { price: parsed });
    toast.success(`Price updated to ₹${parsed}`);
  };

  // Add Category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory({
      name: newCategoryName.trim(),
      id: newCategoryName.toLowerCase().replace(/\s+/g, '-')
    });
    setNewCategoryName('');
    toast.success('Category added successfully!');
  };

  // Delete Category
  const handleDeleteCategory = (catId) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    toast.success('Category removed');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Menu Management
          </h2>
          <p className="text-xs text-slate-500">
            Add, update dishes, manage availability and prices
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-slate-600" />
            <span>Manage Categories</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dish by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Food Item</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price (₹)</th>
                <th className="px-4 py-3.5">Dietary</th>
                <th className="px-4 py-3.5">Availability</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No food items match your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isInStock = item.inStock !== undefined ? item.inStock : (item.available !== false);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Food Item & Thumbnail */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || '/dishes/paneer_butter_masala.jpg'}
                            alt={item.name}
                            onError={(e) => { e.target.src = '/dishes/paneer_butter_masala.jpg'; }}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                              {item.description || 'Delicious freshly prepared dish'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <span>₹</span>
                          <input
                            type="number"
                            defaultValue={item.price}
                            onBlur={(e) => handleQuickPriceUpdate(item, e.target.value)}
                            className="w-20 px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white text-xs font-bold transition"
                            title="Click to edit price"
                          />
                        </div>
                      </td>

                      {/* Dietary */}
                      <td className="px-4 py-3">
                        {item.isVeg ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Veg
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Non-Veg
                          </span>
                        )}
                      </td>

                      {/* Availability Switch */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            toggleItemAvailability(item.id);
                            toast.success(`${item.name} marked ${!isInStock ? 'In Stock' : 'Out of Stock'}`);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                            isInStock
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isInStock ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                          <span>{isInStock ? 'In Stock' : 'Out of Stock'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit dish"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === item.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 text-slate-500 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete dish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ADD / EDIT FOOD ITEM MODAL                                   */}
      {/* ============================================================ */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="py-4 space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const sel = categories.find(c => c.id === e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        categoryId: e.target.value,
                        category: sel ? sel.name : prev.category 
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="250"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Dietary & Stock Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dietary Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isVeg: true }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                        formData.isVeg
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isVeg: false }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                        !formData.isVeg
                          ? 'bg-rose-50 border-rose-500 text-rose-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Availability
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, inStock: !prev.inStock }))}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold border ${
                      formData.inStock
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}
                  >
                    {formData.inStock ? '✓ Available (In Stock)' : '✕ Out of Stock'}
                  </button>
                </div>
              </div>

              {/* Image Upload & URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Image
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Or enter image URL..."
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, taste, serving details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                >
                  {editingItem ? 'Update Food Item' : 'Save Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CATEGORY MANAGEMENT MODAL                                    */}
      {/* ============================================================ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Manage Categories
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="py-4 flex gap-2">
              <input
                type="text"
                placeholder="New Category Name (e.g. Desserts)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Category List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {categories.map((cat) => {
                const count = menuItems.filter(i => i.categoryId === cat.id || i.category === cat.name).length;
                return (
                  <div key={cat.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {count} dishes
                      </span>
                    </div>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
