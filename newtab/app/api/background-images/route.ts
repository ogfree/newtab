import { NextResponse } from 'next/server'

const GITHUB_API_URL = 'https://api.github.com/repos/neuralshyam/media-lib/contents/newtab'
const CACHE_TIME = 60 * 60 * 1000 // 1 hour in milliseconds

let cachedImages: string[] | null = null
let lastFetchTime: number | null = null

export async function GET() {
  try {
    // Check if we have cached images and if the cache is still valid
    if (cachedImages && lastFetchTime && Date.now() - lastFetchTime < CACHE_TIME) {
      return NextResponse.json({ images: cachedImages })
    }

    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch images')
    }

    const data = await response.json()
    
    // Filter for image files and get their download URLs
    const imageUrls = data
      .filter((file: any) => 
        file.name.match(/\.(jpg|jpeg|png|webp)$/i))
      .map((file: any) => file.download_url)

    // Update cache
    cachedImages = imageUrls
    lastFetchTime = Date.now()

    return NextResponse.json({ images: imageUrls })
  } catch (error) {
    console.error('Error fetching background images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch background images' },
      { status: 500 }
    )
  }
}