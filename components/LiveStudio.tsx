import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decodeBase64, decodeAudioData, encodeAudio } from '../utils/audioHelpers';
import { SYSTEM_INSTRUCTION } from '../services/geminiService';
import { AudioVisualizer } from './AudioVisualizer';

export const LiveStudio: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('En reposo... despiértame para conversar.');
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    setIsActive(false);
    setStatus('En reposo... despiértame para conversar.');
    
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close());
      sessionRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startSession = async () => {
    setIsActive(true);
    setStatus('Costumbres Tintay está despertando...');
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: isCameraOn ? { width: 640, height: 480 } : false 
      });
      
      if (videoRef.current && isCameraOn) {
        videoRef.current.srcObject = stream;
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + "\nIMPORTANTE: Tu tono debe ser extremadamente amable, maternal y acogedor. Eres la voz de una mujer real de los Andes, llena de bondad. Siempre identifícate como Costumbres Tintay.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: () => {
            setStatus('¡Hola, corazoncito! Costumbres Tintay te escucha...');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
              
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { 
                  data: encodeAudio(new Uint8Array(int16.buffer)), 
                  mimeType: 'audio/pcm;rate=16000' 
                }
              })).catch(() => {});
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);

            if (isCameraOn && videoRef.current && canvasRef.current) {
              const video = videoRef.current;
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              
              frameIntervalRef.current = window.setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
                  canvas.width = 320;
                  canvas.height = 240;
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  
                  sessionPromise.then(s => s.sendRealtimeInput({
                    media: { data: base64Data, mimeType: 'image/jpeg' }
                  })).catch(() => {});
                }
              }, 1000);
            }
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            
            const audioStr = msg.serverContent?.modelTurn?.parts.find(p => p.inlineData)?.inlineData?.data;
            if (audioStr && audioContextRef.current) {
              const ctx = audioContextRef.current;
              if (ctx.state === 'suspended') await ctx.resume();
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioStr), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error("Live error:", e);
            stopSession();
          }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden">
      <div className={`absolute w-full h-full bg-emerald-900/20 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] transition-transform duration-1000 ${isActive ? 'scale-150 animate-pulse' : 'scale-50'}`} />

      <canvas ref={canvasRef} className="hidden" />

      <div className="z-10 text-center space-y-8 max-w-md w-full">
        <div className="relative inline-block">
          <div className={`w-48 h-48 rounded-full border-4 ${isActive ? 'border-emerald-400' : 'border-slate-700'} flex items-center justify-center bg-slate-900 shadow-2xl transition-all overflow-hidden`}>
             {isCameraOn && isActive ? (
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
             ) : (
               <div className="flex flex-col items-center">
                 <span className="text-7xl mb-2">{isActive ? '👵' : '😴'}</span>
                 {isActive && <AudioVisualizer isActive={true} color="bg-emerald-400" />}
               </div>
             )}
          </div>
          {isActive && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-[10px] font-black tracking-widest animate-pulse">TRANSMITIENDO</div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold italic text-emerald-50">Costumbres Tintay</h2>
          <p className="text-emerald-300/80 font-medium text-sm h-6 overflow-hidden uppercase tracking-widest">{status}</p>
        </div>

        <div className="flex flex-col space-y-4 pt-4">
          <button 
            onClick={isActive ? stopSession : startSession}
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 uppercase tracking-widest ${
              isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            }`}
          >
            {isActive ? 'Terminar Conversa' : 'Conversar en Tiempo Real'}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            disabled={isActive}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl border-2 transition-all ${
              isCameraOn ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'
            } disabled:opacity-50`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest">
              {isCameraOn ? 'Cámara Activada' : 'Activar Cámara'}
            </span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Experiencia inmersiva cultural • Tintay
        </p>
      </div>
    </div>
  );
};