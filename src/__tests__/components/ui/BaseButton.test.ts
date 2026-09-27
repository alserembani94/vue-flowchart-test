import userEvent from '@testing-library/user-event'
// @vitest-environment happy-dom
import { render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import BaseButton from '../../../components/ui/BaseButton.vue'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('baseButton', () => {
  it('is a plain button by default', () => {
    render(BaseButton, { slots: { default: 'Save' } })

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('can be a submit button', () => {
    render(BaseButton, { props: { type: 'submit' }, slots: { default: 'Add' } })

    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('type', 'submit')
  })

  it('applies the chosen variant', () => {
    render(BaseButton, { props: { variant: 'primary' }, slots: { default: 'Add' } })

    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass('bg-gray-900')
  })

  it('shows a leading icon hidden from screen readers', () => {
    render(BaseButton, { props: { icon: 'pi pi-trash' }, slots: { default: 'Delete node' } })

    const button = screen.getByRole('button', { name: 'Delete node' })
    expect(button.querySelector('i')).toHaveClass('pi', 'pi-trash')
    expect(button.querySelector('i')).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the label as the name of an icon-only button', () => {
    render(BaseButton, { props: { iconOnly: true, icon: 'pi pi-times', label: 'Close' }, slots: { default: 'hidden' } })

    const button = screen.getByRole('button', { name: 'Close' })
    expect(button).not.toHaveTextContent('hidden')
  })

  it('warns when an icon-only button has no label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(BaseButton, { props: { iconOnly: true, icon: 'pi pi-times' } })

    expect(warn).toHaveBeenCalledWith('[BaseButton] Icon-only buttons need a label.')
  })

  it('can be disabled', async () => {
    const onClick = vi.fn()
    render(BaseButton, { props: { disabled: true }, attrs: { onClick }, slots: { default: 'Add' } })

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('can be focused through its ref', async () => {
    const Host = defineComponent(() => {
      const button = ref<InstanceType<typeof BaseButton> | null>(null)
      return () => [
        h('button', { onClick: () => { button.value?.focus() } }, 'Focus it'),
        h(BaseButton, { ref: button }, () => 'Target'),
      ]
    })
    render(Host)

    await userEvent.click(screen.getByRole('button', { name: 'Focus it' }))

    expect(screen.getByRole('button', { name: 'Target' })).toHaveFocus()
  })
})
