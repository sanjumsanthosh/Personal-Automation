import { createServer } from '@/lib/supabase/server'
import { ResearchCard } from '@/components/ResearchCard'

export const revalidate = 60 // ISR: Revalidate every 60 seconds

export default async function FeedPage() {
  const supabase = await createServer()

  // Join queue with digests to get both original notes and AI results
  const { data: results, error } = await supabase
    .from('digests')
    .select(`
      id,
      markdown_content,
      source_notes,
      source_urls,
      created_at,
      processed_at,
      batch_id
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Feed error:', error)
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        Error loading feed: {error.message}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Research Digest
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          AI-powered summaries of your research notes
        </p>
      </div>

      {/* Results */}
      {results && results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <ResearchCard
              key={result.id}
              id={result.id}
              notes={result.source_notes || 'No notes available'}
              urls={result.source_urls || []}
              markdown_content={result.markdown_content}
              created_at={result.created_at}
              type="research" // Could extract from batch metadata
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No research digests yet
          </p>
          <a
            href="/add"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Research
          </a>
        </div>
      )}
    </div>
  )
}
