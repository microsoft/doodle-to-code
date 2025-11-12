import { describe, expect, it, beforeEach } from 'vitest'
import { VisionService, VisionAnalysisError } from '../src/services/visionService'

describe('VisionService', () => {
  let mockVisionService: VisionService

  beforeEach(() => {
    mockVisionService = new VisionService({ provider: 'mock' })
  })

  describe('Mock Provider', () => {
    it('should analyze a login mockup correctly', async () => {
      const loginFile = new File([''], 'login-mockup.png', { type: 'image/png' })
      const result = await mockVisionService.analyzeSketch(loginFile)

      expect(result.elements).toHaveLength(4)
      expect(result.elements[0].type).toBe('text')
      expect(result.elements[0].properties.text).toBe('Login')
      expect(result.elements[1].type).toBe('input')
      expect(result.elements[2].type).toBe('input')
      expect(result.elements[3].type).toBe('button')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should analyze a dashboard mockup correctly', async () => {
      const dashboardFile = new File([''], 'dashboard-layout.jpg', { type: 'image/jpeg' })
      const result = await mockVisionService.analyzeSketch(dashboardFile)

      expect(result.elements).toHaveLength(3)
      expect(result.elements[0].type).toBe('text')
      expect(result.elements[0].properties.text).toBe('Dashboard')
      expect(result.elements[1].type).toBe('card')
      expect(result.elements[1].properties.title).toBe('Analytics')
      expect(result.elements[1].children).toHaveLength(1)
      expect(result.elements[2].type).toBe('card')
    })

    it('should return generic mockup for unknown files', async () => {
      const genericFile = new File([''], 'random-sketch.png', { type: 'image/png' })
      const result = await mockVisionService.analyzeSketch(genericFile)

      expect(result.elements).toHaveLength(3)
      expect(result.elements[0].type).toBe('text')
      expect(result.elements[1].type).toBe('card')
      expect(result.elements[2].type).toBe('button')
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  describe('Error Handling', () => {
    it('should throw error for invalid file format', async () => {
      const invalidFile = new File([''], 'document.pdf', { type: 'application/pdf' })
      
      await expect(mockVisionService.analyzeSketch(invalidFile))
        .rejects.toThrow(VisionAnalysisError)
      
      try {
        await mockVisionService.analyzeSketch(invalidFile)
      } catch (error) {
        expect(error).toBeInstanceOf(VisionAnalysisError)
        expect((error as VisionAnalysisError).code).toBe('INVALID_FORMAT')
      }
    })

    it('should throw error for files too large', async () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('x').join('') // 11MB
      const largeFile = new File([largeContent], 'huge-image.png', { type: 'image/png' })
      
      await expect(mockVisionService.analyzeSketch(largeFile))
        .rejects.toThrow(VisionAnalysisError)
      
      try {
        await mockVisionService.analyzeSketch(largeFile)
      } catch (error) {
        expect(error).toBeInstanceOf(VisionAnalysisError)
        expect((error as VisionAnalysisError).code).toBe('FILE_TOO_LARGE')
      }
    })

    it('should throw error for unsupported provider', async () => {
      const invalidService = new VisionService({ provider: 'invalid' as 'openai' | 'mock' })
      const validFile = new File([''], 'test.png', { type: 'image/png' })
      
      await expect(invalidService.analyzeSketch(validFile))
        .rejects.toThrow(VisionAnalysisError)
      
      try {
        await invalidService.analyzeSketch(validFile)
      } catch (error) {
        expect(error).toBeInstanceOf(VisionAnalysisError)
        expect((error as VisionAnalysisError).code).toBe('UNSUPPORTED_PROVIDER')
      }
    })
  })

  describe('OpenAI Provider', () => {
    it('should throw error when no API key is provided', async () => {
      const openaiService = new VisionService({ provider: 'openai' })
      const validFile = new File([''], 'test.png', { type: 'image/png' })
      
      await expect(openaiService.analyzeSketch(validFile))
        .rejects.toThrow(VisionAnalysisError)
      
      try {
        await openaiService.analyzeSketch(validFile)
      } catch (error) {
        expect(error).toBeInstanceOf(VisionAnalysisError)
        expect((error as VisionAnalysisError).code).toBe('NO_API_KEY')
      }
    })
  })

  describe('Data Validation', () => {
    it('should sanitize element properties', async () => {
      const testFile = new File([''], 'test.png', { type: 'image/png' })
      const result = await mockVisionService.analyzeSketch(testFile)

      result.elements.forEach(element => {
        // Check bounds are within valid ranges
        expect(element.bounds.x).toBeGreaterThanOrEqual(0)
        expect(element.bounds.x).toBeLessThanOrEqual(100)
        expect(element.bounds.y).toBeGreaterThanOrEqual(0)
        expect(element.bounds.y).toBeLessThanOrEqual(100)
        expect(element.bounds.width).toBeGreaterThanOrEqual(1)
        expect(element.bounds.width).toBeLessThanOrEqual(100)
        expect(element.bounds.height).toBeGreaterThanOrEqual(1)
        expect(element.bounds.height).toBeLessThanOrEqual(100)

        // Check confidence is valid
        expect(element.confidence).toBeGreaterThanOrEqual(0)
        expect(element.confidence).toBeLessThanOrEqual(1)

        // Check type is valid
        const validTypes = ['text', 'button', 'card', 'container', 'input', 'image']
        expect(validTypes).toContain(element.type)
      })

      // Check overall confidence
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle nested elements correctly', async () => {
      const dashboardFile = new File([''], 'dashboard.png', { type: 'image/png' })
      const result = await mockVisionService.analyzeSketch(dashboardFile)

      const cardWithChildren = result.elements.find(el => el.children && el.children.length > 0)
      expect(cardWithChildren).toBeDefined()
      expect(cardWithChildren!.children).toHaveLength(1)
      expect(cardWithChildren!.children![0].type).toBe('button')
    })
  })
})