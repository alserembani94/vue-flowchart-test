import userEvent from '@testing-library/user-event'
// @vitest-environment happy-dom
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import InsertButton from '../../components/InsertButton.vue'

const COLOR = 'var(--color-pink-600)'

function renderButton(active?: boolean) {
  const view = render(InsertButton, { props: { label: 'Add node after Trigger', color: COLOR, active } })
  return { view, button: screen.getByRole('button', { name: 'Add node after Trigger' }) }
}

describe('insertButton', () => {
  it('is a labelled button with a plus icon', () => {
    const { button } = renderButton()

    expect(button.querySelector('i')).toHaveClass('pi', 'pi-plus')
  })

  it('uses the color for the border, icon and focus ring when inactive', () => {
    const { button } = renderButton(false)

    expect(button.style.borderColor).toBe(COLOR)
    expect(button.style.color).toBe(COLOR)
    expect(button.style.getPropertyValue('--tw-ring-color')).toBe(COLOR)
    expect(button.style.backgroundColor).toBe('')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('fills with the color and uses a white icon when active', () => {
    const { button } = renderButton(true)

    expect(button.style.backgroundColor).toBe(COLOR)
    expect(button.style.borderColor).toBe(COLOR)
    expect(button.style.color).toBe('white')
    expect(button.style.getPropertyValue('--tw-ring-color')).toBe(COLOR)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('emits click', async () => {
    const { view, button } = renderButton()

    await userEvent.click(button)

    expect(view.emitted('click')).toHaveLength(1)
  })
})
