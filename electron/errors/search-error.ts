class SearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    Object.setPrototypeOf(this, SearchError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export { SearchError }
