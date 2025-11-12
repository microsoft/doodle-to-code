# Sketch to Action

A lightweight UI playground that transforms JSON sketches into interactive React components, with AI-powered image analysis using OpenAI's GPT-4 Vision API.

## Features

- 🎨 **JSON to React**: Convert structured JSON sketches into live UI components
- 📤 **Image Upload**: Upload hand-drawn sketches, wireframes, or mockups  
- � **AI Vision Analysis**: Analyze uploaded images with OpenAI GPT-4o Vision API
- �🧩 **Component Library**: Text, Button, Card, Tabs, and Column layout components
- 🔧 **TypeScript**: Fully typed parser and component system
- ✅ **Tested**: Comprehensive test coverage with Vitest
- 🚀 **Fast**: Built with Vite for instant development feedback

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

Open <http://localhost:5173> to use the playground.

## 🔑 AI Vision Configuration (Optional)

To enable real image analysis with AI vision, choose one of these providers:

### Option 1: Azure OpenAI (Recommended)

1. **Copy environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Configure Azure OpenAI in `.env`:**

   ```bash
   VITE_AZURE_OPENAI_API_KEY=your-azure-api-key
   VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   VITE_AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-vision
   VITE_VISION_PROVIDER=azure
   VITE_VISION_MODEL=gpt-4o
   ```

### Option 2: OpenAI (Direct)

1. **Copy environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Configure OpenAI in `.env`:**

   ```bash
   VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
   VITE_VISION_PROVIDER=openai
   VITE_VISION_MODEL=gpt-4o
   ```

3. **Restart the development server:**

   ```bash
   npm run dev
   ```

### Mock vs Real Analysis

- **Without API key**: Uses intelligent mock analysis based on filename patterns (great for testing!)
- **With Azure/OpenAI**: Analyzes actual image content using GPT-4o Vision API

Try filenames like `login.png`, `dashboard.jpg`, `contact-form.png` to see different mock layouts!

## Usage

### 1. Sample Sketches

Switch between pre-built samples using the dropdown:

- **Basic Layout**: Text, card, and button components
- **Tabbed Layout**: Multi-tab interface with nested content

### 2. Upload Your Own Sketches

Use the upload area to add your own sketch images:

- Supports PNG, JPG, SVG (max 10MB)
- Drag & drop or click to browse
- Preview uploaded sketches instantly

### 3. JSON Schema Format

Create your own sketches using this JSON structure:

```json
{
  "name": "my-sketch",
  "root": {
    "type": "column",
    "props": { "gap": 16 },
    "children": [
      {
        "type": "text",
        "props": {
          "value": "Hello World",
          "variant": "heading"
        }
      },
      {
        "type": "button",
        "props": {
          "label": "Click Me",
          "variant": "primary"
        }
      }
    ]
  }
}
```

## Available Components

### Text

```json
{
  "type": "text",
  "props": {
    "value": "Your text content",
    "variant": "heading" | "body"  // optional, defaults to "body"
  }
}
```

### Button

```json
{
  "type": "button",
  "props": {
    "label": "Button Text",
    "variant": "primary" | "secondary"  // optional, defaults to "primary"
  }
}
```

### Card

```json
{
  "type": "card",
  "props": {
    "title": "Card Title",        // optional
    "description": "Card text"    // optional
  },
  "children": [/* nested components */]  // optional
}
```

### Tabs

```json
{
  "type": "tabs",
  "props": {
    "activeTabId": "tab1",  // optional, defaults to first tab
    "tabs": [
      {
        "id": "tab1",
        "label": "Tab 1",
        "content": {/* any component */}
      }
    ]
  }
}
```

### Column Layout

```json
{
  "type": "column",
  "props": {
    "gap": 16  // optional spacing in pixels
  },
  "children": [/* array of components */]
}
```

## Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Button component
│   ├── Card.tsx        # Card component  
│   ├── Text.tsx        # Text component
│   ├── Tabs.tsx        # Tabs component
│   ├── ImageUpload.tsx # File upload component
│   ├── SketchPreview.tsx # Image preview component
│   └── index.ts        # Component exports
├── parser/             # JSON parsing and validation
│   ├── types.ts        # TypeScript definitions
│   ├── parse.ts        # Core parsing logic
│   └── index.ts        # Parser exports
├── App.tsx             # Main application
├── App.css             # Component styles
└── main.tsx            # Application entry point

samples/                # Example sketches
├── basic.json          # Simple layout example
└── tabs.json           # Tabbed interface example

tests/                  # Test files
└── parser.test.ts      # Parser test suite
```

## Development

### Adding New Components

To add a new component type:

1. **Create the component** in `src/components/NewComponent.tsx`:

```tsx
export interface NewComponentProps {
  // Define your props
}

export function NewComponent(props: NewComponentProps) {
  // Component implementation
}
```

1. **Add TypeScript types** in `src/parser/types.ts`:

```typescript
export type NewComponentNode = BaseNode<
  'newComponent',
  {
    // Define props schema
  }
>

// Add to the union type
export type SketchNode = ... | NewComponentNode
```

1. **Update the parser** in `src/parser/parse.ts`:

```typescript
// Add to SUPPORTED_TYPES
const SUPPORTED_TYPES = new Set([..., 'newComponent'])

// Add parser function
function parseNewComponentNode(node: NewComponentNode, path: string): ReactElement {
  // Parsing logic
}

// Add to switch statement in parseNode()
case 'newComponent':
  return parseNewComponentNode(node, path)
```

1. **Export the component** in `src/components/index.ts`:

```typescript
export { NewComponent } from './NewComponent'
export type { NewComponentProps } from './NewComponent'
```

1. **Add tests** in `tests/parser.test.ts`:

```typescript
it('renders new component correctly', () => {
  // Test implementation
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Style

This project uses ESLint and TypeScript strict mode. Run `npm run lint` to check for issues.

## Architecture

The playground uses a three-layer architecture:

1. **Parser Layer** (`src/parser/`): Validates JSON schemas and converts them to React elements
2. **Component Layer** (`src/components/`): Reusable UI primitives that render the parsed elements  
3. **Application Layer** (`src/App.tsx`): Orchestrates sample selection, file uploads, and preview rendering

## Roadmap

- ✅ JSON to React conversion
- ✅ Base UI components (Text, Button, Card, Tabs)
- ✅ Image upload interface
- 🔄 AI vision processing for sketch analysis
- 🔄 Sketch-to-JSON conversion pipeline
- 🔄 Interactive schema editing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure tests pass (`npm test`) and code is linted (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is part of the larger `doodle-to-code` repository. See the main repository for licensing information.
