export const runtime = 'edge'
export const maxDuration = 60

import {
  EmptyPromptError,
  ImageRequiredError,
  RateLimitError,
  AIServiceError,
  AIInvalidResponseError,
  AITextResponseError,
} from '@/lib/errors'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withRequestTracing, createRequestLogger, measureAsync } from '@/lib/tracing'
import { checkRateLimit, getIdentifierFromRequest } from '@/lib/rate-limit'
import { APP_CONFIG } from '@/lib/config'

interface NanaBananaRequest {
  prompt: string
  imageUrl?: string
  mode: 'generate' | 'edit'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
}

// System prompts to guide the AI model's behavior
const SYSTEM_PROMPTS = {
  edit: `You are a professional photo editing AI. When given an image and editing instructions:

CRITICAL RULES:
1. PRESERVE the original composition, framing, and subject matter
2. Treat instructions as FILTERS/ENHANCEMENTS, not transformations
3. Maintain original resolution and aspect ratio
4. Apply changes subtly and naturally - avoid over-processing
5. Keep the same subjects, objects, and overall scene intact
6. DO NOT regenerate or recreate the image - only apply the requested edits as filters

INTERPRETATION GUIDE:
- "increase sharpness" → enhance edge definition, add clarity
- "make cinematic" → adjust color grading (teal/orange tones), add subtle vignette
- "boost colors" → increase saturation by 15-25%, not 100%
- "fix lighting" → balance exposure, recover highlights/shadows
- "professional look" → subtle contrast boost, color correction
- "bokeh" or "depth of field" → blur background while keeping subject sharp
- "vintage" → add film grain, adjust color temperature, slight fade
- "golden hour" → warm color temperature, soft lighting
- "HDR" → enhance dynamic range, detail in shadows and highlights

OUTPUT REQUIREMENTS:
- Return the EDITED version of the input image
- Maintain same dimensions and format
- Apply changes as a layer/filter overlay, not a recreation
- Preserve all original subjects, people, objects, and scene elements`,

  generate: `You are a professional AI image generator. Create high-quality, photorealistic images based on user descriptions.

QUALITY STANDARDS:
- High resolution and sharp details
- Natural lighting and realistic colors
- Professional composition and framing
- Avoid artifacts, distortions, or uncanny elements

Follow user instructions precisely while maintaining photographic realism.`,
}

/**
 * POST /api/nano-banana
 * Generate or edit images using AI
 */
export const POST = withRequestTracing(async (req: Request, requestId: string) => {
  const log = createRequestLogger(requestId)

  try {
    // 1. Rate Limiting
    log.info('Checking rate limit')
    const identifier = getIdentifierFromRequest(req)
    const rateLimit = checkRateLimit(
      identifier,
      APP_CONFIG.rateLimit.requestsPerMinute,
      APP_CONFIG.rateLimit.windowMs
    )

    if (!rateLimit.allowed) {
      log.warn('Rate limit exceeded', { identifier })
      throw new RateLimitError(rateLimit.resetAt, identifier)
    }

    log.debug('Rate limit check passed', {
      identifier: identifier.substring(0, 20),
      remaining: rateLimit.remaining,
    })

    // 2. Parse Request Body
    log.info('Parsing request body')
    const { prompt, imageUrl, mode } = (await req.json()) as NanaBananaRequest

    log.info('Request parsed', {
      mode,
      promptLength: prompt?.length || 0,
      hasImage: !!imageUrl,
    })

    // 3. Validation
    if (!prompt || prompt.trim().length === 0) {
      log.warn('Validation failed: empty prompt')
      throw new EmptyPromptError()
    }

    if (mode === 'edit' && !imageUrl) {
      log.warn('Validation failed: no image for edit mode')
      throw new ImageRequiredError()
    }

    log.debug('Validation passed')

    // 4. Build API Request
    const messages = buildMessages(mode, prompt, imageUrl, log)

    // 5. Call OpenRouter AI
    const { result: aiResponse, duration } = await measureAsync(
      'OpenRouter API call',
      async () => {
        log.info('Calling OpenRouter API', { model: APP_CONFIG.ai.model })

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.VERCEL_URL || APP_CONFIG.app.url,
            'X-Title': APP_CONFIG.app.name,
          },
          body: JSON.stringify({
            model: APP_CONFIG.ai.model,
            messages,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          log.error('OpenRouter API error', undefined, {
            status: response.status,
            error: errorText,
          })
          throw new AIServiceError(errorText, response.status)
        }

        return response.json()
      }
    )

    log.info('OpenRouter API call completed', { duration })

    // 6. Extract and Validate Image
    const imageResult = extractImageFromResponse(aiResponse, log)

    if (!imageResult) {
      log.error('No image in response', { responseKeys: Object.keys(aiResponse) })
      throw new AIInvalidResponseError('No image data in response', JSON.stringify(aiResponse))
    }

    // 7. Validate Image Format
    const validatedImage = validateImageData(imageResult, log)

    log.info('Image generation successful', {
      imageSize: validatedImage.length,
      cached: false,
    })

    // 8. Return Success
    return successResponse(
      {
        image: validatedImage,
        cached: false,
      },
      { requestId }
    )
  } catch (error) {
    // Error handling is done by withRequestTracing wrapper
    throw error
  }
})

/**
 * Build messages array for AI request
 */
function buildMessages(
  mode: 'generate' | 'edit',
  prompt: string,
  imageUrl: string | undefined,
  log: ReturnType<typeof createRequestLogger>
): any[] {
  log.debug('Building messages array', { mode })

  const messages: any[] = []

  // Add system prompt
  messages.push({
    role: 'system',
    content: mode === 'edit' ? SYSTEM_PROMPTS.edit : SYSTEM_PROMPTS.generate,
  })

  // Build user content
  const userContent: any[] = []

  // Add image if editing
  if (mode === 'edit' && imageUrl) {
    const base64Data = imageUrl.includes('base64,') ? imageUrl.split('base64,')[1] : imageUrl

    log.debug('Adding image to request', { imageSize: base64Data.length })

    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Data}`,
      },
    })
  }

  // Add text prompt
  userContent.push({
    type: 'text',
    text: prompt,
  })

  messages.push({
    role: 'user',
    content: userContent,
  })

  log.debug('Messages array built', { messageCount: messages.length })

  return messages
}

/**
 * Extract image from OpenRouter response
 */
function extractImageFromResponse(
  response: any,
  log: ReturnType<typeof createRequestLogger>
): string | null {
  const message = response.choices?.[0]?.message
  const messageContent = message?.content
  const messageImages = message?.images

  log.debug('Extracting image from response', {
    hasMessage: !!message,
    hasContent: !!messageContent,
    hasImages: !!messageImages,
    imagesLength: messageImages?.length || 0,
  })

  // Try images array first (OpenRouter format)
  if (messageImages && messageImages.length > 0) {
    const firstImage = messageImages[0]

    if (typeof firstImage === 'string') {
      log.debug('Found image as string in images array')
      return firstImage
    }

    if (typeof firstImage === 'object' && firstImage !== null) {
      // Try various possible properties
      if (firstImage.image_url?.url) {
        log.debug('Found image at .image_url.url')
        return firstImage.image_url.url
      }
      if (firstImage.url) {
        log.debug('Found image at .url')
        return firstImage.url
      }
      if (firstImage.b64_json) {
        log.debug('Found image at .b64_json')
        return `data:image/png;base64,${firstImage.b64_json}`
      }
      if (firstImage.data) {
        log.debug('Found image at .data')
        return firstImage.data
      }
    }
  }

  // Try content field
  if (messageContent && typeof messageContent === 'string' && messageContent.trim().length > 0) {
    log.debug('Found content in message.content')
    return messageContent
  }

  return null
}

/**
 * Validate image data format
 */
function validateImageData(
  imageData: string,
  log: ReturnType<typeof createRequestLogger>
): string {
  log.debug('Validating image data', { dataLength: imageData.length })

  // Check if it's text response (should be image)
  if (isTextResponse(imageData)) {
    log.error('AI returned text instead of image', { preview: imageData.substring(0, 200) })
    throw new AITextResponseError(imageData)
  }

  // If not a data URL, convert it
  if (!imageData.startsWith('data:')) {
    const trimmed = imageData.trim()

    // Validate base64 format
    if (!isValidBase64(trimmed)) {
      log.error('Invalid base64 format', { preview: trimmed.substring(0, 200) })
      throw new AIInvalidResponseError('Invalid base64 format', trimmed.substring(0, 200))
    }

    // Check minimum length
    if (trimmed.length < 1000) {
      log.error('Response too short for image', { length: trimmed.length })
      throw new AIInvalidResponseError('Response too short to be an image', `${trimmed.length} chars`)
    }

    log.debug('Converting to data URL')
    imageData = `data:image/png;base64,${trimmed}`
  }

  // Validate data URL format
  if (!imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)) {
    log.error('Invalid data URL format', { preview: imageData.substring(0, 100) })
    throw new AIInvalidResponseError('Invalid data URL format', imageData.substring(0, 100))
  }

  // Verify base64 can be decoded
  try {
    const base64Part = imageData.split(',')[1]
    if (!base64Part) {
      throw new Error('No base64 data after comma')
    }

    // Test decode a portion
    const testDecode = atob(base64Part.substring(0, 100))
    log.debug('Base64 decode test successful', { testLength: testDecode.length })

    // Check for image magic numbers
    const firstBytes = testDecode.substring(0, 4)
    const isPNG = firstBytes.charCodeAt(0) === 0x89 && firstBytes.charCodeAt(1) === 0x50
    const isJPEG = firstBytes.charCodeAt(0) === 0xff && firstBytes.charCodeAt(1) === 0xd8

    if (isPNG || isJPEG) {
      log.debug('Image format verified', { format: isPNG ? 'PNG' : 'JPEG' })
    } else {
      log.warn('Image magic numbers not detected (may be WebP or other format)')
    }
  } catch (decodeError) {
    log.error('Base64 decode failed', decodeError as Error)
    throw new AIInvalidResponseError(
      'Failed to decode base64 image data',
      decodeError instanceof Error ? decodeError.message : 'Unknown decode error'
    )
  }

  log.debug('Image validation complete')
  return imageData
}

/**
 * Check if content is text (not image data)
 */
function isTextResponse(str: string): boolean {
  const textIndicators = [
    /^(here|absolutely|sure|certainly|of course)/i,
    /\b(image|photo|picture|transformed|applied|filter)\b/i,
    /(\.|\!|\?)(\s|$)/, // Sentences ending with punctuation
    /\s{2,}/, // Multiple spaces (common in text)
    /\n/, // Newlines in sentences
  ]

  for (const pattern of textIndicators) {
    if (pattern.test(str)) {
      return true
    }
  }

  // High space ratio indicates text
  const spaceRatio = (str.match(/ /g) || []).length / str.length
  if (spaceRatio > 0.05) {
    return true
  }

  // Short text with common words
  if (str.length < 500 && /\b(the|is|are|was|were|your|here)\b/i.test(str)) {
    return true
  }

  return false
}

/**
 * Check if string is valid base64
 */
function isValidBase64(str: string): boolean {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  return base64Regex.test(str)
}
