'use client'

import { useState } from 'react'
import { Upload, Brain, Zap, BookOpen } from 'lucide-react'
import UploadComponent from '@/components/UploadComponent'
import DecisionViewer from '@/components/DecisionViewer'
import type { AnalysisResponse } from '@/lib/types'

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [streamingEvents, setStreamingEvents] = useState<any[]>([])

  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setAnalysisResult(result)
    setIsAnalyzing(false)
  }

  const handleAnalysisStart = () => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setStreamingEvents([])
  }

  const handleStreamingEvent = (event: any) => {
    setStreamingEvents(prev => [...prev, event])
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Decision Engine Explorer
                </h1>
                <p className="text-sm text-gray-600">
                  Learn multimodal + multimodel concepts interactively
                </p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!analysisResult && !isAnalyzing && (
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See How AI Makes Decisions
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Upload anything - text, image, or audio - and watch the AI decide which models to use and why.
            </p>

            {/* Key Concepts */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
                <div className="flex items-center gap-3 mb-3">
                  <Upload className="w-6 h-6 text-blue-700" />
                  <h3 className="text-xl font-bold text-blue-900">🎯 MULTIMODAL</h3>
                </div>
                <p className="text-blue-800 text-left leading-relaxed">
                  Handles <strong>multiple types of input</strong>: text, images, audio, video. 
                  Watch how data transforms across modalities.
                </p>
                <div className="mt-3 text-xs text-blue-700 bg-blue-200 rounded px-3 py-2">
                  💡 This concept will light up when different input types are detected
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-purple-700" />
                  <h3 className="text-xl font-bold text-purple-900">🤖 MULTIMODEL</h3>
                </div>
                <p className="text-purple-800 text-left leading-relaxed">
                  Uses <strong>specialized AI models</strong> for specialized tasks. 
                  Watch models work together intelligently.
                </p>
                <div className="mt-3 text-xs text-purple-700 bg-purple-200 rounded px-3 py-2">
                  💡 This concept will light up when multiple models collaborate
                </div>
              </div>
            </div>
          </div>

          {/* Upload Component */}
          <UploadComponent
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisStart={handleAnalysisStart}
            onStreamingEvent={handleStreamingEvent}
          />
        </section>
      )}

      {/* Results Section */}
      {(analysisResult || isAnalyzing) && (
        <section className="container mx-auto px-4 py-8">
          <button
            onClick={() => {
              setAnalysisResult(null)
              setIsAnalyzing(false)
            }}
            className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Try Another Example
          </button>

          <DecisionViewer
            result={analysisResult}
            isLoading={isAnalyzing}
            streamingEvents={streamingEvents}
          />
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>Built with Microsoft Agent Framework + Azure OpenAI</span>
            </div>
            <div className="text-sm text-gray-600">
              © 2025 AI Decision Engine Explorer
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
