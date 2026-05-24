import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles, ChevronDown } from 'lucide-react'

const SUGGESTIONS = [
  'How do I register for a tournament?',
  'What sports are supported?',
  'How does bracket generation work?',
  'What is the entry fee process?',
  'Can I create my own team?',
]

const RESPONSES = {
  register: "To register: 1️⃣ Create an account & verify email 2️⃣ Browse open tournaments 3️⃣ Click 'Register Now' on any active tournament 4️⃣ Fill in your details & upload ID 5️⃣ Choose Solo/Duo/Group & submit. Your registration will be reviewed by the organizer!",
  sports: "We support: 🏏 Cricket, ⚽ Football, 🏀 Basketball, 🎾 Tennis, 🏸 Badminton, 🏐 Volleyball, ♟️ Chess, 🎮 Esports, 🤸 Kabaddi, and more! Each sport supports different tournament formats.",
  bracket: "Our smart bracket generator supports: 🎯 Single Elimination, 🔄 Double Elimination, 🔁 Round Robin & Group Stages. Once registration closes, organizers generate brackets automatically and all teams are notified instantly!",
  fee: "Entry fees are set by tournament organizers — many tournaments are FREE! 💰 Fees are shown on each tournament card. Payment is processed securely during registration. Refund policies vary by tournament.",
  team: "Yes! Go to Dashboard → Teams → Create Team 👥 Add members by email, set roles, upload team logo. You can be in multiple teams across different sports. Teams are required for Duo & Group registrations.",
  default: "Great question! 🏆 I'm your Tournament Assistant. I can help you with registration, team management, tournament formats, payments, and more. What would you like to know?",
}

function getResponse(msg) {
  const lower = msg.toLowerCase()
  if (lower.includes('register') || lower.includes('join') || lower.includes('sign up')) return RESPONSES.register
  if (lower.includes('sport') || lower.includes('game') || lower.includes('play')) return RESPONSES.sports
  if (lower.includes('bracket') || lower.includes('elimination') || lower.includes('round robin')) return RESPONSES.bracket
  if (lower.includes('fee') || lower.includes('payment') || lower.includes('cost') || lower.includes('price') || lower.includes('free')) return RESPONSES.fee
  if (lower.includes('team') || lower.includes('group') || lower.includes('squad')) return RESPONSES.team
  return RESPONSES.default
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hi! 👋 I'm your AI Tournament Assistant. How can I help you today?", time: new Date() }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { id: Date.now(), role: 'user', text: text.trim(), time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    const response = getResponse(text)
    setTyping(false)
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: response, time: new Date() }])
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl shadow-primary-500/30 flex items-center justify-center"
          >
            <Bot size={24} className="text-dark-950" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-950 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[520px] bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-600/20 to-dark-800 border-b border-dark-700">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-dark-950" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-dark-100 text-sm">Tournament AI</p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                  Online — Ready to help
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-dark-500 hover:text-dark-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Sparkles size={12} className="text-primary-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-dark-950 rounded-br-sm'
                      : 'bg-dark-800 text-dark-200 rounded-bl-sm border border-dark-700/50'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={12} className="text-primary-400" />
                  </div>
                  <div className="bg-dark-800 border border-dark-700/50 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-dark-600 mb-2 flex items-center gap-1"><Sparkles size={10} /> Quick questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-dark-800 border border-dark-700 text-dark-400 hover:text-primary-400 hover:border-primary-500/40 px-2.5 py-1.5 rounded-full transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-dark-700 bg-dark-900/50">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2.5 text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || typing}
                  className="w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send size={15} className="text-dark-950" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
