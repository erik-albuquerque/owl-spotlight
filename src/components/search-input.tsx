import { useCallback, useEffect, useRef, useState } from 'react'
import * as Lucide from 'lucide-react'
import { cn } from '../utils/cn'
import type { SearchResult } from '../../electron/@types/search-result'

const SearchResults = ({
  results,
  resultListRef,
}: {
  results: SearchResult[]
  resultListRef: React.RefObject<HTMLDivElement>
}) => (
  <div
    className='flex flex-col space-y-2 bg-white p-2 dark:bg-neutral-900'
    ref={resultListRef}
  >
    {results.map((result, index) => (
      <button
        type="button"
        key={`${result.name}-${index}`}
        className="flex items-center space-x-3"
      >
        <span className="justify-self-end text-neutral-400">{result.type}</span>

        {result.type === 'app' && result.icon && (
          <img
            src={`file://${result.icon}`}
            className="h-8 w-8"
            alt={result.name}
          />
        )}

        {result.type === 'file' && result.icon && (
          <img src={result.icon} className="h-8 w-8" alt={result.name} />
        )}

        <span className='truncate text-start'>{result.name}</span>

        <span className='max-w-[40%] truncate text-neutral-500 text-sm'>
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
  const [results, setResults] = useState<SearchResult[] | null>(null)

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
      const searchResults: SearchResult[] = await window.ipcRenderer.invoke(
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
          height: results?.length ? Math.min(resultListHeight + 40, 500) : 40,
        }

        await window.ipcRenderer.invoke('resizeWindow', query)
      } catch (error) {
        console.error(`Error resizing window: ${(error as Error).message}`)
      }
    }

    resizeWindow()
  }, [results])

  return (
    <div className='relative dark:bg-neutral-900'>
      <div
        data-focus={isFocused}
        className={cn(
          'flex h-10 items-center space-x-2 rounded-md p-2',
          'border border-neutral-300 dark:border-neutral-500',
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
