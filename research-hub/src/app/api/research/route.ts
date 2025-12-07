import { createServer } from '@/lib/supabase/server'
import { researchSchema } from '@/lib/schemas'
import { extractUrls } from '@/lib/utils/extractUrls'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input (notes + type)
    const parsed = researchSchema.parse(body)

    // Extract URLs from notes
    const extractedUrls = extractUrls(parsed.notes)

    // Insert into database
    const supabase = await createServer()
    const { data, error } = await supabase
      .from('queue')
      .insert({
        notes: parsed.notes,        // Original text
        urls: extractedUrls,        // Array of URLs (can be empty)
        type: parsed.type,
        status: 'PENDING'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save research item' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Research added successfully',
        data: {
          id: data.id,
          urls_found: extractedUrls.length
        }
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Validation error:', err)
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    )
  }
}
