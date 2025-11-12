# Multimodal + Multimodel AI Demo

A practical demo showing how MULTIMODAL inputs and MULTIMODEL architecture work together. Upload a Japanese menu image with a question and watch three specialized AI models collaborate to answer it.

## What This Demonstrates

This demo clarifies two concepts that sound similar but mean different things:

**MULTIMODAL** = Using different types of input data (image + text, audio + text, etc.)

**MULTIMODEL** = Using multiple specialized AI models in sequence or parallel

Most AI applications need both concepts working together.

## Real Example: Japanese Menu Translation

Upload a photo of a Japanese restaurant menu and ask "anything gluten free?"

The system:
1. **Detects multimodal input** - Image (menu photo) + Text (your question)
2. **Selects three specialized models**:
   - Llama 4 Maverick (Meta) - Extracts Japanese text from image
   - Cohere Command R+ - Translates Japanese to English
   - DeepSeek R1 - Answers your question based on translated menu
3. **Chains outputs** - Each model passes results to the next one

This shows why both concepts matter: handling different input types (multimodal) AND using the right model for each task (multimodel).

## Architecture

The app has two main parts:

**Frontend** (Next.js + TypeScript)
- Upload component for images
- Two visualization boxes showing MULTIMODAL and MULTIMODEL concepts
- Pipeline display showing each model's output

**Backend** (TypeScript + GitHub Models API)
- Decision engine that analyzes input type
- Model orchestration that chains three models
- Streaming responses for real-time updates

**Models Used**:
- Llama 4 Maverick 17B (Meta) - Vision and OCR
- Cohere Command R+ - Translation (100+ languages)
- DeepSeek R1 - Reasoning and question answering
- Phi-4 Multimodal (Microsoft) - Backup for vision tasks

All models accessed via GitHub Models API (free tier available).

## Setup

### Requirements

- Node.js 18+
- GitHub Personal Access Token (for GitHub Models API)

### Installation

1. Clone and install:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
GITHUB_TOKEN=your_github_token_here
PHI4_MULTIMODAL_MODEL=Phi-4-multimodal-instruct
LLAMA4_MAVERICK_MODEL=Llama-4-Maverick-17B-128E-Instruct-FP8
COHERE_MODEL=Cohere-command-r-plus-08-2024
DEEPSEEK_MODEL=DeepSeek-R1-0528
PHI4_REASONING_MODEL=Phi-4-reasoning-plus
```

3. Run the dev server:
```bash
npm run dev
```

4. Open http://localhost:3001

### Getting a GitHub Token

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `read:packages`
4. Copy token to `.env.local`

## How It Works

**Step 1: Input Detection**
- System checks what input types you provided
- Detects: Image, Text, or both
- Displays results in MULTIMODAL box

**Step 2: Model Selection**
- Based on input type, system chooses specialized models
- For IMAGE_WITH_TEXT: Llama → Cohere → DeepSeek
- Displays selected models in MULTIMODEL box

**Step 3: Pipeline Execution**
- Models run sequentially:
  - Llama extracts Japanese text from image
  - Cohere translates Japanese to English
  - DeepSeek answers your question using translated menu
- Each model only gets what it needs:
  - First model: Gets original image
  - Middle models: Get previous model's output
  - Last model: Gets previous output + your question

**Step 4: Results**
- See each model's individual output
- Final answer appears at the bottom
- Performance stats: time (~20s) and cost (~$0.01)

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/upload/stream/   # Streaming upload endpoint
│   │   └── page.tsx              # Main demo page
│   ├── components/
│   │   ├── DecisionViewer.tsx   # Shows MULTIMODAL + MULTIMODEL
│   │   └── UploadComponent.tsx  # File upload UI
│   ├── lib/
│   │   └── decision-engine.ts   # Model selection and pipeline logic
│   └── types/
│       └── index.ts              # TypeScript types
├── .env.local                    # API keys (not in git)
└── VIDEO_RECORDING_GUIDE.md      # Guide for recording demo
```

## Key Files

**decision-engine.ts** - Core logic
- `analyzeStreaming()` - Detects input modality
- `selectModels()` - Chooses which models to use
- `executeModel()` - Runs individual models
- Pipeline flow at lines 920-935

**DecisionViewer.tsx** - UI components
- MULTIMODAL box (shows detected inputs)
- MULTIMODEL box (shows selected models)
- Pipeline display (shows execution flow)

## Performance

Typical request:
- **Time**: ~20 seconds
- **Cost**: < $0.01 (using GitHub Models free tier)
- **Models**: 3 different providers (Meta, Cohere, DeepSeek)
- **Token usage**: ~750 tokens total

## Why This Approach?

**Specialization** - Each model does what it's best at:
- Vision models for OCR
- Translation models for languages
- Reasoning models for question answering

**Transparency** - You see exactly what each model contributes

**Cost efficiency** - Only pay for what you need (each model runs once)

**Flexibility** - Easy to swap models or add new ones

## Limitations

- Image size: Keep under 500KB for fast processing
- Language support: Currently optimized for Japanese menus
- Model availability: Requires GitHub Models API access
- Temperature settings: Fixed at 0.3-0.7 (not configurable in UI)
- Token limits: 250 tokens per model (may truncate long outputs)

## Learn More

- [GitHub Models](https://github.com/marketplace/models) - Free AI model access
- [Llama 4 Maverick](https://ai.meta.com/llama/) - Vision model from Meta
- [Cohere Command R+](https://cohere.com/command) - Translation model
- [DeepSeek R1](https://www.deepseek.com/) - Reasoning model

## License

MIT
