import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function BotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hi there! I am the SRS Assistant. How can I help you with recommendations, ordering, or table booking today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const suggestedQuestions = [
    "What's the best food for this weather?",
    "How do I book a table?",
    "How to track my live order?",
    "What is Meghana Foods famous for?",
    "Suggest a top rated restaurant"
  ];

  const handleSend = async (e, textOverride = null) => {
    e?.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend.trim() };
    const currentHistory = [...messages, userMessage];
    
    setMessages(currentHistory);
    if (!textOverride) setInput('');
    setIsTyping(true);

    try {
      const { data } = await api.post('/api/bot/chat', {
        history: messages,
        message: userMessage.content
      });

      if (data.success) {
        setMessages([...currentHistory, { role: 'model', content: data.response }]);
      } else {
        setMessages([...currentHistory, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.message || 'Sorry, I am currently unavailable.';
      setMessages([...currentHistory, { role: 'model', content: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-neutral-200 mb-4 overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-ink text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 p-1 flex items-center justify-center">
                  <img src="/assets/srs-avatar.png" alt="SRS Bot" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">SRS Assistant</h3>
                  <p className="text-[10px] text-white/60">Always here to help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-ember text-white rounded-br-sm' 
                        : 'bg-white border border-neutral-200 text-ink rounded-bl-sm shadow-sm leading-relaxed'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {messages.length === 1 && !isTyping && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(null, q)}
                      className="text-xs bg-ember/10 text-ember border border-ember/20 px-3 py-1.5 rounded-full hover:bg-ember/20 transition-colors text-left font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-200 text-slate-400 rounded-2xl rounded-bl-sm px-4 py-2 text-sm shadow-sm flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-neutral-200 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ember/50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-ember text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-ember/90 disabled:opacity-50 transition-colors"
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-ink text-white shadow-xl flex items-center justify-center relative group"
      >
        <img 
          src="/assets/srs-avatar.png" 
          alt="Chat" 
          className="w-10 h-10 object-contain"
        />
        {/* Blinking indicator to grab attention */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-ember border-2 border-ink"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
