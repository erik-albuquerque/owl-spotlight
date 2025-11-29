import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  memo,
} from 'react'
import * as Lucide from 'lucide-react'
import { cn } from '../utils/cn'
import type {
  SearchFile,
  SearchResult,
} from '../../electron/@types/search-result'
import { Button } from './ui/button'

interface SearchResultItemProps {
  result: SearchResult
  onExecute: (result: SearchResult) => void
}

const SearchResultItem = memo(
  ({ result, onExecute }: SearchResultItemProps) => {
    const handleClick = () => onExecute(result)

    return (
      <Button
        variant='ghost'
        type="button"
        className="group cursor-pointer flex w-full items-center space-x-3 rounded-md p-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={handleClick}
      >
        {/* <span className="w-8 justify-self-end text-right text-neutral-400 text-xs uppercase">
          {result.type}
        </span> */}

        {result.type === 'app' && result.icon && (
          <img
            src={`file://${result.icon}`}
            className="h-8 w-8 object-contain"
            alt={result.name}
            decoding="async"
          />
        )}

        {result.type === 'file' && result.icon && (
          <img
            src={result.icon}
            className="h-8 w-8 object-contain"
            alt={result.name}
            decoding="async"
          />
        )}

        <div className="flex flex-1 flex-col items-start overflow-hidden">
          <span className="truncate text-start font-medium text-neutral-700 dark:text-neutral-200">
            {result.name}
          </span>

          <div className="flex w-full items-center space-x-2">
            {result.type === 'file' ? (
              <span className="w-full truncate text-start text-neutral-500 text-xs">
                {(result as unknown as SearchFile).shortPath}
              </span>
            ) : (
              <span className="w-full truncate text-start text-neutral-500 text-xs">
                {result.description}
              </span>
            )}
          </div>
        </div>

        {result.categories && result.categories.length > 0 && (
          <div className="hidden text-right sm:block">
            {result.categories.slice(0, 1).map(category => (
              <span
                key={category}
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:bg-neutral-800"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </Button>
    )
  }
)

SearchResultItem.displayName = 'SearchResultItem'

const SearchResults = memo(
  ({
    results,
    resultListRef,
    onExecuteItem,
  }: {
    results: SearchResult[]
    resultListRef: React.RefObject<HTMLDivElement>
    onExecuteItem: (item: SearchResult) => void
  }) => {
    return (
      <div
        className="flex flex-col space-y-1 bg-white p-2 dark:bg-neutral-900"
        ref={resultListRef}
      >
        {results.map((result, index) => (
          <SearchResultItem
            key={`${result.name}-${index}`}
            result={result}
            onExecute={onExecuteItem}
          />
        ))}
      </div>
    )
  }
)

SearchResults.displayName = 'SearchResults'

const SearchInput = () => {
  const searchQueryInputRef = useRef<HTMLInputElement>(null!)
  const resultListRef = useRef<HTMLDivElement>(null!)

  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)

  const handleToggleFocus = () => setIsFocused(prev => !prev)

  const handleExecuteItem = useCallback(async (itemPath: SearchResult) => {
    try {
      await window.ipcRenderer.invoke('executeItem', itemPath)
    } catch (error) {
      console.error('Error on execute item:', error)
    }
  }, [])

  const handleClearSearchQuery = useCallback(() => {
    searchQueryInputRef.current?.focus()
    setSearchQuery('')
    setResults(null)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults(null)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const searchResults: SearchResult[] = await window.ipcRenderer.invoke(
          'search',
          searchQuery
        )
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  useEffect(() => {
    searchQueryInputRef.current?.focus()
  }, [])

  useLayoutEffect(() => {
    let isMounted = true

    const resizeWindow = async () => {
      if (!resultListRef.current) {
        if (isMounted)
          await window.ipcRenderer.invoke('resizeWindow', {
            width: 550,
            height: 40,
          })
        return
      }

      try {
        const scrollHeight = resultListRef.current.scrollHeight

        const query = {
          width: 550,
          height: results?.length && Math.min(scrollHeight + 40, 500),
        }

        if (isMounted) {
          await window.ipcRenderer.invoke('resizeWindow', query)
        }
      } catch (error) {
        console.error(`Error resizing window: ${(error as Error).message}`)
      }
    }

    resizeWindow()

    return () => {
      isMounted = false
    }
  }, [results])

  return (
    <div className="relative w-full overflow-hidden dark:bg-neutral-900">
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
          onChange={handleInputChange}
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
        <div className="overflow-y-auto">
          <SearchResults
            results={results}
            resultListRef={resultListRef}
            onExecuteItem={handleExecuteItem}
          />
        </div>
      )}
    </div>
  )
}

export { SearchInput }
