# AI Decision Engine Explorer

This is an interactive demo that shows how modern AI systems work with different input types and coordinate multiple specialized models to solve tasks.

**What you'll see:** Upload text, images, or audio files, then watch in real-time as the AI analyzes your input, selects the right models, and processes everything step-by-step. Think of it as looking inside the decision-making process of an AI system.

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, and either a GitHub account or Azure OpenAI access.

1. Clone and install:

   ```bash
   git clone https://github.com/microsoft/doodle-to-code
   cd 08-multimodal-multimodel/sample
   npm install
   ```

2. Configure your API keys:

   ```bash
   cp .env.local.sample .env.local
   ```

   Edit `.env.local` and add your credentials:

   For GitHub Models (free):
   ```bash
   GITHUB_TOKEN=your_github_personal_access_token
   MODEL_ENDPOINT=https://models.inference.ai.azure.com
   ```

   Or for Azure OpenAI:
   ```bash
   AZURE_OPENAI_API_KEY=your_azure_openai_key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>

**Get API Keys:**
- GitHub: Go to [Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
- Azure: Create an Azure OpenAI resource in the Azure Portal

## What This Does

Upload any combination of text, images, or audio. The app shows you how the AI:

1. Detects what type of input you provided
2. Selects which AI models to use
3. Routes your input to specialized models
4. Combines their outputs into a final result

You see the entire decision process: which models were chosen, why, and how they worked together.

## 💡 Concepts Explained

**Multimodal:** Accepting different input formats (text, images, audio, video). The system processes and understands multiple data types and their relationships, not just text.

**Multimodel:** Using multiple specialized AI models instead of one general-purpose model. A router analyzes each task and delegates to specialists: vision models handle images, reasoning models tackle logic problems, language models process text.

**Why it matters:** By combining both approaches, you get a system that accepts any input type, then intelligently routes work to the right specialists. Each model does what it's best at, producing better results than a single model handling everything.

## Architecture

The app is built as a Next.js application that talks to various AI models. Here's the basic flow:

```text
┌─────────────────┐
│   Next.js App   │ ← Frontend (React, TypeScript, TailwindCSS)
│   (Port 3000)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │ ← Built-in Next.js API
│  /api/upload    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Decision Engine │ ← TypeScript logic for model orchestration
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Models via  │ ← GitHub Models or Azure OpenAI
│  Azure AI SDK   │
└─────────────────┘
```

The app uses five AI models: Phi-4-multimodal (router), Llama-4-Maverick (vision), Cohere Command-R+ (text), DeepSeek-R1 (reasoning), and Phi-4-Reasoning (logic).

## Resources

[Github Marketplace - GitHub Models](https://github.com/marketplace?type=models)  
[Azure AI Services Documentation](https://learn.microsoft.com/en-us/azure/ai-services/)

## Contributing

Contributions welcome. This is an educational project for learning multimodal and multimodel AI concepts.
