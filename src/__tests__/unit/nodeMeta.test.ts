import type { FlowItem } from '../../types'
import { describe, expect, it } from 'vitest'
import { getItemAriaLabel, getItemContent, getItemDisplayName, getItemTitle, isContentItem, isSelectable } from '../../utils/nodeMeta'
import { flowItems } from '../fixtures/flowItems'

const [trigger, dateTime, connector, message] = flowItems as [FlowItem, FlowItem, FlowItem, FlowItem]
const itemsById = new Map(flowItems.map(item => [item.id.toString(), item]))

describe('isSelectable', () => {
  it('allows every type except connectors', () => {
    expect([trigger, dateTime, message].map(isSelectable)).toEqual([true, true, true])
    expect(isSelectable(connector)).toBe(false)
  })

  it('rejects a missing item', () => {
    expect(isSelectable(undefined)).toBe(false)
  })
})

describe('isContentItem', () => {
  it('accepts items that have a title and description', () => {
    expect([dateTime, message].map(isContentItem)).toEqual([true, true])
  })

  it('rejects the trigger, connectors and missing items', () => {
    expect([trigger, connector, undefined].map(isContentItem)).toEqual([false, false, false])
  })
})

describe('getItemContent', () => {
  it('returns the title and description', () => {
    expect(getItemContent(dateTime)).toEqual({ title: 'Business Hours', description: 'Routes by office hours' })
  })

  it('uses an empty description when there is none', () => {
    expect(getItemContent(message)).toEqual({ title: 'Welcome Message', description: '' })
  })

  it('returns null for items without content', () => {
    expect(getItemContent(trigger)).toBeNull()
    expect(getItemContent(undefined)).toBeNull()
  })
})

describe('getItemTitle', () => {
  it('uses the item\'s name when it has one', () => {
    expect(getItemTitle(message)).toBe('Welcome Message')
  })

  it('falls back to the type label for items without a name', () => {
    expect(getItemTitle(trigger)).toBe('Trigger')
    expect(getItemTitle(connector)).toBe('Connector')
  })
})

describe('getItemAriaLabel', () => {
  it('combines type label and title', () => {
    expect(getItemAriaLabel(message)).toBe('Send Message: Welcome Message')
    expect(getItemAriaLabel(dateTime)).toBe('Date Time: Business Hours')
  })

  it('uses only the type label when the title is the same', () => {
    expect(getItemAriaLabel(trigger)).toBe('Trigger')
  })
})

describe('getItemDisplayName', () => {
  it('uses the title for regular items', () => {
    expect(getItemDisplayName(message, itemsById)).toBe('Welcome Message')
  })

  it('names a connector by its branch and condition', () => {
    expect(getItemDisplayName(connector, itemsById)).toBe('Success branch of Business Hours')
  })

  it('names a connector by its branch alone when the condition is missing', () => {
    const failure: FlowItem = { id: 'x', parentId: 'gone', type: 'dateTimeConnector', data: { connectorType: 'failure' } }

    expect(getItemDisplayName(failure, itemsById)).toBe('Failure branch')
  })
})
