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
    const { prompt, imageUrl, mode, aspectRatio } = await req.json() as NanaBananaRequest;

    // Validate input
    if (!prompt || prompt.length > 2000) {
      return Response.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    // For image editing, we need the image
    if (mode === 'edit' && !imageUrl) {
      return Response.json({ error: 'Image required for edit mode' }, { status: 400 });
    }

    // Build message content for Gemini
    const parts: any[] = [];

    // Add the image if in edit mode
    if (mode === 'edit' && imageUrl) {
      // Extract base64 data if it's a data URL
      const base64Data = imageUrl.includes('base64,')
        ? imageUrl.split('base64,')[1]
        : imageUrl;

      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    // Add the prompt
    parts.push({ text: prompt });

    // Call Gemini via OpenRouter
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
          content: parts
        }],
        max_tokens: 4096,
        stream: false
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
    console.log('OpenRouter response structure:', JSON.stringify({
      choices: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentType: typeof data.choices?.[0]?.message?.content
    }));

    // Extract the response content
    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent) {
      console.error('No content in response:', data);
      return Response.json({
        error: 'No image returned',
        details: 'API response contained no content'
      }, { status: 500 });
    }

    // Gemini returns base64 image data directly in content
    // Check if it's already a data URL
    let imageResult = messageContent;

    // If it's base64 without data URL prefix, add it
    if (!imageResult.startsWith('data:') && !imageResult.startsWith('http')) {
      imageResult = `data:image/png;base64,${imageResult}`;
    }

    console.log('Image result type:', imageResult.substring(0, 50));

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
