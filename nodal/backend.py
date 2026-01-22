
import os
import json
import io
import re
import logging
from collections import Counter
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pypdf import PdfReader
from docx import Document

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("nodal_backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Prioritize loading .env.local, then .env
if os.path.exists(".env.local"):
    load_dotenv(".env.local")
    logger.info("Loaded environment from .env.local")
else:
    load_dotenv(".env")
    logger.info("Loaded environment from .env")

app = FastAPI()

# Configure CORS to be safe, although Vite proxy handles cross-origin in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client using the environment variable API_KEY or GEMINI_API_KEY
# We check both to be flexible with common naming conventions
api_key = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    logger.error("No API key found! Please ensure API_KEY or GEMINI_API_KEY is set in .env.local")
    client = None
else:
    client = genai.Client(api_key=api_key)
    logger.info("Gemini client successfully initialized from environment variable.")

# --- Helper Functions ---
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"PDF Parse Error: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        parts = []
        for p in doc.paragraphs:
            if p.text and p.text.strip():
                parts.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text = cell.text.strip()
                    if text:
                        parts.append(text)
        return "\n".join(parts)
    except Exception as e:
        logger.error(f"Docx Parse Error: {e}")
        return ""

def _ensure_edge_ids(edges: list) -> None:
    for i, e in enumerate(edges, start=1):
        if isinstance(e, dict) and not e.get("id"):
            e["id"] = f"e{i}"

def _clamp_weight(edges: list) -> None:
    for e in edges:
        if not isinstance(e, dict): continue
        vis = e.get("visual")
        if not isinstance(vis, dict):
            vis = {}
            e["visual"] = vis
        w = vis.get("weight")
        try:
            w = float(w)
        except Exception:
            w = 0.5
        if w < 0: w = 0.0
        if w > 1: w = 1.0
        vis["weight"] = w

def _extract_json_text(raw: str) -> str:
    if not raw: return ""
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z0-9]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s).strip()
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        s = s[start:end+1].strip()
    return s

def _add_degree_and_size(parsed: dict) -> dict:
    nodes = parsed.get("nodes", [])
    edges = parsed.get("edges", [])
    detected_language = parsed.get("detected_language", "English")

    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise ValueError("Model JSON must contain 'nodes' (list) and 'edges' (list).")

    node_ids = []
    for n in nodes:
        if isinstance(n, dict) and n.get("id") is not None:
            node_ids.append(str(n["id"]))
            n["id"] = str(n["id"])
            if "label_en" not in n and "label" in n:
                n["label_en"] = n["label"]
                n["label_original"] = n["label"]
            if "description_en" not in n and "description" in n:
                n["description_en"] = n["description"]
                n["description_original"] = n["description"]

    node_set = set(node_ids)
    degree = Counter()
    valid_edges = []
    for e in edges:
        if not isinstance(e, dict): continue
        s = e.get("source")
        t = e.get("target")
        if s is None or t is None: continue
        s = str(s)
        t = str(t)
        e["source"] = s
        e["target"] = t
        if s in node_set and t in node_set:
            valid_edges.append(e)
            degree[s] += 1
            degree[t] += 1
            rel = e.get("relation", {})
            if "label_en" not in rel and "label" in rel:
                rel["label_en"] = rel["label"]
                rel["label_original"] = rel["label"]
            if "description_en" not in rel and "description" in rel:
                rel["description_en"] = rel["description"]
                rel["description_original"] = rel["description"]
            if "type_en" not in rel and "type" in rel:
                rel["type_en"] = rel["type"]
                rel["type_original"] = rel["type"]

    for n in nodes:
        if not isinstance(n, dict): continue
        nid = str(n.get("id", ""))
        d = int(degree.get(nid, 0))
        n["centrality"] = d
        vis = n.get("visual")
        if not isinstance(vis, dict):
            vis = {}
            n["visual"] = vis
        vis["size"] = 15 + (d * 5)

    _ensure_edge_ids(valid_edges)
    _clamp_weight(valid_edges)

    return {
        "detected_language": detected_language,
        "total_characters": len([n for n in nodes if isinstance(n, dict)]),
        "nodes": nodes,
        "edges": valid_edges
    }

SYSTEM_PROMPT = """
You are a graph data generator.
Your task is to extract all the people and their relationships from the input content and output a single JSON object.

### Core Constraints
1. Output ONLY valid JSON.
2. Total_characters must equal the number of nodes.
3. Detect the language of the input text (e.g. "English", "Chinese", "Spanish").

### Bilingual Output Rule
For every text field (labels, descriptions, types), you MUST provide two versions:
- `_original`: The text in the detected language of the story.
- `_en`: The text translated into English.
If the story is in English, both fields should be identical.

### Visual & Data Rules
- Nodes: People only.
- Edges: Direct relationships.
- Weight (0.0-1.0): Based on emotional depth/interaction frequency.
- Colors: Consistent hex codes per relationship type.
"""

USER_PROMPT_TEMPLATE = """
Extract a character relationship graph from the provided content.
Output strictly in this JSON format:
{
  "detected_language": "string",
  "total_characters": number,
  "nodes": [ 
    { 
      "id": "string", 
      "label_original": "string", 
      "label_en": "string",
      "description_original": "string",
      "description_en": "string"
    } 
  ],
  "edges": [
    {
      "id": "string", "source": "node_id", "target": "node_id",
      "relation": { 
        "type_original": "string", 
        "type_en": "string",
        "label_original": "string", 
        "label_en": "string",
        "description_original": "string",
        "description_en": "string"
      },
      "visual": { "color": "hex_string", "weight": number }
    }
  ]
}
"""

CHAT_SYSTEM_PROMPT = """
You are an expert story analyst AI for the "Nodal" platform.
You have access to a Knowledge Graph (nodes and relationships) extracted from a story.
Your goal is to answer user questions about the story's characters, relationships, and plot implications based on this graph data.
Be concise, insightful, and refer to specific relationships defined in the context.
"""

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]
    history: List[Dict[str, str]] = []

@app.post("/api/analyze")
async def analyze_content(
    file: UploadFile = File(None),
    text_content: str = Form(None)
):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized. Check your API_KEY in .env.local")
        
    try:
        final_text = ""
        if file:
            content = await file.read()
            if file.content_type == "application/pdf":
                final_text = extract_text_from_pdf(content)
            elif "wordprocessingml" in file.content_type or file.filename.endswith(".docx"):
                final_text = extract_text_from_docx(content)
            else:
                final_text = content.decode("utf-8", errors="ignore")
        elif text_content:
            final_text = text_content

        if not final_text or not final_text.strip():
            raise HTTPException(status_code=400, detail="No content provided")

        file_part = types.Part.from_bytes(
            data=final_text.encode("utf-8", errors="ignore"),
            mime_type="text/plain"
        )

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, file_part],
            config={"response_mime_type": "application/json"}
        )

        raw = response.text
        json_text = _extract_json_text(raw)
        parsed = json.loads(json_text)
        final_graph = _add_degree_and_size(parsed)

        return final_graph

    except Exception as e:
        logger.error(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_context(request: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized. Check your API_KEY in .env.local")

    try:
        history_str = ""
        if request.history:
            for msg in request.history[-10:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_str += f"{role}: {msg.get('content')}\n"

        graph_context = json.dumps(request.context, ensure_ascii=False)
        prompt = f"CONTEXT (Knowledge Graph JSON):\n{graph_context}\n\nCONVERSATION HISTORY:\n{history_str}\n\nUSER QUESTION:\n{request.message}"

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[CHAT_SYSTEM_PROMPT, prompt]
        )
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Local backend running on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
