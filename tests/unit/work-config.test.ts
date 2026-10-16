import { describe, expect, it } from 'vitest'
import { parseFields } from '../../src/features/cms/fields'
import { workConfig } from '../../src/features/documents/configs'
import { demoWork, launchWork } from '../../src/features/work/launch'

describe('work descriptor', () => {
  it('accepts the demo projects and labels them as internal demos', () => {
    expect(launchWork()).toEqual([])
    for (const row of demoWork) {
      expect(parseFields(workConfig.schema, row.data)).toEqual({ ok: true, value: row.data })
      expect(row.data.projectType).toBe('internal-demo')
      expect(row.data.title.startsWith('[Demo]')).toBe(true)
    }
  })

  it('requires a project type from the list and rejects dashes in results', () => {
    const data = demoWork[0].data
    expect(parseFields(workConfig.schema, { ...data, projectType: 'agency' }).ok).toBe(false)
    expect(parseFields(workConfig.schema, { ...data, result: 'Faster — by far' }).ok).toBe(false)
  })
})
