// @vitest-environment happy-dom
import type { MessageAttachment } from '../../composables/useMessageDraft'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import AttachmentTiles from '../../components/AttachmentTiles.vue'
import { MAX_ATTACHMENT_BYTES } from '../../utils/constants'

let blobCount = 0

beforeEach(() => {
  blobCount = 0
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:upload-${++blobCount}`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderTiles(initial: string[]) {
  let nextKey = 0
  const attachments = ref<MessageAttachment[]>(initial.map(url => ({ key: `a${nextKey++}`, url })))
  const added: string[][] = []
  const Host = defineComponent(() => () => h(AttachmentTiles, {
    attachments: attachments.value,
    onAdd: (urls: string[]) => {
      added.push(urls)
      attachments.value = [...attachments.value, ...urls.map(url => ({ key: `a${nextKey++}`, url }))]
    },
    onRemove: (key: string) => {
      attachments.value = attachments.value.filter(attachment => attachment.key !== key)
    },
  }))
  render(Host)
  return { user: userEvent.setup({ applyAccept: false }), attachments, added }
}

function image(name: string, size = 1024) {
  const file = new File(['x'], name, { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}
const upload = () => screen.getByLabelText('Upload images')
const status = () => screen.getByRole('status')

describe('attachmentTiles', () => {
  it('shows each attachment as a tile that removes it', () => {
    renderTiles(['https://example.com/a.png', 'https://example.com/b.png'])

    const tile = screen.getByRole('button', { name: 'Remove attachment 1 of 2' })
    expect(tile.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png')
    expect(screen.getByRole('button', { name: 'Remove attachment 2 of 2' })).toBeInTheDocument()
  })

  it('removes an attachment on click, announces it and focuses the next tile', async () => {
    const { user, attachments } = renderTiles(['a.png', 'b.png'])

    await user.click(screen.getByRole('button', { name: 'Remove attachment 1 of 2' }))

    expect(attachments.value.map(attachment => attachment.url)).toEqual(['b.png'])
    expect(status()).toHaveTextContent('Attachment removed')
    expect(screen.getByRole('button', { name: 'Remove attachment 1 of 1' })).toHaveFocus()
  })

  it('focuses the add tile after removing the last attachment', async () => {
    const { user } = renderTiles(['a.png'])

    await user.click(screen.getByRole('button', { name: 'Remove attachment 1 of 1' }))

    expect(screen.getByRole('button', { name: 'Add attachment' })).toHaveFocus()
  })

  it('opens the file picker from the add tile', async () => {
    const { user } = renderTiles([])
    const click = vi.spyOn(upload(), 'click')

    await user.click(screen.getByRole('button', { name: 'Add attachment' }))

    expect(click).toHaveBeenCalled()
  })

  it('adds several images at once and announces them', async () => {
    const { user, added } = renderTiles([])

    await user.upload(upload(), [image('one.png'), image('two.png')])

    expect(added).toEqual([['blob:upload-1', 'blob:upload-2']])
    expect(screen.getByRole('button', { name: 'Remove attachment 2 of 2' })).toBeInTheDocument()
    expect(status()).toHaveTextContent('2 attachments added')
  })

  it('rejects files that are not images or are over 25 MB, and still adds the valid ones', async () => {
    const { user, added } = renderTiles([])
    const pdf = new File(['x'], 'notes.pdf', { type: 'application/pdf' })

    await user.upload(upload(), [image('ok.png'), pdf, image('huge.png', MAX_ATTACHMENT_BYTES + 1)])

    expect(added).toEqual([['blob:upload-1']])
    expect(screen.getByText('notes.pdf isn\'t an image')).toBeInTheDocument()
    expect(screen.getByText('huge.png is larger than 25 MB')).toBeInTheDocument()
    expect(status()).toHaveTextContent('1 attachment added. notes.pdf isn\'t an image. huge.png is larger than 25 MB')
  })

  it('shows a placeholder for an image that fails to load, which can still be removed', async () => {
    renderTiles(['https://example.com/missing.png'])
    const tile = screen.getByRole('button', { name: 'Remove attachment 1 of 1' })

    await fireEvent.error(tile.querySelector('img')!)

    expect(tile).toHaveTextContent('Image unavailable')
    expect(tile.querySelector('img')).toBeNull()
  })
})
