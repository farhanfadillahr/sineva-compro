/** Depth-first walk helpers shared by the public contract tests. */
export function* walkStrings(value: unknown): Generator<string> {
  if (typeof value === 'string') yield value
  else if (Array.isArray(value)) for (const item of value) yield* walkStrings(item)
  else if (value && typeof value === 'object')
    for (const item of Object.values(value)) yield* walkStrings(item)
}

export function* walkKeys(value: unknown): Generator<string> {
  if (Array.isArray(value)) for (const item of value) yield* walkKeys(item)
  else if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) {
      yield key
      yield* walkKeys(item)
    }
}

/** Yields every object that has the given own key, so tests can inspect nested sections. */
export function* walkObjectsWithKey(value: unknown, key: string): Generator<object> {
  if (Array.isArray(value)) for (const item of value) yield* walkObjectsWithKey(item, key)
  else if (value && typeof value === 'object') {
    if (key in value) yield value
    for (const item of Object.values(value)) yield* walkObjectsWithKey(item, key)
  }
}
