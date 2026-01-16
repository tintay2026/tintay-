
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

export const MapsStudio: React.FC = () => {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPlaces([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Encuentra este lugar en Tintay o Apurímac: ${query}. Dame detalles turísticos y culturales.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: -14.1685, // Tintay Latitude
                longitude: -73.1678 // Tintay Longitude
              }
            }
          }
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setPlaces(chunks.filter(c => c.maps));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 max-w-4xl mx-auto w-full space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-emerald-100">
        <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-4">Rutas de Tintay</h2>
        <div className="flex space-x-2">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: 'Puente colonial', 'Mirador', 'Iglesia de Tintay'..."
            className="flex-1 bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button 
            onClick={handleSearch}
            className="bg-emerald-700 text-white p-4 rounded-2xl shadow-lg hover:bg-emerald-800 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center animate-pulse">
            <p className="text-emerald-700 font-serif italic">Explorando los caminos de Aymaraes...</p>
          </div>
        ) : places.length > 0 ? (
          places.map((place, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-lg border border-emerald-50 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-emerald-900 mb-2">{place.maps.title}</h3>
                <p className="text-xs text-gray-500 mb-4">Ubicación verificada en Google Maps</p>
              </div>
              <a 
                href={place.maps.uri} 
                target="_blank" 
                className="w-full bg-emerald-100 text-emerald-800 py-3 rounded-xl font-bold text-center hover:bg-emerald-200 transition-all"
              >
                VER EN EL MAPA
              </a>
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 bg-emerald-50 rounded-3xl border-2 border-dashed border-emerald-100 text-center">
             <p className="text-emerald-900/40 text-sm italic">Busca un lugar para ver su ubicación exacta, tesoro.</p>
          </div>
        )}
      </div>
    </div>
  );
};
