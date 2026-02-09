# Nodal - Developer Documentation

This directory contains the source code for **Nodal**, a full-stack AI application combining a React frontend with a FastAPI backend, powered by Google Gemini 3.0.

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, Tailwind CSS, D3.js (Force-Directed Graphs)
*   **Backend:** Python 3.10+, FastAPI, NetworkX
*   **AI Model:** Google Gemini 3.0 Pro (Multimodal & Thinking)

## 🔧 Local Development Setup

### 1. Prerequisites
*   Node.js (v18 or higher)
*   Python (v3.10 or higher)
*   A Google Cloud Project with Gemini API enabled.

### 2. Backend Setup (FastAPI)

Navigate to the project root:

```bash
# Create a virtual environment
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Configuration:**
Create a `.env` file in this directory:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Run the Server:**
```bash
python backend.py
```
The API will start at `http://0.0.0.0:8000`.

### 3. Frontend Setup (React + Vite)

Open a new terminal window in this directory:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
The application will run at `http://localhost:3000`.

## 📦 Key Libraries Used

*   **`@google/genai`**: Official SDK for interacting with Gemini 3.0.
*   **`networkx`**: Python library used for calculating Betweenness Centrality and graph metrics on the backend.
*   **`d3`**: Used in `components/GraphView.tsx` for the interactive physics-based rendering.

## 🚀 Deployment

The project is designed to be easily deployed:
*   **Frontend**: Can be built via `npm run build` and served via Vercel/Netlify.
*   **Backend**: Can be deployed to AWS EC2, Google Cloud Run, or Render.

## 📝 License

This project is part of the Gemini 3 Hackathon submission by team **U Still Coding**.
