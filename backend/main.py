import os
import json
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pypdf import PdfReader
from docx import Document

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- 辅助函数：提取文本 ---
def extract_text_from_pdf(file_bytes):
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"PDF Parse Error: {e}")
        return ""

def extract_text_from_docx(file_bytes):
    try:
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Docx Parse Error: {e}")
        return ""

SYSTEM_PROMPT = """
You are an expert narrative analyst. Your job is to analyze the provided content and construct a dynamic social network graph that evolves over time.

Output strict JSON format with the following structure:
{
  "timeline": [
    {
      "phase_name": "Phase 1: Introduction",
      "summary": "Brief summary of this phase",
      "nodes": [
        {"id": "char1", "label": "Name", "desc": "Role/Description", "centrality": 8}
      ],
      "edges": [
        {"source": "char1", "target": "char2", "relation": "Friend", "detail": "detail...", "sentiment": "positive", "weight": 5}
      ]
    }
  ]
}

Rules:
1. Divide the story into 3-5 logical phases.
2. Sentiment must be 'positive' (green), 'negative' (red), or 'neutral' (grey).
3. Centrality and Weight should be 1-10.
"""

@app.post("/api/analyze")
async def analyze_content(
    file: UploadFile = File(None),
    text_content: str = Form(None)
):
    try:
        final_text = ""

        # 1. 优先处理文件上传
        if file:
            print(f"Processing file: {file.filename} ({file.content_type})")
            content = await file.read()
            
            if file.content_type == "application/pdf":
                final_text = extract_text_from_pdf(content)
            elif "wordprocessingml" in file.content_type or file.filename.endswith(".docx"):
                final_text = extract_text_from_docx(content)
            elif file.content_type.startswith("text/"):
                final_text = content.decode("utf-8")
            else:
                # 尝试当作纯文本处理
                try:
                    final_text = content.decode("utf-8")
                except:
                    raise HTTPException(status_code=400, detail="Unsupported file format")

        # 2. 如果没有文件，检查是否有粘贴的文本
        elif text_content:
            final_text = text_content
            
        if not final_text:
            raise HTTPException(status_code=400, detail="No content provided")

        print(f"Extracted text length: {len(final_text)} characters")
        print(f"Extracted text preview: {final_text[:500]}...")  # 打印前500个字符预览

        # 3. 发送给 Gemini
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=[SYSTEM_PROMPT, f"STORY CONTENT:\n{final_text}"],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # 解析并打印生成的JSON结果
        parsed_response = json.loads(response.text)
        print("Generated analysis result:")
        print(json.dumps(parsed_response, indent=2, ensure_ascii=False))
        
        # 额外打印一些关键信息
        timeline = parsed_response.get('timeline', [])
        print(f"\nTimeline phases count: {len(timeline)}")
        
        for i, phase in enumerate(timeline):
            # 确保phase是字典类型，再使用.get()方法
            if isinstance(phase, dict):
                print(f"Phase {i+1}: {phase.get('phase_name', 'N/A')}")
                print(f"  Summary: {phase.get('summary', 'N/A')[:100]}...")
                print(f"  Nodes count: {len(phase.get('nodes', []))}")
                print(f"  Edges count: {len(phase.get('edges', []))}")
                
                # 打印第一个节点的信息作为示例
                nodes = phase.get('nodes', [])
                if nodes and len(nodes) > 0:
                    first_node = nodes[0]
                    if isinstance(first_node, dict):
                        print(f"  First node: {first_node.get('label', 'N/A')} (ID: {first_node.get('id', 'N/A')}, Centrality: {first_node.get('centrality', 'N/A')})")
                        
                # 打印第一个边的信息作为示例
                edges = phase.get('edges', [])
                if edges and len(edges) > 0:
                    first_edge = edges[0]
                    if isinstance(first_edge, dict):
                        print(f"  First edge: {first_edge.get('source', 'N/A')} -> {first_edge.get('target', 'N/A')} ({first_edge.get('relation', 'N/A')}, Sentiment: {first_edge.get('sentiment', 'N/A')})")
            else:
                print(f"Phase {i+1}: Invalid phase data (not a dictionary)")

        return parsed_response

    except json.JSONDecodeError as je:
        print(f"JSON Decode Error: {je}")
        print(f"Raw response: {response.text if 'response' in locals() else 'Response not available'}")
        raise HTTPException(status_code=500, detail=f"Invalid JSON response from AI: {str(je)}")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)