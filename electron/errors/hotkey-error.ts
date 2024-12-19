class HotkeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    Object.setPrototypeOf(this, HotkeyError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export { HotkeyError }
