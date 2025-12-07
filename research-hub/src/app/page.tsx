import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Research Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Dump your research notes and URLs. AI handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Natural Input
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Just write notes with URLs mixed in. No separate fields needed.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Auto-Extraction
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              URLs are automatically extracted and stored. Zero effort.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI Summary
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get AI-powered digests combining all your research insights.
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/add"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/feed"
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-lg"
          >
            View Digest
          </Link>
        </div>
      </div>
    </div>
  )
}
