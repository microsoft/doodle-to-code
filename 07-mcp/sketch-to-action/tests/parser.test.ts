import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { parseSketch, Sketch, SketchParserError } from '@parser'

describe('parseSketch', () => {
  it('renders a simple text node', () => {
    const sketch: Sketch = {
      name: 'text-only',
      root: {
        type: 'text',
        props: {
          value: 'Hello, Sketch!',
        },
      },
    }

    const element = parseSketch(sketch)
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Hello, Sketch!')
  })

  it('renders nested column layouts', () => {
    const sketch: Sketch = {
      name: 'nested-column',
      root: {
        type: 'column',
        props: {
          gap: 16,
        },
        children: [
          {
            type: 'card',
            props: {
              title: 'Card title',
              description: 'Card body',
            },
            children: [
              {
                type: 'button',
                props: {
                  label: 'Action',
                },
              },
            ],
          },
        ],
      },
    }

    const element = parseSketch(sketch)
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Card title')
    expect(html).toContain('Action')
  })

  it('throws when encountering unsupported node types', () => {
    const sketch = {
      name: 'unsupported-node',
      root: {
        type: 'chip',
        props: {},
      },
    }

    expect(() => parseSketch(sketch)).toThrowError(SketchParserError)
  })

  it('throws when required props are missing', () => {
    const sketch: Sketch = {
      name: 'missing-props',
      root: {
        type: 'button',
        props: {
          label: '',
        },
      },
    }

    expect(() => parseSketch(sketch)).toThrowError(SketchParserError)
  })

  it('renders tabs with multiple panes', () => {
    const sketch: Sketch = {
      name: 'tabs-test',
      root: {
        type: 'tabs',
        props: {
          activeTabId: 'tab2',
          tabs: [
            {
              id: 'tab1',
              label: 'First Tab',
              content: {
                type: 'text',
                props: {
                  value: 'Content of first tab',
                },
              },
            },
            {
              id: 'tab2',
              label: 'Second Tab',
              content: {
                type: 'text',
                props: {
                  value: 'Content of second tab',
                },
              },
            },
          ],
        },
      },
    }

    const element = parseSketch(sketch)
    const html = renderToStaticMarkup(element)

    expect(html).toContain('First Tab')
    expect(html).toContain('Second Tab')
    expect(html).toContain('Content of second tab')
  })

  it('throws when tabs array is empty', () => {
    const sketch: Sketch = {
      name: 'empty-tabs',
      root: {
        type: 'tabs',
        props: {
          tabs: [],
        },
      },
    }

    expect(() => parseSketch(sketch)).toThrowError(SketchParserError)
  })

  it('throws when tab has missing required fields', () => {
    const sketch = {
      name: 'invalid-tab',
      root: {
        type: 'tabs',
        props: {
          tabs: [
            {
              id: '',
              label: 'Invalid Tab',
              content: {
                type: 'text',
                props: { value: 'test' },
              },
            },
          ],
        },
      },
    }

    expect(() => parseSketch(sketch)).toThrowError(SketchParserError)
  })

  it('renders a tabs layout and falls back to the first tab when default is invalid', () => {
    const sketch: Sketch = {
      name: 'tabs-layout',
      root: {
        type: 'tabs',
        props: {
          activeTabId: 'missing',
          tabs: [
            {
              id: 'overview',
              label: 'Overview',
              content: {
                type: 'text',
                props: {
                  value: 'Overview content',
                  variant: 'heading',
                },
              },
            },
            {
              id: 'details',
              label: 'Details',
              content: {
                type: 'button',
                props: {
                  label: 'More info',
                },
              },
            },
          ],
        },
      },
    }

    const element = parseSketch(sketch)
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Overview')
    expect(html).toContain('Details')
    expect(html).toContain('Overview content')
    expect(html).toContain('sketch-tabs__trigger--active')
  })

  it('throws when tabs contain duplicate ids', () => {
    const sketch: Sketch = {
      name: 'tabs-invalid',
      root: {
        type: 'tabs',
        props: {
          tabs: [
            {
              id: 'duplicate',
              label: 'One',
              content: {
                type: 'text',
                props: {
                  value: 'First tab',
                },
              },
            },
            {
              id: 'duplicate',
              label: 'Two',
              content: {
                type: 'text',
                props: {
                  value: 'Second tab',
                },
              },
            },
          ],
        },
      },
    }

    expect(() => parseSketch(sketch)).toThrowError(SketchParserError)
  })
})
