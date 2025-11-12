import type { ReactElement } from 'react'

export type PrimitiveNodeType = 'text' | 'button' | 'card'
export type ContainerNodeType = 'column' | 'tabs' | 'grid'
export type SketchNodeType = PrimitiveNodeType | ContainerNodeType

interface BaseNode<T extends SketchNodeType, P> {
  type: T
  props: P
}

export type TextNode = BaseNode<
  'text',
  {
    value: string
    variant?: 'heading' | 'body'
  }
>

export type ButtonNode = BaseNode<
  'button',
  {
    label: string
    variant?: 'primary' | 'secondary'
  }
>

export type CardNode = BaseNode<
  'card',
  {
    title?: string
    description?: string
  }
> & {
  children?: SketchNode[]
}

export type ColumnNode = BaseNode<
  'column',
  {
    gap?: number
    direction?: 'vertical' | 'horizontal'
  }
> & {
  children: SketchNode[]
}

export interface GridItem {
  node: SketchNode
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export type GridNode = BaseNode<
  'grid',
  {
    gap?: number
    mode?: 'absolute' | 'flex' // absolute = positioned, flex = responsive
  }
> & {
  children: GridItem[]
}

export interface TabItem {
  id: string
  label: string
  content: SketchNode
}

export type TabsNode = BaseNode<
  'tabs',
  {
    activeTabId?: string
    tabs: TabItem[]
  }
>

export type SketchNode = TextNode | ButtonNode | CardNode | ColumnNode | TabsNode | GridNode

export interface Sketch {
  name: string
  root: SketchNode
}

export type SketchComponent = ReactElement

export class SketchParserError extends Error {
  readonly path?: string

  constructor(message: string, path?: string) {
    super(message)
    this.name = 'SketchParserError'
    this.path = path
  }
}

export type SketchParseResult = SketchComponent