import { ResearchForm } from '@/components/ResearchForm'

export default function AddPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Add Research
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Drop your notes and URLs naturally—we'll handle the rest
          </p>
        </div>

        <ResearchForm />
      </div>
    </div>
  )
}
