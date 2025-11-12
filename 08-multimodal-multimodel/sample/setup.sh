#!/bin/bash

echo "🧠 AI Decision Engine Explorer - Setup Script"
echo "=============================================="
echo ""

# Check Python
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10 or higher."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"
echo ""

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"
echo ""

# Setup Backend
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Microsoft Agent Framework (--pre flag required)..."
pip install agent-framework-azure-ai --pre

echo "Installing other Python dependencies..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API credentials!"
fi

cd ..

# Setup Frontend
echo ""
echo "Setting up frontend..."
cd frontend

echo "Installing Node.js dependencies..."
npm install

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from example..."
    cp .env.local.example .env.local
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your API credentials"
echo "   - For GitHub Models (free): Add your GitHub Personal Access Token"
echo "   - For Azure OpenAI: Add your Azure OpenAI API key and endpoint"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "See SETUP.md for detailed instructions!"
