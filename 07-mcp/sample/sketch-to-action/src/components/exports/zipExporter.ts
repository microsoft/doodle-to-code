import JSZip from 'jszip'
import type { Sketch } from '../../parser/types'
import { ReactGenerator } from './reactGenerator'
import { CSSGenerator } from './cssGenerator'
import { sanitizeFileName, generateTimestamp } from './utils'

export interface ZipExportOptions {
  includeComments?: boolean
  includePackageJson?: boolean
  includeReadme?: boolean
}

/**
 * Generates a complete React app as a ZIP file
 * Includes: App.tsx, styles, package.json, README, etc.
 */
export class ZipExporter {
  constructor(private sketch: Sketch) {}

  /**
   * Generate a complete app ZIP with all necessary files
   */
  async generateAppZip(options: ZipExportOptions = {}): Promise<Blob> {
    const {
      includeComments = true,
      includePackageJson = true,
      includeReadme = true,
    } = options

    const zip = new JSZip()
    const appName = sanitizeFileName(this.sketch.name || 'generated-app')

    // Create src folder
    const srcFolder = zip.folder('src')!
    
    // Generate main App component
    const reactGenerator = new ReactGenerator(this.sketch)
    const appContent = reactGenerator.generate({ includeComments })
    srcFolder.file('App.tsx', appContent)

    // Generate CSS
    const cssGenerator = new CSSGenerator(this.sketch)
    const cssContent = cssGenerator.generate({ includeComments })
    srcFolder.file('App.css', cssContent)

    // Add main.tsx entry point
    srcFolder.file('main.tsx', this.generateMainTsx())

    // Add index.html
    zip.file('index.html', this.generateIndexHtml(appName))

    // Add package.json
    if (includePackageJson) {
      zip.file('package.json', this.generatePackageJson(appName))
    }

    // Add TypeScript config
    zip.file('tsconfig.json', this.generateTsConfig())
    zip.file('tsconfig.node.json', this.generateTsConfigNode())

    // Add Vite config
    zip.file('vite.config.ts', this.generateViteConfig())

    // Add README
    if (includeReadme) {
      zip.file('README.md', this.generateReadme(appName))
    }

    // Add .gitignore
    zip.file('.gitignore', this.generateGitignore())

    // Generate the ZIP blob
    return await zip.generateAsync({ type: 'blob' })
  }

  private generateMainTsx(): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
  }

  private generateIndexHtml(appName: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  }

  private generatePackageJson(appName: string): string {
    const pkg = {
      name: appName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
      devDependencies: {
        '@types/react': '^18.3.12',
        '@types/react-dom': '^18.3.1',
        '@vitejs/plugin-react': '^4.3.4',
        typescript: '^5.6.2',
        vite: '^6.0.1',
      },
    }
    return JSON.stringify(pkg, null, 2)
  }

  private generateTsConfig(): string {
    const config = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
      },
      include: ['src'],
    }
    return JSON.stringify(config, null, 2)
  }

  private generateTsConfigNode(): string {
    const config = {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2023'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        strict: true,
        noEmit: true,
      },
      include: ['vite.config.ts'],
    }
    return JSON.stringify(config, null, 2)
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
`
  }

  private generateReadme(appName: string): string {
    return `# ${appName}

This React application was generated from an image using AI vision analysis.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

## Project Structure

\`\`\`
${appName}/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Component styles
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── README.md            # This file
\`\`\`

## Features

- ⚛️ React 18 with TypeScript
- ⚡ Vite for fast development and builds
- 🎨 Component-based architecture
- 📱 Responsive positioning from original design
- 🎯 Absolute positioning for precise layouts

## Technologies

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Next-generation frontend tooling
- **CSS3**: Modern styling with custom properties

## Customization

The generated components use absolute positioning to match the original design layout.
You can customize:

- Edit \`src/App.tsx\` to modify component structure
- Edit \`src/App.css\` to adjust styles and positioning
- Components are positioned exactly as detected in the original image

## Generated by

Image to Code Playground - AI-powered UI to React converter
`
  }

  private generateGitignore(): string {
    return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`
  }
}

/**
 * Helper function to download a ZIP file
 */
export async function downloadZip(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
