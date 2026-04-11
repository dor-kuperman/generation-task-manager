'use client';

import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Input } from './ui/input';
import { Button } from './ui/button';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['em', 'mark', 'b', 'strong'] });
}

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  highlight?: Record<string, string[]>;
  score: number;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('Search request failed');
      }
      const data = await res.json();
      setResults(data.hits ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div role="search">
      <div className="flex gap-2">
        <Input
          aria-label="Search tasks"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <Button onClick={search} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div aria-live="polite">
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        {searched && !error && results.length === 0 && !loading && (
          <p className="text-sm text-gray-500 mt-2">No results found.</p>
        )}

        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((hit) => (
              <a
                key={hit.id}
                href={`/tasks/${hit.id}`}
                className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <p
                  className="font-medium text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(hit.highlight?.title?.[0] ?? hit.title),
                  }}
                />
                {(hit.highlight?.description?.[0] || hit.description) && (
                  <p
                    className="text-sm text-gray-500 mt-1"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(hit.highlight?.description?.[0] ?? hit.description ?? ''),
                    }}
                  />
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
