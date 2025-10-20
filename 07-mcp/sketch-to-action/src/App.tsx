import { useMemo, useState, useCallback } from 'react'
import './App.css'
import { parseSketch, SketchParserError } from '@parser'
import type { Sketch } from '@parser'
import { VisionAnalyzer, SchemaEditor, CodeExporter } from '@components'
import type { VisionAnalysisResult } from '@services'
import { SketchConverter } from './services/sketchConverter'
import { EditableProvider } from './contexts/EditableContext'

function App() {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null)
  const [conversionError, setConversionError] = useState<Error | null>(null)
  const [editedSchema, setEditedSchema] = useState<Sketch | null>(null)
  const [editedTextValues, setEditedTextValues] = useState<Record<string, string>>({})

  const convertedSketch = useMemo(() => {
    if (!visionResult) return null
    try {
      const converter = new SketchConverter()
      const result = converter.convertVisionToSketch(visionResult, { 
        inferTabs: false, minConfidence: 0.6, layoutStrategy: 'auto'
      })
      setConversionError(null)
      return result
    } catch (error) {
      setConversionError(error instanceof Error ? error : new Error('Conversion failed'))
      return null
    }
  }, [visionResult])

  const schemaWithTextEdits = useMemo(() => {
    const baseSchema = editedSchema || convertedSketch?.sketch
    if (!baseSchema || Object.keys(editedTextValues).length === 0) return baseSchema
    const updated = JSON.parse(JSON.stringify(baseSchema))
    const updateTextInNodes = (nodes: unknown[]): void => {
      if (!Array.isArray(nodes)) return
      nodes.forEach((node: any) => {
        if (node && typeof node === 'object') {
          if (node.type === 'text' && node.id) {
            const editId = `text-${node.id}`
            if (editedTextValues[editId]) {
              node.props = node.props || {}
              node.props.value = editedTextValues[editId]
            }
          }
          if (Array.isArray(node.children)) updateTextInNodes(node.children)
          if (node.type === 'grid' && Array.isArray(node.items)) {
            node.items.forEach((item: any) => {
              if (item && item.node) updateTextInNodes([item.node])
            })
          }
        }
      })
    }
    const root = updated.root
    if (root && Array.isArray(root.children)) {
      updateTextInNodes(root.children)
    }
    return updated
  }, [editedSchema, convertedSketch?.sketch, editedTextValues])

  const { element: renderedAISketch, error: aiParseError } = useMemo(() => {
    const schemaToRender = schemaWithTextEdits
    if (!schemaToRender) return { element: null, error: null }
    try {
      return { element: parseSketch(schemaToRender), error: null }
    } catch (error) {
      if (error instanceof SketchParserError) return { element: null, error }
      return { element: null, error: new SketchParserError('Failed to parse sketch') }
    }
  }, [schemaWithTextEdits])

  const handleVisionAnalysis = useCallback((result: VisionAnalysisResult) => {
    setVisionResult(result)
  }, [])

  const handleVisionError = useCallback(() => {
    setVisionResult(null)
  }, [])

  const handleTextValuesChange = useCallback((values: Record<string, string>) => {
    setEditedTextValues(values)
  }, [])

  return (
    <main className="app">
      <header className="app__header">
        <h1>Image to Code Playground</h1>
        <p className="app__tagline">
          🎨 Upload your UI image → 🤖 AI analyzes layout → ⚛️ Get positioned React components!
        </p>
      </header>

      <section className="app__section app__section--primary">
        <h2>🎨 Upload Your Image</h2>
        <p className="app__intro">
          Upload a website screenshot, UI mockup, or app design. The AI will analyze it and generate live React components with accurate positioning!
        </p>
        
        <VisionAnalyzer
          config={{ 
            provider: import.meta.env.VITE_VISION_PROVIDER || 'azure',
            apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY,
            model: import.meta.env.VITE_VISION_MODEL || 'gpt-4o',
            azureEndpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
            azureDeploymentName: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME
          }}
          onAnalysisComplete={handleVisionAnalysis}
          onAnalysisError={handleVisionError}
        />
        
        {visionResult && !convertedSketch && (
          <div className="app__upload-note">
            <p><strong>🔄 Analyzing your image...</strong></p>
            <p>Found {visionResult.elements.length} UI elements with {Math.round(visionResult.confidence * 100)}% confidence.</p>
          </div>
        )}
        
        {visionResult && convertedSketch && (
          <div className="app__upload-note app__upload-note--success">
            <p><strong>✅ Analysis Complete!</strong></p>
            <p>✨ Generated {convertedSketch.mappings.length} React components from your image!</p>
            <p>👇 Components are positioned exactly as in your image. Click text to edit!</p>
          </div>
        )}
        
        {conversionError && (
          <div className="app__upload-note app__upload-note--error">
            <p><strong>❌ Conversion Failed:</strong> {conversionError.message}</p>
          </div>
        )}
      </section>

      {renderedAISketch && (
        <section className="app__section app__section--success">
          <h3>🎉 Your Live React Components</h3>
          <p className="app__success-message">
            Components are positioned exactly as analyzed from your image. Click any text to edit it!
          </p>
          
          <div className="app__preview-modes">
            <h4>Component Preview</h4>
            <div className="app__preview-tabs">
              <button 
                className={`app__preview-tab ${previewMode === 'mobile' ? 'app__preview-tab--active' : ''}`}
                onClick={() => setPreviewMode('mobile')}
              >
                📱 Mobile View
              </button>
              <button 
                className={`app__preview-tab ${previewMode === 'desktop' ? 'app__preview-tab--active' : ''}`}
                onClick={() => setPreviewMode('desktop')}
              >
                🖥️ Desktop View
              </button>
            </div>
            
            <div className="app__preview-container">
              <div className={`app__device-frame app__device-frame--${previewMode}`}>
                <div className="app__device-header">
                  <div className="app__device-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="app__device-url">your-app.com</div>
                </div>
                <div className="app__device-content">
                  <EditableProvider onValuesChange={handleTextValuesChange}>
                    {renderedAISketch}
                  </EditableProvider>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {convertedSketch && (
        <section className="app__section app__section--editor">
          <h3>🛠️ Customize Your Components</h3>
          <p>Click elements in the tree to edit properties. Text edits from the preview are automatically applied.</p>
          
          <SchemaEditor
            initialSchema={convertedSketch.sketch}
            conversionResult={convertedSketch}
            onSchemaChange={setEditedSchema}
          />
          
          <CodeExporter 
            sketch={schemaWithTextEdits || convertedSketch.sketch} 
            className="app__code-exporter"
          />
        </section>
      )}
      
      {aiParseError && (
        <div className="app__error">
          <strong>Parse Error:</strong> {aiParseError.message}
        </div>
      )}
    </main>
  )
}

export default App
