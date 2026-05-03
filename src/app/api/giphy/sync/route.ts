import { NextResponse } from 'next/server'
import { getExercises, updateExerciseVideoUrl } from '@/lib/notion'
import { searchGiphyForExercise } from '@/lib/giphy'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const overwriteExisting: boolean = body?.overwriteExisting === true

    const exercises = await getExercises()
    const updated: string[] = []
    const skipped: string[] = []
    const notFound: string[] = []
    const errored: string[] = []

    for (const ex of exercises) {
      // Skip if already has a video URL and we're not overwriting
      if (ex.videoUrl && !overwriteExisting) {
        skipped.push(ex.name)
        continue
      }

      try {
        const giphyUrl = await searchGiphyForExercise(ex.name)
        if (!giphyUrl) {
          notFound.push(ex.name)
          continue
        }
        await updateExerciseVideoUrl(ex.id, giphyUrl)
        updated.push(ex.name)
      } catch (err) {
        console.error(`Failed to sync ${ex.name}:`, err)
        errored.push(ex.name)
      }
    }

    return NextResponse.json({
      total: exercises.length,
      updated: updated.length,
      skipped: skipped.length,
      notFound: notFound.length,
      errored: errored.length,
      details: { updated, skipped, notFound, errored },
    })
  } catch (error: any) {
    console.error('Giphy sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
