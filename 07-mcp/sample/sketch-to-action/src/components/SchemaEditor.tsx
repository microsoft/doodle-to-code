import { useState, useCallback } from 'react'
import type { Sketch, SketchNode } from '@parser'
import type { ConversionResult } from '../services/sketchConverter'
import { useSchemaStorage } from '../services/schemaStorage'
import type { SavedSchema } from '../services/schemaStorage'

export interface SchemaEditorProps {
  initialSchema: Sketch
  conversionResult: ConversionResult
  onSchemaChange: (schema: Sketch) => void
  onExport?: (schema: Sketch) => void
}

export interface EditableElement {
  id: string
  path: string[]
  type: SketchNode['type']
  props: Record<string, unknown>
  parentId?: string
  children?: EditableElement[]
}

export function SchemaEditor({ 
  initialSchema, 
  conversionResult,
  onSchemaChange,
  onExport 
}: SchemaEditorProps) {
  const [schema, setSchema] = useState<Sketch>(initialSchema)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [editHistory, setEditHistory] = useState<Sketch[]>([initialSchema])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [saveDialogName, setSaveDialogName] = useState('')
  
  const { 
    savedSchemas, 
    loading: storageLoading, 
    error: storageError,
    saveSchema, 
    loadSchema 
  } = useSchemaStorage()

  // Convert schema to flat editable elements tree
  const flattenElements = useCallback((node: SketchNode, path: string[] = [], parentId?: string): EditableElement[] => {
    const id = `${path.join('-')}-${node.type}`
    const element: EditableElement = {
      id,
      path,
      type: node.type,
      props: { ...node.props },
      parentId
    }

    const elements = [element]

    if ('children' in node && node.children) {
      const childElements = node.children.flatMap((child: unknown, index) => {
        // Handle GridItem (has a node property)
        const childNode = typeof child === 'object' && child !== null && 'node' in child 
          ? (child as { node: SketchNode }).node 
          : (child as SketchNode)
        return flattenElements(childNode, [...path, 'children', index.toString()], id)
      })
      element.children = childElements.filter(child => child.parentId === id)
      elements.push(...childElements)
    }

    return elements
  }, [])

  const elements = flattenElements(schema.root)

  // Update schema and trigger change
  const updateSchema = useCallback((newSchema: Sketch) => {
    setSchema(newSchema)
    onSchemaChange(newSchema)
    
    // Add to history
    const newHistory = editHistory.slice(0, historyIndex + 1)
    newHistory.push(newSchema)
    setEditHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [onSchemaChange, editHistory, historyIndex])

  // Update specific element
  const updateElement = useCallback((elementId: string, newProps: Record<string, unknown>) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    // Create new schema with updated element
    const updateNodeProps = (node: SketchNode, path: string[], targetPath: string[]): SketchNode => {
      // Check if this is the target node
      if (path.length === targetPath.length && path.every((p, i) => p === targetPath[i])) {
        return {
          ...node,
          props: { ...node.props, ...newProps }
        } as SketchNode
      }

      // If this node has children, recursively update them
      if ('children' in node && node.children && path.length < targetPath.length) {
        const nextKey = targetPath[path.length]
        if (nextKey === 'children') {
          const childIndex = parseInt(targetPath[path.length + 1])
          
          // Handle GridNode children (GridItem[])
          if (node.type === 'grid') {
            const gridNode = node as unknown as { children: Array<{ node: SketchNode }> }
            const updatedChildren = gridNode.children.map((child: { node: SketchNode }, index: number) => {
              if (index === childIndex) {
                // For GridItem, we need to update the node property
                return {
                  ...child,
                  node: updateNodeProps(child.node, [...path, 'children', index.toString()], targetPath)
                }
              }
              return child
            })
            return { ...node, children: updatedChildren } as SketchNode
          } else {
            // Handle regular children (SketchNode[])
            const updatedChildren = (node.children as SketchNode[]).map((child, index) => {
              if (index === childIndex) {
                return updateNodeProps(child, [...path, 'children', index.toString()], targetPath)
              }
              return child
            })
            return { ...node, children: updatedChildren } as SketchNode
          }
        }
      }

      return node
    }

    const newSchema: Sketch = {
      ...schema,
      root: updateNodeProps(schema.root, [], element.path)
    }
    
    updateSchema(newSchema)
  }, [elements, schema, updateSchema])

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const previousSchema = editHistory[newIndex]
      setSchema(previousSchema)
      onSchemaChange(previousSchema)
    }
  }, [historyIndex, editHistory, onSchemaChange])

  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const nextSchema = editHistory[newIndex]
      setSchema(nextSchema)
      onSchemaChange(nextSchema)
    }
  }, [historyIndex, editHistory, onSchemaChange])

  // Save functionality
  const handleSave = useCallback(async () => {
    if (!saveDialogName.trim()) return
    
    try {
      await saveSchema(saveDialogName, schema)
      setShowSaveDialog(false)
      setSaveDialogName('')
    } catch {
      // Silently handle save errors
    }
  }, [saveSchema, schema, saveDialogName])

  // Load functionality  
  const handleLoad = useCallback(async (savedSchema: SavedSchema) => {
    try {
      const loaded = await loadSchema(savedSchema.id)
      if (loaded) {
        setSchema(loaded.schema)
        onSchemaChange(loaded.schema)
        
        // Reset history with loaded schema
        setEditHistory([loaded.schema])
        setHistoryIndex(0)
        setSelectedElementId(null)
        setShowLoadDialog(false)
      }
    } catch {
      // Silently handle load errors
    }
  }, [loadSchema, onSchemaChange])

  // Export functionality
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(schema)
    } else {
      // Default export - download JSON
      const dataStr = JSON.stringify(schema, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `${schema.name || 'sketch'}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }
  }, [schema, onExport])

  const selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) : null

  return (
    <div className="schema-editor">
      <div className="schema-editor__header">
        <h3>Schema Editor</h3>
        <div className="schema-editor__controls">
          <button 
            onClick={undo} 
            disabled={historyIndex <= 0}
            className="schema-editor__control-btn"
            title="Undo"
          >
            ↶
          </button>
          <button 
            onClick={redo} 
            disabled={historyIndex >= editHistory.length - 1}
            className="schema-editor__control-btn"
            title="Redo"
          >
            ↷
          </button>
          <button 
            onClick={() => setShowLoadDialog(true)}
            className="schema-editor__control-btn"
          >
            Load
          </button>
          <button 
            onClick={() => setShowSaveDialog(true)}
            className="schema-editor__control-btn"
          >
            Save
          </button>
          <button 
            onClick={handleExport}
            className="schema-editor__control-btn schema-editor__control-btn--primary"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="schema-editor__content">
        <div className="schema-editor__tree">
          <h4>Elements</h4>
          <div className="schema-editor__elements">
            {elements.filter(el => !el.parentId).map(element => (
              <ElementTreeItem
                key={element.id}
                element={element}
                allElements={elements}
                selectedId={selectedElementId}
                onSelect={setSelectedElementId}
              />
            ))}
          </div>
        </div>

        <div className="schema-editor__properties">
          {selectedElement ? (
            <ElementPropertiesEditor
              element={selectedElement}
              onUpdate={(newProps) => updateElement(selectedElement.id, newProps)}
            />
          ) : (
            <div className="schema-editor__placeholder">
              <p>Select an element to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      <div className="schema-editor__info">
        <details className="schema-editor__conversion-info">
          <summary>Original AI Analysis</summary>
          <div className="schema-editor__ai-info">
            <p><strong>Confidence:</strong> {Math.round(conversionResult.confidence * 100)}%</p>
            <p><strong>Elements mapped:</strong> {conversionResult.mappings.length}</p>
            {conversionResult.warnings.length > 0 && (
              <div className="schema-editor__warnings">
                <strong>Warnings:</strong>
                <ul>
                  {conversionResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="schema-editor__dialog-overlay">
          <div className="schema-editor__dialog">
            <h4>Save Schema</h4>
            <input
              type="text"
              placeholder="Enter schema name..."
              value={saveDialogName}
              onChange={(e) => setSaveDialogName(e.target.value)}
              className="schema-editor__dialog-input"
              autoFocus
            />
            {storageError && (
              <div className="schema-editor__dialog-error">{storageError}</div>
            )}
            <div className="schema-editor__dialog-actions">
              <button 
                onClick={() => setShowSaveDialog(false)}
                className="schema-editor__control-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!saveDialogName.trim() || storageLoading}
                className="schema-editor__control-btn schema-editor__control-btn--primary"
              >
                {storageLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="schema-editor__dialog-overlay">
          <div className="schema-editor__dialog">
            <h4>Load Schema</h4>
            {storageLoading ? (
              <div className="schema-editor__loading">Loading schemas...</div>
            ) : savedSchemas.length === 0 ? (
              <div className="schema-editor__empty">No saved schemas found</div>
            ) : (
              <div className="schema-editor__schema-list">
                {savedSchemas.map(savedSchema => (
                  <div 
                    key={savedSchema.id} 
                    className="schema-editor__schema-item"
                    onClick={() => handleLoad(savedSchema)}
                  >
                    <div className="schema-editor__schema-name">{savedSchema.name}</div>
                    <div className="schema-editor__schema-date">
                      {new Date(savedSchema.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {storageError && (
              <div className="schema-editor__dialog-error">{storageError}</div>
            )}
            <div className="schema-editor__dialog-actions">
              <button 
                onClick={() => setShowLoadDialog(false)}
                className="schema-editor__control-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Tree item component for displaying elements hierarchy
interface ElementTreeItemProps {
  element: EditableElement
  allElements: EditableElement[]
  selectedId: string | null
  onSelect: (id: string) => void
  level?: number
}

function ElementTreeItem({ 
  element, 
  allElements, 
  selectedId, 
  onSelect, 
  level = 0 
}: ElementTreeItemProps) {
  const children = allElements.filter(el => el.parentId === element.id)
  const isSelected = selectedId === element.id
  
  const getElementLabel = (el: EditableElement) => {
    if (el.type === 'text') return el.props.value as string || 'Text'
    if (el.type === 'button') return el.props.label as string || 'Button'
    if (el.type === 'card') return el.props.title as string || 'Card'
    return el.type
  }

  return (
    <div className="element-tree-item">
      <div 
        className={`element-tree-item__label ${isSelected ? 'element-tree-item__label--selected' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => onSelect(element.id)}
      >
        <span className="element-tree-item__type">{element.type}</span>
        <span className="element-tree-item__text">{getElementLabel(element)}</span>
      </div>
      {children.map(child => (
        <ElementTreeItem
          key={child.id}
          element={child}
          allElements={allElements}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </div>
  )
}

// Properties editor for individual elements
interface ElementPropertiesEditorProps {
  element: EditableElement
  onUpdate: (newProps: Record<string, unknown>) => void
}

function ElementPropertiesEditor({ element, onUpdate }: ElementPropertiesEditorProps) {
  const handlePropertyChange = (key: string, value: unknown) => {
    onUpdate({ [key]: value })
  }

  const renderPropertyEditor = (key: string, value: unknown) => {
    if (typeof value === 'string') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handlePropertyChange(key, e.target.value)}
          className="property-editor__input"
        />
      )
    }
    
    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value))}
          className="property-editor__input"
        />
      )
    }

    if (typeof value === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => handlePropertyChange(key, e.target.checked)}
          className="property-editor__checkbox"
        />
      )
    }

    // Handle select options for known variants
    if (key === 'variant') {
      const options = element.type === 'text' 
        ? ['heading', 'body'] 
        : element.type === 'button' 
        ? ['primary', 'secondary'] 
        : []
        
      if (options.length > 0) {
        return (
          <select
            value={value as string}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            className="property-editor__select"
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      }
    }

    return (
      <input
        type="text"
        value={String(value)}
        onChange={(e) => handlePropertyChange(key, e.target.value)}
        className="property-editor__input"
      />
    )
  }

  return (
    <div className="element-properties-editor">
      <h4>Edit {element.type} Element</h4>
      <div className="property-editor__fields">
        {Object.entries(element.props).map(([key, value]) => (
          <div key={key} className="property-editor__field">
            <label className="property-editor__label">
              {key.charAt(0).toUpperCase() + key.slice(1)}:
            </label>
            {renderPropertyEditor(key, value)}
          </div>
        ))}
      </div>
    </div>
  )
}