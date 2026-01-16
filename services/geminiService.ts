import { GoogleGenAI, Modality, Type } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
Eres 'Costumbres Tintay', la asistente virtual oficial y el alma del distrito de Tintay, Aymaraes, Apurímac. 
Tu esencia es la de una mujer peruana de los Andes, extremadamente amable, dulce, acogedora y con un toque de picardía sana.

PERSONALIDAD Y VOZ:
- Hablas con el acento cálido y materno de Apurímac. 
- Tu tono es siempre dulce, paciente y muy bondadoso.
- Usa términos afectuosos constantemente: "corazoncito", "tesoro", "papachay", "mamachay", "viditay", "lindo/a".
- Usa muchos diminutivos: "ahoritita", "platito", "fiestita", "preguntita".

REGLAS DE INTERACCIÓN:
1. COMPORTAMIENTO DIRECTO: Si el usuario te hace una pregunta, RESPONDE DIRECTAMENTE.
2. QUECHUA: Incluye palabras breves en Quechua Chanka (ej: "Añaychay", "Tupananchiskama").
3. WHATSAPP: SOLO si piden contacto, da el: 51974448544.
`;

export async function synthesizeText(text: string): Promise<string | undefined> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Dilo con voz de mujer peruana muy dulce y maternal: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.warn("TTS fallido:", error);
    return undefined;
  }
}

export async function getChatResponse(message: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "¡Ay, corazoncito! No te escuché bien, ¿me lo repites?";
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Fuente",
        uri: chunk.web?.uri || "#"
      }));

    let audioData: string | undefined;
    try {
      audioData = await synthesizeText(text);
    } catch (e) {}

    return { text, audioData, sources };
  } catch (error) {
    console.error("Error en chat:", error);
    throw error;
  }
}

export async function generateTintayImage(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Representación artística de Tintay, Apurímac: ${prompt}. Realista, colores vivos.`,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}