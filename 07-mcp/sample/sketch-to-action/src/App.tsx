import { useMemo, useState, useCallback } from 'react'
import './App.css'
import { parseSketch, SketchParserError } from '@parser'
import type { Sketch } from '@parser'
import { VisionAnalyzer, SchemaEditor, CodeExporter } from '@components'
import type { VisionAnalysisResult, UIElement } from '@services'
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

  const analysisElements = useMemo(() => {
    if (!visionResult) return []

    const flattenElements = (elements: UIElement[]): UIElement[] => {
      return elements.reduce<UIElement[]>((acc, element) => {
        acc.push(element)
        if (element.children?.length) {
          acc.push(...flattenElements(element.children))
        }
        return acc
      }, [])
    }

    return flattenElements(visionResult.elements)
  }, [visionResult])

  const schemaWithTextEdits = useMemo(() => {
    const baseSchema = editedSchema || convertedSketch?.sketch
    if (!baseSchema || Object.keys(editedTextValues).length === 0) return baseSchema
    const updated = JSON.parse(JSON.stringify(baseSchema))
    const updateTextInNodes = (nodes: unknown[]): void => {
      if (!Array.isArray(nodes)) return

      type MutableSketchNode = {
        type?: string
        id?: string
        props?: Record<string, unknown>
        children?: unknown[]
        items?: Array<{ node?: unknown }>
      }

      nodes.forEach(node => {
        if (!node || typeof node !== 'object') return
        const sketchNode = node as MutableSketchNode

        if (sketchNode.type === 'text' && typeof sketchNode.id === 'string') {
          const editId = `text-${sketchNode.id}`
          const editedValue = editedTextValues[editId]
          if (editedValue) {
            if (!sketchNode.props) sketchNode.props = {}
            sketchNode.props.value = editedValue
          }
        }

        if (Array.isArray(sketchNode.children)) updateTextInNodes(sketchNode.children)

        if (sketchNode.type === 'grid' && Array.isArray(sketchNode.items)) {
          sketchNode.items.forEach(item => {
            if (item?.node) updateTextInNodes([item.node])
          })
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

  const analysisWarnings = useMemo(() => {
    const warnings: string[] = []
    if (visionResult?.errors?.length) warnings.push(...visionResult.errors)
    if (convertedSketch?.warnings?.length) warnings.push(...convertedSketch.warnings)
    if (aiParseError) warnings.push(`Parser warning: ${aiParseError.message}`)
    return warnings
  }, [visionResult, convertedSketch, aiParseError])

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

        {visionResult && (
          <details className="app__ai-output">
            <summary>View AI Analysis Output</summary>
            <div className="app__ai-output-content">
              <h4>Analysis Overview</h4>
              <p><strong>Overall Confidence:</strong> {Math.round((visionResult.confidence ?? 0) * 100)}%</p>
              <p><strong>Total Elements Detected:</strong> {analysisElements.length}</p>

              <h5>Detected Elements</h5>
              <div className="app__elements-list">
                {analysisElements.map((element, index) => {
                  const textContent = element.properties.text || element.properties.title || element.properties.description
                  return (
                    <div className="app__element-item" key={`analysis-element-${index}`}>
                      <strong>{element.type}</strong>
                      {textContent && (
                        <p>Text: {textContent}</p>
                      )}
                      <div className="app__element-bounds">
                        Position: x {element.bounds.x.toFixed(1)}%, y {element.bounds.y.toFixed(1)}%
                        {' '}| Size: w {element.bounds.width.toFixed(1)}%, h {element.bounds.height.toFixed(1)}%
                      </div>
                      <div className="app__element-confidence">Confidence: {Math.round(element.confidence * 100)}%</div>
                    </div>
                  )
                })}
              </div>

              {analysisWarnings.length > 0 && (
                <div className="analysis-warnings">
                  <h5>Warnings &amp; Notes</h5>
                  <ul>
                    {analysisWarnings.map((warning, index) => (
                      <li key={`analysis-warning-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
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
