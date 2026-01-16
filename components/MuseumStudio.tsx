import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../services/geminiService';

export const MuseumStudio: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInvestigate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Investigación histórica profunda para Tintay: ${query}. Responde con tono académico pero muy cariñoso, como una mamachay que cuenta historias del pasado.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // REGLA CRÍTICA: Al usar thinkingBudget, es obligatorio definir maxOutputTokens.
          maxOutputTokens: 8000,
          thinkingConfig: { thinkingBudget: 4000 },
          tools: [{ googleSearch: {} }]
        },
      });

      const responseText = response.text || "No encontré lo que buscabas, corazoncito.";
      setResult(responseText);
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setSources(chunks.filter(c => c.web));
    } catch (err) {
      console.error("Error en investigación:", err);
      setResult("¡Ay, papachay! Hubo un error buscando en la memoria de los abuelos. ¿Me lo repites, tesoro?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 max-w-4xl mx-auto w-full space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 -mr-16 -mt-16 rounded-full opacity-50" />
        <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-2">Crónicas e Historia de Tintay</h2>
        <p className="text-gray-600 text-sm mb-6">Descubre el pasado de nuestro pueblo, sus leyendas y la sabiduría de nuestros ancestros.</p>
        
        <div className="flex flex-col space-y-4">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvestigate()}
            placeholder="¿Qué historia te gustaría conocer, tesoro?"
            className="w-full bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-emerald-900"
          />
          <button 
            onClick={handleInvestigate}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
              loading ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800 active:scale-95'
            }`}
          >
            {loading ? 'BUSCANDO EN LA MEMORIA...' : 'INICIAR INVESTIGACIÓN'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border-l-8 border-emerald-700 animate-fade-in">
          <div className="prose prose-emerald max-w-none">
            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
              {result}
            </p>
          </div>
          
          {sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-emerald-50">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Fuentes Consultadas:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map((chunk, i) => (
                  chunk.web && (
                    <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 font-bold shadow-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-xs text-emerald-900 font-bold truncate">{chunk.web.title}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Batallas históricas en Apurímac', 'Origen de las danzas típicas', 'Primeros pobladores de Tintay'].map((t) => (
            <button key={t} onClick={() => { setQuery(t); }} className="p-4 bg-emerald-100/50 rounded-2xl border border-dashed border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all text-left">
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};