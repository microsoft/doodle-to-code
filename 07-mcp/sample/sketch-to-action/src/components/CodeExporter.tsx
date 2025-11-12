import React, { useState } from 'react'
import type { Sketch } from '../parser/types'
import { HTMLGenerator } from './exports/htmlGenerator'
import { ReactGenerator } from './exports/reactGenerator'
import { CSSGenerator } from './exports/cssGenerator'
import { ZipExporter, downloadZip } from './exports/zipExporter'
import { downloadFile, formatFileSize, sanitizeFileName, generateTimestamp } from './exports/utils'

export interface CodeExporterProps {
  sketch: Sketch
  className?: string
}

interface ExportStats {
  size: number
  filename: string
  ready: boolean
}

export function CodeExporter({ sketch, className = '' }: CodeExporterProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportStats, setExportStats] = useState<Record<string, ExportStats>>({})

  const generateExportStats = React.useCallback(() => {
    const timestamp = generateTimestamp()
    const baseName = sanitizeFileName(sketch.name || 'sketch')
    
    const htmlGenerator = new HTMLGenerator(sketch)
    const reactGenerator = new ReactGenerator(sketch)
    const cssGenerator = new CSSGenerator(sketch)
    
    const htmlContent = htmlGenerator.generate({ includeComments: true })
    const reactContent = reactGenerator.generate({ includeComments: true })
    const cssContent = cssGenerator.generate({ includeComments: true })
    
    setExportStats({
      html: {
        size: new Blob([htmlContent]).size,
        filename: `${baseName}-${timestamp}.html`,
        ready: true
      },
      react: {
        size: new Blob([reactContent]).size,
        filename: `${baseName}-component-${timestamp}.tsx`,
        ready: true
      },
      css: {
        size: new Blob([cssContent]).size,
        filename: `${baseName}-styles-${timestamp}.css`,
        ready: true
      },
      zip: {
        size: 0, // Will be calculated on export
        filename: `${baseName}-app-${timestamp}.zip`,
        ready: true
      }
    })
  }, [sketch])

  React.useEffect(() => {
    generateExportStats()
  }, [generateExportStats])

  const handleExport = async (format: 'html' | 'react' | 'css' | 'zip') => {
    setIsGenerating(true)
    
    try {
      const stats = exportStats[format]
      if (!stats || !stats.ready) return

      if (format === 'zip') {
        // Generate complete app as ZIP
        const zipExporter = new ZipExporter(sketch)
        const zipBlob = await zipExporter.generateAppZip({
          includeComments: true,
          includePackageJson: true,
          includeReadme: true,
        })
        await downloadZip(zipBlob, stats.filename)
      } else {
        // Generate individual files
        let content = ''
        let mimeType = ''

        switch (format) {
          case 'html': {
            const generator = new HTMLGenerator(sketch)
            content = generator.generate({ includeComments: true })
            mimeType = 'text/html'
            break
          }
          case 'react': {
            const generator = new ReactGenerator(sketch)
            content = generator.generate({ includeComments: true })
            mimeType = 'text/plain'
            break
          }
          case 'css': {
            const generator = new CSSGenerator(sketch)
            content = generator.generate({ includeComments: true })
            mimeType = 'text/css'
            break
          }
        }

        downloadFile(content, stats.filename, mimeType)
      }
    } catch {
      // Silently handle export errors
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`code-exporter ${className}`}>
      <div className="code-exporter__header">
        <h3 className="code-exporter__title">📥 Export Your Code</h3>
        <p className="code-exporter__description">
          Download working code files or a complete React app. 
          All files maintain exact positioning and layouts from your image.
        </p>
      </div>

      <div className="code-exporter__grid">
        <div className="code-exporter__item code-exporter__item--featured">
          <div className="code-exporter__icon">📦</div>
          <div className="code-exporter__details">
            <h4 className="code-exporter__format">Complete React App (ZIP)</h4>
            <p className="code-exporter__format-desc">
              Full app bundle with package.json, TypeScript, Vite config, and all files. 
              Just extract, run `npm install`, and start developing!
            </p>
            <div className="code-exporter__meta">
              {exportStats.zip && (
                <span className="code-exporter__badge">Ready to use</span>
              )}
            </div>
          </div>
          <button
            className="code-exporter__button code-exporter__button--primary"
            onClick={() => handleExport('zip')}
            disabled={isGenerating || !exportStats.zip?.ready}
          >
            {isGenerating ? '⏳ Generating...' : '📦 Download Complete App'}
          </button>
        </div>
      </div>

      <details className="code-exporter__individual">
        <summary>Or download individual files</summary>
        <div className="code-exporter__grid">
        <div className="code-exporter__item">
          <div className="code-exporter__icon">📄</div>
          <div className="code-exporter__details">
            <h4 className="code-exporter__format">Complete HTML File</h4>
            <p className="code-exporter__format-desc">
              Standalone webpage with embedded CSS. Opens directly in any browser.
            </p>
            <div className="code-exporter__meta">
              {exportStats.html && (
                <span className="code-exporter__size">
                  {formatFileSize(exportStats.html.size)}
                </span>
              )}
            </div>
          </div>
          <button
            className="code-exporter__button"
            onClick={() => handleExport('html')}
            disabled={isGenerating || !exportStats.html?.ready}
          >
            {isGenerating ? '⏳ Generating...' : 'Download HTML'}
          </button>
        </div>

        <div className="code-exporter__item">
          <div className="code-exporter__icon">⚛️</div>
          <div className="code-exporter__details">
            <h4 className="code-exporter__format">React Component</h4>
            <p className="code-exporter__format-desc">
              Clean JSX code ready for your React project. Includes proper component structure.
            </p>
            <div className="code-exporter__meta">
              {exportStats.react && (
                <span className="code-exporter__size">
                  {formatFileSize(exportStats.react.size)}
                </span>
              )}
            </div>
          </div>
          <button
            className="code-exporter__button"
            onClick={() => handleExport('react')}
            disabled={isGenerating || !exportStats.react?.ready}
          >
            {isGenerating ? '⏳ Generating...' : 'Download TSX'}
          </button>
        </div>

        <div className="code-exporter__item">
          <div className="code-exporter__icon">🎨</div>
          <div className="code-exporter__details">
            <h4 className="code-exporter__format">CSS Stylesheet</h4>
            <p className="code-exporter__format-desc">
              Complete styles with absolute positioning for exact layout matching.
            </p>
            <div className="code-exporter__meta">
              {exportStats.css && (
                <span className="code-exporter__size">
                  {formatFileSize(exportStats.css.size)}
                </span>
              )}
            </div>
          </div>
          <button
            className="code-exporter__button"
            onClick={() => handleExport('css')}
            disabled={isGenerating || !exportStats.css?.ready}
          >
            {isGenerating ? '⏳ Generating...' : 'Download CSS'}
          </button>
        </div>
        </div>
      </details>

      <div className="code-exporter__footer">
        <p className="code-exporter__footer-text">
          💡 <strong>Recommended:</strong> Download the complete app ZIP for the best experience. 
          It includes everything you need to run the app locally with `npm install && npm run dev`.
        </p>
      </div>
    </div>
  )
}