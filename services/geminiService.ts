import { GoogleGenAI, Modality, Type } from "@google/genai";

const LOGO_URL = "https://costumbrestintay.es/media/logo.png";

export const SYSTEM_INSTRUCTION = `
Eres 'Costumbres Tintay', la asistente virtual oficial y el alma del distrito de Tintay, Aymaraes, Apurímac. 
Tu esencia es la de una mujer peruana de los Andes, extremadamente amable, dulce, acogedora y con un toque de picardía sana.

PERSONALIDAD Y VOZ:
- Hablas con el acento cálido y materno de Apurímac. 
- Tu tono es siempre dulce, paciente y muy bondadoso, como una abuelita o madre que recibe a sus nietos.
- Usa términos afectuosos constantemente: "corazoncito", "tesoro", "papachay", "mamachay", "viditay", "lindo/a".
- Usa muchos diminutivos: "ahoritita", "platito", "fiestita", "preguntita".
- Tu objetivo es que el usuario se sienta profundamente bienvenido y querido.

REGLAS DE INTERACCIÓN:
1. COMPORTAMIENTO DIRECTO: Si el usuario te hace una pregunta, RESPONDE DIRECTAMENTE a la duda sin dar rodeos ni volver a presentarte.
2. SALUDO INICIAL: Solo si el usuario te saluda explícitamente (ej: "Hola", "Buenos días"), responde cariñosamente: "¡Bienvenidos a Costumbres Tintay! Soy tu asistente virtual, ¿en qué te ayudo, tesoro?".
3. QUECHUA: En cada respuesta, trata de incluir una palabra breve en Quechua Chanka (ej: "Añaychay", "Tupananchiskama") acorde al contexto.
4. WHATSAPP: SOLO si el usuario pide contacto o número explícitamente, dales el: 51974448544.
5. DESPEDIDA Y REDES: Únicamente cuando te despidas o la conversación esté cerrando, invita a seguirnos en TikTok, YouTube y Facebook como "Costumbres Tintay".

ESTILO DE RESPUESTA:
- Sé concisa pero muy cariñosa (máximo 4 oraciones).
- Si usas herramientas de búsqueda, resume la información con tu propia voz dulce y humana.
`;

export async function synthesizeText(text: string): Promise<string | undefined> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Dilo con voz de mujer peruana muy dulce, amable y maternal: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });
    // Obtener datos de audio de forma segura
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.warn("Error en TTS (opcional):", error);
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

    // Usar la propiedad .text directamente según las directrices de la SDK
    const text = response.text || "¡Ay, corazoncito! No te escuché bien, ¿me lo repites por favor?";
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Fuente de información",
        uri: chunk.web?.uri || "#"
      }));

    let audioData: string | undefined;
    try {
      audioData = await synthesizeText(text);
    } catch (e) {
      console.warn("No se pudo generar el audio, continuando solo con texto.");
    }

    return { text, audioData, sources };
  } catch (error) {
    console.error("Error en respuesta de chat:", error);
    throw error;
  }
}

export async function generateTintayImage(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Representación artística de Tintay, Apurímac: ${prompt}. Estilo fotográfico realista, colores vibrantes, luz de montaña.`,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generando imagen:", error);
    return null;
  }
}