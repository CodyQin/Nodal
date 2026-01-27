import os
import json
import io
import re
import logging
from collections import Counter
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai
from google.genai import types
from pypdf import PdfReader
from docx import Document

# -------------------------
# Logging
# -------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("nodal_backend.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Prioritize .env.local then .env
if os.path.exists(".env.local"):
    load_dotenv(".env.local")
    logger.info("Loaded environment from .env.local")
else:
    load_dotenv(".env")
    logger.info("Loaded environment from .env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Gemini client
# -------------------------
api_key = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("No API key found! Please set API_KEY or GEMINI_API_KEY in .env.local")
    client = None
else:
    client = genai.Client(api_key=api_key)
    logger.info("Gemini client initialized.")


# -------------------------
# Helper: extract text
# -------------------------
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
    """
    Extract docx text from paragraphs and tables.
    (Your existing backend already does this.)
    """
    try:
        doc = Document(io.BytesIO(file_bytes))
        parts = []
        for p in doc.paragraphs:
            if p.text and p.text.strip():
                parts.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    t = (cell.text or "").strip()
                    if t:
                        parts.append(t)
        return "\n".join(parts)
    except Exception as e:
        logger.error(f"Docx Parse Error: {e}")
        return ""


# -------------------------
# Helper: JSON cleanup
# -------------------------
def _extract_json_text(raw: str) -> str:
    """
    Handle cases like:
    ```json
    {...}
    ```
    or extra chatter around JSON.
    """
    if not raw:
        return ""
    s = raw.strip()

    # strip code fences
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z0-9]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s).strip()

    # keep the outermost {...}
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        s = s[start : end + 1].strip()
    return s


def _ensure_edge_ids(edges: list) -> None:
    for i, e in enumerate(edges, start=1):
        if isinstance(e, dict) and not e.get("id"):
            e["id"] = f"e{i}"


def _clamp_weight(edges: list) -> None:
    """
    New schema uses edge.visual.weight (not top-level weight).
    If missing or invalid -> default 0.5.
    """
    for e in edges:
        if not isinstance(e, dict):
            continue
        vis = e.get("visual")
        if not isinstance(vis, dict):
            vis = {}
            e["visual"] = vis

        w = vis.get("weight")
        try:
            w = float(w)
        except Exception:
            w = 0.5

        if w < 0:
            w = 0.0
        if w > 1:
            w = 1.0
        vis["weight"] = w


def _add_degree_and_size_to_graph(graph: dict) -> dict:
    """
    Add:
      node.centrality = degree
      node.visual.size = 15 + degree*5  (keep your backend's original sizing style)
    Also:
      - fixes total_characters
      - drops edges referencing missing nodes
      - clamps visual.weight
    """
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    detected_language = graph.get("detected_language", "English")

    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise ValueError("Graph JSON must contain 'nodes'(list) and 'edges'(list).")

    node_ids = []
    for n in nodes:
        if isinstance(n, dict) and n.get("id") is not None:
            n["id"] = str(n["id"])
            node_ids.append(n["id"])

            # Backward-compat / Safety: if model returns plain label/description, copy into bilingual fields
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
        if not isinstance(e, dict):
            continue
        s = e.get("source")
        t = e.get("target")
        if s is None or t is None:
            continue

        s = str(s)
        t = str(t)
        e["source"] = s
        e["target"] = t

        if s in node_set and t in node_set:
            valid_edges.append(e)
            degree[s] += 1
            degree[t] += 1

            rel = e.get("relation", {})
            if isinstance(rel, dict):
                # Safety for edges too
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
        if not isinstance(n, dict):
            continue
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
        "edges": valid_edges,
    }


# ===== NEW: timeline-aware processing
def _is_timeline_schema(parsed: Any) -> bool:
    return isinstance(parsed, dict) and isinstance(parsed.get("timeline"), list)


def _process_model_output(parsed: dict) -> dict:
    """
    If timeline schema:
      - add degree+size to each phase.graph
      - return the whole timeline object (with enriched graphs)
    Else:
      - add degree+size to single graph and return it
    """
    if _is_timeline_schema(parsed):
        timeline = parsed.get("timeline", [])
        for i, phase in enumerate(timeline, start=1):
            if not isinstance(phase, dict):
                continue
            graph = phase.get("graph")
            if isinstance(graph, dict):
                phase["graph"] = _add_degree_and_size_to_graph(graph)
            else:
                # keep structure stable; just skip
                logger.warning(f"Phase {i} missing graph object; skipped centrality/size fill.")

        return {"timeline": timeline}

    # single-graph schema
    return _add_degree_and_size_to_graph(parsed)


# -------------------------
# Prompts
# -------------------------
SYSTEM_PROMPT = """
You are a graph data generator.

Your task is to extract people and their direct relationships from the provided content and output a JSON object with a timeline of phases. Each phase contains one graph.

### Output Constraints
1. Output ONLY valid JSON. No explanations, no markdown, no code fences.
2. Output must support bilingual display (Original Language + English).
3. You MUST output a top-level object with this structure:
{
  "timeline": [
    {
      "phase_id": "p1",
      "phase_name_original": "string",
      "phase_name_en": "string",
      "summary_original": "string",
      "summary_en": "string",
      "graph": {
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
            "id": "string",
            "source": "node_id",
            "target": "node_id",
            "relation": {
              "type_original": "string",
              "type_en": "string",
              "label_original": "string",
              "label_en": "string",
              "description_original": "string",
              "description_en": "string"
            },
            "visual": {
              "color": "string",
              "weight": number
            }
          }
        ]
      }
    }
  ]
}

### Language Handling
4. "detected_language": The primary language of the input text (e.g., "English", "Chinese", "French").
5. `_original` fields: content in the source language.
6. `_en` fields: content translated to English.
7. If the input is English, `_original` and `_en` fields must be identical.
8. `node.id` MUST be a language-neutral, lowercase snake_case identifier (e.g., "sun_wukong", "dr_sheppard") and must be stable across phases.

### Phase Rules
9. Divide the content into suitable logical phases, in chronological reading order.
10. Each phase has its own graph. Do NOT merge graphs across phases.
11. `phase_name` and `summary` MUST be bilingual (original + English).

### Node & Edge Definitions
12. Nodes represent people only.
13. Edges represent direct relationships only.
14. Each node should appear in at least one edge unless the phase strongly implies isolation.

### Identity Consistency
15. If the same character appears in multiple phases, reuse the EXACT same node.id.
16. Canonical labels: Choose one consistent display name for `label_original` and `label_en` per character ID across all phases.

### Relationship Rules
17. relationship.type_* MUST be normalized (e.g., "friend", "ally", "enemy").
18. relationship.description_* MUST be >3 sentences, citing specific interactions.

### Visual Rules
19. edge.visual fields are required: color and weight (0.0 - 1.0).
20. Strict 1-to-1 color mapping for relationship types across the ENTIRE timeline.

### Totals & Coverage
21. For each phase.graph: total_characters MUST equal the number of nodes.
22. Capture key interactions and active secondary characters.
""".strip()

USER_PROMPT_TEMPLATE = """
Extract a timeline of character relationship graphs from the attached content.

Return JSON ONLY.

""".strip()

# -------------------------
# ===== NEW: stricter chat boundary prompt
# -------------------------
CHAT_SYSTEM_PROMPT = """
You are the Nodal Graph Chat assistant.

You ONLY answer questions about:
- characters (nodes),
- relationships (edges),
- relationship changes across phases if a timeline is provided,
- and plot implications that can be directly supported by the provided graph JSON.

Hard boundaries:
- If the user asks anything unrelated to character relationships / the graph (e.g., general trivia, writing advice, coding help, medical/legal, or story details not supported by the graph), you MUST refuse briefly and ask them to rephrase as a graph/relationship question.
- You must not invent facts not present in the graph context.
- If the graph context is missing or empty, say you do not have the generated graph data and ask the user to send/attach it (or re-run analysis) before you can answer.

Answer style:
- Be concise.
- When possible, cite specific node labels and the exact relationship types from the context.
""".strip()


class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]
    history: List[Dict[str, str]] = []


# -------------------------
# API: analyze
# -------------------------
@app.post("/api/analyze")
async def analyze_content(
    file: UploadFile = File(None),
    text_content: str = Form(None),
):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized. Check API_KEY/GEMINI_API_KEY.")

    try:
        final_text = ""

        if file:
            content = await file.read()
            if file.content_type == "application/pdf":
                final_text = extract_text_from_pdf(content)
            elif "wordprocessingml" in file.content_type or (file.filename and file.filename.endswith(".docx")):
                final_text = extract_text_from_docx(content)
            else:
                final_text = content.decode("utf-8", errors="ignore")
        elif text_content:
            final_text = text_content

        if not final_text or not final_text.strip():
            raise HTTPException(status_code=400, detail="No content provided")

        # Provide "prompt + uploaded file" style input to Gemini (like your local test)
        file_part = types.Part.from_bytes(
            data=final_text.encode("utf-8", errors="ignore"),
            mime_type="text/plain",
        )

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, file_part],
            config={"response_mime_type": "application/json"},
        )

        raw = response.text or ""
        json_text = _extract_json_text(raw)
        parsed = json.loads(json_text)

        # Timeline-aware: fill degree/size per phase
        final_obj = _process_model_output(parsed)

        return final_obj

    except json.JSONDecodeError as je:
        logger.error(f"JSON Decode Error: {je}")
        logger.error(f"Raw model output (first 2000 chars): {raw[:2000] if 'raw' in locals() else ''}")
        raise HTTPException(status_code=500, detail=f"Invalid JSON response from AI: {str(je)}")
    except Exception as e:
        logger.error(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# API: chat
# -------------------------
@app.post("/api/chat")
async def chat_with_context(request: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized. Check API_KEY/GEMINI_API_KEY.")

    try:
        # ===== IMPORTANT: This chatbot only knows what the frontend sends in request.context
        # It does NOT automatically load phases_out/index.json or latest_analysis.json.
        graph_context = request.context or {}

        history_str = ""
        if request.history:
            for msg in request.history[-10:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_str += f"{role}: {msg.get('content')}\n"

        prompt = (
            "CONTEXT (Graph JSON; may be single-graph or timeline):\n"
            f"{json.dumps(graph_context, ensure_ascii=False)}\n\n"
            "CONVERSATION HISTORY:\n"
            f"{history_str}\n"
            "USER QUESTION:\n"
            f"{request.message}"
        )

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[CHAT_SYSTEM_PROMPT, prompt],
        )

        return {"response": response.text}

    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
