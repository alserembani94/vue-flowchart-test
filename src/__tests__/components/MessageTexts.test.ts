// @vitest-environment happy-dom
import type { MessageText } from '../../composables/useMessageDraft'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import MessageTexts from '../../components/MessageTexts.vue'

function renderList(initial: string[]) {
  let nextKey = 0
  const texts = ref<MessageText[]>(initial.map(value => ({ key: `t${nextKey++}`, value })))
  const Host = defineComponent(() => () => h(MessageTexts, {
    texts: texts.value,
    onChange: (key: string, value: string) => {
      texts.value = texts.value.map(text => (text.key === key ? { key, value } : text))
    },
    onAdd: () => {
      texts.value = [...texts.value, { key: `t${nextKey++}`, value: '' }]
    },
    onRemove: (key: string) => {
      texts.value = texts.value.filter(text => text.key !== key)
    },
  }))
  render(Host)
  return { user: userEvent.setup(), texts }
}

const field = (n: number) => screen.getByRole('textbox', { name: `Message ${n}` })
const addButton = () => screen.getByRole('button', { name: /add message/i })

describe('messageTexts', () => {
  it('shows each text in a labelled field', () => {
    renderList(['Hi', 'Bye'])

    expect(field(1)).toHaveValue('Hi')
    expect(field(2)).toHaveValue('Bye')
  })

  it('emits changes as you type', async () => {
    const { user, texts } = renderList(['Hi'])

    await user.type(field(1), ' there')

    expect(texts.value[0].value).toBe('Hi there')
  })

  it('adds an empty field at the end and focuses it', async () => {
    const { user } = renderList(['Hi'])

    await user.click(addButton())

    expect(field(2)).toHaveValue('')
    expect(field(2)).toHaveFocus()
  })

  it('shows an error on an empty text right away and disables Add', async () => {
    const { user } = renderList(['Hi'])

    await user.click(addButton())

    expect(field(2)).toHaveAttribute('aria-invalid', 'true')
    expect(field(2)).toHaveAccessibleDescription('Message can\'t be empty')
    expect(addButton()).toBeDisabled()
    expect(addButton()).toHaveAccessibleDescription('Fill in the empty message before adding another.')
  })

  it('enables Add again once the empty text is filled in', async () => {
    const { user } = renderList(['Hi'])
    await user.click(addButton())

    await user.type(field(2), 'More')

    expect(field(2)).toHaveAttribute('aria-invalid', 'false')
    expect(addButton()).toBeEnabled()
  })

  it('removes a text and focuses the next field', async () => {
    const { user } = renderList(['One', 'Two', 'Three'])

    await user.click(screen.getByRole('button', { name: 'Remove message 1' }))

    expect(field(1)).toHaveValue('Two')
    expect(field(1)).toHaveFocus()
  })

  it('focuses the previous field when the last text is removed', async () => {
    const { user } = renderList(['One', 'Two'])

    await user.click(screen.getByRole('button', { name: 'Remove message 2' }))

    expect(field(1)).toHaveFocus()
  })

  it('focuses Add when no texts are left', async () => {
    const { user } = renderList(['Only'])

    await user.click(screen.getByRole('button', { name: 'Remove message 1' }))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(addButton()).toHaveFocus()
  })

  describe('visible height', () => {
    const original = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'scrollHeight')

    function stubContentHeight(px: number) {
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', { configurable: true, get: () => px })
    }

    afterEach(() => {
      if (original)
        Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', original)
      else
        Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight')
    })

    it('grows with short texts without scrolling', () => {
      stubContentHeight(40)
      renderList(['Two\nlines'])

      expect(field(1).style.height).toBe('40px')
      expect(field(1).style.overflowY).toBe('hidden')
    })

    it('stops growing at 5 lines and scrolls the rest', () => {
      stubContentHeight(300)
      renderList(['1\n2\n3\n4\n5\n6\n7\n8'])

      expect(field(1).style.height).toBe('100px')
      expect(field(1).style.overflowY).toBe('auto')
    })

    it('only limits the display, not how much can be typed', () => {
      renderList(['Hi'])

      expect(field(1)).not.toHaveAttribute('maxlength')
    })
  })
})
