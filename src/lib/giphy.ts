// Giphy integration — searches GIFs from a specific channel/user
// Used to auto-fill exercise Video URLs in Notion based on exercise name

const GIPHY_USERNAME = 'docgarrett'  // https://giphy.com/channel/DocGarrett

interface GiphyImage {
  url: string
  width: string
  height: string
}

interface GiphyGif {
  id: string
  title: string
  url: string  // page URL
  username: string
  images: {
    original: GiphyImage
    downsized: GiphyImage
    downsized_medium?: GiphyImage
    fixed_height: GiphyImage
  }
}

interface GiphyResponse {
  data: GiphyGif[]
  pagination: { total_count: number; count: number; offset: number }
}

// Search Giphy for GIFs from DocGarrett's channel matching the query
// Returns the best-match direct GIF URL, or null if no match
export async function searchGiphyForExercise(exerciseName: string): Promise<string | null> {
  const apiKey = process.env.GIPHY_API_KEY
  if (!apiKey) {
    console.warn('GIPHY_API_KEY not configured')
    return null
  }

  // @username syntax restricts results to that channel
  const query = `@${GIPHY_USERNAME} ${exerciseName}`
  const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=5&rating=g&lang=en`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`Giphy search failed: ${res.status}`)
      return null
    }
    const json = (await res.json()) as GiphyResponse
    if (!json.data || json.data.length === 0) return null

    // Filter to only GIFs from the actual channel (extra safety)
    const channelGifs = json.data.filter(
      g => g.username?.toLowerCase() === GIPHY_USERNAME.toLowerCase()
    )
    const best = channelGifs[0] || json.data[0]

    // Prefer downsized_medium for fast loading, fall back to downsized, then original
    return (
      best.images.downsized_medium?.url ||
      best.images.downsized.url ||
      best.images.original.url
    )
  } catch (err) {
    console.error('Giphy fetch error:', err)
    return null
  }
}
