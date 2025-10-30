export const runtime = 'edge';
export const maxDuration = 60;

interface NanaBananaRequest {
  prompt: string;
  imageUrl?: string;
  mode: 'generate' | 'edit';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

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

    // Build content array for OpenRouter
    console.log(`[${requestId}] Building content array for mode: ${mode}`);
    const content: any[] = [];

    // Add image first if editing
    if (mode === 'edit' && imageUrl) {
      console.log(`[${requestId}] Processing image data...`);
      const base64Data = imageUrl.includes('base64,')
        ? imageUrl.split('base64,')[1]
        : imageUrl;

      console.log(`[${requestId}] Image data size: ${base64Data.length} characters`);

      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Data}`
        }
      });
      console.log(`[${requestId}] Image added to content array`);
    }

    // Add text prompt
    content.push({
      type: 'text',
      text: prompt
    });
    console.log(`[${requestId}] Text prompt added to content array`);

    console.log(`[${requestId}] Content array built with ${content.length} items`);
    console.log(`[${requestId}] Sending request to OpenRouter...`);

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'https://snapmod.vercel.app',
        'X-Title': 'SnapMod',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content: content
        }]
      })
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
    console.log(`[${requestId}] Response parsed. Checking for content...`);

    const messageContent = data.choices?.[0]?.message?.content;
    console.log(`[${requestId}] Content type:`, typeof messageContent);
    console.log(`[${requestId}] Content length:`, messageContent?.length || 0);

    if (!messageContent) {
      console.error(`[${requestId}] No content in response. Full data:`, JSON.stringify(data).substring(0, 500));
      return Response.json({
        error: 'No image returned',
        userMessage: 'AI did not return an image. Please try again with a different filter.',
        details: 'API response had no content'
      }, { status: 500 });
    }

    // Gemini returns base64 image data
    let imageResult = messageContent;

    // If it's not a data URL yet, make it one
    if (!imageResult.startsWith('data:')) {
      console.log(`[${requestId}] Content is not a data URL, checking format...`);

      // Check if it's just base64 or has some text
      if (imageResult.length > 1000 && !imageResult.includes(' ')) {
        // Likely base64
        console.log(`[${requestId}] Detected base64 data, converting to data URL`);
        imageResult = `data:image/png;base64,${imageResult}`;
      } else {
        // It's text, not an image
        console.error(`[${requestId}] Got text response instead of image:`, imageResult.substring(0, 200));
        return Response.json({
          error: 'API returned text instead of image',
          userMessage: 'AI responded with text instead of an image. Try selecting different filters.',
          details: 'Try a different filter or simpler prompt'
        }, { status: 500 });
      }
    }

    console.log(`[${requestId}] Image processed successfully. Data URL prefix:`, imageResult.substring(0, 50));
    console.log(`[${requestId}] Total image data size: ${imageResult.length} characters`);

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
