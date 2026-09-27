import type { Ref } from 'vue'
import type { FlowItem, SendMessagePayload } from '../types'
import { computed, ref } from 'vue'

interface DraftPart {
  key: string
  part: SendMessagePayload
}

export interface MessageText {
  key: string
  value: string
}

export interface MessageAttachment {
  key: string
  url: string
}

export interface MessageDraftSaver {
  later: (payload: SendMessagePayload[]) => void
  now: (payload: SendMessagePayload[]) => void
  flush: () => void
}

export function useMessageDraft(item: Ref<FlowItem>, save: MessageDraftSaver) {
  const parts = ref<DraftPart[]>([])
  let nextKey = 0

  const toDraft = (part: SendMessagePayload): DraftPart => ({ key: `part-${nextKey++}`, part: { ...part } })
  const savedPayload = () => (item.value.type === 'sendMessage' ? item.value.data.payload : [])
  const draftPayload = () => parts.value.map(({ part }) => part)

  const texts = computed<MessageText[]>(() =>
    parts.value.flatMap(({ key, part }) => (part.type === 'text' ? [{ key, value: part.text }] : [])),
  )

  const attachments = computed<MessageAttachment[]>(() =>
    parts.value.flatMap(({ key, part }) => (part.type === 'attachment' ? [{ key, url: part.attachment }] : [])),
  )

  const hasEmptyText = computed(() => texts.value.some(text => text.value.trim() === ''))

  function reset() {
    parts.value = savedPayload().map(toDraft)
  }

  function editText(key: string, value: string) {
    const draft = parts.value.find(entry => entry.key === key)
    if (!draft)
      return
    draft.part = { type: 'text', text: value }
    if (!hasEmptyText.value)
      save.later(draftPayload())
  }

  function addText() {
    parts.value.push(toDraft({ type: 'text', text: '' }))
  }

  function removeText(key: string) {
    parts.value = parts.value.filter(entry => entry.key !== key)
    if (!hasEmptyText.value)
      save.now(draftPayload())
  }

  function addAttachments(urls: string[]) {
    const added = urls.map<SendMessagePayload>(url => ({ type: 'attachment', attachment: url }))
    parts.value.push(...added.map(toDraft))

    if (!hasEmptyText.value) {
      save.now(draftPayload())
      return
    }
    save.flush()
    save.now([...savedPayload(), ...added])
  }

  function removeAttachment(key: string) {
    const position = attachments.value.findIndex(attachment => attachment.key === key)
    if (position === -1)
      return
    parts.value = parts.value.filter(entry => entry.key !== key)

    if (!hasEmptyText.value) {
      save.now(draftPayload())
      return
    }
    save.flush()
    let seen = -1
    save.now(savedPayload().filter(part => part.type !== 'attachment' || ++seen !== position))
  }

  return { texts, attachments, hasEmptyText, reset, editText, addText, removeText, addAttachments, removeAttachment }
}
