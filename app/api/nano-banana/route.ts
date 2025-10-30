export const runtime = 'edge';
export const maxDuration = 60;

interface NanaBananaRequest {
  prompt: string;
  imageUrl?: string; // For editing existing images
  mode: 'generate' | 'edit';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

export async function POST(req: Request) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    // TODO: Implement rate limiting with Vercel KV or Edge Config

    const { prompt, imageUrl, mode, aspectRatio } = await req.json() as NanaBananaRequest;

    // Validate input
    if (!prompt || prompt.length > 1000) {
      return Response.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    // Build message content
    const content = mode === 'edit' && imageUrl
      ? [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      : [{ type: 'text', text: `${prompt}. Aspect ratio: ${aspectRatio || '1:1'}` }];

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'https://snapmod.app',
        'X-Title': 'SnapMod',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content
        }],
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      return Response.json({
        error: 'Image generation failed',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    // Extract image URL from response
    // Nano Banana returns image in content or as URL
    const imageResult = data.choices?.[0]?.message?.content;

    return Response.json({
      success: true,
      image: imageResult,
      cached: false
    });

  } catch (error) {
    console.error('Nano Banana API error:', error);
    return Response.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
