class HotkeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HotkeyError'
  }
}

export { HotkeyError }
