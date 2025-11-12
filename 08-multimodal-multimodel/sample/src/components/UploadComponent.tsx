'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, X, Image as ImageIcon, FileAudio, FileText } from 'lucide-react'
import type { AnalysisResponse } from '@/lib/types'

const API_URL = '' // Empty string means use same domain (Next.js API routes)

interface UploadComponentProps {
  onAnalysisComplete: (result: AnalysisResponse) => void
  onAnalysisStart: () => void
  onStreamingEvent?: (event: any) => void
}

interface UploadedFile {
  file: File
  type: 'image' | 'audio' | 'text'
  preview?: string
}

export default function UploadComponent({ onAnalysisComplete, onAnalysisStart, onStreamingEvent }: UploadComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => addFile(file))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => addFile(file))
    }
  }

  const addFile = async (file: File) => {
    const contentType = file.type
    let fileType: 'image' | 'audio' | 'text' = 'text'
    let preview: string | undefined

    if (contentType.startsWith('image')) {
      fileType = 'image'
      preview = URL.createObjectURL(file)
    } else if (contentType.startsWith('audio')) {
      fileType = 'audio'
    } else {
      fileType = 'text'
    }

    setUploadedFiles(prev => [...prev, { file, type: fileType, preview }])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0 && !textInput.trim()) {
      alert('Please add some content to analyze')
      return
    }

    setIsLoading(true)
    onAnalysisStart()

    try {
      // Prepare FormData for multi-file upload
      const formData = new FormData()
      
      // Add all files
      uploadedFiles.forEach((item) => {
        formData.append('files', item.file)
      })
      
      // Add text input if provided
      if (textInput.trim()) {
        formData.append('text', textInput)
        formData.append('question', textInput)
      }

      // Use streaming endpoint with FormData
      const response = await fetch(`${API_URL}/api/upload/stream`, {
        method: 'POST',
        body: formData, // Send FormData directly, no Content-Type header needed
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response:', response.status, errorText)
        throw new Error(`Analysis failed: ${response.status} - ${errorText}`)
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      // Collect data for final result
      const collectedSteps: any[] = []
      const collectedExecutions: any[] = []

      if (reader) {
        console.log('[Frontend] Starting to read stream...')
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[Frontend] Stream complete')
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              console.log('[Frontend] Received event:', data.type, data)
              
              // Collect steps and executions
              if (data.type === 'step_complete' && data.data) {
                collectedSteps.push(data.data)
              }
              if (data.type === 'model_complete' && data.data) {
                collectedExecutions.push(data.data)
              }
              
              // Handle model errors - show them as executions with error status
              if (data.type === 'model_error') {
                const errorExecution = {
                  model_name: data.model,
                  model_type: data.model,
                  input_summary: 'Error occurred',
                  output_summary: `❌ ERROR: ${data.error}`,
                  tokens_used: 0,
                  time_seconds: 0,
                  cost_usd: 0,
                  thinking_process: '❌ Model execution failed',
                  error: data.error
                }
                collectedExecutions.push(errorExecution)
              }
              
              // Handle stream errors
              if (data.type === 'error') {
                alert(`Analysis Error: ${data.error}\n\nPlease check:\n1. Is your API key configured in .env.local?\n2. Is the MODEL_ENDPOINT correct?\n3. Check browser console for details`)
              }
              
              // Emit event for real-time visualization
              if (onStreamingEvent) {
                onStreamingEvent(data)
              }
              
              // Handle completion
              if (data.type === 'complete') {
                console.log('[Frontend] Analysis complete, calling onAnalysisComplete')
                // Convert the complete event to AnalysisResponse format
                const result: any = {
                  request_id: data.request_id,
                  detected_modality: data.detected_modality,
                  decision_steps: collectedSteps,
                  model_executions: collectedExecutions,
                  final_output: data.final_output,
                  total_time_seconds: data.total_time,
                  total_cost_usd: data.total_cost,
                  learning_summary: data.learning_summary
                }
                onAnalysisComplete(result)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error,
        error
      })
      alert(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}. Please check console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,audio/*,.txt,.pdf"
          multiple
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-lg font-medium text-gray-900">Analyzing...</p>
            <p className="text-sm text-gray-600">Watching the AI make decisions in real-time</p>
          </div>
        ) : (
          <>
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-600 mb-2">
              Upload <strong>multiple files</strong>: images, audio, and text documents
            </p>
            <p className="text-sm text-gray-500 mb-6">
              💡 You can combine different types: image + text + audio all together!
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Choose Files
            </button>
          </>
        )}
      </div>

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {item.type === 'image' && <ImageIcon className="w-5 h-5 text-blue-600" />}
                {item.type === 'audio' && <FileAudio className="w-5 h-5 text-purple-600" />}
                {item.type === 'text' && <FileText className="w-5 h-5 text-green-600" />}
                <span className="flex-1 text-sm text-gray-700">{item.file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combined Text Input and Question */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Text or Question (optional - combine with files!)
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter any text, question, or description... (e.g., 'What's in this image?' or 'Analyze this content')"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || (uploadedFiles.length === 0 && !textInput.trim())}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </span>
          ) : (
            '🚀 Analyze with AI'
          )}
        </button>
      </div>
    </div>
  )
}
