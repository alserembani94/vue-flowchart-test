import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readonly } from 'vue'
import { useFlowStore } from '../../stores/flow'
import { flowItems } from '../fixtures/flowItems'

let flow: ReturnType<typeof useFlowStore>

const item = (id: string) => flow.itemsById.get(id)!
const parentOf = (id: string) => item(id).parentId.toString()

beforeEach(() => {
  setActivePinia(createPinia())
  flow = useFlowStore()
  flow.setItems(structuredClone(flowItems))
})

describe('setItems', () => {
  it('keeps its own editable copy, even of read-only query data', () => {
    const source = structuredClone(flowItems)
    flow.setItems(readonly(source) as typeof source)

    expect(flow.updateItem('b0653a', { name: 'Edited' })).toBe(true)
    expect(item('b0653a')).toMatchObject({ name: 'Edited' })
    expect(source[3]).toMatchObject({ name: 'Welcome Message' })
  })
})

describe('updateItem', () => {
  it('trims and saves the title', () => {
    expect(flow.updateItem('b0653a', { name: '  Hi there  ' })).toBe(true)
    expect(item('b0653a')).toMatchObject({ name: 'Hi there' })
  })

  it('rejects an empty title and keeps the old one', () => {
    expect(flow.updateItem('b0653a', { name: '   ' })).toBe(false)
    expect(item('b0653a')).toMatchObject({ name: 'Welcome Message' })
  })

  it('trims the description and merges it into data', () => {
    flow.updateItem('b0653a', { data: { description: '  Greets visitors ' } })

    expect(item('b0653a').data).toEqual({
      payload: [{ type: 'text', text: 'Hello there' }],
      description: 'Greets visitors',
    })
  })

  it('removes the description when it\'s cleared', () => {
    flow.updateItem('d09c08', { data: { description: '  ' } })

    expect(item('d09c08').data).not.toHaveProperty('description')
  })

  it('ignores items without a title', () => {
    expect(flow.updateItem('1', { name: 'Renamed' })).toBe(false)
    expect(flow.updateItem('161f52', { name: 'Renamed' })).toBe(false)
  })
})

describe('updateItem comment', () => {
  const commentOf = (id: string) => {
    const entry = item(id)
    return entry.type === 'addComment' ? entry.data.comment : undefined
  }

  it('trims and saves the comment', () => {
    const id = flow.insertItem({ type: 'addComment', name: 'Note' }, 'b0653a')!

    flow.updateItem(id, { data: { comment: '  Call back  ' } })

    expect(commentOf(id)).toBe('Call back')
  })

  it('keeps an empty comment when it is removed', () => {
    const id = flow.insertItem({ type: 'addComment', name: 'Note' }, 'b0653a')!
    flow.updateItem(id, { data: { comment: 'Call back' } })

    flow.updateItem(id, { data: { comment: '   ' } })

    expect(commentOf(id)).toBe('')
  })

  it('ignores a comment for other node types', () => {
    flow.updateItem('b0653a', { data: { comment: 'Not a comment node' } })

    expect(item('b0653a').data).not.toHaveProperty('comment', 'Not a comment node')
  })
})

describe('updateItem payload', () => {
  const payloadOf = (id: string) => {
    const entry = item(id)
    return entry.type === 'sendMessage' ? entry.data.payload : undefined
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('replaces the payload in order and trims texts', () => {
    const payload = [
      { type: 'attachment' as const, attachment: 'https://example.com/a.png' },
      { type: 'text' as const, text: '  Hi there  ' },
    ]

    expect(flow.updateItem('b0653a', { data: { payload } })).toBe(true)
    expect(payloadOf('b0653a')).toEqual([
      { type: 'attachment', attachment: 'https://example.com/a.png' },
      { type: 'text', text: 'Hi there' },
    ])
  })

  it('rejects a payload with an empty text and changes nothing', () => {
    const payload = [{ type: 'text' as const, text: '   ' }]

    expect(flow.updateItem('b0653a', { name: 'Renamed', data: { payload } })).toBe(false)
    expect(payloadOf('b0653a')).toEqual([{ type: 'text', text: 'Hello there' }])
    expect(item('b0653a')).toMatchObject({ name: 'Welcome Message' })
  })

  it('allows an empty payload', () => {
    expect(flow.updateItem('b0653a', { data: { payload: [] } })).toBe(true)
    expect(payloadOf('b0653a')).toEqual([])
  })

  it('releases uploaded images that are removed from the payload', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    flow.updateItem('b0653a', {
      data: { payload: [
        { type: 'attachment', attachment: 'blob:kept' },
        { type: 'attachment', attachment: 'blob:removed' },
        { type: 'attachment', attachment: 'https://example.com/remote.png' },
      ] },
    })

    flow.updateItem('b0653a', { data: { payload: [{ type: 'attachment', attachment: 'blob:kept' }] } })

    expect(revoke).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:removed')
  })

  it('releases uploaded images when their node is deleted', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    flow.updateItem('b0653a', { data: { payload: [{ type: 'attachment', attachment: 'blob:photo' }] } })

    flow.deleteItem('b0653a')

    expect(revoke).toHaveBeenCalledWith('blob:photo')
  })
})

describe('updateItem schedule', () => {
  const timesOf = (id: string) => {
    const entry = item(id)
    return entry.type === 'dateTime' ? entry.data.times : undefined
  }

  it('saves valid times and a new timezone', () => {
    const times = [{ day: 'mon' as const, startTime: '08:30', endTime: '08:30' }]

    expect(flow.updateItem('d09c08', { data: { times, timezone: 'Asia/Kuala_Lumpur' } })).toBe(true)
    expect(timesOf('d09c08')).toEqual(times)
    expect(item('d09c08').data).toMatchObject({ timezone: 'Asia/Kuala_Lumpur' })
  })

  it('rejects an end time before the start time and changes nothing', () => {
    const times = [{ day: 'mon' as const, startTime: '17:00', endTime: '09:00' }]

    expect(flow.updateItem('d09c08', { data: { times, timezone: 'Asia/Tokyo' } })).toBe(false)
    expect(timesOf('d09c08')).toEqual([{ day: 'mon', startTime: '09:00', endTime: '17:00' }])
    expect(item('d09c08').data).toMatchObject({ timezone: 'UTC' })
  })

  it('rejects empty times', () => {
    expect(flow.updateItem('d09c08', { data: { times: [{ day: 'mon', startTime: '', endTime: '17:00' }] } })).toBe(false)
  })
})

describe('insertItem', () => {
  it('adds a node at the end when the parent has no children', () => {
    const id = flow.insertItem({ type: 'addComment', name: ' Note ', description: ' Why ' }, 'b0653a')!

    expect(item(id)).toMatchObject({
      type: 'addComment',
      name: 'Note',
      data: { comment: '', description: 'Why' },
    })
    expect(parentOf(id)).toBe('b0653a')
  })

  it('inserts between a parent and its children', () => {
    const id = flow.insertItem({ type: 'sendMessage', name: 'Between' }, '161f52')!

    expect(parentOf(id)).toBe('161f52')
    expect(parentOf('b0653a')).toBe(id)
  })

  it('creates Business Hours with success and failure connectors and moves children under success', () => {
    const id = flow.insertItem({ type: 'businessHours', name: 'Hours' }, '161f52')!
    const dateTime = item(id)
    if (dateTime.type !== 'dateTime')
      throw new Error('expected dateTime')

    const [successId, failureId] = dateTime.data.connectors.map(String) as [string, string]
    expect(item(successId)).toMatchObject({ type: 'dateTimeConnector', data: { connectorType: 'success' } })
    expect(item(failureId)).toMatchObject({ type: 'dateTimeConnector', data: { connectorType: 'failure' } })
    expect(parentOf(successId)).toBe(id)
    expect(parentOf(failureId)).toBe(id)
    expect(parentOf('b0653a')).toBe(successId)
  })

  it('gives a new Business Hours node every day from 9 to 5', () => {
    const id = flow.insertItem({ type: 'businessHours', name: 'Hours' }, 'b0653a')!
    const dateTime = item(id)
    if (dateTime.type !== 'dateTime')
      throw new Error('expected dateTime')

    expect(dateTime.data.times.map(time => time.day)).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    expect(dateTime.data.times.every(time => time.startTime === '09:00' && time.endTime === '17:00')).toBe(true)
  })

  it('rejects an empty title or an unknown parent', () => {
    expect(flow.insertItem({ type: 'sendMessage', name: '  ' }, 'b0653a')).toBeNull()
    expect(flow.insertItem({ type: 'sendMessage', name: 'Ok' }, 'missing')).toBeNull()
    expect(flow.items).toHaveLength(flowItems.length)
  })
})

describe('deleteItem', () => {
  it('moves the deleted node\'s children up to its parent', () => {
    const id = flow.insertItem({ type: 'sendMessage', name: 'Between' }, '161f52')!

    expect(flow.deleteItem(id)).toBe(true)

    expect(flow.itemsById.has(id)).toBe(false)
    expect(parentOf('b0653a')).toBe('161f52')
  })

  it('removes Business Hours\' connectors and moves their children up', () => {
    expect(flow.deleteItem('d09c08')).toBe(true)

    expect(flow.itemsById.has('d09c08')).toBe(false)
    expect(flow.itemsById.has('161f52')).toBe(false)
    expect(parentOf('b0653a')).toBe('1')
  })

  it('does not delete the trigger', () => {
    expect(flow.deleteItem('1')).toBe(false)
    expect(flow.itemsById.has('1')).toBe(true)
  })
})
