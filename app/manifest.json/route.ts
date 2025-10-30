export async function GET() {
  return Response.json({
    name: 'SnapMod - AI Photo Filters',
    short_name: 'SnapMod',
    description: 'Transform your photos with AI-powered Nano Banana filters',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['photo', 'productivity', 'utilities']
  });
}
