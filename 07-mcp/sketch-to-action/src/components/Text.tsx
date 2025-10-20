import { useState, useRef, useEffect } from 'react'
import { useEditable } from '../contexts/EditableContext'

export interface TextProps {
  value: string
  variant?: 'heading' | 'body'
  editId?: string
}

export function Text({ value, variant = 'body', editId }: TextProps) {
  const Tag = variant === 'heading' ? 'h2' : 'p'
  const { isEditMode, editingId, startEditing, stopEditing, updateValue, getValue } = useEditable()
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  
  const id = editId || `text-${value.slice(0, 20)}`
  const displayValue = getValue(id, value)
  const isEditing = isEditMode && editingId === id

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (isEditMode && !isEditing) {
      setLocalValue(displayValue)
      startEditing(id)
    }
  }

  const handleBlur = () => {
    updateValue(id, localValue)
    stopEditing()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      updateValue(id, localValue)
      stopEditing()
    } else if (e.key === 'Escape') {
      setLocalValue(displayValue)
      stopEditing()
    }
  }

  if (isEditing) {
    if (variant === 'heading') {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          className={`sketch-text sketch-text--${variant} sketch-text--editing`}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      )
    } else {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={`sketch-text sketch-text--${variant} sketch-text--editing`}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={Math.max(1, localValue.split('\n').length)}
        />
      )
    }
  }

  return (
    <Tag 
      className={`sketch-text sketch-text--${variant} ${isEditMode ? 'sketch-text--editable' : ''}`}
      onClick={handleClick}
      title={isEditMode ? 'Click to edit' : undefined}
    >
      {displayValue}
    </Tag>
  )
}
