import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import { 
  User, 
  X, 
  Phone, 
  Mail, 
  LogOut, 
  ShoppingBag, 
  Clock, 
  Crown, 
  Sparkles, 
  Check, 
  Edit2, 
  LogIn,
  ChevronRight,
  ShieldCheck,
  UtensilsCrossed,
  Camera,
  Upload
} from 'lucide-react';

export default function CustomerProfileModal({ isOpen, onClose }) {
  const { currentUser, logout, updateProfile } = useAuth();
  const { currentTable, orders } = useTableOrder();
  const navigate = useNavigate();
  const location = useLocation();

  const avatarInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || localStorage.getItem('smartdine_guest_avatar') || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setAvatarUrl(result);
      localStorage.setItem('smartdine_guest_avatar', result);
      if (currentUser && updateProfile) {
        updateProfile({ photoURL: result }).catch(() => {});
      }
      toast.success('Profile picture updated!', { icon: '📸' });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentUser && updateProfile) {
        await updateProfile({ 
          displayName: displayName.trim(),
          photoURL: avatarUrl 
        });
      }
      localStorage.setItem('smartdine_guest_name', displayName.trim());
      localStorage.setItem('smartdine_guest_phone', phone.trim());
      if (avatarUrl) localStorage.setItem('smartdine_guest_avatar', avatarUrl);
      toast.success('Profile updated successfully!', { icon: '✨' });
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const myOrders = orders.filter(o => 
    (currentUser?.uid && o.customerId === currentUser.uid) || 
    (currentTable && o.tableNumber === currentTable)
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Hidden file input for Avatar Photo */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        accept="image/*" 
        onChange={handleAvatarUpload} 
        className="hidden" 
      />

      <div 
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col justify-between text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header with Signature Dark Restaurant Banner */}
        <div className="relative bg-slate-950 text-white p-6 pb-7 border-b border-slate-800">
          <div className="absolute top-3 right-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar with Royal Golden Ring and Camera Change Button */}
            <div className="relative group/avatar">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                title="Tap to change profile picture"
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-lg flex items-center justify-center cursor-pointer overflow-hidden relative"
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Customer Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-black text-2xl">
                    {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                  </div>
                )}
                
                {/* Hover / Tap Camera overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <Camera className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                title="Change Photo"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-110 shadow-md transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Identity Info */}
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white truncate">
                  {displayName || (currentUser ? 'SmartDine Customer' : 'Dining Guest')}
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  title="Edit details"
                  className="p-1 text-amber-400 hover:text-white transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 truncate">
                {currentUser?.email || (phone ? `+91 ${phone}` : 'Dine-In Customer')}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-950/80 text-slate-100">
          
          {/* Edit Profile Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Update Customer Information
                </h4>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sahil / Priya"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-glow cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Active Dining Table Session Card (Only shown on menu page when table is active) */}
          {currentTable && location.pathname === '/menu' && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Active Dining Table</div>
                  <div className="text-sm font-black text-white">
                    Table {currentTable}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>
          )}

          {/* Recent Orders Section */}
          {myOrders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Recent Table Orders</span>
              </h4>

              <div className="space-y-2">
                {myOrders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => {
                      onClose();
                      navigate(`/track/${order.id}`);
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 shadow-sm flex items-center justify-between cursor-pointer transition group"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span>Order #{order.id.slice(0, 6)}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-950 text-amber-400 border border-amber-500/30">
                          Table {order.tableNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {order.items?.length || 0} items • ₹{order.total?.toFixed(0)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-amber-400 uppercase">
                        {order.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {currentUser ? (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-400 font-bold text-xs border border-red-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition cursor-pointer"
            >
              <span>Close</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
