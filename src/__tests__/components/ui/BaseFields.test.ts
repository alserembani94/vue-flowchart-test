import userEvent from '@testing-library/user-event'
// @vitest-environment happy-dom
import { render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import BaseInput from '../../../components/ui/BaseInput.vue'
import BaseSelect from '../../../components/ui/BaseSelect.vue'
import BaseTextarea from '../../../components/ui/BaseTextarea.vue'

function withModel(component: typeof BaseInput | typeof BaseTextarea, initial: string, props: Record<string, unknown> = {}) {
  const value = ref(initial)
  const Host = defineComponent(() => () => h(component, {
    'aria-label': 'Field',
    'modelValue': value.value,
    'onUpdate:modelValue': (next: string) => {
      value.value = next
    },
    ...props,
  }))
  render(Host)
  return { value, field: () => screen.getByRole('textbox', { name: 'Field' }) }
}

describe('baseInput', () => {
  it('binds its value both ways', async () => {
    const { value, field } = withModel(BaseInput, 'Hi')

    await userEvent.type(field(), ' there')

    expect(field()).toHaveValue('Hi there')
    expect(value.value).toBe('Hi there')
  })

  it('marks itself invalid', () => {
    const { field } = withModel(BaseInput, '', { invalid: true })

    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })

  it('is valid by default and passes attributes to the input', () => {
    const { field } = withModel(BaseInput, '', { name: 'title' })

    expect(field()).toHaveAttribute('aria-invalid', 'false')
    expect(field()).toHaveAttribute('name', 'title')
  })
})

describe('baseTextarea', () => {
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

  it('binds its value both ways', async () => {
    const { value, field } = withModel(BaseTextarea, '')

    await userEvent.type(field(), 'Note')

    expect(value.value).toBe('Note')
  })

  it('does not resize itself unless asked', () => {
    stubContentHeight(300)
    const { field } = withModel(BaseTextarea, 'Long')

    expect(field().style.height).toBe('')
  })

  it('grows with its content when auto-resizing', () => {
    stubContentHeight(60)
    const { field } = withModel(BaseTextarea, 'Some text', { autoResize: true })

    expect(field().style.height).toBe('60px')
    expect(field().style.overflowY).toBe('hidden')
  })

  it('stops at maxRows and scrolls the rest', () => {
    stubContentHeight(300)
    const { field } = withModel(BaseTextarea, 'Long text', { autoResize: true, maxRows: 3 })

    expect(field().style.height).toBe('60px')
    expect(field().style.overflowY).toBe('auto')
  })
})

describe('baseSelect', () => {
  function renderSelect(props: Record<string, unknown> = {}) {
    const value = ref('')
    const Host = defineComponent(() => () => h(BaseSelect, {
      'aria-label': 'Type',
      'modelValue': value.value,
      'onUpdate:modelValue': (next: string) => {
        value.value = next
      },
      ...props,
    }, () => [h('option', { value: '' }, 'Pick one'), h('option', { value: 'a' }, 'A')]))
    render(Host)
    return { value, select: () => screen.getByRole('combobox', { name: 'Type' }) }
  }

  it('binds the selected option both ways', async () => {
    const { value, select } = renderSelect()

    await userEvent.selectOptions(select(), 'a')

    expect(value.value).toBe('a')
  })

  it('marks itself invalid', () => {
    const { select } = renderSelect({ invalid: true })

    expect(select()).toHaveAttribute('aria-invalid', 'true')
  })
})
