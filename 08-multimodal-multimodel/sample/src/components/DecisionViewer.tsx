'use client'

import { Clock, DollarSign, Zap, CheckCircle, Loader2 } from 'lucide-react'
import type { AnalysisResponse } from '@/lib/types'

interface DecisionViewerProps {
  result: AnalysisResponse | null
  isLoading: boolean
  streamingEvents?: any[]
}

export default function DecisionViewer({ result, isLoading, streamingEvents = [] }: DecisionViewerProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing...</h3>
        <p className="text-gray-600 mb-6">Watching AI make decisions in real-time</p>
        
        {/* Show streaming events in real-time */}
        <div className="w-full max-w-2xl space-y-3 mt-8">
          {streamingEvents.map((event, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-fadeIn">
              {event.type === 'step_start' && (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700">{event.message}</span>
                </div>
              )}
              {event.type === 'step_complete' && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">{event.data?.step_name}</span>
                </div>
              )}
              {event.type === 'model_start' && (
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">{event.message}</span>
                </div>
              )}
              {event.type === 'ai_thinking' && (
                <div className="ml-8 space-y-2">
                  <div className="text-sm text-gray-600 italic">
                    💭 {event.thinking}
                  </div>
                  {event.details && (
                    <div className="text-xs text-gray-500 whitespace-pre-line bg-gray-50 p-2 rounded">
                      {event.details}
                    </div>
                  )}
                </div>
              )}
              {event.type === 'model_complete' && (
                <div className="ml-8 space-y-2">
                  <div className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    {event.message}
                  </div>
                  {event.preview && (
                    <div className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200">
                      <div className="whitespace-pre-wrap">{event.preview}</div>
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Show full output
                    </summary>
                    <div className="mt-2 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-3 rounded border border-gray-300 text-gray-800">
                      {event.output}
                    </div>
                  </details>
                </div>
              )}
              {event.type === 'model_error' && (
                <div className="ml-8 text-sm bg-red-50 p-3 rounded border border-red-200">
                  <div className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                    ❌ Model Failed: {event.model}
                  </div>
                  <div className="text-red-800 font-mono">{event.error}</div>
                </div>
              )}
              {event.type === 'error' && (
                <div className="text-sm bg-red-50 p-4 rounded border-2 border-red-300">
                  <div className="font-bold text-red-900 mb-2 flex items-center gap-2">
                    ❌ ERROR
                  </div>
                  <div className="text-red-800 mb-2">{event.error}</div>
                  <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
                    Check: API key in .env.local | Model endpoint | Browser console
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Modality Detection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎬 Decision Process Complete
            </h2>
            <p className="text-gray-600">
              Detected: <span className="font-semibold">{result.detected_modality}</span> input
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{result.total_time_seconds}s</span>
              </div>
              <div className="text-xs text-gray-500">Total Time</div>
            </div>
            {result.total_cost_usd && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>${result.total_cost_usd.toFixed(3)}</span>
                </div>
                <div className="text-xs text-gray-500">Total Cost</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Steps - Simplified */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Multimodal Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span>🎯</span> MULTIMODAL
          </h3>
          <div className="bg-white rounded-lg p-4">
            {result.decision_steps[0] && (
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {result.decision_steps[0].details.analysis}
              </div>
            )}
          </div>
        </div>

        {/* Multimodel Panel */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-purple-900 mb-3 flex items-center gap-2">
            <span>🤖</span> MULTIMODEL
          </h3>
          <div className="bg-white rounded-lg p-4 space-y-2">
            {result.decision_steps[1]?.details.decisions?.map((decision: any, idx: number) => (
              decision.selected && (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-purple-600 font-bold">{idx + 1}.</span>
                  <span className="font-medium text-gray-900">{decision.model.split('-')[0]}</span>
                  <span className="text-gray-500 text-xs">→</span>
                  <span className="text-gray-600 text-xs">{decision.task.substring(0, 40)}...</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Execution Steps */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          ⚡ Watch Models Work
        </h3>
        <div className="space-y-4">
          {result.model_executions.map((execution, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${
              execution.error ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {execution.error ? (
                    <span className="text-2xl">❌</span>
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span className="font-bold text-gray-900">
                    [{execution.model_type}]
                  </span>
                  <span className={execution.error ? 'text-red-600 font-bold' : 'text-gray-600'}>
                    {execution.error ? '❌ FAILED' : '⚡ COMPLETED'}
                  </span>
                </div>
                {!execution.error && (
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>⏱️ {execution.time_seconds}s</span>
                    {execution.tokens_used && <span>🎫 {execution.tokens_used} tokens</span>}
                    {execution.cost_usd && <span>💰 ${execution.cost_usd.toFixed(3)}</span>}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-700 mb-1">
                  {execution.error ? '❌' : '👁️'} <span className="font-medium">{execution.thinking_process}</span>
                </div>
              </div>

              <div className={`rounded p-4 border ${
                execution.error ? 'bg-white border-red-200' : 'bg-white border-gray-200'
              }`}>
                {!execution.error && execution.input_summary && (
                  <>
                    <div className="text-xs text-gray-500 mb-1">📥 Input:</div>
                    <div className="text-sm text-gray-700 mb-3 max-h-32 overflow-y-auto">
                      {execution.input_summary}
                    </div>
                  </>
                )}
                
                <div className="text-xs text-gray-500 mb-1">📤 {execution.error ? 'Error' : 'Output'}:</div>
                <div className={`text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto ${
                  execution.error ? 'text-red-800 bg-red-50 p-3 rounded' : 'text-gray-900'
                }`}>
                  {execution.output_summary}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Output - SHOW THIS FIRST! */}
      {result.final_output?.result && result.final_output.result !== 'No output' && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 border-2 border-blue-300 shadow-lg">
          <h3 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-3">
            ✨ AI Response
          </h3>
          <div className="bg-white rounded-lg p-6 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
            {result.final_output.result}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-gray-900 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">📊 Performance</span>
            <span className="text-gray-300">Total time: {result.total_time_seconds}s</span>
            <span className="text-gray-300">Total cost: ${result.total_cost_usd}</span>
          </div>
          <span className="text-sm text-gray-400">
            Models used: {result.model_executions.length}
          </span>
        </div>
      </div>
    </div>
  )
}
