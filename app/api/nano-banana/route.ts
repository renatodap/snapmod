export const runtime = 'edge';
export const maxDuration = 60;

interface NanaBananaRequest {
  prompt: string;
  imageUrl?: string;
  mode: 'generate' | 'edit';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
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

Follow user instructions precisely while maintaining photographic realism.`
};

export async function POST(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] API request received`);

  try {
    console.log(`[${requestId}] Parsing request body...`);
    const { prompt, imageUrl, mode } = await req.json() as NanaBananaRequest;

    console.log(`[${requestId}] Request parsed:`, {
      mode,
      promptLength: prompt?.length || 0,
      hasImage: !!imageUrl,
      imageUrlPrefix: imageUrl?.substring(0, 50) || 'none'
    });

    // Validate
    if (!prompt || prompt.trim().length === 0) {
      console.error(`[${requestId}] Validation failed: Empty prompt`);
      return Response.json({
        error: 'Please select at least one filter',
        userMessage: 'You need to select at least one filter to apply.'
      }, { status: 400 });
    }

    if (mode === 'edit' && !imageUrl) {
      console.error(`[${requestId}] Validation failed: No image for edit mode`);
      return Response.json({
        error: 'Image required for edit mode',
        userMessage: 'Please take or upload a photo first.'
      }, { status: 400 });
    }

    console.log(`[${requestId}] Validation passed`);
    console.log(`[${requestId}] Processing request:`, { mode, promptLength: prompt.length, hasImage: !!imageUrl });

    // Build messages array with system prompt
    console.log(`[${requestId}] Building messages array for mode: ${mode}`);
    const messages: any[] = [];

    // Add system prompt first to guide the model's behavior
    messages.push({
      role: 'system',
      content: mode === 'edit' ? SYSTEM_PROMPTS.edit : SYSTEM_PROMPTS.generate
    });
    console.log(`[${requestId}] System prompt added for mode: ${mode}`);

    // Build user content array
    const userContent: any[] = [];

    // Add image first if editing
    if (mode === 'edit' && imageUrl) {
      console.log(`[${requestId}] Processing image data...`);
      const base64Data = imageUrl.includes('base64,')
        ? imageUrl.split('base64,')[1]
        : imageUrl;

      console.log(`[${requestId}] Image data size: ${base64Data.length} characters`);

      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Data}`
        }
      });
      console.log(`[${requestId}] Image added to user content array`);
    }

    // Add text prompt
    userContent.push({
      type: 'text',
      text: prompt
    });
    console.log(`[${requestId}] User prompt added to content array`);

    // Add user message with content
    messages.push({
      role: 'user',
      content: userContent
    });

    console.log(`[${requestId}] Messages array built with ${messages.length} messages`);
    console.log(`[${requestId}] System prompt length: ${SYSTEM_PROMPTS[mode].length} characters`);
    console.log(`[${requestId}] Sending request to OpenRouter...`);

    const requestBody = {
      model: 'google/gemini-2.5-flash-image-preview',
      messages: messages
    };

    console.log(`[${requestId}] Request body structure:`, {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      hasSystemPrompt: requestBody.messages[0].role === 'system'
    });

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'https://snapmod.vercel.app',
        'X-Title': 'SnapMod',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[${requestId}] OpenRouter response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] OpenRouter error (${response.status}):`, errorText);

      let userMessage = 'Failed to process your image. Please try again.';
      if (response.status === 401) {
        userMessage = 'Authentication error. Please contact support.';
      } else if (response.status === 429) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status >= 500) {
        userMessage = 'AI service is temporarily unavailable. Please try again later.';
      }

      return Response.json({
        error: 'Image generation failed',
        userMessage,
        details: errorText
      }, { status: response.status });
    }

    console.log(`[${requestId}] Parsing OpenRouter response...`);
    const data = await response.json();
    console.log(`[${requestId}] Response parsed. Full response structure:`, JSON.stringify(data, null, 2));

    // Log the entire response structure for debugging
    console.log(`[${requestId}] Response keys:`, Object.keys(data));
    console.log(`[${requestId}] Choices array:`, data.choices);
    console.log(`[${requestId}] First choice:`, data.choices?.[0]);
    console.log(`[${requestId}] Message object:`, data.choices?.[0]?.message);

    const message = data.choices?.[0]?.message;
    const messageContent = message?.content;
    const messageImages = message?.images;

    console.log(`[${requestId}] Message object:`, message);
    console.log(`[${requestId}] Content type:`, typeof messageContent);
    console.log(`[${requestId}] Content length:`, messageContent?.length || 0);
    console.log(`[${requestId}] Content value:`, messageContent ? messageContent.substring(0, 500) : 'NULL/UNDEFINED');
    console.log(`[${requestId}] Images array:`, messageImages);
    console.log(`[${requestId}] Images length:`, messageImages?.length || 0);

    // Gemini 2.5 Flash Image returns images in the 'images' array, not 'content'
    let imageResult: string | null = null;

    if (messageImages && messageImages.length > 0) {
      console.log(`[${requestId}] Found image in images array!`);
      console.log(`[${requestId}] Images array length:`, messageImages.length);
      console.log(`[${requestId}] First image type:`, typeof messageImages[0]);
      console.log(`[${requestId}] First image (full):`, JSON.stringify(messageImages[0]).substring(0, 500));

      // The image might be a URL or base64 string or object with various formats
      const firstImage = messageImages[0];

      if (typeof firstImage === 'string') {
        console.log(`[${requestId}] Image is a string`);
        imageResult = firstImage;
      } else if (typeof firstImage === 'object' && firstImage !== null) {
        console.log(`[${requestId}] Image is an object, keys:`, Object.keys(firstImage));

        // Try various possible properties - OpenRouter format has nested image_url.url
        if (firstImage.image_url && firstImage.image_url.url) {
          console.log(`[${requestId}] Found .image_url.url property (OpenRouter format)`);
          imageResult = firstImage.image_url.url;
        } else if (firstImage.url) {
          console.log(`[${requestId}] Found .url property`);
          imageResult = firstImage.url;
        } else if (firstImage.b64_json) {
          console.log(`[${requestId}] Found .b64_json property`);
          imageResult = `data:image/png;base64,${firstImage.b64_json}`;
        } else if (firstImage.data) {
          console.log(`[${requestId}] Found .data property`);
          imageResult = firstImage.data;
        } else if (firstImage.image) {
          console.log(`[${requestId}] Found .image property`);
          imageResult = firstImage.image;
        } else if (firstImage.base64) {
          console.log(`[${requestId}] Found .base64 property`);
          imageResult = `data:image/png;base64,${firstImage.base64}`;
        } else {
          console.error(`[${requestId}] Unknown image object structure:`, firstImage);
        }
      }

      console.log(`[${requestId}] Extracted image result (first 100 chars):`, imageResult?.substring(0, 100));
      console.log(`[${requestId}] Image result length:`, imageResult?.length || 0);
    } else if (messageContent && messageContent.trim().length > 0) {
      console.log(`[${requestId}] Found image in content field`);
      imageResult = messageContent;
    } else {
      console.error(`[${requestId}] No image in response!`);
      console.error(`[${requestId}] Full response:`, JSON.stringify(data, null, 2));

      // Check if there's an error message from OpenRouter
      const errorMsg = data.error?.message || data.error || 'Unknown error';
      console.error(`[${requestId}] OpenRouter error:`, errorMsg);

      // Return detailed debugging info to frontend
      return Response.json({
        error: 'No image returned',
        userMessage: `AI service error: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}. Please check console for details.`,
        details: 'API response had no content or images',
        debug: {
          requestId,
          responseKeys: Object.keys(data),
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length,
          firstChoice: data.choices?.[0],
          error: data.error,
          fullResponse: data
        }
      }, { status: 500 });
    }

    // Null check - this should never happen due to earlier check, but TypeScript needs it
    if (!imageResult) {
      console.error(`[${requestId}] imageResult is null after extraction`);
      console.error(`[${requestId}] Images array was:`, messageImages);
      console.error(`[${requestId}] Content was:`, messageContent);

      return Response.json({
        error: 'Failed to extract image',
        userMessage: 'Failed to extract image from API response. Please try again.',
        details: 'Image extraction returned null',
        debug: {
          requestId,
          hasImages: !!messageImages,
          imagesLength: messageImages?.length,
          firstImage: messageImages?.[0],
          firstImageType: typeof messageImages?.[0],
          firstImageKeys: messageImages?.[0] && typeof messageImages[0] === 'object' ? Object.keys(messageImages[0]) : null,
          contentLength: messageContent?.length || 0
        }
      }, { status: 500 });
    }

    // Comprehensive validation to detect text responses
    console.log(`[${requestId}] Validating response content...`);

    // Helper function to check if content is valid base64
    const isValidBase64 = (str: string): boolean => {
      // Base64 should only contain A-Z, a-z, 0-9, +, /, and = for padding
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(str);
    };

    // Helper function to detect if content is text
    const isTextResponse = (str: string): boolean => {
      // Common text indicators
      const textIndicators = [
        /^(here|absolutely|sure|certainly|of course)/i,
        /\b(image|photo|picture|transformed|applied|filter)\b/i,
        /(\.|\!|\?)(\s|$)/,  // Sentences ending with punctuation
        /\s{2,}/,  // Multiple spaces (common in text)
        /\n/,  // Newlines in sentences
      ];

      // If it matches common text patterns, it's likely text
      for (const pattern of textIndicators) {
        if (pattern.test(str)) {
          console.log(`[${requestId}] Text indicator matched:`, pattern);
          return true;
        }
      }

      // If it has lots of spaces, it's likely text (base64 has no spaces)
      const spaceRatio = (str.match(/ /g) || []).length / str.length;
      if (spaceRatio > 0.05) {
        console.log(`[${requestId}] High space ratio detected:`, spaceRatio);
        return true;
      }

      // If it's relatively short and contains common words
      if (str.length < 500 && /\b(the|is|are|was|were|your|here)\b/i.test(str)) {
        console.log(`[${requestId}] Short text with common words detected`);
        return true;
      }

      return false;
    };

    // If it's not a data URL yet, validate and convert
    if (!imageResult.startsWith('data:')) {
      console.log(`[${requestId}] Content is not a data URL, checking format...`);
      console.log(`[${requestId}] First 200 chars:`, imageResult.substring(0, 200));

      // First check: Is this clearly text?
      if (isTextResponse(imageResult)) {
        console.error(`[${requestId}] DETECTED TEXT RESPONSE:`, imageResult.substring(0, 300));
        return Response.json({
          error: 'API returned text instead of image',
          userMessage: 'The AI responded with text instead of generating an image. This might mean the prompt was unclear. Please try again with different filters or a different photo.',
          details: imageResult.substring(0, 200),
          hint: 'Try using fewer filters or a clearer photo'
        }, { status: 500 });
      }

      // Second check: Does it look like valid base64?
      const trimmed = imageResult.trim();
      if (!isValidBase64(trimmed)) {
        console.error(`[${requestId}] INVALID BASE64 FORMAT:`, imageResult.substring(0, 200));
        return Response.json({
          error: 'Invalid response format',
          userMessage: 'Received an invalid response from the AI. Please try again.',
          details: 'Response is neither text nor valid base64'
        }, { status: 500 });
      }

      // Third check: Is it long enough to be an image?
      // Even a tiny 1x1 PNG is ~100 bytes in base64, realistic images are 10KB+
      if (trimmed.length < 1000) {
        console.error(`[${requestId}] RESPONSE TOO SHORT for image:`, trimmed.length, 'chars');
        console.error(`[${requestId}] Content:`, imageResult);
        return Response.json({
          error: 'Response too short to be an image',
          userMessage: 'The AI response was incomplete. Please try again.',
          details: `Only ${trimmed.length} characters received`
        }, { status: 500 });
      }

      // If all checks pass, it's likely valid base64 image data
      console.log(`[${requestId}] Valid base64 detected (${trimmed.length} chars), converting to data URL`);
      imageResult = `data:image/png;base64,${trimmed}`;
    } else {
      console.log(`[${requestId}] Already a data URL`);
    }

    // Final validation: Verify data URL format
    if (!imageResult.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)) {
      console.error(`[${requestId}] INVALID DATA URL FORMAT:`, imageResult.substring(0, 100));
      return Response.json({
        error: 'Invalid image format',
        userMessage: 'The image format is not supported. Please try again.',
        details: 'Data URL does not match expected format'
      }, { status: 500 });
    }

    console.log(`[${requestId}] Image validated successfully!`);
    console.log(`[${requestId}] Data URL prefix:`, imageResult.substring(0, 50));
    console.log(`[${requestId}] Total image data size: ${imageResult.length} characters`);

    // Final sanity check: Verify the base64 portion is actually valid
    try {
      const base64Part = imageResult.split(',')[1];
      if (!base64Part) {
        throw new Error('No base64 data after comma');
      }

      // Try to decode a small portion to verify it's valid base64
      const testDecode = atob(base64Part.substring(0, 100));
      console.log(`[${requestId}] Base64 decode test successful (first 100 chars decoded to ${testDecode.length} bytes)`);

      // Check for PNG or JPEG magic numbers in decoded data
      const firstBytes = testDecode.substring(0, 4);
      const isPNG = firstBytes.charCodeAt(0) === 0x89 && firstBytes.charCodeAt(1) === 0x50;
      const isJPEG = firstBytes.charCodeAt(0) === 0xFF && firstBytes.charCodeAt(1) === 0xD8;

      if (!isPNG && !isJPEG) {
        console.warn(`[${requestId}] Warning: Data doesn't start with PNG or JPEG signature`);
        console.warn(`[${requestId}] First bytes:`, Array.from(firstBytes).map(c => c.charCodeAt(0).toString(16)));
        // Continue anyway - might be WebP or other format
      } else {
        console.log(`[${requestId}] Image format verified: ${isPNG ? 'PNG' : 'JPEG'}`);
      }
    } catch (decodeError) {
      console.error(`[${requestId}] FAILED to decode base64:`, decodeError);
      return Response.json({
        error: 'Invalid base64 image data',
        userMessage: 'The AI returned invalid image data. Please try again with different filters.',
        details: decodeError instanceof Error ? decodeError.message : 'Base64 decode failed'
      }, { status: 500 });
    }

    console.log(`[${requestId}] All validations passed! Returning image.`);

    return Response.json({
      success: true,
      image: imageResult,
      cached: false
    });

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

    let userMessage = 'An unexpected error occurred. Please try again.';
    if (error instanceof SyntaxError) {
      userMessage = 'Failed to process the response. Please try again.';
    } else if (error instanceof TypeError) {
      userMessage = 'Network error. Please check your connection and try again.';
    }

    return Response.json({
      error: 'Server error',
      userMessage,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
