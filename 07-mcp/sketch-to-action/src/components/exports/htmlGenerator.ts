import type { Sketch, SketchNode } from '../../parser/types'
import type { ExportOptions } from './utils'
import { CSSGenerator } from './cssGenerator'

type NodeWithProps = {
  type: string
  props?: Record<string, unknown>
  children?: NodeWithProps[]
}

/**
 * Generates complete HTML file from sketch data
 */
export class HTMLGenerator {
  private sketch: Sketch
  private cssGenerator: CSSGenerator

  constructor(sketch: Sketch) {
    this.sketch = sketch
    this.cssGenerator = new CSSGenerator(sketch)
  }

  generate(options: ExportOptions = {}): string {
    const css = this.cssGenerator.generate({ ...options, minify: true })
    const title = this.sketch.name || 'Generated from Sketch'

    const html = this.buildHTML(title, css, options)
    return html
  }

  private buildHTML(title: string, css: string, options: ExportOptions): string {
    const bodyContent = this.generateBodyContent()

    let html = ''

    if (options.includeComments) {
      html += `<!-- 
  Generated HTML from sketch: ${this.sketch.name}
  Created: ${new Date().toISOString()}
  
  This is a complete standalone HTML file that includes all styles
  and markup needed to display your sketch as a web page.
-->\n`
    }

    html += `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`

    return html
  }

  private generateBodyContent(): string {
    return this.convertReactToHTML(this.sketch.root, 1)
  }

  private convertReactToHTML(node: SketchNode, depth: number): string {
    const indent = '  '.repeat(depth)

    switch (node.type) {
      case 'text':
        return this.generateTextHTML(node, indent)
      
      case 'button':
        return this.generateButtonHTML(node, indent)
      
      case 'card':
        return this.generateCardHTML(node, depth, indent)
      
      case 'column':
        return this.generateColumnHTML(node, depth, indent)
      
      case 'tabs':
        return this.generateTabsHTML(node, depth, indent)
      
      default: {
        const unknownNode = node as { type: string }
        return `${indent}<!-- Unsupported component: ${unknownNode.type} -->`
      }
    }
  }

  private generateTextHTML(node: SketchNode, indent: string): string {
    const textNode = node as { props?: { value?: string; variant?: string } }
    const value = this.escapeHtml(textNode.props?.value || 'Text content')
    const variant = textNode.props?.variant || 'body'
    
    return `${indent}<div class="sketch-text sketch-text--${variant}">
${indent}  ${value}
${indent}</div>`
  }

  private generateButtonHTML(node: SketchNode, indent: string): string {
    const buttonNode = node as { props?: { label?: string; variant?: string } }
    const label = this.escapeHtml(buttonNode.props?.label || 'Button')
    const variant = buttonNode.props?.variant || 'primary'
    
    return `${indent}<button class="sketch-button sketch-button--${variant}">
${indent}  ${label}
${indent}</button>`
  }

  private generateCardHTML(node: SketchNode, depth: number, indent: string): string {
    const cardNode = node as { props?: { title?: string; description?: string }; children?: SketchNode[] }
    const title = this.escapeHtml(cardNode.props?.title || 'Card Title')
    const description = this.escapeHtml(cardNode.props?.description || '')
    
    let html = `${indent}<div class="sketch-card">\n`
    html += `${indent}  <h3 class="sketch-card__title">${title}</h3>\n`
    
    if (description) {
      html += `${indent}  <p class="sketch-card__description">${description}</p>\n`
    }
    
    if (cardNode.children && cardNode.children.length > 0) {
      html += `${indent}  <div class="sketch-card__content">\n`
      for (const child of cardNode.children) {
        html += this.convertReactToHTML(child, depth + 2) + '\n'
      }
      html += `${indent}  </div>\n`
    }
    
    html += `${indent}</div>`
    return html
  }

  private generateColumnHTML(node: SketchNode, depth: number, indent: string): string {
    const columnNode = node as { props?: { direction?: string }; children?: SketchNode[] }
    const direction = columnNode.props?.direction || 'vertical'
    const className = direction === 'horizontal' ? 'sketch-row horizontal-layout' : 'sketch-column'
    
    let html = `${indent}<div class="${className}">\n`
    
    if (columnNode.children && columnNode.children.length > 0) {
      for (const child of columnNode.children) {
        html += this.convertReactToHTML(child, depth + 1) + '\n'
      }
    }
    
    html += `${indent}</div>`
    return html
  }

  private generateTabsHTML(node: SketchNode, depth: number, indent: string): string {
    const tabsNode = node as { 
      props?: { 
        activeTabId?: string; 
        tabs?: Array<{ id: string; label: string; content?: SketchNode }> 
      } 
    }
    const activeTabId = tabsNode.props?.activeTabId || tabsNode.props?.tabs?.[0]?.id || 'tab1'
    const tabs = tabsNode.props?.tabs || []
    
    let html = `${indent}<div class="sketch-tabs">\n`
    
    // Tab navigation
    html += `${indent}  <div class="sketch-tabs__nav">\n`
    for (const tab of tabs) {
      const isActive = tab.id === activeTabId
      const activeClass = isActive ? ' sketch-tabs__tab--active' : ''
      html += `${indent}    <button class="sketch-tabs__tab${activeClass}" onclick="showTab('${tab.id}')">
${indent}      ${this.escapeHtml(tab.label)}
${indent}    </button>\n`
    }
    html += `${indent}  </div>\n`
    
    // Tab content
    html += `${indent}  <div class="sketch-tabs__content">\n`
    for (const tab of tabs) {
      const isActive = tab.id === activeTabId
      const display = isActive ? 'block' : 'none'
      html += `${indent}    <div id="${tab.id}" class="sketch-tabs__panel" style="display: ${display}">\n`
      if (tab.content) {
        html += this.convertReactToHTML(tab.content, depth + 3) + '\n'
      }
      html += `${indent}    </div>\n`
    }
    html += `${indent}  </div>\n`
    
    html += `${indent}</div>`
    
    // Add simple JavaScript for tab functionality
    if (tabs.length > 1) {
      html += `\n${indent}<script>
${indent}  function showTab(tabId) {
${indent}    // Hide all tab panels
${indent}    const panels = document.querySelectorAll('.sketch-tabs__panel');
${indent}    panels.forEach(panel => panel.style.display = 'none');
${indent}    
${indent}    // Remove active class from all tabs
${indent}    const tabs = document.querySelectorAll('.sketch-tabs__tab');
${indent}    tabs.forEach(tab => tab.classList.remove('sketch-tabs__tab--active'));
${indent}    
${indent}    // Show selected panel and mark tab as active
${indent}    document.getElementById(tabId).style.display = 'block';
${indent}    event.target.classList.add('sketch-tabs__tab--active');
${indent}  }
${indent}</script>`
    }
    
    return html
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}