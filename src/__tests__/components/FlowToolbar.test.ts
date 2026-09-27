import userEvent from '@testing-library/user-event'
// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import FlowToolbar from '../../components/FlowToolbar.vue'

function renderToolbar(canUndo: boolean) {
  const view = render(FlowToolbar, { props: { canUndo } })
  return { view, user: userEvent.setup() }
}

const button = (name: string) => screen.getByRole('button', { name })

describe('flowToolbar', () => {
  it('is a labelled toolbar with the three actions', () => {
    renderToolbar(true)

    const toolbar = screen.getByRole('toolbar', { name: 'Graph tools' })
    expect(within(toolbar).getAllByRole('button').map(item => item.getAttribute('aria-label')))
      .toEqual(['Undo move', 'Reset layout', 'Fit view'])
  })

  it('shows a visible hint for each button, hidden from screen readers', () => {
    renderToolbar(true)

    const hint = button('Undo move').parentElement!.querySelector('[aria-hidden="true"]:not(i)')
    expect(hint).toHaveTextContent('Undo move')
  })

  it('disables Undo when there is nothing to undo', () => {
    renderToolbar(false)

    expect(button('Undo move')).toBeDisabled()
    expect(button('Reset layout')).toBeEnabled()
  })

  it('emits each action', async () => {
    const { view, user } = renderToolbar(true)

    await user.click(button('Undo move'))
    await user.click(button('Reset layout'))
    await user.click(button('Fit view'))

    expect(view.emitted('undo')).toHaveLength(1)
    expect(view.emitted('reset')).toHaveLength(1)
    expect(view.emitted('fit')).toHaveLength(1)
  })

  it('is a single Tab stop, on the first enabled button', async () => {
    const { user } = renderToolbar(false)

    await user.tab()

    expect(button('Reset layout')).toHaveFocus()
    expect(button('Reset layout')).toHaveAttribute('tabindex', '0')
    expect(button('Fit view')).toHaveAttribute('tabindex', '-1')
  })

  it('moves between buttons with the arrow keys, wrapping around', async () => {
    const { user } = renderToolbar(true)
    await user.tab()
    expect(button('Undo move')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(button('Reset layout')).toHaveFocus()

    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(button('Undo move')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(button('Fit view')).toHaveFocus()
    expect(button('Fit view')).toHaveAttribute('tabindex', '0')
  })

  it('jumps to the first and last buttons with Home and End', async () => {
    const { user } = renderToolbar(true)
    await user.tab()

    await user.keyboard('{End}')
    expect(button('Fit view')).toHaveFocus()

    await user.keyboard('{Home}')
    expect(button('Undo move')).toHaveFocus()
  })

  it('skips a disabled Undo when moving with the arrow keys', async () => {
    const { user } = renderToolbar(false)
    await user.tab()

    await user.keyboard('{ArrowLeft}')

    expect(button('Fit view')).toHaveFocus()
  })

  it('moves the Tab stop off Undo when it becomes disabled', async () => {
    const { view } = renderToolbar(true)
    expect(button('Undo move')).toHaveAttribute('tabindex', '0')

    await view.rerender({ canUndo: false })

    expect(button('Reset layout')).toHaveAttribute('tabindex', '0')
  })
})
