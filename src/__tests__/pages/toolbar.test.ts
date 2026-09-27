// @vitest-environment happy-dom
import { screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderIndexPage } from '../helpers/indexPage'

function pressUndo(target: EventTarget = document.body, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

describe('graph toolbar', () => {
  it('shows the toolbar with Undo disabled until a node is moved', async () => {
    await renderIndexPage()

    const toolbar = screen.getByRole('toolbar', { name: 'Graph tools' })
    expect(within(toolbar).getByRole('button', { name: 'Undo move' })).toBeDisabled()
    expect(within(toolbar).getByRole('button', { name: 'Reset layout' })).toBeEnabled()
    expect(within(toolbar).getByRole('button', { name: 'Fit view' })).toBeEnabled()
  })
})

describe('undo shortcut', () => {
  it('handles Cmd/Ctrl+Z when the drawer is closed', async () => {
    await renderIndexPage()

    expect(pressUndo().defaultPrevented).toBe(true)
    expect(pressUndo(document.body, { metaKey: false, ctrlKey: true }).defaultPrevented).toBe(true)
  })

  it('leaves Cmd/Ctrl+Z alone while the drawer is open', async () => {
    await renderIndexPage('/?node=b0653a')

    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(pressUndo().defaultPrevented).toBe(false)
  })

  it('leaves Cmd/Ctrl+Z alone while typing in a field', async () => {
    await renderIndexPage()
    const input = document.createElement('input')
    document.body.append(input)

    expect(pressUndo(input).defaultPrevented).toBe(false)
    input.remove()
  })

  it('ignores Shift+Cmd+Z, which is usually redo', async () => {
    await renderIndexPage()

    expect(pressUndo(document.body, { shiftKey: true }).defaultPrevented).toBe(false)
  })
})
