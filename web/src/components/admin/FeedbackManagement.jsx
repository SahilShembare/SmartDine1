import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Star, 
  MessageSquareHeart, 
  Search, 
  Trash2, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  ThumbsUp, 
  AlertCircle, 
  UtensilsCrossed, 
  Send, 
  Edit3, 
  X,
  Filter,
  RotateCw,
  Volume2,
  VolumeX,
  Calendar,
  Radio
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import { playOrderBellSound } from '../../utils/notificationSound';
import toast from 'react-hot-toast';

export default function FeedbackManagement() {
  const { 
    customerFeedbacks = [], 
    deleteCustomerFeedback, 
    replyToCustomerFeedback,
    refreshFeedbacks
  } = useTableOrder();

  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | 'today' | '5' | '4' | '3' | 'critical'
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  // Real-Time Live Stream Controls
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('smartdine_feedback_sound') !== 'false';
    } catch {
      return true;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date());

  const prevCountRef = useRef(customerFeedbacks.length);
  const isInitialMount = useRef(true);

  // Live Auto-Alert chime and toast when a diner submits feedback
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCountRef.current = customerFeedbacks.length;
      return;
    }

    if (customerFeedbacks.length > prevCountRef.current) {
      const latest = customerFeedbacks[0];
      if (soundEnabled) {
        try {
          playOrderBellSound();
        } catch {}
      }
      toast.success(
        `🛎️ New ${latest?.overallRating || 5}★ Review from Table ${latest?.tableNumber || 'Guest'} (${latest?.customerName || 'Customer'})!`,
        {
          icon: '⭐',
          duration: 6000,
          style: {
            borderRadius: '16px',
            background: '#0f172a',
            color: '#fff',
            fontWeight: '600'
          }
        }
      );
      setLastSyncTime(new Date());
    }
    prevCountRef.current = customerFeedbacks.length;
  }, [customerFeedbacks, soundEnabled]);

  // Check if a feedback was received recently (within 20 mins)
  const isRecentFeedback = (fb) => {
    if (!fb.createdAt) return false;
    try {
      const diffMs = Date.now() - new Date(fb.createdAt).getTime();
      return diffMs >= 0 && diffMs <= 20 * 60 * 1000;
    } catch {
      return false;
    }
  };

  // Check if a feedback was received today
  const isTodayFeedback = (fb) => {
    const raw = fb.createdAt || fb.date;
    if (!raw) return false;
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
    } catch {}
    return String(fb.date || '').toLowerCase().includes('today');
  };

  // Safe formatted date
  const formatFeedbackDate = (fb) => {
    if (fb.createdAt) {
      try {
        const d = new Date(fb.createdAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch {}
    }
    return fb.date || 'Recent';
  };

  // 1. Analytics & Summary Metrics
  const stats = useMemo(() => {
    const total = customerFeedbacks.length;
    if (total === 0) {
      return {
        avgRating: 5.0,
        total: 0,
        positivePct: 100,
        responseRate: 100,
        todayCount: 0,
        countsByStar: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;
    let respondedCount = 0;
    let positiveCount = 0;
    let todayCount = 0;

    customerFeedbacks.forEach(fb => {
      const r = Math.min(5, Math.max(1, Math.round(Number(fb.overallRating) || 5)));
      counts[r] = (counts[r] || 0) + 1;
      sumRating += Number(fb.overallRating) || 5;
      if (fb.restaurantResponse && fb.restaurantResponse.trim()) {
        respondedCount++;
      }
      if (r >= 4) {
        positiveCount++;
      }
      if (isTodayFeedback(fb)) {
        todayCount++;
      }
    });

    return {
      avgRating: (sumRating / total).toFixed(1),
      total,
      positivePct: Math.round((positiveCount / total) * 100),
      responseRate: Math.round((respondedCount / total) * 100),
      todayCount,
      countsByStar: counts
    };
  }, [customerFeedbacks]);

  // 2. Filtered Feedback List
  const filteredFeedbacks = useMemo(() => {
    return customerFeedbacks.filter(fb => {
      // Rating / Date Filter
      const r = Number(fb.overallRating) || 5;
      if (ratingFilter === 'today' && !isTodayFeedback(fb)) return false;
      if (ratingFilter === '5' && r !== 5) return false;
      if (ratingFilter === '4' && r !== 4) return false;
      if (ratingFilter === '3' && r !== 3) return false;
      if (ratingFilter === 'critical' && r > 2) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = String(fb.customerName || '').toLowerCase().includes(q);
        const matchTable = String(fb.tableNumber || '').toLowerCase().includes(q);
        const matchOrder = String(fb.orderId || '').toLowerCase().includes(q);
        const matchText = String(fb.writtenText || '').toLowerCase().includes(q);
        const matchTags = Array.isArray(fb.selectedTags) && fb.selectedTags.some(t => String(t).toLowerCase().includes(q));
        const matchDishes = fb.itemRatings && Object.keys(fb.itemRatings).some(d => d.toLowerCase().includes(q));
        return matchName || matchTable || matchOrder || matchText || matchTags || matchDishes;
      }

      return true;
    });
  }, [customerFeedbacks, ratingFilter, searchQuery]);

  // 3. Actions
  const handleStartReply = (fb) => {
    setEditingReplyId(fb.id);
    setReplyText(fb.restaurantResponse || '');
  };

  const handleSaveReply = (id) => {
    if (!replyText.trim()) {
      toast.error('Response cannot be empty');
      return;
    }
    replyToCustomerFeedback(id, replyText.trim());
    setEditingReplyId(null);
    setReplyText('');
    toast.success('Official response updated and saved!', { icon: '💬' });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete feedback from ${name || 'guest'}?`)) {
      deleteCustomerFeedback(id);
      toast.success('Feedback entry removed.');
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    if (typeof refreshFeedbacks === 'function') {
      refreshFeedbacks();
    }
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      toast.success('✨ Feedback stream is live & up to date!', { icon: '🔄' });
    }, 450);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('smartdine_feedback_sound', String(next));
    } catch {}
    toast(next ? 'Feedback chime sound enabled' : 'Feedback chime sound muted', {
      icon: next ? '🔔' : '🔕'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header Banner with Live Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Customer Feedback & Ratings</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                    {stats.total} Reviews
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time dining ratings, dish satisfaction, sentiment telemetry & official replies
              </p>
            </div>
          </div>

          {/* Real-Time Live Status Pill */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Live Auto-Sync Active</span>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Last synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest, dish, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Click to mute feedback chime' : 'Click to enable feedback chime'}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer shrink-0 ${
              soundEnabled 
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Chime ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Chime Muted</span>
              </>
            )}
          </button>

          {/* Manual Force Sync Button */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title="Force refresh feedback telemetry"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{stats.avgRating}</span>
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Average Rating</p>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Total Feedbacks</p>
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600">{stats.positivePct}%</span>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Delighted Guests (4-5★)</p>
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-blue-600">{stats.responseRate}%</span>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Admin Response Rate</p>
          </div>
        </div>
      </div>

      {/* 3. Rating & Timeline Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>

        {[
          { id: 'all', label: `All Reviews (${stats.total})` },
          { id: 'today', label: `Today's (${stats.todayCount})` },
          { id: '5', label: `5 Stars ⭐ (${stats.countsByStar[5] || 0})` },
          { id: '4', label: `4 Stars ⭐ (${stats.countsByStar[4] || 0})` },
          { id: '3', label: `3 Stars ⭐ (${stats.countsByStar[3] || 0})` },
          { id: 'critical', label: `Needs Attention ⚠️ (${(stats.countsByStar[1] || 0) + (stats.countsByStar[2] || 0)})` },
        ].map(pill => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setRatingFilter(pill.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              ratingFilter === pill.id
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* 4. Feedback Cards List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <MessageSquareHeart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Feedback Matches Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery 
              ? `No customer reviews found matching "${searchQuery}". Try a different keyword.`
              : 'When diners submit dining feedback and dish ratings, they will instantly appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeedbacks.map((fb) => {
            const rating = Number(fb.overallRating) || 5;
            const isEditing = editingReplyId === fb.id;
            const isCritical = rating <= 2;
            const isDelighted = rating >= 5;
            const isRecent = isRecentFeedback(fb);

            return (
              <div 
                key={fb.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4 ${
                  isRecent ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'
                }`}
              >
                {/* Top Row: Customer Info, Table, Date & Stars */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      {(fb.customerName || 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">
                          {fb.customerName || `Table ${fb.tableNumber || '01'} Guest`}
                        </h4>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-orange-100 text-orange-800">
                          Table {fb.tableNumber || '01'}
                        </span>
                        {fb.orderId && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {fb.orderId}
                          </span>
                        )}
                        {isRecent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs animate-pulse">
                            <Sparkles className="w-3 h-3" /> Live
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatFeedbackDate(fb)}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars & Sentiment Badge */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                      isDelighted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isDelighted ? '🎉 Delighted' : isCritical ? '⚠️ Needs Review' : '👍 Satisfied'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(fb.id, fb.customerName)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Highlights / Tags */}
                {Array.isArray(fb.selectedTags) && fb.selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {fb.selectedTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Customer Written Comment */}
                {fb.writtenText && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-800 font-medium leading-relaxed italic">
                    "{fb.writtenText}"
                  </div>
                )}

                {/* Specific Dish Ratings */}
                {fb.itemRatings && Object.keys(fb.itemRatings).length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                      Individual Delicacy Ratings:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(fb.itemRatings).map(([dish, star]) => (
                        <div
                          key={dish}
                          className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <span className="truncate pr-2">{dish}</span>
                          <span className="text-amber-500 font-bold flex items-center gap-0.5 shrink-0">
                            {star} <Star className="w-3 h-3 fill-amber-400" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restaurant Official Response Box */}
                <div className="pt-2 border-t border-slate-100">
                  {isEditing ? (
                    <div className="space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                      <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        Reply as Restaurant Management:
                      </label>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type official restaurant response..."
                        className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingReplyId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveReply(fb.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Save & Post Reply</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                          <span>👑 Restaurant Response:</span>
                        </p>
                        <p className="text-xs text-slate-700 font-medium">
                          {fb.restaurantResponse || 'No response added yet.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartReply(fb)}
                        className="px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{fb.restaurantResponse ? 'Edit Reply' : 'Add Reply'}</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
