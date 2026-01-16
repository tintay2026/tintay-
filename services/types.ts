
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  audioData?: string; // base64 pcm
  timestamp: number;
  sources?: Array<{ title: string; uri: string }>;
}

export interface AudioProcessingState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
}

export enum AppSection {
  CHAT = 'chat',
  HISTORIA = 'historia',
  GALERIA = 'galeria',
  VOZ = 'voz',
  LIVE = 'live',
  MAPAS = 'mapas'
}
