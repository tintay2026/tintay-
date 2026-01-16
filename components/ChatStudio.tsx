import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole, AudioProcessingState } from '../services/types';
import { getChatResponse } from '../services/geminiService';
import { decodeBase64, decodeAudioData } from '../utils/audioHelpers';

export const ChatStudio: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [audioState, setAudioState] = useState<AudioProcessingState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, audioState.isProcessing]);

  useEffect(() => {
    if (messages.length === 0) {
      const hour = new Date().getHours();
      let greetingTime = "¡Buen día";
      if (hour >= 12 && hour < 19) greetingTime = "¡Buenas tardes";
      else if (hour >= 19 || hour < 6) greetingTime = "¡Buenas noches";

      const initText = `${greetingTime}, corazoncito! ✨ Qué alegría tenerte por aquí. Saludos de parte de nuestro administrador, el señor Raúl. Bienvenido a Tintay, tesoro mío. Soy tu asistente Costumbres Tintay y estoy aquí para contarte todo lo lindo de mi pueblo. ¿Cómo te llamas, viditay? Cuéntame tu nombre para saludarte como te mereces.`;
      
      const welcomeMsg: Message = {
        id: 'welcome',
        role: MessageRole.ASSISTANT,
        text: initText,
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playAudio = async (base64: string) => {
    const ctx = initAudio();
    try {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      const decoded = decodeBase64(base64);
      const buffer = await decodeAudioData(decoded, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      await new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (err) {
      console.error("Error reproduciendo audio:", err);
    } finally {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || audioState.isProcessing) return;
    
    // Activar audio en interacción del usuario
    initAudio();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setAudioState(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await getChatResponse(currentInput);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        text: response.text,
        audioData: response.audioData,
        sources: response.sources,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      if (response.audioData) {
        await playAudio(response.audioData);
      }
    } catch (err) {
      console.error("Gemini Chat Error:", err);
      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        role: MessageRole.ASSISTANT,
        text: "¡Ay, papachay! Se me cortó la señal del cerro. ¿Me lo repites, corazoncito?",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAudioState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white/40 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm border ${
              msg.role === MessageRole.USER 
                ? 'bg-emerald-800 text-white border-emerald-900 rounded-tr-none' 
                : 'bg-white text-slate-800 border-emerald-100 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm md:text-base font-medium leading-relaxed">{msg.text}</p>
              
              {msg.audioData && msg.role === MessageRole.ASSISTANT && (
                <button 
                  onClick={() => playAudio(msg.audioData!)}
                  disabled={audioState.isPlaying}
                  className="mt-4 flex items-center space-x-2 text-[10px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${audioState.isPlaying ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span className="tracking-widest uppercase">{audioState.isPlaying ? 'REPRODUCIENDO...' : 'VOLVER A ESCUCHAR'}</span>
                </button>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-emerald-50/50">
                  <p className="text-[9px] uppercase font-black text-emerald-600 mb-2 tracking-[0.2em]">Fuentes de Sabiduría:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s, idx) => (
                      <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-800 bg-emerald-100/50 px-3 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-200 transition-all truncate max-w-[180px] font-bold">
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {audioState.isProcessing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-emerald-100 flex items-center space-x-4">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs text-emerald-700 italic font-bold tracking-wide">Costumbres Tintay está pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-emerald-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-end space-x-3 max-w-3xl mx-auto">
          <div className="flex-1 bg-slate-50 border-2 border-emerald-100 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-all shadow-inner">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dime algo lindo, corazoncito..."
              className="w-full bg-transparent p-4 resize-none max-h-32 focus:outline-none text-slate-800 font-medium placeholder:text-slate-400 text-sm md:text-base"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || audioState.isProcessing}
            className={`p-4 rounded-2xl shadow-lg transition-all active:scale-90 ${
              inputText.trim() && !audioState.isProcessing 
                ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};