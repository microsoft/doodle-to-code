import type { Sketch, SketchNode, ColumnNode, CardNode, ButtonNode, TextNode, TabsNode, GridNode } from '../../parser/types'
import type { ExportOptions } from './utils'

/**
 * Generates React/JSX code from sketch data
 */
export class ReactGenerator {
  private sketch: Sketch

  constructor(sketch: Sketch) {
    this.sketch = sketch
  }

  generate(options: ExportOptions = {}): string {
    const componentName = this.getComponentName()
    const jsx = this.generateJSX(this.sketch.root, 0)

    const reactCode = this.buildReactComponent(componentName, jsx, options)
    return reactCode
  }

  private getComponentName(): string {
    return this.sketch.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, (str) => str.toUpperCase())
      .concat('Component')
  }

  private generateJSX(node: SketchNode, depth: number): string {
    const indent = '  '.repeat(depth + 1)

    switch (node.type) {
      case 'text':
        return this.generateTextJSX(node as TextNode, indent)
      
      case 'button':
        return this.generateButtonJSX(node as ButtonNode, indent)
      
      case 'card':
        return this.generateCardJSX(node as CardNode, depth, indent)
      
      case 'column':
        return this.generateColumnJSX(node as ColumnNode, depth, indent)
      
      case 'tabs':
        return this.generateTabsJSX(node as TabsNode, depth, indent)
      
      case 'grid':
        return this.generateGridJSX(node as GridNode, depth, indent)
      
      default: {
        const unknownNode = node as { type: string }
        return `${indent}<div>{/* Unsupported component: ${unknownNode.type} */}</div>`
      }
    }
  }

  private generateTextJSX(node: TextNode, indent: string): string {
    const value = node.props?.value || 'Text content'
    const variant = node.props?.variant || 'body'
    
    return `${indent}<div className="sketch-text sketch-text--${variant}">
${indent}  ${value}
${indent}</div>`
  }

  private generateButtonJSX(node: ButtonNode, indent: string): string {
    const label = node.props?.label || 'Button'
    const variant = node.props?.variant || 'primary'
    
    return `${indent}<button className="sketch-button sketch-button--${variant}">
${indent}  ${label}
${indent}</button>`
  }

  private generateCardJSX(node: CardNode, depth: number, indent: string): string {
    const title = node.props?.title || 'Card Title'
    const description = node.props?.description || ''
    
    let jsx = `${indent}<div className="sketch-card">\n`
    jsx += `${indent}  <h3 className="sketch-card__title">${title}</h3>\n`
    
    if (description) {
      jsx += `${indent}  <p className="sketch-card__description">${description}</p>\n`
    }
    
    if (node.children && node.children.length > 0) {
      jsx += `${indent}  <div className="sketch-card__content">\n`
      for (const child of node.children) {
        jsx += this.generateJSX(child, depth + 2) + '\n'
      }
      jsx += `${indent}  </div>\n`
    }
    
    jsx += `${indent}</div>`
    return jsx
  }

  private generateColumnJSX(node: ColumnNode, depth: number, indent: string): string {
    const direction = node.props?.direction || 'vertical'
    const className = direction === 'horizontal' ? 'sketch-row horizontal-layout' : 'sketch-column'
    
    let jsx = `${indent}<div className="${className}">\n`
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        jsx += this.generateJSX(child, depth + 1) + '\n'
      }
    }
    
    jsx += `${indent}</div>`
    return jsx
  }

  private generateTabsJSX(node: TabsNode, depth: number, indent: string): string {
    const activeTabId = node.props?.activeTabId || node.props?.tabs?.[0]?.id || 'tab1'
    const tabs = node.props?.tabs || []
    
    let jsx = `${indent}<div className="sketch-tabs">\n`
    
    // Tab navigation
    jsx += `${indent}  <div className="sketch-tabs__nav">\n`
    for (const tab of tabs) {
      const isActive = tab.id === activeTabId
      jsx += `${indent}    <button className="sketch-tabs__tab${isActive ? ' sketch-tabs__tab--active' : ''}">
${indent}      ${tab.label}
${indent}    </button>\n`
    }
    jsx += `${indent}  </div>\n`
    
    // Tab content
    jsx += `${indent}  <div className="sketch-tabs__content">\n`
    for (const tab of tabs) {
      if (tab.id === activeTabId && tab.content) {
        jsx += this.generateJSX(tab.content, depth + 2) + '\n'
      }
    }
    jsx += `${indent}  </div>\n`
    
    jsx += `${indent}</div>`
    return jsx
  }

  private generateGridJSX(node: GridNode, depth: number, indent: string): string {
    const mode = node.props?.mode || 'flex'
    const gap = node.props?.gap || 16
    
    if (mode === 'absolute') {
      // Absolute grid positioning - generate with inline styles
      let jsx = `${indent}<div className="sketch-grid sketch-grid--absolute">\n`
      
      if (node.children && node.children.length > 0) {
        for (const item of node.children) {
          const bounds = item.bounds
          if (!bounds) continue // Skip items without bounds
          
          const childIndent = '  '.repeat(depth + 2)
          
          // Generate wrapper div with absolute positioning
          jsx += `${childIndent}<div style={{\n`
          jsx += `${childIndent}  position: 'absolute',\n`
          jsx += `${childIndent}  left: '${bounds.x}%',\n`
          jsx += `${childIndent}  top: '${bounds.y}%',\n`
          jsx += `${childIndent}  width: '${bounds.width}%',\n`
          jsx += `${childIndent}  height: '${bounds.height}%',\n`
          jsx += `${childIndent}  boxSizing: 'border-box',\n`
          
          // Add z-index based on element size
          if (bounds.width > 50 && bounds.height > 30) {
            jsx += `${childIndent}  zIndex: 0,\n`
          } else if (item.node.type === 'text' || item.node.type === 'button') {
            jsx += `${childIndent}  zIndex: 10,\n`
            jsx += `${childIndent}  minHeight: '35px',\n`
          } else if (item.node.type === 'card') {
            jsx += `${childIndent}  zIndex: 5,\n`
          }
          
          jsx += `${childIndent}}}>\n`
          jsx += this.generateJSX(item.node, depth + 2) + '\n'
          jsx += `${childIndent}</div>\n`
        }
      }
      
      jsx += `${indent}</div>`
      return jsx
    } else {
      // Flex grid positioning
      let jsx = `${indent}<div className="sketch-grid sketch-grid--flex" style={{ gap: '${gap}px' }}>\n`
      
      if (node.children && node.children.length > 0) {
        for (const item of node.children) {
          jsx += this.generateJSX(item.node, depth + 1) + '\n'
        }
      }
      
      jsx += `${indent}</div>`
      return jsx
    }
  }

  private buildReactComponent(componentName: string, jsx: string, options: ExportOptions): string {
    let code = ''

    if (options.includeComments) {
      code += `/*
 * ${componentName}
 * Generated from sketch: ${this.sketch.name}
 * Created: ${new Date().toISOString()}
 * 
 * This is a React component generated from your hand-drawn sketch.
 * You can copy this code into your React project and customize as needed.
 */\n\n`
    }

    code += `import React from 'react';\n`
    code += `import './App.css'; // Import the generated CSS\n\n`

    code += `export function ${componentName}() {\n`
    code += `  return (\n`
    code += `    <div className="sketch-container">\n`
    code += jsx + '\n'
    code += `    </div>\n`
    code += `  );\n`
    code += `}\n\n`

    code += `export default ${componentName};\n`

    return code
  }
}