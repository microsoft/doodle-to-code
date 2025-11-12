import { createElement } from 'react'
import { Button, Card, Tabs, Text } from '@components'
import type { ReactElement } from 'react'
import { SketchParserError } from './types'
import type {
  Sketch,
  SketchNode,
  ColumnNode,
  CardNode,
  ButtonNode,
  TextNode,
  SketchNodeType,
  TabsNode,
  TabItem,
  GridNode,
} from './types'

const SUPPORTED_TYPES: ReadonlySet<SketchNodeType> = new Set([
  'text',
  'button',
  'card',
  'column',
  'tabs',
  'grid',
])

function validateSketch(input: unknown): asserts input is Sketch {
  if (!input || typeof input !== 'object') {
    throw new SketchParserError('Sketch input must be an object', 'root')
  }

  const sketch = input as Sketch
  if (typeof sketch.name !== 'string' || !sketch.name.trim()) {
    throw new SketchParserError('Sketch name is required', 'root.name')
  }
  if (!sketch.root) {
    throw new SketchParserError('Sketch root node is missing', 'root')
  }

  const root = sketch.root as { type?: unknown }
  if (typeof root.type !== 'string') {
    throw new SketchParserError('Sketch root requires a "type" field', 'root.type')
  }
}

function ensureSupportedType(node: SketchNode, path: string): void {
  if (!SUPPORTED_TYPES.has(node.type)) {
    throw new SketchParserError(`Unsupported node type: ${node.type}`, path)
  }
}

function parseTextNode(node: TextNode, path: string): ReactElement {
  const value = node.props?.value
  if (typeof value !== 'string') {
    throw new SketchParserError('Text nodes require a string "value" prop', path)
  }

  const variant = node.props.variant ?? 'body'
  const editId = `text-${path}`

  return createElement(Text, { key: path, value, variant, editId })
}

function parseButtonNode(node: ButtonNode, path: string): ReactElement {
  const label = node.props?.label
  if (typeof label !== 'string' || !label.trim()) {
    throw new SketchParserError('Button nodes require a non-empty "label" prop', path)
  }

  const variant = node.props.variant ?? 'primary'
  return createElement(Button, { key: path, label, variant })
}

function parseCardNode(node: CardNode, path: string): ReactElement {
  const title = node.props?.title
  const description = node.props?.description
  const hasChildren = Array.isArray(node.children) && node.children.length > 0

  const cardProps: Record<string, unknown> = {}
  if (typeof title === 'string' && title.trim()) {
    cardProps.title = title
  }
  if (typeof description === 'string' && description.trim()) {
    cardProps.description = description
  }

  const nestedChildren = hasChildren
    ? (node.children as SketchNode[]).map((child, index) =>
        parseNode(child, `${path}.children[${index}]`),
      )
    : undefined

  return createElement(Card, { key: path, ...cardProps }, nestedChildren)
}

function parseColumnNode(node: ColumnNode, path: string): ReactElement {
  if (!Array.isArray(node.children)) {
    throw new SketchParserError('Column nodes require a "children" array', path)
  }

  const children = node.children.map((child, index) => parseNode(child, `${path}.children[${index}]`))
  const gap = typeof node.props?.gap === 'number' ? node.props.gap : undefined
  const direction = node.props?.direction || 'vertical'
  
  const flexDirection = direction === 'horizontal' ? 'row' : 'column'
  const className = direction === 'horizontal' ? 'sketch-row horizontal-layout' : 'sketch-column vertical-layout'

  return createElement(
    'div',
    {
      key: path,
      className,
      style: {
        display: 'flex !important',
        flexDirection,
        gap: gap || 16,
        width: '100%',
        ...(direction === 'horizontal' && {
          flexWrap: 'wrap',
          alignItems: 'flex-start'
        })
      },
    },
    children,
  )
}

function parseTabsNode(node: TabsNode, path: string): ReactElement {
  const props = node.props

  if (!props || !Array.isArray(props.tabs)) {
    throw new SketchParserError('Tabs nodes require a "tabs" array', path)
  }

  if (props.tabs.length === 0) {
    throw new SketchParserError('Tabs nodes require at least one tab', path)
  }

  const seenIds = new Set<string>()
  const parsedTabs = props.tabs.map((tab, index) => {
    const tabPath = `${path}.props.tabs[${index}]`
    if (!tab || typeof tab !== 'object') {
      throw new SketchParserError('Each tab must be an object', tabPath)
    }

    const rawTab = tab as TabItem
    const id = typeof rawTab.id === 'string' && rawTab.id.trim() ? rawTab.id : null
    if (!id) {
      throw new SketchParserError('Tab requires a non-empty "id" field', `${tabPath}.id`)
    }
    if (seenIds.has(id)) {
      throw new SketchParserError('Tab ids must be unique', `${tabPath}.id`)
    }
    seenIds.add(id)

    const label = typeof rawTab.label === 'string' && rawTab.label.trim() ? rawTab.label : null
    if (!label) {
      throw new SketchParserError('Tab requires a non-empty "label" field', `${tabPath}.label`)
    }

    if (!rawTab.content) {
      throw new SketchParserError('Tab requires a "content" node', `${tabPath}.content`)
    }

    const content = parseNode(rawTab.content, `${tabPath}.content`)

    return { id, label, content }
  })

  const defaultActiveId =
    typeof props.activeTabId === 'string' && props.activeTabId.trim() ? props.activeTabId : undefined

  return createElement(Tabs, {
    key: path,
    tabs: parsedTabs,
    defaultActiveId,
  })
}

function parseGridNode(node: GridNode, path: string): ReactElement {
  if (!Array.isArray(node.children)) {
    throw new SketchParserError('Grid nodes require a "children" array', path)
  }

  const gap = typeof node.props?.gap === 'number' ? node.props.gap : 16
  const mode = node.props?.mode || 'flex'

  const children = node.children.map((item, index) => {
    const childNode = item.node
    const bounds = item.bounds
    const childPath = `${path}.children[${index}]`

    if (mode === 'absolute' && bounds) {
      // Absolute positioning mode for accurate UI layout
      const isTextOrButton = childNode.type === 'text' || childNode.type === 'button'
      
      // Z-index layering
      let zIndex = 1
      if (bounds.width > 50 && bounds.height > 30) {
        zIndex = 0 // Large backgrounds
      } else if (isTextOrButton) {
        zIndex = 10 // Text on top
      } else if (childNode.type === 'card') {
        zIndex = 5 // Cards middle
      }
      
      return createElement(
        'div',
        {
          key: childPath,
          style: {
            position: 'absolute',
            left: `${bounds.x}%`,
            top: `${bounds.y}%`,
            width: `${bounds.width}%`,
            height: `${bounds.height}%`,
            boxSizing: 'border-box',
            zIndex,
            // Ensure minimum readable size for text
            minHeight: isTextOrButton ? '35px' : undefined,
          },
        },
        parseNode(childNode, childPath)
      )
    } else {
      // Flex mode for responsive layout
      return createElement(
        'div',
        {
          key: childPath,
          style: {
            flex: '1 1 auto',
            minWidth: '0',
          },
        },
        parseNode(childNode, childPath)
      )
    }
  })

  return createElement(
    'div',
    {
      key: path,
      className: mode === 'absolute' ? 'sketch-grid sketch-grid--absolute' : 'sketch-grid sketch-grid--flex',
      style: {
        position: mode === 'absolute' ? 'relative' : 'static',
        width: '100%',
        ...(mode === 'flex' && {
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${gap}px`,
        }),
        ...(mode === 'absolute' && {
          minHeight: '1200px', // Increased from 800px to give more vertical space
          height: '150vh', // Increased from 100vh for better element spacing
        }),
      },
    },
    children
  )
}

function parseNode(node: SketchNode, path: string): ReactElement {
  ensureSupportedType(node, path)

  switch (node.type) {
    case 'text':
      return parseTextNode(node, path)
    case 'button':
      return parseButtonNode(node, path)
    case 'card':
      return parseCardNode(node, path)
    case 'column':
      return parseColumnNode(node, path)
    case 'tabs':
      return parseTabsNode(node as TabsNode, path)
    case 'grid':
      return parseGridNode(node as GridNode, path)
    default:
      throw new SketchParserError('Unhandled node type.', path)
  }
}

export function parseSketch(input: unknown): ReactElement {
  validateSketch(input)
  const sketch = input as Sketch
  return parseNode(sketch.root, 'root')
}
