import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import Drawer from '../../components/Drawer.vue'

function renderDrawer(props: { open: boolean, title?: string, describedby?: string }, body = 'Body') {
  return render(Drawer, { props, slots: { default: `<p>${body}</p>` } })
}

describe('drawer', () => {
  it('renders nothing while closed', () => {
    renderDrawer({ open: false })

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('is named by its title and shows its content while open', () => {
    renderDrawer({ open: true, title: 'Business Hours' })

    expect(screen.getByRole('complementary', { name: 'Business Hours' })).toHaveTextContent('Body')
  })

  it('links a description when given one', () => {
    renderDrawer({ open: true, title: 'New node', describedby: 'context' }, '<span id="context">Adding after Trigger</span>')

    expect(screen.getByRole('complementary')).toHaveAccessibleDescription('Adding after Trigger')
  })

  it('emits close from the labelled close button', async () => {
    const view = renderDrawer({ open: true })

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(view.emitted('close')).toHaveLength(1)
  })

  it('emits close on Escape inside the drawer', async () => {
    const view = renderDrawer({ open: true })
    screen.getByRole('button', { name: 'Close' }).focus()

    await userEvent.keyboard('{Escape}')

    expect(view.emitted('close')).toHaveLength(1)
  })

  it('ignores Escape pressed outside the drawer', async () => {
    const view = renderDrawer({ open: true })

    await userEvent.keyboard('{Escape}')

    expect(view.emitted('close')).toBeUndefined()
  })

  it('moves focus to the panel when its focus() is called', async () => {
    const Host = defineComponent(() => {
      const drawer = ref<InstanceType<typeof Drawer> | null>(null)
      return () => [
        h('button', { onClick: () => { drawer.value?.focus() } }, 'Focus drawer'),
        h(Drawer, { ref: drawer, open: true, title: 'Business Hours' }),
      ]
    })
    render(Host)

    await userEvent.click(screen.getByRole('button', { name: 'Focus drawer' }))

    expect(screen.getByRole('complementary')).toHaveFocus()
  })
})
