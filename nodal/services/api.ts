import axios from 'axios';
import { GraphData, ChatMessage } from '../types';

// Dynamically determine the API base URL.
const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

export const analyzeContent = async (
  file: File | null, 
  text: string | null, 
  signal?: AbortSignal
): Promise<GraphData> => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (text) {
    formData.append('text_content', text);
  }

  const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal: signal // Pass the abort signal to axios
  });
  return response.data;
};

export const chatWithContext = async (message: string, context: GraphData, history: ChatMessage[]) => {
  const response = await axios.post(`${API_BASE_URL}/chat`, {
    message,
    context,
    history
  });
  return response.data.response;
};
