import type { VisionAnalysisResult, UIElement } from './visionService'
import type { Sketch, SketchNode, TextNode, ButtonNode, CardNode, GridNode, GridItem } from '@parser'

export interface ConversionOptions {
  inferTabs?: boolean
  minConfidence?: number
  layoutStrategy?: 'columns' | 'flex' | 'auto' | 'newsletter'
}

export interface ConversionResult {
  sketch: Sketch
  confidence: number
  mappings: ElementMapping[]
  warnings: string[]
}

export interface ElementMapping {
  originalId: string
  convertedType: string
  reasoning: string
}

export class SketchConverter {
  convertVisionToSketch(
    visionResult: VisionAnalysisResult,
    _options: ConversionOptions = {}
  ): ConversionResult {
    const { elements } = visionResult

    // Create element mappings and warnings
    const mappings: ElementMapping[] = []
    const warnings: string[] = []

    // ALWAYS use grid positioning to preserve exact AI-detected positions
    // This ensures elements appear exactly where the AI vision analysis detected them
    // NO TABS - just pure grid positioning
    const rootNode: SketchNode = this.convertToAbsoluteGridLayout(elements, mappings, warnings)

    const sketch: Sketch = {
      name: 'Generated Layout',
      root: rootNode
    }

    return {
      sketch,
      confidence: this.calculateConfidence(elements, mappings, warnings),
      mappings,
      warnings
    }
  }

  // Convert ALL elements to absolute grid positioning
  // This preserves the exact coordinates detected by the AI vision analysis
  private convertToAbsoluteGridLayout(
    elements: UIElement[],
    mappings: ElementMapping[],
    warnings: string[]
  ): GridNode {
    // Use AI positioning as-is - no adjustments
    const gridItems: GridItem[] = elements.map(el => {
      const node = this.convertElement(el, mappings, warnings)
      
      return {
        node,
        bounds: {
          x: el.bounds.x,
          y: el.bounds.y,
          width: el.bounds.width,
          height: el.bounds.height
        }
      }
    })
    
    return {
      type: 'grid',
      props: {
        mode: 'absolute'
      },
      children: gridItems
    } as GridNode
  }

  private convertElement(
    element: UIElement, 
    mappings: ElementMapping[], 
    warnings: string[]
  ): SketchNode {
    const mapping: ElementMapping = {
      originalId: `element-${Date.now()}-${Math.random()}`, // Generate ID since UIElement doesn't have one
      convertedType: element.type,
      reasoning: this.getConversionReasoning(element)
    }
    mappings.push(mapping)

    switch (element.type) {
      case 'text':
        return {
          type: 'text',
          props: {
            value: element.properties.text || 'Sample text',
            variant: element.bounds.height > 30 ? 'heading' : 'body'
          }
        } as TextNode

      case 'button':
        return {
          type: 'button',
          props: {
            label: element.properties.text || 'Button',
            variant: 'primary'
          }
        } as ButtonNode

      case 'input':
        return {
          type: 'text',
          props: {
            value: element.properties.text || 'Input field',
            variant: 'body'
          }
        } as TextNode

      case 'image':
        return {
          type: 'card',
          props: {
            title: 'Image',
            description: element.properties.description || 'Newsletter image'
          }
        } as CardNode

      case 'card':
      case 'container':
        return {
          type: 'card',
          props: {
            title: element.properties.title || 'Content Section',
            description: element.properties.description || 'Newsletter content'
          },
          children: element.children ? 
            element.children.map(child => this.convertElement(child, mappings, warnings)) : 
            []
        } as CardNode

      default:
        warnings.push(`Unknown element type: ${element.type}`)
        return {
          type: 'text',
          props: {
            value: `Unknown element: ${element.type}`,
            variant: 'body'
          }
        } as TextNode
    }
  }

  private getConversionReasoning(element: UIElement): string {
    switch (element.type) {
      case 'text':
        return 'Converted text element to TextNode with appropriate variant'
      case 'button':
        return 'Converted button element to ButtonNode'
      case 'input':
        return 'Converted input element to TextNode (placeholder text)'
      case 'image':
        return 'Converted image element to CardNode with image description'
      case 'card':
      case 'container':
        return 'Converted container element to CardNode with children'
      default:
        return `Unknown element type: ${element.type}`
    }
  }

  private calculateConfidence(
    elements: UIElement[], 
    mappings: ElementMapping[], 
    warnings: string[]
  ): number {
    let confidence = 1.0

    // Reduce confidence for warnings
    confidence -= warnings.length * 0.1

    // Reduce confidence for unknown elements
    const unknownElements = mappings.filter(m => m.convertedType === 'unknown').length
    confidence -= unknownElements * 0.2

    // Boost confidence for successful conversions
    const successfulConversions = mappings.filter(m => m.convertedType !== 'unknown').length
    confidence += (successfulConversions / elements.length) * 0.3

    return Math.max(0, Math.min(1, confidence))
  }
}