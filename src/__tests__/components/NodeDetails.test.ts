import type { FlowItem } from '../../types'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NodeDetails from '../../components/NodeDetails.vue'
import { INPUT_DEBOUNCE_MS } from '../../utils/constants'
import { flowItems } from '../fixtures/flowItems'

const [trigger, dateTime, , message] = structuredClone(flowItems) as [FlowItem, FlowItem, FlowItem, FlowItem]

const comment: FlowItem = {
  id: 'c1',
  parentId: 'b0653a',
  type: 'addComment',
  name: 'Note',
  data: { comment: 'Off hours message' },
}

const messageWithAttachment: FlowItem = {
  id: 'b0653a',
  parentId: '161f52',
  type: 'sendMessage',
  name: 'Welcome Message',
  data: {
    payload: [
      { type: 'text', text: 'Hello there' },
      { type: 'attachment', attachment: 'https://example.com/image.jpg' },
    ],
  },
}

let user: ReturnType<typeof userEvent.setup>

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
})

afterEach(() => {
  vi.useRealTimers()
})

const renderDetails = (item: FlowItem) => render(NodeDetails, { props: { item } })
const titleInput = () => screen.getByRole('textbox', { name: 'Title' })
const descriptionInput = () => screen.getByRole('textbox', { name: 'Description (optional)' })

describe('content by type', () => {
  it('shows the trigger\'s settings, without title, description or delete', () => {
    renderDetails(trigger)

    expect(screen.getByText('Conversation Opened')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Title' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows message texts as editable fields and attachments as tiles', () => {
    renderDetails(messageWithAttachment)

    expect(screen.getByRole('textbox', { name: 'Message 1' })).toHaveValue('Hello there')
    expect(screen.getByRole('button', { name: 'Remove attachment 1 of 1' }).querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/image.jpg',
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows the comment in an editable field', () => {
    renderDetails(comment)

    expect(screen.getByRole('textbox', { name: 'Comment (optional)' })).toHaveValue('Off hours message')
  })

  it('shows the business hours editor without the action or connectors', () => {
    renderDetails(dateTime)

    expect(screen.getByRole('combobox', { name: 'Timezone' })).toHaveValue('UTC')
    expect(screen.getByLabelText('Monday start time')).toHaveValue('09:00')
    expect(screen.queryByText('businessHours')).not.toBeInTheDocument()
    expect(screen.queryByText('Connectors')).not.toBeInTheDocument()
    expect(screen.queryByText('161f52')).not.toBeInTheDocument()
  })

  it('fills the title and description inputs', () => {
    renderDetails(dateTime)

    expect(titleInput()).toHaveValue('Business Hours')
    expect(descriptionInput()).toHaveValue('Routes by office hours')
  })

  it('leaves the description input empty when there is none', () => {
    renderDetails(message)

    expect(descriptionInput()).toHaveValue('')
  })
})

describe('editing', () => {
  it('emits the title only after the debounce', async () => {
    const view = renderDetails(message)

    await user.clear(titleInput())
    await user.type(titleInput(), 'Hello')
    expect(view.emitted('update')).toBeUndefined()

    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['b0653a', { name: 'Hello', data: undefined }]])
  })

  it('emits the description after the debounce', async () => {
    const view = renderDetails(message)

    await user.type(descriptionInput(), 'Greets')
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['b0653a', { data: { description: 'Greets' } }]])
  })

  it('shows an error for an empty title, emits nothing and restores the title on blur', async () => {
    const view = renderDetails(message)

    await user.clear(titleInput())
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(titleInput()).toHaveAttribute('aria-invalid', 'true')
    expect(titleInput()).toHaveAccessibleDescription('Title is required')
    expect(view.emitted('update')).toBeUndefined()

    await user.tab()

    expect(titleInput()).toHaveValue('Welcome Message')
    expect(titleInput()).toHaveAttribute('aria-invalid', 'false')
  })

  it('sends a pending edit to the previous node when the item changes', async () => {
    const view = renderDetails(message)

    await user.clear(titleInput())
    await user.type(titleInput(), 'Renamed')
    await view.rerender({ item: dateTime })

    expect(view.emitted('update')).toEqual([['b0653a', { name: 'Renamed', data: undefined }]])
    expect(titleInput()).toHaveValue('Business Hours')
  })

  it('sends a pending edit when unmounted', async () => {
    const view = renderDetails(message)

    await user.type(descriptionInput(), 'Bye')
    view.unmount()

    expect(view.emitted('update')).toEqual([['b0653a', { data: { description: 'Bye' } }]])
  })
})

describe('editing the comment', () => {
  const commentInput = () => screen.getByRole('textbox', { name: 'Comment (optional)' })

  it('emits the comment after the debounce', async () => {
    const view = renderDetails(comment)

    await user.clear(commentInput())
    await user.type(commentInput(), 'Call back tomorrow')
    expect(view.emitted('update')).toBeUndefined()

    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['c1', { data: { comment: 'Call back tomorrow' } }]])
  })

  it('emits an empty comment when it is cleared', async () => {
    const view = renderDetails(comment)

    await user.clear(commentInput())
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['c1', { data: { comment: '' } }]])
  })

  it('shows the comment field only for comment nodes', () => {
    renderDetails(message)

    expect(screen.queryByRole('textbox', { name: 'Comment (optional)' })).not.toBeInTheDocument()
  })
})

describe('editing a message', () => {
  it('emits the whole payload after the debounce when a text changes', async () => {
    const view = renderDetails(messageWithAttachment)
    const field = screen.getByRole('textbox', { name: 'Message 1' })

    await user.clear(field)
    await user.type(field, 'Hi')
    expect(view.emitted('update')).toBeUndefined()

    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['b0653a', { data: { payload: [
      { type: 'text', text: 'Hi' },
      { type: 'attachment', attachment: 'https://example.com/image.jpg' },
    ] } }]])
  })

  it('emits uploaded images straight away, at the end of the payload', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:new')
    const view = renderDetails(message)

    await user.upload(screen.getByLabelText('Upload images'), new File(['x'], 'new.png', { type: 'image/png' }))

    expect(view.emitted('update')).toEqual([['b0653a', { data: { payload: [
      { type: 'text', text: 'Hello there' },
      { type: 'attachment', attachment: 'blob:new' },
    ] } }]])
  })
})

describe('editing business hours', () => {
  it('emits a new timezone straight away', async () => {
    const view = renderDetails(dateTime)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Timezone' }), 'Asia/Tokyo')

    expect(view.emitted('update')).toEqual([['d09c08', { data: { timezone: 'Asia/Tokyo' } }]])
  })

  it('emits time changes after the debounce', async () => {
    const view = renderDetails(dateTime)

    await fireEvent.update(screen.getByLabelText('Monday end time'), '18:00')
    expect(view.emitted('update')).toBeUndefined()

    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['d09c08', { data: { times: [{ day: 'mon', startTime: '09:00', endTime: '18:00' }] } }]])
  })

  it('saves a pending time change when focus leaves the row', async () => {
    const view = renderDetails(dateTime)

    await fireEvent.update(screen.getByLabelText('Monday end time'), '18:00')
    await fireEvent.focusOut(screen.getByLabelText('Monday end time'), { relatedTarget: null })

    expect(view.emitted('update')).toHaveLength(1)
  })
})

describe('deleting', () => {
  it('asks for confirmation and moves focus to Cancel', async () => {
    const view = renderDetails(message)

    await user.click(screen.getByRole('button', { name: 'Delete node' }))

    expect(screen.getByRole('group', { name: /delete this node/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(view.emitted('delete')).toBeUndefined()
  })

  it('goes back on Cancel and refocuses the delete button', async () => {
    renderDetails(message)
    await user.click(screen.getByRole('button', { name: 'Delete node' }))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('group', { name: /delete this node/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete node' })).toHaveFocus()
  })

  it('emits delete on confirm, after an edit in progress was saved on blur', async () => {
    const view = renderDetails(message)
    await user.type(descriptionInput(), 'Last words')
    await user.click(screen.getByRole('button', { name: 'Delete node' }))

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS)

    expect(view.emitted('update')).toEqual([['b0653a', { data: { description: 'Last words' } }]])
    expect(view.emitted('delete')).toEqual([['b0653a']])
  })
})
