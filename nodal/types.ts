export interface VisualNode {
  color?: string;
  size?: number;
}

export interface Node {
  id: string;
  // Bilingual fields (optional in new schema if model outputs English only, but kept for compatibility)
  label_original?: string;
  label_en?: string;
  label?: string; // New simplified schema might just use label
  description_original?: string;
  description_en?: string;
  description?: string;
  
  centrality: number;
  visual: VisualNode;
  
  // D3 simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface VisualEdge {
  color: string;
  weight: number;
}

export interface EdgeRelation {
  // Bilingual fields
  type_original?: string;
  type_en?: string;
  type?: string;
  label_original?: string;
  label_en?: string;
  label?: string;
  description_original?: string;
  description_en?: string;
  description?: string;
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

export interface Phase {
  phase_id: string;
  phase_name_original?: string;
  phase_name_en?: string;
  phase_name?: string; // Fallback
  summary_original?: string;
  summary_en?: string;
  summary?: string; // Fallback
  graph: GraphData;
}

export interface AnalysisResult {
  timeline?: Phase[];
  // Flattened properties for backward compatibility or single-graph responses
  detected_language?: string;
  total_characters?: number;
  nodes?: Node[];
  edges?: Edge[];
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}
