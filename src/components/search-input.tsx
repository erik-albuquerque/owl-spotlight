import { useCallback, useEffect, useRef, useState } from 'react'
import * as Lucide from 'lucide-react'
import { cn } from '../utils/cn'

type SearchResult = {
  type: 'app' | 'file' | 'recentFile'
  name: string
  path: string
  icon: string | null
  description: string | null
  categories: string[] | null
}

type Results = SearchResult[]

const SearchResults = ({
  results,
  resultListRef,
}: {
  results: Results
  resultListRef: React.RefObject<HTMLDivElement>
}) => (
  <div
    className="mt-2 flex flex-col rounded-md bg-white p-2 pt-0 dark:bg-neutral-900"
    ref={resultListRef}
  >
    {results.map((result, index) => (
      <button
        type="button"
        key={`${result.name}-${index}`}
        className='flex items-center space-x-2'
      >
        <span className="text-neutral-400">{result.type}</span>
        <span className='truncate text-start'>{result.name}</span>

        <span className="truncate text-neutral-500 text-sm">
          {result.description}
        </span>

        {result.categories && (
          <div>
            {result.categories.map((category, index) => (
              <span key={category} className="text-neutral-400 text-xs">
                {category}
                {result.categories?.length !== index + 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </button>
    ))}
  </div>
)

const SearchInput = () => {
  const searchQueryInputRef = useRef<HTMLInputElement | null>(null)
  const resultListRef = useRef<HTMLDivElement | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [results, setResults] = useState<Results | null>(null)

  const handleToggleFocus = () => setIsFocused(prev => !prev)

  const handleClearSearchQuery = useCallback(() => {
    searchQueryInputRef.current?.focus()
    setSearchQuery('')
    setResults(null)
  }, [])

  const handleSearch = useCallback(async (input: string) => {
    setSearchQuery(input)

    if (input.trim() === '') {
      setResults(null)
      return
    }

    try {
      const searchResults: Results = await window.ipcRenderer.invoke(
        'search',
        input
      )
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    }
  }, [])

  useEffect(() => {
    if (searchQueryInputRef.current) {
      searchQueryInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const resizeWindow = async () => {
      try {
        const resultListHeight =
          resultListRef.current?.getBoundingClientRect().height || 112

        const query = {
          width: 550,
          height: results?.length ? Math.min(resultListHeight + 48, 500) : 40,
        }

        await window.ipcRenderer.invoke('resizeWindow', query)
      } catch (error) {
        console.error(`Error resizing window: ${(error as Error).message}`)
      }
    }

    resizeWindow()
  }, [results])

  return (
    <div className="relative bg-white dark:bg-neutral-900">
      <div
        data-focus={isFocused}
        className={cn(
          'flex h-10 items-center space-x-2 rounded-md p-2',
          'border border-neutral-300',
          'data-[focus=true]:border-neutral-700',
          'transition-colors'
        )}
      >
        <Lucide.Search className="size-4 text-neutral-400" />

        <input
          type="text"
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          placeholder="Search..."
          value={searchQuery}
          onFocus={handleToggleFocus}
          onBlur={handleToggleFocus}
          onChange={e => handleSearch(e.target.value)}
          ref={searchQueryInputRef}
        />

        {searchQuery && (
          <button
            type="button"
            className="rounded-lg p-1 outline-none hover:bg-neutral-100 focus:bg-neutral-100 focus:ring-1 focus:ring-neutral-300 dark:focus:bg-neutral-800 dark:focus:ring-transparent dark:hover:bg-neutral-800"
            onClick={handleClearSearchQuery}
          >
            <Lucide.X className="size-4 text-neutral-500" />
          </button>
        )}
      </div>

      {results && results.length > 0 && (
        <SearchResults results={results} resultListRef={resultListRef} />
      )}
    </div>
  )
}

export { SearchInput }
