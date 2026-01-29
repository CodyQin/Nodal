import axios from 'axios';
import { AnalysisResult, ChatMessage, GraphData } from '../types';

// Dynamically determine the API base URL.
const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

export const analyzeContent = async (
  file: File | null, 
  text: string | null, 
  videoUrl: string | null,
  signal?: AbortSignal
): Promise<AnalysisResult> => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (text) {
    formData.append('text_content', text);
  }
  if (videoUrl) {
    formData.append('video_url', videoUrl);
  }

  const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal: signal // Pass the abort signal to axios
  });
  return response.data;
};

export const chatWithContext = async (message: string, context: GraphData | AnalysisResult, history: ChatMessage[]) => {
  const response = await axios.post(`${API_BASE_URL}/chat`, {
    message,
    context,
    history
  });
  return response.data.response;
};
