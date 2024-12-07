const parseDesktopFile = (content: string, key: string): string | null => {
  const regex = new RegExp(`^${key}=(.*)`, 'm')
  const match = content.match(regex)
  return match?.[1] || null
}

export { parseDesktopFile }
