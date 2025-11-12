import type { Sketch } from '../../parser/types'
import type { ExportOptions } from './utils'

/**
 * Generates CSS stylesheet from sketch data
 */
export class CSSGenerator {
  private cssRules: string[] = []
  private customProperties: Map<string, string> = new Map()
  private sketch: Sketch

  constructor(sketch: Sketch) {
    this.sketch = sketch
  }

  generate(options: ExportOptions = {}): string {
    this.cssRules = []
    this.customProperties.clear()

    // Add CSS custom properties (CSS variables)
    this.addCustomProperties()
    
    // Add base styles
    this.addBaseStyles()
    
    // Add component styles
    this.addComponentStyles()
    
    // Add layout styles
    this.addLayoutStyles()

    const css = this.buildCSS(options)
    return css
  }

  private addCustomProperties() {
    this.customProperties.set('--primary-color', '#3b82f6')
    this.customProperties.set('--secondary-color', '#64748b')
    this.customProperties.set('--text-color', '#1e293b')
    this.customProperties.set('--background-color', '#ffffff')
    this.customProperties.set('--border-color', '#e2e8f0')
    this.customProperties.set('--border-radius', '0.5rem')
    this.customProperties.set('--spacing-sm', '0.5rem')
    this.customProperties.set('--spacing-md', '1rem')
    this.customProperties.set('--spacing-lg', '1.5rem')
    this.customProperties.set('--font-size-sm', '0.875rem')
    this.customProperties.set('--font-size-md', '1rem')
    this.customProperties.set('--font-size-lg', '1.125rem')
    this.customProperties.set('--font-size-xl', '1.25rem')
  }

  private addBaseStyles() {
    this.cssRules.push(`
/* Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.sketch-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md);
}`)
  }

  private addComponentStyles() {
    // Button styles
    this.cssRules.push(`
/* Button Component */
.sketch-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-md);
  font-weight: 500;
  text-decoration: none;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sketch-button--primary {
  background-color: var(--primary-color);
  color: white;
}

.sketch-button--primary:hover {
  background-color: #2563eb;
}

.sketch-button--secondary {
  background-color: transparent;
  color: var(--secondary-color);
  border: 1px solid var(--border-color);
}

.sketch-button--secondary:hover {
  background-color: #f8fafc;
}`)

    // Card styles
    this.cssRules.push(`
/* Card Component */
.sketch-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.sketch-card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-color);
}

.sketch-card__description {
  font-size: var(--font-size-md);
  color: var(--secondary-color);
  margin-bottom: var(--spacing-md);
}`)

    // Text styles
    this.cssRules.push(`
/* Text Component */
.sketch-text {
  margin-bottom: var(--spacing-sm);
}

.sketch-text--heading {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-color);
}

.sketch-text--body {
  font-size: var(--font-size-md);
  color: var(--text-color);
}

.sketch-text--caption {
  font-size: var(--font-size-sm);
  color: var(--secondary-color);
}`)
  }

  private addLayoutStyles() {
    this.cssRules.push(`
/* Layout Components */
.sketch-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.sketch-row {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--spacing-md);
  width: 100%;
}

.sketch-row > * {
  flex: 1;
  min-width: 200px;
}

.horizontal-layout {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: flex-start !important;
  gap: var(--spacing-md) !important;
  width: 100% !important;
}

.horizontal-layout > * {
  flex: 1 !important;
  min-width: 200px !important;
}

/* Grid Layout with Absolute Positioning */
.sketch-grid {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.sketch-grid--absolute {
  position: relative;
  width: 100%;
  min-height: 1200px;
  height: 150vh;
  background: white;
  border-radius: 12px;
  overflow: visible;
}

.sketch-grid--absolute > div {
  position: absolute;
  box-sizing: border-box;
}

.sketch-grid--flex {
  display: flex;
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sketch-row,
  .horizontal-layout {
    flex-direction: column !important;
  }
  
  .sketch-row > *,
  .horizontal-layout > * {
    min-width: 100% !important;
  }
  
  .sketch-container {
    padding: var(--spacing-sm);
  }
  
  .sketch-grid--absolute {
    height: auto;
    min-height: 600px;
  }
}`)
  }

  private buildCSS(options: ExportOptions): string {
    let css = ''

    if (options.includeComments) {
      css += `/*
 * Generated CSS for ${this.sketch.name}
 * Created: ${new Date().toISOString()}
 * 
 * This stylesheet contains all the styles needed to render
 * the components generated from your sketch.
 */\n\n`
    }

    // Add CSS custom properties
    css += ':root {\n'
    for (const [property, value] of this.customProperties) {
      css += `  ${property}: ${value};\n`
    }
    css += '}\n\n'

    // Add all CSS rules
    css += this.cssRules.join('\n\n')

    return options.minify ? this.minifyCSS(css) : css
  }

  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon before }
      .replace(/\s*{\s*/g, '{') // Remove spaces around {
      .replace(/}\s*/g, '}') // Remove spaces after }
      .replace(/;\s*/g, ';') // Remove spaces after ;
      .trim()
  }
}