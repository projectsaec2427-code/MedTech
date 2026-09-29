import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X, RotateCcw, FileText } from 'lucide-react';
import { PrescribedMedicine } from '../types';
import MedicinePdfCard from './MedicinePdfCard';

interface AIChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
  medicines?: PrescribedMedicine[];
  suggestedDiagnosis?: string;
}

interface AIChatbotModalProps {
  onClose: () => void;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientBlood?: string;
}

export default function AIChatbotModal({ onClose, patientName, patientAge, patientGender, patientBlood }: AIChatbotModalProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { 
      sender: 'ai', 
      text: "Hello! I am your MedTech AI Assistant. How can I help you today? I can explain symptoms, suggest first-aid remedies, provide healthy diet insights, or summarize doctor-given medications and care guidelines.", 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: userMessage, time: userTime }]);
    setLoading(true);

    try {
      // Map current conversation history
      const historyPayload = messages.map(msg => ({
        sender: msg.sender === 'user' ? 'user' : 'ai',
        text: msg.text
      }));

      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: historyPayload })
      });

      if (!res.ok) throw new Error('Chatbot response error');
      
      const data = await res.json();
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: data.reply || 'Here are the clinical considerations based on your request.', 
        time: aiTime,
        medicines: data.medicines && data.medicines.length > 0 ? data.medicines : undefined,
        suggestedDiagnosis: data.suggestedDiagnosis
      }]);
    } catch (err: any) {
      console.error(err);
      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Apologies, I encountered a temporary connection issue. Please make sure the service is running and try again.", 
        time: errTime 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      { 
        sender: 'ai', 
        text: "Conversation refreshed. I am ready to assist with any symptoms, first-aid, or diet questions!", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl h-[640px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Chatbot Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Bot className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-tight">MedTech AI Health Bot</span>
                <span className="text-[10px] bg-indigo-500/40 text-indigo-100 font-mono px-1.5 py-0.5 rounded-full border border-indigo-400/20 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  Gemini
                </span>
              </div>
              <span className="text-[11px] text-blue-100 block">Personal Care & Medication Companion</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={handleReset}
              title="Clear Conversation History"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Warning Disclaimer Bar */}
        <div className="bg-amber-50 border-b border-amber-100/60 px-4 py-2 text-[10.5px] text-amber-800 font-medium leading-relaxed flex items-center">
          <span className="font-bold text-amber-900 mr-1">Medical Disclaimer:</span>
          MedTech AI answers questions for guidance. Under no circumstances should this replace professional clinical diagnosis.
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => {
            const isAI = msg.sender === 'ai';
            const hasMedicines = msg.medicines && msg.medicines.length > 0;

            return (
              <div 
                key={index}
                className={`flex items-start space-x-2.5 ${isAI ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  isAI ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                  isAI 
                    ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' 
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed text-[12.5px]">{msg.text}</p>
                  
                  {/* If AI suggested medicines, render MedicinePdfCard */}
                  {hasMedicines && msg.medicines && (
                    <div className="mt-2.5 text-slate-900">
                      <MedicinePdfCard
                        type="ai"
                        patientName={patientName}
                        patientAge={patientAge}
                        patientGender={patientGender}
                        patientBlood={patientBlood}
                        diagnosis={msg.suggestedDiagnosis || 'Clinical Care & Medication Analysis'}
                        medicines={msg.medicines}
                        notes="Always consult your licensed physician before beginning any new medication."
                      />
                    </div>
                  )}

                  <span className={`text-[9.5px] block mt-1.5 ${isAI ? 'text-slate-400' : 'text-blue-100 text-right'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none p-3.5 text-xs shadow-sm flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-200"></span>
                <span>Synthesizing clinical advice & medication guidance...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
          <button
            type="button"
            onClick={() => setInput("What medicine should I take for headache and fever?")}
            className="px-2.5 py-0.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shrink-0 transition"
          >
            Fever & Headache Relief
          </button>
          <button
            type="button"
            onClick={() => setInput("Explain doctor given medicines: Amoxicillin 500mg and Paracetamol")}
            className="px-2.5 py-0.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shrink-0 transition"
          >
            Explain Doctor Given Medicine
          </button>
          <button
            type="button"
            onClick={() => setInput("Diet and first-aid remedies for acidity and acid reflux")}
            className="px-2.5 py-0.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shrink-0 transition"
          >
            Acidity & Diet
          </button>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
          <input
            type="text"
            required
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type health question, ask about doctor-given medicines, or get first-aid..."
            className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/10 disabled:opacity-50"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
