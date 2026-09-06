import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Mic,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Info,
  ChevronRight
} from 'lucide-react';
import { AIAssistantService } from '../services/aiService';

export default function AskSmartDineAI({ isOpen: externalIsOpen, onClose: externalOnClose, defaultQuery = '' }) {
  // Allow component to operate either autonomously via floating button or controlled
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = () => {
    if (externalOnClose && isOpen) {
      externalOnClose();
    } else {
      setInternalIsOpen(!isOpen);
    }
  };

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am **SmartDine AI**, your restaurant intelligence co-pilot. I analyze your live orders, menu velocity, stock levels, and revenue patterns in real-time. Ask me anything or select a quick question below!",
      timestamp: 'Just now',
      confidence: 96,
      dataPoints: [
        { label: "Today's Revenue", value: "₹25,450" },
        { label: "Active Orders", value: "12" },
        { label: "Top Dish", value: "Paneer Pizza" }
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (defaultQuery && isOpen) {
      handleSend(defaultQuery);
    }
  }, [defaultQuery]);

  const handleSend = async (queryToSend) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const response = await AIAssistantService.answerQuestion(text);
      const aiMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: response.confidence,
        dataPoints: response.dataPoints
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: "I encountered a slight error retrieving the real-time restaurant telemetry. Please try asking again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Always visible on Admin screens) */}
      <button
        onClick={toggleOpen}
        id="ask-smartdine-ai-btn"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#E8752A] via-[#EA580C] to-[#C2410C] hover:from-[#EA580C] hover:to-[#9A3412] text-white rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-200 border border-orange-300/40 cursor-pointer font-bold text-sm group"
        title="Open SmartDine AI Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
        </span>
        <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
        <span>Ask SmartDine AI</span>
      </button>

      {/* Slide-out Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 transition-opacity"
          onClick={toggleOpen}
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#24140D] text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E8752A] to-[#F97316] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">SmartDine AI</h3>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-300 border border-orange-400/30">
                  Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Live operational & predictive intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([messages[0]])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Clear chat history"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleOpen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Explainability Banner */}
        <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-900">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Answers are synthesized dynamically from restaurant order histories & inventory telemetry.</span>
        </div>

        {/* Chat Message Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[90%]">
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-sm mb-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#E8752A] text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Optional Telemetry Data Points for AI Replies */}
                  {msg.dataPoints && msg.dataPoints.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                      {msg.dataPoints.map((dp, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">{dp.label}</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{dp.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confidence Badge */}
                  {msg.confidence && (
                    <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Confidence: {msg.confidence}%
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-sm mb-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 max-w-[90%]">
              <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-sm mb-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] text-slate-400 ml-1 font-medium">SmartDine AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Chips */}
        <div className="p-3 bg-white border-t border-slate-200/80">
          <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-orange-500" />
            Suggested Questions:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {AIAssistantService.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-[#E8752A] hover:border-orange-200 border border-slate-200 text-[11px] text-slate-700 font-medium transition shrink-0 active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-[#E8752A] focus-within:ring-2 focus-within:ring-orange-500/20 transition">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about sales, items, inventory..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none py-1.5"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputQuery.trim() || isTyping}
              className="p-1.5 rounded-lg bg-[#E8752A] text-white hover:bg-[#EA580C] disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
            <span>Powered by SmartDine Telemetry Engine</span>
            <span>Press Enter ↵ to send</span>
          </div>
        </div>
      </div>
    </>
  );
}
