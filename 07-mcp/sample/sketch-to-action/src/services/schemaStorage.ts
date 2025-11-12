import type { Sketch } from '@parser'

export interface SavedSchema {
  id: string
  name: string
  schema: Sketch
  createdAt: string
  updatedAt: string
}

export interface SchemaStorageService {
  save: (name: string, schema: Sketch) => Promise<string>
  load: (id: string) => Promise<SavedSchema | null>
  list: () => Promise<SavedSchema[]>
  delete: (id: string) => Promise<void>
  update: (id: string, schema: Sketch) => Promise<void>
}

class LocalStorageSchemaService implements SchemaStorageService {
  private readonly storageKey = 'sketch-to-action-schemas'

  private getStoredSchemas(): SavedSchema[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveStoredSchemas(schemas: SavedSchema[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(schemas))
    } catch {
      throw new Error('Failed to save schema - storage may be full')
    }
  }

  async save(name: string, schema: Sketch): Promise<string> {
    const schemas = this.getStoredSchemas()
    const id = `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const savedSchema: SavedSchema = {
      id,
      name: name || schema.name || 'Untitled Schema',
      schema,
      createdAt: now,
      updatedAt: now
    }

    schemas.push(savedSchema)
    this.saveStoredSchemas(schemas)
    
    return id
  }

  async load(id: string): Promise<SavedSchema | null> {
    const schemas = this.getStoredSchemas()
    return schemas.find(schema => schema.id === id) || null
  }

  async list(): Promise<SavedSchema[]> {
    return this.getStoredSchemas().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  async delete(id: string): Promise<void> {
    const schemas = this.getStoredSchemas()
    const filteredSchemas = schemas.filter(schema => schema.id !== id)
    this.saveStoredSchemas(filteredSchemas)
  }

  async update(id: string, updatedSchema: Sketch): Promise<void> {
    const schemas = this.getStoredSchemas()
    const index = schemas.findIndex(schema => schema.id === id)
    
    if (index === -1) {
      throw new Error(`Schema with id ${id} not found`)
    }

    schemas[index].schema = updatedSchema
    schemas[index].updatedAt = new Date().toISOString()
    
    this.saveStoredSchemas(schemas)
  }
}

// Export singleton instance
export const schemaStorage = new LocalStorageSchemaService()

// Hook for React components
import { useState, useEffect, useCallback } from 'react'

export function useSchemaStorage() {
  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSchemas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const schemas = await schemaStorage.list()
      setSavedSchemas(schemas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schemas')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSchema = useCallback(async (name: string, schema: Sketch): Promise<string> => {
    setError(null)
    try {
      const id = await schemaStorage.save(name, schema)
      await refreshSchemas()
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schema'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [refreshSchemas])

  const loadSchema = useCallback(async (id: string): Promise<SavedSchema | null> => {
    setError(null)
    try {
      return await schemaStorage.load(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schema' 
      setError(errorMessage)
      return null
    }
  }, [])

  const deleteSchema = useCallback(async (id: string): Promise<void> => {
    setError(null)
    try {
      await schemaStorage.delete(id)
      await refreshSchemas()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schema'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [refreshSchemas])

  const updateSchema = useCallback(async (id: string, schema: Sketch): Promise<void> => {
    setError(null)
    try {
      await schemaStorage.update(id, schema)
      await refreshSchemas()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schema'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [refreshSchemas])

  useEffect(() => {
    refreshSchemas()
  }, [refreshSchemas])

  return {
    savedSchemas,
    loading,
    error,
    saveSchema,
    loadSchema,
    deleteSchema,
    updateSchema,
    refreshSchemas
  }
}