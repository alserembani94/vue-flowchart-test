import type { FlowItem, SendMessagePayload } from '../../types'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMessageDraft } from '../../composables/useMessageDraft'

function setup(payload: SendMessagePayload[]) {
  const item = ref<FlowItem>({ id: 'm1', parentId: '1', type: 'sendMessage', name: 'Message', data: { payload } })
  const save = { later: vi.fn(), now: vi.fn(), flush: vi.fn() }
  const draft = useMessageDraft(item, save)
  draft.reset()
  return { item, save, draft }
}

const text = (value: string): SendMessagePayload => ({ type: 'text', text: value })
const image = (url: string): SendMessagePayload => ({ type: 'attachment', attachment: url })

describe('useMessageDraft', () => {
  it('splits the payload into texts and attachments, keeping their order', () => {
    const { draft } = setup([text('Hi'), image('a.png'), text('Bye')])

    expect(draft.texts.value.map(entry => entry.value)).toEqual(['Hi', 'Bye'])
    expect(draft.attachments.value.map(entry => entry.url)).toEqual(['a.png'])
  })

  it('saves text edits later, as the whole payload in order', () => {
    const { draft, save } = setup([text('Hi'), image('a.png')])

    draft.editText(draft.texts.value[0].key, 'Hello')

    expect(save.later).toHaveBeenCalledWith([text('Hello'), image('a.png')])
  })

  it('adds a new text at the end without saving it while empty', () => {
    const { draft, save } = setup([text('Hi')])

    draft.addText()

    expect(draft.texts.value.map(entry => entry.value)).toEqual(['Hi', ''])
    expect(draft.hasEmptyText.value).toBe(true)
    expect(save.later).not.toHaveBeenCalled()
    expect(save.now).not.toHaveBeenCalled()
  })

  it('holds back text changes while a text is empty', () => {
    const { draft, save } = setup([text('Hi'), text('Bye')])
    draft.addText()

    draft.editText(draft.texts.value[0].key, 'Hello')
    draft.removeText(draft.texts.value[1].key)

    expect(save.later).not.toHaveBeenCalled()
    expect(save.now).not.toHaveBeenCalled()
  })

  it('saves everything once the empty text is filled in', () => {
    const { draft, save } = setup([text('Hi')])
    draft.addText()

    draft.editText(draft.texts.value[1].key, 'New')

    expect(save.later).toHaveBeenCalledWith([text('Hi'), text('New')])
  })

  it('saves immediately when a text is removed', () => {
    const { draft, save } = setup([text('Hi'), text('Bye')])

    draft.removeText(draft.texts.value[0].key)

    expect(save.now).toHaveBeenCalledWith([text('Bye')])
  })

  it('saves added attachments immediately at the end of the payload', () => {
    const { draft, save } = setup([image('a.png'), text('Hi')])

    draft.addAttachments(['b.png', 'c.png'])

    expect(save.now).toHaveBeenCalledWith([image('a.png'), text('Hi'), image('b.png'), image('c.png')])
  })

  it('saves removed attachments immediately', () => {
    const { draft, save } = setup([image('a.png'), text('Hi'), image('b.png')])

    draft.removeAttachment(draft.attachments.value[0].key)

    expect(save.now).toHaveBeenCalledWith([text('Hi'), image('b.png')])
  })

  it('saves attachment changes on top of the saved texts while a text is empty', () => {
    const { draft, save } = setup([text('Hi'), image('a.png')])
    draft.addText()
    draft.editText(draft.texts.value[0].key, 'Held back')

    draft.addAttachments(['b.png'])

    expect(save.flush).toHaveBeenCalled()
    expect(save.now).toHaveBeenLastCalledWith([text('Hi'), image('a.png'), image('b.png')])
  })

  it('removes the right saved attachment while a text is empty', () => {
    const { draft, save } = setup([image('a.png'), text('Hi'), image('b.png')])
    draft.addText()

    draft.removeAttachment(draft.attachments.value[1].key)

    expect(save.now).toHaveBeenLastCalledWith([image('a.png'), text('Hi')])
  })

  it('resets to the saved payload', () => {
    const { draft } = setup([text('Hi')])
    draft.addText()

    draft.reset()

    expect(draft.texts.value.map(entry => entry.value)).toEqual(['Hi'])
    expect(draft.hasEmptyText.value).toBe(false)
  })
})
