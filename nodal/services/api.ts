import axios from 'axios';
import { AnalysisResult, ChatMessage, GraphData } from '../types';

// Dynamically determine the API base URL.
const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

export type StreamEventCallback = (type: 'status' | 'thought' | 'error' | 'result', data: any) => void;

export const analyzeContentStream = async (
  file: File | null, 
  text: string | null, 
  videoUrl: string | null,
  onEvent: StreamEventCallback,
  signal?: AbortSignal
): Promise<void> => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (text) formData.append('text_content', text);
  if (videoUrl) formData.append('video_url', videoUrl);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
    signal
  });

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      const lines = buffer.split("\n");
      // Keep the last part if it's incomplete (doesn't end with newline)
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          onEvent(event.type, event.data || event.text || event.message);
        } catch (e) {
          console.warn("Error parsing stream line:", line);
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Stream aborted');
    } else {
      throw err;
    }
  }
};

// Kept for backward compatibility if needed, though LandingPage uses stream now
export const analyzeContent = async (
  file: File | null, 
  text: string | null, 
  videoUrl: string | null,
  signal?: AbortSignal
): Promise<AnalysisResult> => {
  return new Promise((resolve, reject) => {
    let result: AnalysisResult | null = null;
    analyzeContentStream(
      file, text, videoUrl,
      (type, data) => {
        if (type === 'result') result = data;
        if (type === 'error') reject(data);
      },
      signal
    ).then(() => {
      if (result) resolve(result);
      else reject("Stream finished without result");
    }).catch(reject);
  });
};

export const chatWithContextStream = async (
  message: string, 
  context: GraphData | AnalysisResult, 
  history: ChatMessage[],
  onChunk: (text: string) => void
) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context,
      history
    }),
  });

  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
};

// Simple wrapper for legacy compatibility if needed, but streaming is preferred.
export const chatWithContext = async (message: string, context: GraphData | AnalysisResult, history: ChatMessage[]) => {
  let fullResponse = "";
  await chatWithContextStream(message, context, history, (chunk) => fullResponse += chunk);
  return fullResponse;
};
