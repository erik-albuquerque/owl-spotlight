const ALLOWED_CATEGORIES = new Set([
  'Development',
  'Game',
  'Graphics',
  'Network',
  'AudioVideo',
  'Office',
  'Math',
  'Settings',
  'System',
  'Utility',
])

const parseAppCategories = (rawCategoryString: string | null) => {
  const categoryMap: Record<string, string> = {
    Network: 'Internet',
    AudioVideo: 'Multimedia',
  }

  return (
    rawCategoryString
      ?.replace(/;$/, '')
      .split(';')
      .filter(category => ALLOWED_CATEGORIES.has(category))
      .map(category => categoryMap[category] || category) || null
  )
}

export { parseAppCategories }
