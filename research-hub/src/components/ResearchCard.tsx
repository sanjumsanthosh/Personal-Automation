'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MermaidRenderer } from './MermaidRenderer'

interface ResearchCardProps {
  id: string
  notes: string
  urls: string[]
  markdown_content: string
  created_at: string
  type: string
}

export function ResearchCard({
  id,
  notes,
  urls,
  markdown_content,
  created_at,
  type
}: ResearchCardProps) {
  const date = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              {type}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {date}
            </span>
          </div>

          {/* Original Notes */}
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
            "{notes}"
          </p>
        </div>
      </div>

      {/* Extracted URLs (if any) */}
      {urls && urls.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            📎 Sources ({urls.length}):
          </p>
          <div className="space-y-1">
            {urls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* AI-Generated Summary */}
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-mermaid/.test(className || '')
              if (!inline && match) {
                return (
                  <MermaidRenderer chart={String(children).replace(/\n$/, '')} />
                )
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
            // Style links
            a({ href, children, ...props }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  {...props}
                >
                  {children}
                </a>
              )
            }
          }}
        >
          {markdown_content}
        </ReactMarkdown>
      </div>
    </article>
  )
}
