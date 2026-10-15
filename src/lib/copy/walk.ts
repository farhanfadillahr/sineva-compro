import { findForbiddenDashes, type DashViolation } from './dash-rule'

export type StringLeaf = { path: string; value: string }
export type LocatedViolation = { path: string; violation: DashViolation }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Every string in a JSON-like tree with its path: dots for object keys, `[i]` for array
 * items (`Home.hero.tags[1].label`). A root string has the empty path. Non-string leaves are
 * skipped; keys are identifiers, not copy, and are not returned.
 *
 * Message keys never contain dots (next-intl forbids them), so the dotted path stays
 * unambiguous for the bundles this is used on.
 */
export function collectStringLeaves(tree: unknown, basePath = ''): StringLeaf[] {
  if (typeof tree === 'string') return [{ path: basePath, value: tree }]
  if (Array.isArray(tree)) {
    return tree.flatMap((item, i) => collectStringLeaves(item, `${basePath}[${i}]`))
  }
  if (isRecord(tree)) {
    return Object.entries(tree).flatMap(([key, item]) =>
      collectStringLeaves(item, basePath ? `${basePath}.${key}` : key),
    )
  }
  return []
}

/**
 * Text node strings of a Tiptap/ProseMirror JSON document. Only `{ type: 'text', text }`
 * nodes count: attributes such as link hrefs are not copy and may legitimately contain a
 * dash-like character in a URL.
 */
export function collectRichTextNodes(doc: unknown, basePath = ''): StringLeaf[] {
  if (!isRecord(doc)) return []
  const leaves: StringLeaf[] = []
  if (doc.type === 'text' && typeof doc.text === 'string') {
    leaves.push({ path: basePath ? `${basePath}.text` : 'text', value: doc.text })
  }
  if (Array.isArray(doc.content)) {
    const contentPath = basePath ? `${basePath}.content` : 'content'
    doc.content.forEach((child, i) => {
      leaves.push(...collectRichTextNodes(child, `${contentPath}[${i}]`))
    })
  }
  return leaves
}

function violationsIn(leaves: StringLeaf[]): LocatedViolation[] {
  return leaves.flatMap(({ path, value }) =>
    findForbiddenDashes(value).map((violation) => ({ path, violation })),
  )
}

/** Forbidden dashes anywhere in a JSON message bundle or seed object, with their paths. */
export function findDashViolationsInTree(tree: unknown): LocatedViolation[] {
  return violationsIn(collectStringLeaves(tree))
}

/** Forbidden dashes in the text nodes of a rich text document, with their paths. */
export function findDashViolationsInRichText(doc: unknown): LocatedViolation[] {
  return violationsIn(collectRichTextNodes(doc))
}
