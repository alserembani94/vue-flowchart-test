import type { FlowItem, SendMessagePayload } from '../types'
import type { ContentItem } from '../utils/nodeMeta'
import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { attachmentUrls, revokeBlobUrls } from '../utils/attachments'
import { DEFAULT_BUSINESS_HOURS, WEEKDAYS } from '../utils/constants'
import { isContentItem } from '../utils/nodeMeta'
import { isValidSchedule } from '../utils/schedule'

export interface ItemPatch {
  name?: string
  data?: Partial<ContentItem['data']>
}

export type NewNodeType = 'sendMessage' | 'addComment' | 'businessHours'

export interface NewNodeInput {
  type: NewNodeType
  name: string
  description?: string
}

const newId = () => crypto.randomUUID()

export const useFlowStore = defineStore('flow', () => {
  const items = ref<FlowItem[]>([])
  const loaded = ref(false)

  const itemsById = computed(
    () => new Map(items.value.map(item => [item.id.toString(), item])),
  )

  const structureKey = computed(() =>
    items.value.map(item => `${item.id}>${item.parentId}`).join('|'),
  )

  function setItems(next: FlowItem[]) {
    items.value = structuredClone(toRaw(next))
    loaded.value = true
  }

  function childrenOf(id: string) {
    return items.value.filter(item => item.parentId.toString() === id)
  }

  function updateItem(id: string, patch: ItemPatch): boolean {
    const item = itemsById.value.get(id)
    if (!isContentItem(item))
      return false

    const name = patch.name?.trim()
    if (name === '')
      return false

    let payload: SendMessagePayload[] | undefined
    if (item.type === 'sendMessage' && patch.data && 'payload' in patch.data) {
      payload = (patch.data.payload ?? []).map(part =>
        part.type === 'text' ? { type: 'text', text: part.text.trim() } : part,
      )
      if (payload.some(part => part.type === 'text' && part.text === ''))
        return false
    }

    const times = item.type === 'dateTime' && patch.data && 'times' in patch.data ? patch.data.times ?? [] : undefined
    if (times && !isValidSchedule(times))
      return false

    if (name !== undefined)
      item.name = name

    if (item.type === 'dateTime' && times)
      item.data.times = times.map(time => ({ ...time }))

    if (item.type === 'sendMessage' && payload) {
      const kept = new Set(attachmentUrls(payload))
      revokeBlobUrls(attachmentUrls(item.data.payload).filter(url => !kept.has(url)))
      item.data.payload = payload
    }

    if (patch.data) {
      const { description, ...rest } = patch.data
      const data = item.data as Record<string, unknown>
      for (const [key, value] of Object.entries(rest)) {
        if (key !== 'comment' && key !== 'payload' && key !== 'times' && key in data)
          data[key] = value
      }

      if ('description' in patch.data) {
        const trimmed = description?.trim() ?? ''
        if (trimmed !== '')
          item.data.description = trimmed
        else delete item.data.description
      }

      if (item.type === 'addComment' && 'comment' in patch.data)
        item.data.comment = patch.data.comment?.trim() ?? ''
    }

    return true
  }

  function insertItem(input: NewNodeInput, parentId: string): string | null {
    const parent = itemsById.value.get(parentId)
    const name = input.name.trim()
    if (!parent || name === '')
      return null

    const trimmedDescription = input.description?.trim() ?? ''
    const description = trimmedDescription === '' ? undefined : trimmedDescription
    const children = childrenOf(parentId)
    const id = newId()
    const created: FlowItem[] = []
    let childrenParentId: string = id

    if (input.type === 'sendMessage') {
      created.push({ id, parentId: parent.id, type: 'sendMessage', name, data: { payload: [], description } })
    }
    else if (input.type === 'addComment') {
      created.push({ id, parentId: parent.id, type: 'addComment', name, data: { comment: '', description } })
    }
    else {
      const successId = newId()
      const failureId = newId()
      created.push(
        {
          id,
          parentId: parent.id,
          type: 'dateTime',
          name,
          data: {
            times: WEEKDAYS.map(day => ({ day, ...DEFAULT_BUSINESS_HOURS })),
            connectors: [successId, failureId],
            timezone: 'UTC',
            action: 'businessHours',
            description,
          },
        },
        { id: successId, parentId: id, type: 'dateTimeConnector', data: { connectorType: 'success' } },
        { id: failureId, parentId: id, type: 'dateTimeConnector', data: { connectorType: 'failure' } },
      )
      childrenParentId = successId
    }

    for (const child of children) child.parentId = childrenParentId
    items.value.push(...created)

    return id
  }

  function deleteItem(id: string): boolean {
    const item = itemsById.value.get(id)
    if (!item || item.type === 'trigger')
      return false

    const removed = [item]
    if (item.type === 'dateTime') {
      removed.push(...childrenOf(id).filter(child => child.type === 'dateTimeConnector'))
    }

    const removedIds = new Set(removed.map(entry => entry.id.toString()))
    for (const entry of removed) {
      for (const child of childrenOf(entry.id.toString())) {
        if (!removedIds.has(child.id.toString()))
          child.parentId = item.parentId
      }
    }

    for (const entry of removed) {
      if (entry.type === 'sendMessage')
        revokeBlobUrls(attachmentUrls(entry.data.payload))
    }

    items.value = items.value.filter(entry => !removedIds.has(entry.id.toString()))
    return true
  }

  return { items, loaded, itemsById, structureKey, setItems, updateItem, insertItem, deleteItem }
})
