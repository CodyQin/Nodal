import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. 加载 .env 中的 API Key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("错误：未找到 API Key，请检查 .env 文件")
    exit()

# 2. 初始化客户端 (使用您提供的最新写法)
client = genai.Client(api_key=api_key)

# 3. 准备测试文本 (一段模拟的小说片段)
story_text = """
林萧推开门，看到了坐在沙发上的顾里。顾里的脸色很苍白，手里紧紧握着高脚杯。
“你早就知道席城会来，对吗？”林萧的声音在发抖。
顾里冷笑了一声，红色的裙摆像一团火。“林萧，如果我不这么做，我们在公司的股份都会被吞掉。我是为了我们。”
林萧觉得眼前这个女人既熟悉又陌生，她是自己最好的朋友，也是此刻最可怕的策划者。
"""

# 4. 编写核心 Prompt (这是最关键的一步)
# 我们要求 AI 返回严格的 JSON，包含节点(Nodes)、连线(Edges)和情感颜色
prompt = f"""
你是一个专业的数据可视化分析师。请分析以下小说片段，提取人物关系网络。

要求：
1. **Nodes (节点)**: 提取出现的人物。
   - `id`: 唯一标识。
   - `label`: 姓名。
   - `desc`: 一句话介绍（基于文本推断）。
   - `centrality`: 1-10 的整数，表示在当前片段的社交中心度。
2. **Edges (连线)**: 提取人物互动。
   - `source`: 起点人物ID。
   - `target`: 终点人物ID。
   - `relation`: 关系词 (如: 质问, 盟友, 敌人)。
   - `detail`: 具体的互动描述。
   - `sentiment`: 情感倾向，只能是 "positive" (粉色/绿色), "negative" (红色), "neutral" (灰色)。
   - `weight`: 1-10，表示互动强度。

请直接返回纯 JSON 格式，不要包含 Markdown 格式符（如 ```json）。

文本内容：
{story_text}
"""

print("正在发送请求给 Gemini...")

try:
    # 5. 调用 Gemini API
    response = client.models.generate_content(
        model="gemini-3-flash-preview", # 使用您指定的最新模型
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json" # 强制让 Gemini 输出 JSON
        )
    )

    # 6. 处理并打印结果
    # 尝试解析 JSON 看看格式对不对
    data = json.loads(response.text)
    print("\n====== 成功获取 JSON 数据 ======")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    # 这里的数据结构就是未来前端 React 要用的数据
    
except Exception as e:
    print(f"发生错误: {e}")