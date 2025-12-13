import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.client'
import type { Report } from '../lib/types'
import { ArrowLeft, ExternalLink, Play, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReportWithDetails extends Report {
  processing_runs: { id: string; name: string; type_id: string } | null
}

interface EntryData {
  id: string
  content: string
  status: string
}

export const Route = createFileRoute('/report/$reportId')({
  component: ReportFullPage,
})

function ReportFullPage() {
  const { reportId } = Route.useParams()

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, processing_runs:run_id(id, name, type_id)')
        .eq('id', reportId)
        .single()

      if (error) throw error
      return data as ReportWithDetails
    },
  })

  // Fetch linked entries
  const { data: entries = [] } = useQuery({
    queryKey: ['report-entries', reportId, report?.entry_ids],
    queryFn: async () => {
      if (!report?.entry_ids?.length) return []
      const { data } = await supabase
        .from('entries')
        .select('id, content, status')
        .in('id', report.entry_ids)
      return (data || []) as EntryData[]
    },
    enabled: !!report?.entry_ids?.length,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading report...</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-red-500">Failed to load report</div>
        <a href="/reports">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports
          </Button>
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </a>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Report</h1>
                <p className="text-sm text-gray-500">
                  {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${report.status === 'done'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
                }`}>
                {report.status === 'done' ? 'Done' : 'Processed'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{report.summary}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {report.processing_runs && (
              <Link
                to="/runs"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Play className="h-4 w-4" />
                {report.processing_runs.name}
              </Link>
            )}
            <span>•</span>
            <span>{report.entry_ids?.length || 0} entries</span>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <article className="prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-4 border-b border-gray-200">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold text-gray-900 mt-5 mb-2">{children}</h3>,
                h4: ({ children }) => <h4 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h4>,
                p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                code: ({ className, children }) => {
                  const isInline = !className
                  if (isInline) {
                    return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800">{children}</code>
                  }
                  return <code className={className}>{children}</code>
                },
                pre: ({ children }) => <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 italic my-4">{children}</blockquote>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                table: ({ children }) => <table className="border-collapse w-full my-4">{children}</table>,
                th: ({ children }) => <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
              }}
            >
              {report.markdown_content}
            </ReactMarkdown>
          </article>
        </div>

        {/* Sources Section */}
        {report.sources && Object.keys(report.sources).length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Sources
            </h3>
            <ul className="space-y-2">
              {Object.entries(report.sources).map(([key, value]) => (
                <li key={key}>
                  <a
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    {key}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Linked Entities Section */}
        {entries.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Source Entries ({entries.length})
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  to="/"
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <p className="text-sm text-gray-700 line-clamp-2">{entry.content}</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${entry.status === 'processed' ? 'bg-green-100 text-green-700' :
                    entry.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {entry.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Run Link */}
        {report.processing_runs && (
          <div className="mt-8 text-center">
            <Link
              to="/runs"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Play className="h-4 w-4" />
              View Run: {report.processing_runs.name}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
