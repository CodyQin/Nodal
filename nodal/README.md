# Nodal - AI Story Analysis

## Prerequisites
- Python 3.10+
- Node.js 18+

## Backend Setup (Python)

1. **Create a Virtual Environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate the Virtual Environment:**
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Mac/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Run the Backend:**
   ```bash
   python backend.py
   ```
   The server will start at `http://0.0.0.0:8000`.

## Frontend Setup (React/Vite)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Frontend:**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000`.
