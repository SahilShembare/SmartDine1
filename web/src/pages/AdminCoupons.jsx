import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { 
  TicketPercent, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Tag, 
  Sparkles,
  Percent,
  IndianRupee,
  Calendar,
  AlertCircle
} from 'lucide-react';

const INITIAL_COUPONS = [
  {
    id: 'c1',
    code: 'ROYAL50',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 150,
    minOrderValue: 299,
    expiryDate: '2026-12-31',
    active: true,
    description: '50% Royal Discount up to ₹150 on orders above ₹299',
    usageCount: 42
  },
  {
    id: 'c2',
    code: 'FEAST100',
    discountType: 'flat',
    discountValue: 100,
    maxDiscount: 100,
    minOrderValue: 499,
    expiryDate: '2026-12-31',
    active: true,
    description: 'Flat ₹100 Off on Grand Royal Feast above ₹499',
    usageCount: 28
  },
  {
    id: 'c3',
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 80,
    minOrderValue: 199,
    expiryDate: '2026-12-31',
    active: true,
    description: '20% Welcome dining discount up to ₹80',
    usageCount: 65
  },
  {
    id: 'c4',
    code: 'THALI30',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 120,
    minOrderValue: 349,
    expiryDate: '2026-12-31',
    active: true,
    description: '30% Special Thali Discount up to ₹120',
    usageCount: 19
  }
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_admin_coupons');
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100,
    minOrderValue: 299,
    expiryDate: '2026-12-31',
    description: ''
  });

  const saveToStorage = (updated) => {
    setCoupons(updated);
    localStorage.setItem('smartdine_admin_coupons', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 100,
      minOrderValue: 299,
      expiryDate: '2026-12-31',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount,
      minOrderValue: c.minOrderValue,
      expiryDate: c.expiryDate,
      description: c.description
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Enter a valid coupon code (e.g. SUMMER50)');
      return;
    }

    if (editingCoupon) {
      const updated = coupons.map(c => c.id === editingCoupon.id ? { ...c, ...formData, code: formData.code.toUpperCase() } : c);
      saveToStorage(updated);
      toast.success(`Coupon ${formData.code.toUpperCase()} updated!`);
    } else {
      const newCoupon = {
        id: `c_${Date.now()}`,
        ...formData,
        code: formData.code.toUpperCase(),
        active: true,
        usageCount: 0
      };
      saveToStorage([newCoupon, ...coupons]);
      toast.success(`Coupon ${formData.code.toUpperCase()} created! 🎉`);
    }
    setShowModal(false);
  };

  const toggleStatus = (id) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active: !c.active } : c);
    saveToStorage(updated);
    toast.success('Coupon status updated!');
  };

  const handleDelete = (id, code) => {
    if (confirm(`Delete coupon "${code}"?`)) {
      const updated = coupons.filter(c => c.id !== id);
      saveToStorage(updated);
      toast.success(`Coupon ${code} deleted.`);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 font-sans text-slate-100">
      <Sidebar mode="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <TicketPercent className="w-7 h-7 text-orange-500" />
              <span>Offers, Deals & Promo Coupons</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Create discount coupons, set minimum spend rules, caps and track guest redemption
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-lg shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <div
              key={coupon.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                coupon.active
                  ? 'bg-slate-900/90 border-slate-800 hover:border-orange-500/50'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-mono font-black text-sm border border-orange-500/30">
                      {coupon.code}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleStatus(coupon.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                      coupon.active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {coupon.active ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-medium mt-3">{coupon.description || 'Special dining promotion discount.'}</p>

                {/* Rules List */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Min Spend</span>
                    <div className="font-bold text-white">₹{coupon.minOrderValue}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Max Cap</span>
                    <div className="font-bold text-orange-400">₹{coupon.maxDiscount}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Expires On</span>
                    <div className="font-semibold text-slate-300">{coupon.expiryDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Redeemed</span>
                    <div className="font-bold text-emerald-400">{coupon.usageCount} times</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleOpenEdit(coupon)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Rules</span>
                </button>
                <button
                  onClick={() => handleDelete(coupon.id, coupon.code)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-black text-white">
                  {editingCoupon ? `Edit Coupon ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROYAL50, FESTIVE100"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-white uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-orange-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Min Order Spend (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Description (Shown to Customer)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 50% discount up to ₹150 on orders above ₹299"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black shadow-lg"
                  >
                    {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
