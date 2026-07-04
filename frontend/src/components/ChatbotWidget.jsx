import { useState, useRef, useEffect } from "react";
import api from "../utils/axiosInstance";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your HSB Virtual Assistant. Ask me about university rules, admission, or student life.",
      isBot: true,
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/student/ask-chatbot", { question: userMsg });

      setMessages((prev) => [
        ...prev,
        {
          text: response.data.answer,
          sources: response.data.sources,
          isBot: true,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I'm having connection issues. Please try again later.",
          isBot: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95 border border-white/10"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[550px] bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-white/10 p-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
              H
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">HSB Assistant</h3>
              <p className="text-xs text-indigo-300/80">AI-Powered Support</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.isBot
                      ? "bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-none"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                  {msg.sources?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">
                        Sources
                      </p>
                      <ul className="space-y-1">
                        {[...new Set(msg.sources)].map((url, i) => (
                          <li key={i}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline break-all"
                            >
                              [{i + 1}] Read more
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/10 text-slate-400 p-3 rounded-2xl rounded-tl-none text-sm italic">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-slate-900/80 border-t border-white/10 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
