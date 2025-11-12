export interface VisionAnalysisResult {
  elements: UIElement[]
  confidence: number
  errors?: string[]
}

export interface UIElement {
  type: 'text' | 'button' | 'card' | 'container' | 'input' | 'image'
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  properties: {
    text?: string
    variant?: string
    title?: string
    description?: string
  }
  confidence: number
  children?: UIElement[]
}

export interface VisionServiceConfig {
  provider: 'openai' | 'azure' | 'mock'
  apiKey?: string
  model?: string
  azureEndpoint?: string
  azureDeploymentName?: string
}

export class VisionAnalysisError extends Error {
  public code: string
  
  constructor(message: string, code: string) {
    super(message)
    this.name = 'VisionAnalysisError'
    this.code = code
  }
}

export class VisionService {
  private config: VisionServiceConfig

  constructor(config: VisionServiceConfig) {
    this.config = config
  }

  async analyzeSketch(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      // Validate image file
      if (!this.isValidImageFile(imageFile)) {
        throw new VisionAnalysisError('Invalid image file format', 'INVALID_FORMAT')
      }

      if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit
        throw new VisionAnalysisError('Image file too large (max 10MB)', 'FILE_TOO_LARGE')
      }

      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile)

      // Analyze based on provider
      switch (this.config.provider) {
        case 'openai':
          return await this.analyzeWithOpenAI(base64Image)
        case 'azure':
          return await this.analyzeWithAzureOpenAI(base64Image)
        case 'mock':
          return await this.analyzeWithMock(imageFile.name)
        default:
          throw new VisionAnalysisError('Unsupported vision provider', 'UNSUPPORTED_PROVIDER')
      }
    } catch (error) {
      if (error instanceof VisionAnalysisError) {
        throw error
      }
      throw new VisionAnalysisError(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYSIS_FAILED')
    }
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    return validTypes.includes(file.type)
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just the base64 string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  private async analyzeWithOpenAI(base64Image: string): Promise<VisionAnalysisResult> {
    if (!this.config.apiKey) {
      throw new VisionAnalysisError('OpenAI API key not configured', 'NO_API_KEY')
    }

    const prompt = `
Analyze this UI/website image and identify all interactive elements and their layout structure.

CRITICAL: Return ONLY valid JSON in this EXACT format. Do not include any explanatory text, markdown formatting, or code blocks:

{
  "elements": [
    {
      "type": "text|button|card|container|input|image",
      "bounds": {"x": 0, "y": 0, "width": 100, "height": 20},
      "properties": {"text": "element text", "variant": "heading|body|primary|secondary"},
      "confidence": 0.95
    }
  ],
  "confidence": 0.90
}

LAYOUT DETECTION GUIDELINES:
- For HEADERS/NAVIGATION: Identify logo and menu items as separate text/button elements positioned horizontally
- For TWO-COLUMN LAYOUTS: Identify left content (text) and right content (images/cards) with appropriate X coordinates
- For HERO SECTIONS: Large headings should have variant: "heading", buttons should be type: "button"
- COORDINATE SYSTEM: Use percentage-based coordinates (0-100) where:
  * Header elements: y: 0-20
  * Main content: y: 20-80  
  * Left column: x: 5-45
  * Right column: x: 55-95
- ELEMENT TYPES: Use "container" for grouped elements, "text" for headings/paragraphs, "button" for clickable elements
- SPACING: Leave appropriate gaps between sections and columns

Return ONLY the JSON object, no other text
`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new VisionAnalysisError(
          `OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`,
          'API_ERROR'
        )
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new VisionAnalysisError('No response content from OpenAI', 'NO_CONTENT')
      }

      // Parse JSON response - extract JSON from potentially mixed content
      const result = this.extractAndParseJSON(content)
      
      // Validate and sanitize result
      return this.validateAndSanitizeResult(result)

    } catch (error) {
      if (error instanceof VisionAnalysisError) {
        throw error
      }
      throw new VisionAnalysisError(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'OPENAI_ERROR')
    }
  }

  private async analyzeWithAzureOpenAI(base64Image: string): Promise<VisionAnalysisResult> {
    if (!this.config.apiKey) {
      throw new VisionAnalysisError('Azure OpenAI API key not configured', 'NO_API_KEY')
    }

    if (!this.config.azureEndpoint) {
      throw new VisionAnalysisError('Azure OpenAI endpoint not configured', 'NO_ENDPOINT')
    }

    if (!this.config.azureDeploymentName) {
      throw new VisionAnalysisError('Azure OpenAI deployment name not configured', 'NO_DEPLOYMENT')
    }

    const prompt = `
You are an expert UI analyzer. Analyze this image and identify EVERY SINGLE visual element with PRECISE positioning.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - NO markdown, NO code blocks, NO explanations
2. Identify EVERY visible element - text, buttons, images, logos, headings, paragraphs, navigation items
3. Use ACCURATE percentage-based coordinates (0-100 scale) that reflect ACTUAL positions in the image
4. If the image is 1920x1080, calculate percentages based on actual pixel positions

REQUIRED JSON FORMAT:
{
  "elements": [
    {
      "type": "text|button|card|container|input|image",
      "bounds": {"x": 0, "y": 0, "width": 100, "height": 20},
      "properties": {"text": "actual text content", "variant": "heading|body|primary|secondary"},
      "confidence": 0.95
    }
  ],
  "confidence": 0.90
}

COMPREHENSIVE DETECTION RULES:

📍 POSITIONING SYSTEM (0-100 percentage scale):
- x: 0 = far left edge, 100 = far right edge
- y: 0 = top edge, 100 = bottom edge  
- width: percentage of image width the element occupies
- height: percentage of image height the element occupies

EXAMPLES OF ACCURATE POSITIONING:
- Sidebar logo (top-left): {"x": 2, "y": 2, "width": 15, "height": 8}
- Main heading (center): {"x": 35, "y": 25, "width": 30, "height": 10}
- Right column image: {"x": 60, "y": 30, "width": 35, "height": 40}
- Footer text (bottom): {"x": 10, "y": 92, "width": 80, "height": 5}

🔍 ELEMENT DETECTION (identify ALL of these):

1. HEADER/NAVIGATION (y: 0-15):
   - Logo (left corner)
   - Brand name/text (next to logo)
   - Navigation menu items (each link separately)
   - Buttons (Sign In, Sign Up, etc.)
   - Search bars

2. SIDEBAR (if present) (x: 0-20, y: 0-100):
   - Logo/brand at top
   - Navigation links (each item separately)
   - Icons with labels
   - Active/selected state indicators

3. MAIN CONTENT AREA:
   - Large headings (identify ALL)
   - Subheadings (identify ALL)
   - Paragraphs of body text (identify each block)
   - Hero images or banners
   - Call-to-action buttons
   - Form inputs and labels

4. TWO-COLUMN LAYOUTS:
   - LEFT column (x: 5-48): Text content, descriptions, lists
   - RIGHT column (x: 52-95): Images, screenshots, illustrations
   - Ensure x-coordinates reflect side-by-side positioning

5. GRID/CARD LAYOUTS:
   - Identify each card individually with unique x,y position
   - Cards in same row: similar y-value, different x-values
   - Cards in different rows: different y-values
   - Include card titles, descriptions, images inside each card

6. IMAGES & MEDIA:
   - Screenshots
   - Product photos
   - Illustrations
   - Icons (even small ones)
   - Background images with content overlay

7. FOOTER (y: 85-100):
   - Footer links
   - Copyright text
   - Social media icons
   - Contact information

🎯 ELEMENT TYPES (use correct type):
- "text": Any readable text (headings, paragraphs, labels, list items)
  * variant: "heading" for large titles, "body" for normal text
- "button": Clickable buttons, CTAs, navigation links with button styling
  * variant: "primary" for main action, "secondary" for less emphasis
- "image": Photos, screenshots, illustrations, logos, icons
- "container": Grouped elements with visible border/card background
- "input": Text fields, search boxes, form inputs

📝 TEXT EXTRACTION:
- For "text" type: Include the actual text content in properties.text
- For "button" type: Include button label in properties.text
- For "image" type: Include descriptive name in properties.text

⚠️ CRITICAL REQUIREMENTS:
- Identify AT LEAST 10-20 elements for a typical page
- DO NOT just identify 2-3 elements - scan the ENTIRE image
- Calculate positions based on where elements ACTUALLY appear
- Small elements (10% width) for buttons, large elements (40% width) for main content
- If you see text, identify it. If you see a button, identify it. If you see an image, identify it.

Return ONLY the JSON object, absolutely no other text before or after.
`

    try {
      // Azure OpenAI API endpoint format: https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version=2024-02-15-preview
      const apiUrl = `${this.config.azureEndpoint}openai/deployments/${this.config.azureDeploymentName}/chat/completions?api-version=2024-02-15-preview`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = `Azure OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`
        throw new VisionAnalysisError(errorMsg, 'API_ERROR')
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new VisionAnalysisError('No response content from Azure OpenAI', 'NO_CONTENT')
      }

      // Parse JSON response - extract JSON from potentially mixed content
      const result = this.extractAndParseJSON(content)
      
      // Validate and sanitize result
      return this.validateAndSanitizeResult(result)

    } catch (error) {
      if (error instanceof VisionAnalysisError) {
        throw error
      }
      throw new VisionAnalysisError(`Azure OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AZURE_ERROR')
    }
  }

  private async analyzeWithMock(fileName: string): Promise<VisionAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    console.log(`Mock analyzing file: ${fileName}`)

    // Enhanced pattern detection for website layouts
    if (fileName.toLowerCase().includes('website') || 
        fileName.toLowerCase().includes('landing') || 
        fileName.toLowerCase().includes('veloce') ||
        fileName.toLowerCase().includes('home') ||
        fileName.toLowerCase().includes('hero')) {
      return {
        elements: [
          // Header Navigation
          {
            type: 'text',
            bounds: { x: 5, y: 5, width: 35, height: 12 },
            properties: { text: 'VELOCE', variant: 'heading' },
            confidence: 0.98
          },
          {
            type: 'text',
            bounds: { x: 55, y: 8, width: 12, height: 6 },
            properties: { text: 'ABOUT', variant: 'body' },
            confidence: 0.95
          },
          {
            type: 'text',
            bounds: { x: 70, y: 8, width: 15, height: 6 },
            properties: { text: 'FIND STOCKLISTS', variant: 'body' },
            confidence: 0.95
          },
          {
            type: 'text',
            bounds: { x: 87, y: 8, width: 10, height: 6 },
            properties: { text: 'CONTACT', variant: 'body' },
            confidence: 0.95
          },
          
          // Hero Section - Left Column
          {
            type: 'container',
            bounds: { x: 5, y: 25, width: 45, height: 60 },
            properties: { text: 'Hero Content' },
            confidence: 0.92,
            children: [
              {
                type: 'text',
                bounds: { x: 5, y: 25, width: 40, height: 8 },
                properties: { text: 'THE ZERO-PROOF APERITIF FOR MODERN LIVING.', variant: 'body' },
                confidence: 0.94
              },
              {
                type: 'text',
                bounds: { x: 5, y: 40, width: 40, height: 25 },
                properties: { text: 'THE ONLY SPIRIT-FREE APERITIF THAT TASTES AS GOOD AS IT MAKES YOU FEEL.', variant: 'heading' },
                confidence: 0.96
              },
              {
                type: 'button',
                bounds: { x: 5, y: 70, width: 18, height: 8 },
                properties: { text: 'SHOP NOW', variant: 'primary' },
                confidence: 0.93
              }
            ]
          },
          
          // Hero Section - Right Column (Product Image)
          {
            type: 'image',
            bounds: { x: 55, y: 25, width: 40, height: 60 },
            properties: { text: 'Product Image' },
            confidence: 0.90
          }
        ],
        confidence: 0.94
      }
    }

    // Return mock analysis based on filename patterns
    if (fileName.toLowerCase().includes('login') || fileName.toLowerCase().includes('signin')) {
      return {
        elements: [
          {
            type: 'text',
            bounds: { x: 20, y: 10, width: 60, height: 15 },
            properties: { text: 'Login', variant: 'heading' },
            confidence: 0.95
          },
          {
            type: 'input',
            bounds: { x: 20, y: 30, width: 60, height: 8 },
            properties: { text: 'Email' },
            confidence: 0.90
          },
          {
            type: 'input',
            bounds: { x: 20, y: 45, width: 60, height: 8 },
            properties: { text: 'Password' },
            confidence: 0.90
          },
          {
            type: 'button',
            bounds: { x: 20, y: 60, width: 25, height: 10 },
            properties: { text: 'Sign In', variant: 'primary' },
            confidence: 0.92
          }
        ],
        confidence: 0.91
      }
    }

    if (fileName.toLowerCase().includes('dashboard') || fileName.toLowerCase().includes('admin')) {
      return {
        elements: [
          {
            type: 'text',
            bounds: { x: 10, y: 5, width: 80, height: 12 },
            properties: { text: 'Dashboard', variant: 'heading' },
            confidence: 0.96
          },
          {
            type: 'card',
            bounds: { x: 10, y: 20, width: 40, height: 30 },
            properties: { 
              title: 'Analytics', 
              description: 'View your data insights' 
            },
            confidence: 0.88,
            children: [
              {
                type: 'button',
                bounds: { x: 15, y: 40, width: 15, height: 6 },
                properties: { text: 'View Details', variant: 'secondary' },
                confidence: 0.85
              }
            ]
          },
          {
            type: 'card',
            bounds: { x: 55, y: 20, width: 40, height: 30 },
            properties: { 
              title: 'Reports', 
              description: 'Generate reports' 
            },
            confidence: 0.87
          }
        ],
        confidence: 0.89
      }
    }

    if (fileName.toLowerCase().includes('form') || fileName.toLowerCase().includes('contact')) {
      return {
        elements: [
          {
            type: 'text',
            bounds: { x: 10, y: 5, width: 80, height: 12 },
            properties: { text: 'Contact Form', variant: 'heading' },
            confidence: 0.94
          },
          {
            type: 'input',
            bounds: { x: 10, y: 25, width: 80, height: 8 },
            properties: { text: 'Name' },
            confidence: 0.92
          },
          {
            type: 'input',
            bounds: { x: 10, y: 40, width: 80, height: 8 },
            properties: { text: 'Email' },
            confidence: 0.91
          },
          {
            type: 'input',
            bounds: { x: 10, y: 55, width: 80, height: 20 },
            properties: { text: 'Message' },
            confidence: 0.90
          },
          {
            type: 'button',
            bounds: { x: 10, y: 85, width: 25, height: 10 },
            properties: { text: 'Send Message', variant: 'primary' },
            confidence: 0.93
          }
        ],
        confidence: 0.92
      }
    }

    if (fileName.toLowerCase().includes('tabs') || fileName.toLowerCase().includes('navigation')) {
      return {
        elements: [
          {
            type: 'text',
            bounds: { x: 10, y: 5, width: 80, height: 12 },
            properties: { text: 'Tabbed Interface', variant: 'heading' },
            confidence: 0.95
          },
          {
            type: 'container',
            bounds: { x: 10, y: 25, width: 80, height: 60 },
            properties: { description: 'Tab content area' },
            confidence: 0.88,
            children: [
              {
                type: 'text',
                bounds: { x: 15, y: 35, width: 70, height: 8 },
                properties: { text: 'Tab 1 Content', variant: 'body' },
                confidence: 0.85
              },
              {
                type: 'button',
                bounds: { x: 15, y: 50, width: 20, height: 8 },
                properties: { text: 'Action', variant: 'secondary' },
                confidence: 0.82
              }
            ]
          }
        ],
        confidence: 0.86
      }
    }

    // Default for newsletter or any other file
    return {
      elements: [
        // Header section
        {
          type: 'text',
          bounds: { x: 20, y: 20, width: 150, height: 15 },
          properties: { text: '17 OCTOBER 2025', variant: 'body' },
          confidence: 0.85
        },
        {
          type: 'text',
          bounds: { x: 600, y: 20, width: 80, height: 15 },
          properties: { text: 'ISSUE 1', variant: 'body' },
          confidence: 0.85
        },
        // Topic cards
        {
          type: 'card',
          bounds: { x: 80, y: 60, width: 120, height: 80 },
          properties: { title: 'Small Heading', description: 'KEY TOPIC 1' },
          confidence: 0.90
        },
        {
          type: 'card',
          bounds: { x: 220, y: 60, width: 120, height: 80 },
          properties: { title: 'KEY TOPIC 2', description: 'SUBHEADING' },
          confidence: 0.90
        },
        {
          type: 'card',
          bounds: { x: 360, y: 60, width: 120, height: 80 },
          properties: { title: 'KEY TOPIC 3', description: 'SUBHEADING' },
          confidence: 0.90
        },
        {
          type: 'card',
          bounds: { x: 500, y: 60, width: 120, height: 80 },
          properties: { title: 'KEY TOPIC', description: 'OVER TWO LINES' },
          confidence: 0.88
        },
        // Main title
        {
          type: 'text',
          bounds: { x: 70, y: 250, width: 600, height: 60 },
          properties: { text: 'NEWSLETTER', variant: 'heading' },
          confidence: 0.95
        },
        // Hero image
        {
          type: 'image',
          bounds: { x: 60, y: 350, width: 650, height: 280 },
          properties: { description: 'Library scene with person reading books' },
          confidence: 0.88
        },
        // Main content
        {
          type: 'text',
          bounds: { x: 60, y: 670, width: 200, height: 35 },
          properties: { text: 'Main Heading', variant: 'heading' },
          confidence: 0.92
        },
        {
          type: 'text',
          bounds: { x: 60, y: 720, width: 350, height: 100 },
          properties: { text: 'To get started, just tap or click this placeholder text and begin typing. You can view and edit this newsletter on your Mac, iPad, iPhone, or on iCloud.com.', variant: 'body' },
          confidence: 0.85
        },
        // Sidebar
        {
          type: 'text',
          bounds: { x: 450, y: 720, width: 200, height: 80 },
          properties: { text: 'Drag your own photos onto any image placeholders in this template, then crop or resize them if you wish.', variant: 'body' },
          confidence: 0.83
        }
      ],
      confidence: 0.89
    }
  }

  private validateAndSanitizeResult(result: unknown): VisionAnalysisResult {
    // Ensure result has required structure
    if (!result || typeof result !== 'object') {
      throw new VisionAnalysisError('Invalid response format', 'INVALID_RESPONSE')
    }

    const resultObj = result as Record<string, unknown>

    if (!Array.isArray(resultObj.elements)) {
      throw new VisionAnalysisError('Missing or invalid elements array', 'INVALID_ELEMENTS')
    }

    // Sanitize elements
    const elements = resultObj.elements.map((element: unknown) => this.sanitizeElement(element))

    return {
      elements,
      confidence: Math.max(0, Math.min(1, (resultObj.confidence as number) || 0.5)),
      errors: (resultObj.errors as string[]) || []
    }
  }

  private extractAndParseJSON(content: string): VisionAnalysisResult {
    // Trim whitespace and log the raw content
    const trimmedContent = content.trim()
    
    // Try to parse as direct JSON first
    try {
      const parsed = JSON.parse(trimmedContent) as VisionAnalysisResult
      return parsed
    } catch {
      // If direct parsing fails, try to extract JSON from mixed content
    }

    // Look for JSON blocks in various formats
    const jsonPatterns = [
      /```json\s*(\{[\s\S]*?\})\s*```/,  // ```json { ... } ```
      /```\s*(\{[\s\S]*?\})\s*```/,      // ``` { ... } ```
      /(\{[\s\S]*"elements"[\s\S]*?\})/,  // Find JSON with "elements" key
      /(\{[\s\S]*?\})/                   // Any JSON-like structure
    ]

    for (let i = 0; i < jsonPatterns.length; i++) {
      const pattern = jsonPatterns[i]
      const match = trimmedContent.match(pattern)
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]) as VisionAnalysisResult
          if (parsed.elements && Array.isArray(parsed.elements)) {
            return parsed
          }
        } catch {
          continue
        }
      }
    }

    // If all else fails, create a fallback response
    return {
      elements: [
        {
          type: 'text',
          bounds: { x: 10, y: 10, width: 80, height: 15 },
          properties: { text: 'Could not analyze image', variant: 'body' },
          confidence: 0.1
        }
      ],
      confidence: 0.1,
      errors: ['Failed to parse AI response as JSON']
    }
  }

  private sanitizeElement(element: unknown): UIElement {
    const validTypes = ['text', 'button', 'card', 'container', 'input', 'image']
    const elementObj = element as Record<string, unknown>
    const bounds = elementObj.bounds as Record<string, unknown> || {}
    const properties = elementObj.properties as Record<string, unknown> || {}
    
    return {
      type: validTypes.includes(elementObj.type as string) ? (elementObj.type as UIElement['type']) : 'container',
      bounds: {
        x: Math.max(0, Math.min(100, (bounds.x as number) || 0)),
        y: Math.max(0, Math.min(100, (bounds.y as number) || 0)),
        width: Math.max(1, Math.min(100, (bounds.width as number) || 10)),
        height: Math.max(1, Math.min(100, (bounds.height as number) || 10))
      },
      properties: {
        text: ((properties.text as string) || '').slice(0, 200),
        variant: (properties.variant as string) || 'primary',
        title: ((properties.title as string) || '').slice(0, 100),
        description: ((properties.description as string) || '').slice(0, 300)
      },
      confidence: Math.max(0, Math.min(1, (elementObj.confidence as number) || 0.5)),
      children: Array.isArray(elementObj.children) 
        ? elementObj.children.map((child: unknown) => this.sanitizeElement(child))
        : undefined
    }
  }
}