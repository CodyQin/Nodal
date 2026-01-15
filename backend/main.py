import os
import json
import asyncio
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI()

# 允许跨域，方便前端开发
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 定义 System Prompt，强调时间轴和关系挖掘
SYSTEM_PROMPT = """
You are an expert narrative analyst. Your job is to analyze the provided content (text or video) and construct a dynamic social network graph that evolves over time.

Output strict JSON format with the following structure:
{
  "timeline": [
    {
      "phase_name": "Phase 1: Introduction",
      "timestamp_start": "00:00", 
      "summary": "Brief summary of this phase",
      "nodes": [
        {"id": "char1", "label": "Name", "desc": "Role/Description", "centrality": 8}
      ],
      "edges": [
        {"source": "char1", "target": "char2", "relation": "Friend", "detail": "detail...", "sentiment": "positive", "weight": 5}
      ]
    },
    ... (more phases)
  ]
}

Rules:
1. Divide the story into 3-5 logical phases based on plot progression.
2. Sentiment must be 'positive', 'negative', or 'neutral'.
3. Centrality and Weight should be integers 1-10.
"""

@app.post("/api/analyze")
async def analyze_content(
    file: UploadFile = File(None),
    text_content: str = Form(None)
):
    try:
        if not file and not text_content:
            raise HTTPException(status_code=400, detail="No content provided")

        prompt_content = []
        
        # 1. 如果是文件 (视频/PDF/文本文件)
        if file:
            print(f"Uploading file: {file.filename}...")
            # 读取文件字节流
            file_bytes = await file.read()
            
            # 上传到 Gemini File API (注意：视频文件可能较大，建议用 upload_file 方法)
            # 这里简化处理，直接作为 content 发送 (适用于小文件/文本)
            # 对于大视频，正式做法是先 upload 到 Google File API 拿到 URI
            # 下面是直接将 Bytes 传给 Gemini (适用于文本或极短视频片段)
            # 如果是纯文本文件，直接decode
            if file.content_type.startswith("text/"):
                 prompt_content.append(file_bytes.decode("utf-8"))
            else:
                # 对于视频/图像，需要使用 upload_file 逻辑，这里为了 Hackathon 演示，
                # 建议在 Demo 中主要上传文本或PDF，若要上传视频，需使用 client.files.upload
                # 下面是处理 Text input 的逻辑优先
                pass 

        # 2. 如果是纯文本输入
        if text_content:
            prompt_content.append(text_content)
        
        if not prompt_content:
             # 简单的 Fallback: 假设用户上传了文本文件但没解析出来
             prompt_content.append("Analyze the implied story.")

        print("Sending request to Gemini 3...")
        
        # 调用 Gemini 3
        response = client.models.generate_content(
            model="gemini-3-flash-preview", # 暂时用 2.0 Flash Exp，等 3 正式可用时替换 model name
            contents=[SYSTEM_PROMPT] + prompt_content,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        print("\n" + "="*40)
        print("🤖 GEMINI 3:")
        print("="*40)
        print(response.text)  
        print("="*40 + "\n")

        return json.loads(response.text)

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)