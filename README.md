# Nodal - Unraveling the Threads of Story

**Advanced AI Story Analysis Platform powered by Gemini 3.0**

🌐 **Live Demo:** [http://192.9.149.19:3000/](http://192.9.149.19:3000/)

[![Nodal Video Demo](https://img.youtube.com/vi/AZJyQdsa6zc/maxresdefault.jpg)](https://www.youtube.com/watch?v=AZJyQdsa6zc "Watch the Demo")
> 🎥 **Click the image above to watch the full demo**
---

## 📖 What is Nodal?

**Nodal** is a cutting-edge analysis platform designed to transform linear narratives—whether from text manuscripts or video content—into interactive, dynamic node graphs. 

By leveraging the advanced multimodal reasoning capabilities of **Google's Gemini 3.0 Pro**, Nodal deconstructs complex stories to reveal the underlying web of character relationships, plot progression, and thematic evolution. It bridges the gap between linear consumption and structural comprehension.

## 👥 The Team (U Still Coding)

Developed for the **[Gemini 3 Hackathon](https://gemini3.devpost.com/)** by a dedicated team of USC Computer Science students:

| Member | Role | Links |
| :--- | :--- | :--- |
| **Chenshuhao (Cody) Qin** | Full Stack / System Architecture | [![GitHub](https://img.shields.io/badge/GitHub-black?logo=github)](https://github.com/CodyQin) [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin)](https://www.linkedin.com/in/chenshuhao-qin/) |
| **Xinran Wu** | Backend & Server Deployment | [![GitHub](https://img.shields.io/badge/GitHub-black?logo=github)](https://github.com/xinranwu666) [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin)](https://www.linkedin.com/in/usc-xinran-wu/) |
| **Yixin Xu** | Frontend & Quality Assessment | [![GitHub](https://img.shields.io/badge/GitHub-black?logo=github)](https://github.com/iceu77) [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin)](http://linkedin.com/in/yixinx2004) |
| **Beining Qian** | Frontend & Quality Assessment | [![GitHub](https://img.shields.io/badge/GitHub-black?logo=github)](https://github.com/qianbeining) [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin)](http://linkedin.com/in/beining-qian-69501639b) |

## 📂 Project Structure

- **`/nodal`**: Contains the source code for the full stack application (FastAPI Backend + React Frontend).

To run the project locally, please navigate to the `nodal` directory and follow the technical documentation there.


Here is the high-level data flow of Nodal, illustrating the dual-stream processing between Gemini 3.0 and our frontend.

<img width="7641" height="3884" alt="Gemini AI Graph Pipeline-2026-02-09-235852" src="https://github.com/user-attachments/assets/f3dc1058-c93d-4b21-a374-6bb56a60aac3" />


The system consists of three main layers:
1. **Frontend**: React 19 handling real-time visualization.
2. **Backend**: FastAPI performing graph theory calculations via NetworkX.
3. **AI Layer**: Gemini 3.0 Pro providing reasoning and multimodal analysis.


## Inspiration
The spark for **Nodal** ignited during a dinner conversation with friends from the **USC School of Cinematic Arts**. As they debated the complexities of screenwriting, character arcs, and plot progression, we realized a fundamental gap in their creative workflow.

They frequently tried to use LLMs to summarize scripts or analyze relationships, but they expressed frustration that the output was always... just text. Dense blocks of words. Even when they explicitly asked for "relationship maps," current models would often hallucinate useless ASCII art or provide generic lists that failed to capture the *structure* of the narrative. They could "read" the story via AI, but they couldn't *see* it.

The AI understood the plot, but it lacked the spatial reasoning to present it as a rigorous data structure. This gap—between understanding a story and visualizing its underlying topology—inspired us.

We asked: **What if we combined Gemini 3.0's massive multimodal context window with rigorous graph theory?**

We wanted to build a tool that doesn't just "summarize" a movie or a book, but *deconstructs* it into a navigable network. We wanted to create a platform where writers and students could instantly visualize who influences whom, identifying the "bridges" between social clusters, and watching the narrative topology shift over time.

## What it does
Nodal is a full-stack narrative intelligence engine that transforms linear storytelling (Text or Video) into dynamic, interactive knowledge graphs.

### 1. 🧠 Visualizing the "Thinking" Process
We utilize the **Gemini 3.0 Pro Thinking Model**. Instead of a static loading spinner, Nodal streams Gemini's raw "thoughts" to the user in real-time. You can watch the AI debate with itself: *"Is 'The Count' the same person as 'Edmond'? Yes, the context suggests a disguise. I will merge these nodes."* This provides unprecedented transparency and trust in the data.

### 2. 📊 Scientific Graph Visualization
We don't just draw dots; we visualize influence using rigorous Graph Theory metrics calculated server-side via **NetworkX**:

*   **Node Size = Popularity ($C_D$):**
    Nodes are sized based on **Degree Centrality**:
    $$C_D(v) = \deg(v)$$
    A larger node means the character interacts with more unique people.
*   **Node Color = Influence ($C_B$):**
    Nodes are colored using a heatmap gradient based on **Betweenness Centrality**:
    $$C_B(v) =\sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$
    This mathematically identifies "Bridge" characters. A character might be small (few friends) but "Hot/Red" (high influence) because they are the *only* link between two warring factions.
*   **Dynamic Layout Strategies:**
    *   **Force-Directed:** Simulates physics for organic clustering.
    *   **Hierarchical:** Arranges characters by influence/generations (great for family trees).
    *   **Circular:** Highlights network density and isolated communities.

### 3. ⏳ Temporal Narrative Timeline
Stories aren't static images; they are flows. Nodal breaks the narrative into chronological **Phases**. Users can slide through the timeline at the bottom of the screen to watch relationships form, break, and evolve as the plot thickens. Each phase includes an AI-generated summary of events.

### 4. 🌐 Bilingual Translation
Nodal is built for a global audience. The graph supports instant toggling between the **Original Language** (e.g., French for *Les Misérables*, Korean for *Parasite*) and **English**. This is perfect for language learners or analyzing foreign cinema.

### 5. 💬 Context-Aware Chat
We built a RAG-like chat interface that is grounded in the *current* graph state. Users can ask: *"Why is the relationship between Character A and B red (hostile) in Phase 3?"* The AI answers using the specific edge data and summary from that exact timeline phase.

### 6. 💾 Reproducibility & Export
Users can download their entire analysis as a JSON file. This allows for instant reloading of complex graphs without re-querying the API, facilitating sharing and further study.

---
*Built with ❤️ by U Still Coding.*
