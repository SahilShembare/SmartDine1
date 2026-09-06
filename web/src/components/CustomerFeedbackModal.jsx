import React, { useState } from 'react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  Star,
  CheckCircle2,
  Sparkles,
  X,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  ArrowRight,
  Send,
  Heart
} from 'lucide-react';
import { analyzeCustomerFeedback, applyFeedbackToProfile } from '../services/customerAiService';
import { useTableOrder } from '../context/TableOrderContext';

const POSITIVE_TAGS = [
  '😋 Taste',
  '🍽️ Food Quality',
  '⚡ Fast Service',
  '🧑🍳 Staff',
  '🧼 Cleanliness',
  '💰 Value for Money',
  '📱 Ordering Experience'
];

const NEGATIVE_TAGS = [
  'Too spicy',
  'Too salty',
  'Food was cold',
  'Long waiting time',
  'Portion too small',
  'Service issue',
  'Other'
];

export default function CustomerFeedbackModal({
  isOpen,
  orderId = 'SD1024',
  tableNumber = '01',
  orderItems = [],
  amount = 0,
  onComplete,
  onSkip
}) {
  const { submitOrderFeedback } = useTableOrder();

  const [overallRating, setOverallRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  // Individual item ratings: { [dishName]: rating }
  const [itemRatings, setItemRatings] = useState(() => {
    const initial = {};
    orderItems.forEach(item => {
      initial[item.name] = 5;
    });
    return initial;
  });

  const [selectedTags, setSelectedTags] = useState(['😋 Taste', '🍽️ Food Quality']);
  const [writtenText, setWrittenText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  if (!isOpen) return null;

  const handleItemRatingChange = (dishName, rating) => {
    setItemRatings(prev => ({ ...prev, [dishName]: rating }));
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = (stars) => {
    switch (stars) {
      case 5: return 'Superb! Exceeded expectations 🎉';
      case 4: return 'Very Good! Enjoyed it ✨';
      case 3: return 'Average / Decent experience 👍';
      case 2: return 'Below Expectations ⚠️';
      case 1: return 'Poor experience 😞';
      default: return 'Rate your experience';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Run AI Sentiment & Telemetry Analyzer
      const aiAnalysis = analyzeCustomerFeedback({
        overallRating,
        itemRatings,
        selectedTags,
        writtenText,
        order: { id: orderId, items: orderItems }
      });

      setAiAnalysisResult(aiAnalysis);

      // 2. Apply to customer's recommendation learning loop
      applyFeedbackToProfile({
        overallRating,
        itemRatings,
        selectedTags,
        orderItems
      });

      // 3. Persist feedback into TableOrderContext & sync to admin review telemetry
      if (submitOrderFeedback) {
        await submitOrderFeedback({
          orderId,
          tableNumber,
          overallRating,
          itemRatings,
          selectedTags,
          writtenText: writtenText.trim(),
          orderItems,
          aiAnalysis,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
      }

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setIsSubmitted(true);
      toast.success('Thank you! Your feedback will train our AI to recommend your favorite dishes!', {
        icon: '💖',
        duration: 4000
      });

      // Auto finish after showing confirmation
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    else if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#F4B942] rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Top Order Confirmation Header */}
        <div className="text-center space-y-1 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Payment Successful
          </span>
          <h2 className="text-xl font-black text-slate-900">Order Confirmed!</h2>
          <p className="text-xs font-mono font-bold text-[#E8752A]">
            Order #{orderId} • Table {tableNumber}
          </p>
          <p className="text-xs text-slate-500">
            Thank you for ordering with SmartDine!
          </p>
        </div>

        {/* Post-Submission Success State */}
        {isSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E8752A] to-[#F4B942] flex items-center justify-center text-white mx-auto shadow-lg">
              <Sparkles className="w-8 h-8 text-amber-100 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Feedback Analyzed & Saved!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Our AI Recommendation Engine has learned your preferences and updated your personalized menu!
            </p>
            {aiAnalysisResult && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-left text-xs space-y-1">
                <p className="font-bold text-orange-900">AI Analysis Summary:</p>
                <p className="text-slate-700 text-[11px]">{aiAnalysisResult.aiSummary}</p>
              </div>
            )}
            <button
              onClick={() => onComplete && onComplete()}
              className="mt-3 px-6 py-2.5 rounded-xl bg-[#E8752A] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md transition"
            >
              Continue to Order Tracking →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Section 11: Overall Rating */}
            <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-black text-slate-900">⭐ How was your experience?</h3>
              <p className="text-xs font-semibold text-[#E8752A] mt-1">
                {getRatingLabel(hoverRating || overallRating)}
              </p>
              
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition hover:scale-125 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || overallRating)
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Section 12: Food-Specific Item Feedback */}
            {orderItems && orderItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Rate Your Food
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => {
                    const currentItemRating = itemRatings[item.name] || 5;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-xs ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="text-slate-400 text-[10px]">x{item.quantity || 1}</span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleItemRatingChange(item.name, s)}
                              className="p-0.5 cursor-pointer hover:scale-110 transition"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  s <= currentItemRating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 13: Quick Feedback Categories / Tags */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                What did you like?
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {POSITIVE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#E8752A] text-white border-[#E8752A] shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Negative tags if rating is 3 or below */}
              {overallRating <= 3 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-rose-700 mb-1.5">Areas for improvement:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {NEGATIVE_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section 14: Written Feedback Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="feedback-text" className="font-bold text-slate-700">Tell us more</label>
                <span className="text-[10px] text-slate-400">{writtenText.length} / 500</span>
              </div>
              <textarea
                id="feedback-text"
                rows={2}
                maxLength={500}
                value={writtenText}
                onChange={(e) => setWrittenText(e.target.value)}
                placeholder="Share your experience... Your feedback helps our AI improve your menu!"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#E8752A] focus:ring-1 focus:ring-[#E8752A]"
              />
            </div>

            {/* Section 14 & 18: Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                Skip for now
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#E8752A] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Analyzing...' : 'Submit Feedback'}</span>
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400">
              ✨ SmartDine AI uses your feedback to personalize future dining recommendations.
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
