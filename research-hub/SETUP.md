# Research Hub - Complete Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (https://supabase.com)
- npm or bun package manager

## Installation Steps

### 1. Install Dependencies

If you haven't already, run:
```bash
npm install
```

All required packages are:
- `@supabase/supabase-js` - Database client
- `@supabase/auth-helpers-nextjs` - Authentication
- `react-hook-form` + `zod` - Form validation
- `react-markdown` + `remark-gfm` - Markdown rendering
- `mermaid` - Diagram support
- `tailwindcss` - Styling

### 2. Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Once created, go to **Settings → API**
3. Copy your:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Environment Variables

Edit `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `database.sql` from this project
4. Paste it into the SQL editor
5. Click "Run"

This will create:
- `queue` table - stores your research notes with extracted URLs
- `digests` table - stores AI-generated summaries
- `batches` table - tracks processing batches
- All necessary indexes for performance

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Home page
│   ├── add/                 # Add research page
│   │   └── page.tsx
│   ├── feed/                # View digests page
│   │   └── page.tsx
│   └── api/
│       └── research/
│           └── route.ts     # API endpoint for saving research
├── components/
│   ├── ResearchForm.tsx     # Form component
│   ├── ResearchCard.tsx     # Display component
│   └── MermaidRenderer.tsx  # Diagram renderer
└── lib/
    ├── utils/
    │   └── extractUrls.ts   # URL extraction logic
    ├── schemas.ts           # Zod validation schemas
    └── supabase/
        └── server.ts        # Supabase client setup
```

## Key Features

### 1. URL Extraction
The `extractUrls()` function automatically:
- Finds all URLs (http/https) in your notes
- Removes duplicates
- Stores them as an array in the database

Example:
```
Input: "Check https://stanford.edu and https://mit.edu for rankings"
Output: ["https://stanford.edu", "https://mit.edu"]
```

### 2. Form Validation
Uses Zod schemas to validate:
- Notes: 5-2000 characters
- Type: one of university/person/paper/generic

### 3. Mobile-First Design
- Single textarea for natural input
- Large tap targets (48px minimum)
- Character counter for feedback
- PWA-ready for "Add to Home Screen"

### 4. Database Structure
```sql
queue
├── id (UUID)
├── notes (TEXT) - Original user input
├── urls (TEXT[]) - Extracted URLs array
├── type (TEXT) - Research type
├── status (TEXT) - PENDING/PROCESSING/COMPLETED/FAILED
├── batch_id (UUID) - Links to batches
└── created_at (TIMESTAMP)

digests
├── id (UUID)
├── markdown_content (TEXT) - AI summary
├── source_notes (TEXT) - Original notes reference
├── source_urls (TEXT[]) - URLs that were processed
├── batch_id (UUID)
└── created_at (TIMESTAMP)
```

## Next Steps

### For n8n Integration:
1. Set up n8n (https://n8n.io)
2. Create workflow to:
   - Poll `queue` table for PENDING items
   - Fetch URL contents if URLs exist
   - Send to Perplexity/Gemini for analysis
   - Store results in `digests` table
3. Update `queue.status` to COMPLETED

### For Production Deployment:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "NEXT_PUBLIC_SUPABASE_URL is undefined"
- Check `.env.local` has correct values
- Restart dev server after updating env vars

### Tables not appearing in Supabase
- Make sure you ran the SQL in database.sql
- Check Supabase project is correct

### Form not submitting
- Check browser console for errors
- Verify Supabase credentials are correct
- Check that queue table exists

## Support

For issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console: DevTools → Console
3. Check terminal output for server errors
