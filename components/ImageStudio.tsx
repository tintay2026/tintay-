
import React, { useState } from 'react';
import { generateTintayImage } from '../services/geminiService';

export const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImage(null);
    try {
      const url = await generateTintayImage(prompt);
      setImage(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 max-w-4xl mx-auto w-full flex flex-col items-center">
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full border border-emerald-100 mb-6">
        <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-4">Galería de Tintay</h2>
        <p className="text-sm text-gray-500 mb-6">Dime qué escena te gustaría ver de nuestro pueblo (ej: 'Fiesta de Santiago en la plaza', 'Cuy chactado servido en mesa de madera').</p>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe tu visión, corazoncito..."
            className="flex-1 bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
              loading ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800 active:scale-95'
            }`}
          >
            {loading ? 'PINTANDO...' : 'GENERAR'}
          </button>
        </div>
      </div>

      <div className="w-full flex-1 flex items-center justify-center min-h-[400px]">
        {loading ? (
          <div className="text-center">
            <div className="loader mx-auto mb-4"></div>
            <p className="text-emerald-700 font-serif italic">Preparando los pinceles de Apurímac...</p>
          </div>
        ) : image ? (
          <div className="relative group animate-fade-in w-full max-w-lg">
            <div className="bg-white p-3 rounded-xl shadow-2xl border-4 border-white rotate-2 group-hover:rotate-0 transition-transform">
              <img src={image} alt="Generado por Costumbres Tintay" className="w-full h-auto rounded-lg" />
              <p className="mt-4 text-center font-serif italic text-gray-400 text-xs">Memoria visual de Tintay</p>
            </div>
            <a 
              href={image} 
              download="tintay-arte.png"
              className="absolute bottom-6 right-6 bg-white text-emerald-700 p-3 rounded-full shadow-lg hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        ) : (
          <div className="text-center opacity-30 px-10">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-emerald-900 font-serif italic">Tu lienzo está esperando, tesoro. ¡Imagina algo lindo!</p>
          </div>
        )}
      </div>
    </div>
  );
};
