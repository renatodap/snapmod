export const runtime = 'edge';
export const maxDuration = 60;

interface NanaBananaRequest {
  prompt: string;
  imageUrl?: string;
  mode: 'generate' | 'edit';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

export async function POST(req: Request) {
  try {
    const { prompt, imageUrl, mode } = await req.json() as NanaBananaRequest;

    // Validate
    if (!prompt || prompt.trim().length === 0) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (mode === 'edit' && !imageUrl) {
      return Response.json({ error: 'Image required for edit mode' }, { status: 400 });
    }

    console.log('Processing request:', { mode, promptLength: prompt.length, hasImage: !!imageUrl });

    // Build content array for OpenRouter
    const content: any[] = [];

    // Add image first if editing
    if (mode === 'edit' && imageUrl) {
      const base64Data = imageUrl.includes('base64,')
        ? imageUrl.split('base64,')[1]
        : imageUrl;

      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Data}`
        }
      });
    }

    // Add text prompt
    content.push({
      type: 'text',
      text: prompt
    });

    console.log('Sending to OpenRouter with content items:', content.length);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return Response.json({
        error: 'Image generation failed',
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Response type:', typeof data.choices?.[0]?.message?.content);

    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent) {
      console.error('No content in response');
      return Response.json({
        error: 'No image returned',
        details: 'API response had no content'
      }, { status: 500 });
    }

    // Gemini returns base64 image data
    let imageResult = messageContent;

    // If it's not a data URL yet, make it one
    if (!imageResult.startsWith('data:')) {
      // Check if it's just base64 or has some text
      if (imageResult.length > 1000 && !imageResult.includes(' ')) {
        // Likely base64
        imageResult = `data:image/png;base64,${imageResult}`;
      } else {
        // It's text, not an image
        console.error('Got text response instead of image:', imageResult.substring(0, 200));
        return Response.json({
          error: 'API returned text instead of image',
          details: 'Try a different filter or simpler prompt'
        }, { status: 500 });
      }
    }

    console.log('Returning image, starts with:', imageResult.substring(0, 50));

    return Response.json({
      success: true,
      image: imageResult,
      cached: false
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
