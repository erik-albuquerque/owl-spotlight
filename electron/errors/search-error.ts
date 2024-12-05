class SearchError extends Error {
  constructor(message: string) {
    super(message)
    this.message = 'SearchError'
  }
}

export { SearchError }
