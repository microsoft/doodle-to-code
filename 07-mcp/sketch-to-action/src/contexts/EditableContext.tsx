import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface EditableContextValue {
  isEditMode: boolean
  editingId: string | null
  editedValues: Record<string, string>
  startEditing: (id: string) => void
  stopEditing: () => void
  updateValue: (id: string, value: string) => void
  getValue: (id: string, defaultValue: string) => string
}

const EditableContext = createContext<EditableContextValue | null>(null)

export interface EditableProviderProps {
  children: ReactNode
  onValuesChange?: (values: Record<string, string>) => void
}

/**
 * Provider for editable text functionality
 * Wraps rendered components to enable click-to-edit text
 */
export function EditableProvider({ children, onValuesChange }: EditableProviderProps) {
  const [isEditMode] = useState(true) // Always in edit mode for now
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const startEditing = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const stopEditing = useCallback(() => {
    setEditingId(null)
  }, [])

  const updateValue = useCallback((id: string, value: string) => {
    setEditedValues(prev => {
      const updated = { ...prev, [id]: value }
      onValuesChange?.(updated)
      return updated
    })
  }, [onValuesChange])

  const getValue = useCallback((id: string, defaultValue: string) => {
    return editedValues[id] ?? defaultValue
  }, [editedValues])

  const value: EditableContextValue = {
    isEditMode,
    editingId,
    editedValues,
    startEditing,
    stopEditing,
    updateValue,
    getValue,
  }

  return <EditableContext.Provider value={value}>{children}</EditableContext.Provider>
}

/**
 * Hook to access editable context
 */
export function useEditable() {
  const context = useContext(EditableContext)
  if (!context) {
    // Return a default non-editable context
    return {
      isEditMode: false,
      editingId: null,
      editedValues: {},
      startEditing: () => {},
      stopEditing: () => {},
      updateValue: () => {},
      getValue: (_: string, defaultValue: string) => defaultValue,
    }
  }
  return context
}
