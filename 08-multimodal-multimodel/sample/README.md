# AI Decision Engine Explorer

**Explore how AI combines multimodal inputs and multimodel processing to solve real-world problems.** This app demonstrates how AI systems analyze diverse inputs like images, audio, text and select the best models for each task to deliver accurate results. For example, upload a photo of a menu and ask, "What are the vegetarian options?", the app will detect text in the image, translate it if needed, and reason through the content to provide an answer.

You can upload an image, audio, or text and pose a question to see how the app analyzes each input type individually, selects the best models for the task, and orchestrates them to provide a comprehensive and accurate response.

## 🌟 Why This App Matters

In the world of AI, the synergy between two key concepts—**Multimodal** and **Multimodel**—is transformative:

- **Multimodal**: By combining different input types (e.g., text, images, audio), AI systems can process information holistically, capturing the richness of real-world data. For example, the app can analyze an image of a menu and a text-based question together to provide a meaningful answer.
- **Multimodel**: Leveraging multiple specialized AI models ensures that each task is handled by the most capable model, leading to more accurate and reliable outcomes. For instance, text recognition, translation, and reasoning are performed by different models, each optimized for its specific task.

When used together, these concepts transform how AI systems operate. By combining diverse data types and selecting the most suitable model for each task, AI can tackle complex, real-world scenarios with a nuanced understanding. This synergy creates systems that are not only more robust but also better equipped to handle the challenges of diverse and dynamic environments.

## 🚀 Quick Start

### 1. Requirements

Ensure you have the following installed and ready:

- **Node.js**: Version 18 or higher
- **Credentials**: Either a GitHub Personal Access Token or Azure OpenAI credentials

### 2. Installation

Follow these steps to set up the app:

1. Clone the repository:

   ```bash
   git clone https://github.com/microsoft/doodle-to-code.git
   ```

2. Navigate to the project directory:

   ```bash
   cd doodle-to-code/08-multimodal-multimodel/sample
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy the example environment file:

   ```bash
   cp .env.local.example .env.local
   ```

### 3. Configuration

Set up your environment variables based on your preferred model provider:

#### GitHub Models (Free Tier)

Add the following to your `.env.local` file:

```env
GITHUB_TOKEN=your_github_token
MODEL_ENDPOINT=https://models.inference.ai.azure.com
```

#### Azure OpenAI

Add the following to your `.env.local` file:

```env
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
MODEL_ENDPOINT=your_endpoint
```

#### Model Names (Required)

Specify the models to use in your `.env.local` file:

```env
PHI4_MULTIMODAL_MODEL=Phi-4-multimodal-instruct
LLAMA4_MAVERICK_MODEL=Llama-4-Maverick-17B-128E-Instruct-FP8
COHERE_MODEL=Cohere-command-r-plus-08-2024
DEEPSEEK_MODEL=DeepSeek-R1-0528
PHI_REASONING_MODEL=Phi-4-reasoning
```

### 4. Run the App

Start the development server:

```bash
npm run dev
```

Access the app in your browser at:

[http://localhost:3001](http://localhost:3001)

## 🧠 How It Works

The app employs a tiered router-based architecture to handle multimodal and multimodel tasks:

1. **Decision Engine**: Detects input types, decomposes tasks, selects models, and orchestrates their execution. It ensures that the right models are chosen for each task, optimizing for accuracy and efficiency.
2. **Decision Viewer**: Visualizes the decision-making process, showing how inputs are processed and models interact. This transparency helps users understand the reasoning behind each decision.
3. **API Endpoint**: Manages uploads and streams results back to the client in real-time, providing a seamless user experience.

## 📂 Project Structure

The project is organized as follows:

```plaintext
src/
├── app/
│   ├── api/upload/stream/     # Streaming API that orchestrates execution
│   └── page.tsx                # Main UI with upload + visualizations
├── components/
│   ├── DecisionViewer.tsx     # Renders multimodal/multimodel boxes + pipeline
│   └── UploadComponent.tsx    # Handles file upload + streaming events
└── lib/
    ├── decision-engine.ts     # Core router logic (1041 lines of orchestration)
    ├── config.ts              # Environment configuration
    └── types/                 # TypeScript definitions
```

## 📖 Learn More

Explore these resources to deepen your understanding:

- [GitHub Models](https://github.com/marketplace/models) — Multi-provider AI model API
- [Azure OpenAI Service](https://azure.microsoft.com/products/ai-services/openai-service) — Enterprise AI platform
- [Router Pattern](https://www.anthropic.com/research/building-effective-agents) — Architectural pattern for AI systems