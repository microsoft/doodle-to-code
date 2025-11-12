import React, { useState, useMemo } from 'react'
import { VisionService, VisionAnalysisError } from '../services'
import type { VisionAnalysisResult, VisionServiceConfig } from '../services'

export interface VisionAnalyzerProps {
  config: VisionServiceConfig
  onAnalysisComplete?: (result: VisionAnalysisResult) => void
  onAnalysisError?: (error: VisionAnalysisError) => void
}

export function VisionAnalyzer({ config, onAnalysisComplete, onAnalysisError }: VisionAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<VisionAnalysisResult | null>(null)
  const [error, setError] = useState<VisionAnalysisError | null>(null)

  const visionService = useMemo(() => new VisionService(config), [config])

  const handleFileAnalysis = async (file: File) => {
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const analysisResult = await visionService.analyzeSketch(file)
      setResult(analysisResult)
      onAnalysisComplete?.(analysisResult)
    } catch (err) {
      const visionError = err instanceof VisionAnalysisError 
        ? err 
        : new VisionAnalysisError('Unknown analysis error', 'UNKNOWN_ERROR')
      
      setError(visionError)
      onAnalysisError?.(visionError)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileAnalysis(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileAnalysis(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className="vision-analyzer">
      <div 
        className={`upload-zone ${isAnalyzing ? 'analyzing' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isAnalyzing}
        />
        
        {isAnalyzing && (
          <div className="analyzing-status">
            <div className="spinner"></div>
            <p>Analyzing sketch...</p>
          </div>
        )}

        {!isAnalyzing && !result && !error && (
          <div className="upload-prompt">
            <p>Drop a sketch image here or click to upload</p>
            <p className="hint">Supports PNG, JPG, SVG (max 10MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="analysis-error">
          <h4>Analysis Failed</h4>
          <p><strong>Error:</strong> {error.message}</p>
          <p><strong>Code:</strong> {error.code}</p>
        </div>
      )}

      {result && (
        <div className="analysis-result">
          <div className="result-header">
            <h4>Analysis Complete</h4>
            <span className="confidence">
              Confidence: {Math.round(result.confidence * 100)}%
            </span>
          </div>
          
          <div className="elements-summary">
            <p>Found {result.elements.length} UI elements:</p>
            <ul>
              {result.elements.map((element, index) => (
                <li key={index} className={`element-${element.type}`}>
                  <strong>{element.type}</strong>
                  {element.properties.text && (
                    <span className="element-text">: "{element.properties.text}"</span>
                  )}
                  {element.properties.title && (
                    <span className="element-title">: {element.properties.title}</span>
                  )}
                  <span className="element-confidence">
                    ({Math.round(element.confidence * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="analysis-warnings">
              <h5>Warnings:</h5>
              <ul>
                {result.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}