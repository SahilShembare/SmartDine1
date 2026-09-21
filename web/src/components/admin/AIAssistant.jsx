import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Clock, 
  Lightbulb, 
  IndianRupee,
  Utensils,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';

export default function AIAssistant() {
  const { orders = [], tables = [], menuItems = [] } = useTableOrder();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your SmartDine AI Assistant. I can analyze your sales, top dishes, live order trends, and give you smart suggestions to grow your restaurant revenue. What would you like to know today?",
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Real-time calculations for accurate intelligence
  const stats = useMemo(() => {
    let totalSales = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let preparingOrdersCount = 0;
    let servedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    const itemRankMap = {};

    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      const p = String(o.paymentStatus || '').toLowerCase();
      const amt = Number(o.amount || o.total) || 0;

      if (s === 'cancelled') {
        cancelledOrdersCount++;
        return;
      }

      if (s === 'pending') pendingOrdersCount++;
      else if (s === 'preparing') preparingOrdersCount++;
      else if (s === 'served' || s === 'completed') servedOrdersCount++;

      const method = String(o.paymentMethod || 'Cash').toLowerCase();
      const isCounter = method.includes('counter') || method.includes('cash') || method.includes('desk');
      const isOnline = !isCounter && (method.includes('upi') || method.includes('online') || method.includes('razorpay') || method.includes('card') || method.includes('netbanking') || method.includes('net banking'));
      const isUnpaidState = !p || p === 'pending' || p === 'unpaid' || p.includes('requested') || p.includes('awaiting');
      const isPaid = !isUnpaidState && (isOnline || p === 'paid' || !!o.paidAt);

      if (isPaid) {
        totalSales += amt;
        paidOrdersCount++;
      }

      (o.items || []).forEach(it => {
        const name = it.name || 'Dish';
        if (!itemRankMap[name]) {
          itemRankMap[name] = { name, quantity: 0, revenue: 0, price: Number(it.price) || 0 };
        }
        const qty = Number(it.quantity) || 1;
        itemRankMap[name].quantity += qty;
        itemRankMap[name].revenue += (qty * (Number(it.price) || 0));
      });
    });

    const sortedDishes = Object.values(itemRankMap).sort((a, b) => b.quantity - a.quantity);
    const avgOrderValue = paidOrdersCount > 0 ? Math.round(totalSales / paidOrdersCount) : 0;
    const occupiedTables = tables.filter(t => t.status === 'Occupied').length;

    return {
      totalSales,
      totalOrders: orders.length,
      paidOrdersCount,
      pendingOrdersCount,
      preparingOrdersCount,
      servedOrdersCount,
      cancelledOrdersCount,
      avgOrderValue,
      sortedDishes,
      topDish: sortedDishes[0] || null,
      occupiedTables,
      totalTables: tables.length || 25
    };
  }, [orders, tables]);

  // AI Response Generator
  const generateAIResponse = (prompt) => {
    const q = prompt.toLowerCase().trim();

    // 1. Sales Insights
    if (q.includes('sale') || q.includes('revenue') || q.includes('earning') || q.includes('today') || q.includes('collection')) {
      return (
        <div className="space-y-2">
          <p className="font-bold text-slate-900">📊 Today's Sales Insights:</p>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-slate-800 space-y-1">
            <div>• <strong>Total Settled Sales:</strong> ₹{stats.totalSales.toLocaleString('en-IN')}</div>
            <div>• <strong>Paid Orders:</strong> {stats.paidOrdersCount} orders</div>
            <div>• <strong>Average Order Value (AOV):</strong> ₹{stats.avgOrderValue} per table</div>
            {stats.pendingOrdersCount > 0 && (
              <div>• <strong>Pending Orders:</strong> {stats.pendingOrdersCount} orders waiting for payment or kitchen action.</div>
            )}
          </div>
          <p className="text-xs text-slate-600">
            💡 <em>Smart Tip:</em> Offer beverage add-ons like Cold Coffee or Mango Lassi during checkout to increase your Average Order Value above ₹{stats.avgOrderValue + 80}.
          </p>
        </div>
      );
    }

    // 2. Popular Items
    if (q.includes('popular') || q.includes('item') || q.includes('dish') || q.includes('best') || q.includes('top')) {
      if (stats.sortedDishes.length === 0) {
        return (
          <div className="space-y-2">
            <p className="font-bold text-slate-900">⭐ Most Popular Food Items Today:</p>
            <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600">
              No dish orders have been recorded today yet. Once customers order dishes, top-selling items will appear here automatically!
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <p className="font-bold text-slate-900">⭐ Most Popular Food Items Today:</p>
          <div className="space-y-1.5 text-xs text-slate-800">
            {stats.sortedDishes.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-100">
                <span><strong>#{i + 1} {d.name}</strong></span>
                <span className="text-emerald-700 font-bold">{d.quantity} portions (₹{d.revenue.toLocaleString('en-IN')})</span>
              </div>
            ))}
          </div>
          {stats.topDish && (
            <p className="text-xs text-slate-600">
              🔥 <strong>{stats.topDish.name}</strong> is your #1 bestseller today with {stats.topDish.quantity} portions sold! Keep ingredients prepped to ensure quick kitchen turnaround.
            </p>
          )}
        </div>
      );
    }

    // 3. Order Trends
    if (q.includes('trend') || q.includes('status') || q.includes('kitchen') || q.includes('time') || q.includes('rate')) {
      return (
        <div className="space-y-2">
          <p className="font-bold text-slate-900">📈 Live Order Trends:</p>
          <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-xs text-slate-800">
            <div>• <strong>Total Orders Received:</strong> {stats.totalOrders}</div>
            <div>• <strong>Currently Cooking:</strong> {stats.preparingOrdersCount} orders in kitchen queue</div>
            <div>• <strong>Successfully Served:</strong> {stats.servedOrdersCount} tables</div>
            <div>• <strong>Cancellations:</strong> {stats.cancelledOrdersCount} (Healthy rate under 5%)</div>
          </div>
          <p className="text-xs text-slate-600">
            ⏰ <em>Peak Ordering Window:</em> Lunch rush (1:00 PM – 2:30 PM) and Dinner rush (8:00 PM – 10:00 PM) experience 3x normal traffic.
          </p>
        </div>
      );
    }

    // 4. Demand Prediction
    if (q.includes('demand') || q.includes('predict') || q.includes('forecast') || q.includes('future') || q.includes('rush')) {
      const forecastMultiplier = stats.occupiedTables > 10 ? 'High' : 'Moderate';
      return (
        <div className="space-y-2">
          <p className="font-bold text-slate-900">🔮 Demand Prediction & Kitchen Forecast:</p>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1 text-xs text-slate-800">
            <div>• <strong>Current Table Occupancy:</strong> {stats.occupiedTables} / {stats.totalTables} tables occupied</div>
            <div>• <strong>Expected Evening Load:</strong> <span className="font-bold text-blue-700">{forecastMultiplier} Demand</span></div>
            <div>• <strong>High-Demand Ingredients:</strong> Paneer, Naan Dough, Gravy bases, and Basmati Rice.</div>
          </div>
          <p className="text-xs text-slate-600">
            👨‍🍳 <em>Prep Advice:</em> Pre-cook core gravies (Makhani & Onion-Tomato masala) by 6:30 PM to keep average preparation time under 15 minutes during the dinner rush.
          </p>
        </div>
      );
    }

    // 5. Business Suggestions
    if (q.includes('suggest') || q.includes('idea') || q.includes('tip') || q.includes('grow') || q.includes('profit') || q.includes('improve')) {
      return (
        <div className="space-y-2">
          <p className="font-bold text-slate-900">💡 Smart Business Suggestions for SmartDine:</p>
          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
            <li><strong>Create Thali & Beverage Combos:</strong> Pair your Special Gujarati Thali with a Mango Lassi for a special bundle price to boost sales.</li>
            <li><strong>Reduce Table Idle Time:</strong> Ensure waiters provide digital bill options right as desserts are served to speed up table turnover by 12 minutes.</li>
            <li><strong>Promote High-Margin Starters:</strong> Highlight Crispy Chilli Paneer and Tandoori appetizers at the top of the QR menu.</li>
            <li><strong>Reward Repeat Diners:</strong> Send loyal customers a 10% weekend dining offer to drive higher weekend traffic.</li>
          </ul>
        </div>
      );
    }

    // Generic helpful fallback
    return (
      <div className="space-y-2 text-xs text-slate-800">
        <p>
          Based on today's restaurant performance, your kitchen is running smoothly with <strong>{stats.totalOrders} total orders</strong> and <strong>₹{stats.totalSales}</strong> in revenue.
        </p>
        <p>You can ask me specifically about:</p>
        <div className="flex gap-2 flex-wrap pt-1">
          <span className="px-2 py-1 bg-slate-100 rounded-md font-semibold text-[11px]">Today's Sales</span>
          <span className="px-2 py-1 bg-slate-100 rounded-md font-semibold text-[11px]">Popular Items</span>
          <span className="px-2 py-1 bg-slate-100 rounded-md font-semibold text-[11px]">Order Trends</span>
          <span className="px-2 py-1 bg-slate-100 rounded-md font-semibold text-[11px]">Demand Prediction</span>
        </div>
      </div>
    );
  };

  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Simulate natural AI thinking delay
    setTimeout(() => {
      const aiResponseContent = generateAIResponse(query);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: aiResponseContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: "Chat cleared. What insights or recommendations would you like to explore?",
        time: 'Just now'
      }
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              SmartDine AI Assistant
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Online
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Instant sales analytics, top dishes, demand prediction & business suggestions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="Clear Chat History"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
          Quick Insights:
        </span>
        {[
          "Today's Sales",
          "Popular Items",
          "Order Trends",
          "Demand Prediction",
          "Give Suggestions"
        ].map((btnText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickAction(btnText)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs whitespace-nowrap transition active:scale-95 cursor-pointer"
          >
            {btnText}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                isUser 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-emerald-600 text-white'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                isUser
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
              }`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.content && msg.content}
                <span className={`text-[10px] block mt-1.5 ${isUser ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">Analyzing restaurant data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box at Bottom */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask AI anything (e.g. How are today's sales? Which dish is top?)..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
