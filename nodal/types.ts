export interface VisualNode {
  color?: string;
  size?: number;
}

export interface Node {
  id: string;
  // Bilingual fields
  label_original: string;
  label_en: string;
  description_original: string;
  description_en: string;
  
  centrality: number;
  visual: VisualNode;
  
  // D3 simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface VisualEdge {
  color: string;
  weight: number;
}

export interface EdgeRelation {
  // Bilingual fields
  type_original: string;
  type_en: string;
  label_original: string;
  label_en: string;
  description_original: string;
  description_en: string;
}

export interface Edge {
  id: string;
  source: string | Node; // D3 converts string ID to Node object
  target: string | Node;
  relation: EdgeRelation;
  visual: VisualEdge;
}

export interface GraphData {
  detected_language: string;
  total_characters: number;
  nodes: Node[];
  edges: Edge[];
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}
