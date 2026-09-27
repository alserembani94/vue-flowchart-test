import { screen, within } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { emitNodesChange, renderIndexPage } from '../helpers/indexPage'

const BUSINESS_HOURS = 'Date Time: Business Hours'
const WELCOME_MESSAGE = 'Send Message: Welcome Message'

const node = (name: string) => screen.getByRole('group', { name })
const connector = () => screen.getByText('success')
const pane = () => screen.getByTestId('flow-pane')
const drawer = () => screen.queryByRole('complementary')
const drawerHeading = () => within(screen.getByRole('complementary')).getByRole('heading', { level: 2 })
const titleInput = () => screen.getByRole('textbox', { name: 'Title' })

type PageUser = Awaited<ReturnType<typeof renderIndexPage>>['user']

async function pressOn(user: PageUser, name: string, key: string) {
  node(name).focus()
  await user.keyboard(`{${key}}`)
}

describe('selecting nodes', () => {
  it('keeps the drawer closed when nothing is selected', async () => {
    const { nodeQuery } = await renderIndexPage()

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
  })

  it('opens the drawer and writes ?node= when a selectable node is clicked', async () => {
    const { user, nodeQuery } = await renderIndexPage()

    await user.click(node(BUSINESS_HOURS))

    expect(nodeQuery()).toBe('d09c08')
    expect(drawer()).toBeInTheDocument()
  })

  it('opens the drawer when a node is selected with the keyboard', async () => {
    const { user, nodeQuery } = await renderIndexPage()

    await pressOn(user, WELCOME_MESSAGE, 'Enter')

    expect(nodeQuery()).toBe('b0653a')
    expect(titleInput()).toHaveValue('Welcome Message')
  })

  it('swaps the content when another node is clicked while open', async () => {
    const { user, nodeQuery } = await renderIndexPage()

    await user.click(node(BUSINESS_HOURS))
    await user.click(node(WELCOME_MESSAGE))

    expect(nodeQuery()).toBe('b0653a')
    expect(titleInput()).toHaveValue('Welcome Message')
    expect(screen.getByText('Hello there')).toBeInTheDocument()
  })

  it('uses replace, so selecting nodes doesn\'t add history entries', async () => {
    const { user, router } = await renderIndexPage()
    const push = vi.spyOn(router, 'push')
    const replace = vi.spyOn(router, 'replace')

    await user.click(node(BUSINESS_HOURS))
    await user.click(node(WELCOME_MESSAGE))

    expect(push).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledTimes(2)
  })

  it('does not open the drawer for a connector', async () => {
    const { user, nodeQuery } = await renderIndexPage()

    await user.click(connector())

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
  })

  it('closes the drawer when a connector is clicked while open', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await user.click(node(BUSINESS_HOURS))

    await user.click(connector())

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
  })

  it('closes the drawer when Vue Flow deselects the open node', async () => {
    const { nodeQuery } = await renderIndexPage('/?node=d09c08')

    await emitNodesChange([{ id: 'd09c08', type: 'select', selected: false }])

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
  })

  it('ignores the old node being deselected after switching to a new one', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await user.click(node(BUSINESS_HOURS))
    await user.click(node(WELCOME_MESSAGE))

    await emitNodesChange([{ id: 'd09c08', type: 'select', selected: false }])

    expect(nodeQuery()).toBe('b0653a')
    expect(titleInput()).toHaveValue('Welcome Message')
  })
})

describe('node content', () => {
  it('shows each card\'s title and description from the store', async () => {
    await renderIndexPage()

    expect(within(node(BUSINESS_HOURS)).getByText('Business Hours')).toBeInTheDocument()
    expect(within(node(BUSINESS_HOURS)).getByText('Routes by office hours')).toBeInTheDocument()
    expect(within(node(WELCOME_MESSAGE)).getByText('Welcome Message')).toBeInTheDocument()
  })

  it('shows the node\'s type in the drawer header and its details below', async () => {
    await renderIndexPage('/?node=d09c08')

    expect(drawerHeading()).toHaveTextContent('Date Time')
    expect(titleInput()).toHaveValue('Business Hours')
  })

  it('keeps the store\'s items when the query data changes again', async () => {
    const { queryClient } = await renderIndexPage()

    queryClient.setQueryData(['processes'], [])
    await flushPromises()

    expect(node(BUSINESS_HOURS)).toBeInTheDocument()
  })
})

describe('closing the drawer', () => {
  it('closes on pane click without moving focus to the node', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await pressOn(user, BUSINESS_HOURS, 'Enter')

    await user.click(pane())

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
    expect(node(BUSINESS_HOURS)).not.toHaveFocus()
  })

  it('closes with the close button and returns focus to the node', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await pressOn(user, BUSINESS_HOURS, 'Enter')

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
    expect(node(BUSINESS_HOURS)).toHaveFocus()
  })

  it('closes with Escape inside the drawer and returns focus to the node', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await pressOn(user, BUSINESS_HOURS, 'Enter')

    await user.keyboard('{Escape}')

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
    expect(node(BUSINESS_HOURS)).toHaveFocus()
  })

  it('keeps other query params when closing', async () => {
    const { user, router } = await renderIndexPage('/?node=d09c08&foo=bar')

    await user.click(pane())

    expect(router.currentRoute.value.query).toEqual({ foo: 'bar' })
  })
})

describe('focus', () => {
  it('moves focus into the drawer when it opens', async () => {
    const { user } = await renderIndexPage()

    await pressOn(user, BUSINESS_HOURS, 'Enter')

    expect(drawer()).toHaveFocus()
  })

  it('moves focus into the drawer when switching to another node', async () => {
    const { user } = await renderIndexPage()
    await pressOn(user, BUSINESS_HOURS, 'Enter')

    await pressOn(user, WELCOME_MESSAGE, 'Enter')

    expect(drawer()).toHaveFocus()
  })

  it('closes on Escape from a node and keeps focus there, before Vue Flow sees the key', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await pressOn(user, BUSINESS_HOURS, 'Enter')
    const vueFlowKeydown = vi.fn()
    node(BUSINESS_HOURS).addEventListener('keydown', vueFlowKeydown)

    await pressOn(user, BUSINESS_HOURS, 'Escape')

    expect(vueFlowKeydown).not.toHaveBeenCalled()
    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
    expect(node(BUSINESS_HOURS)).toHaveFocus()
  })

  it('keeps Escape from Vue Flow after closing, so a second press doesn\'t reselect the node', async () => {
    const { user, nodeQuery } = await renderIndexPage()
    await pressOn(user, BUSINESS_HOURS, 'Enter')
    await user.keyboard('{Escape}')

    await user.keyboard('{Escape}')

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
    expect(node(BUSINESS_HOURS)).toHaveFocus()
  })
})

describe('deep links', () => {
  it('opens the drawer for a selectable node in the URL', async () => {
    const { nodeQuery } = await renderIndexPage('/?node=b0653a')

    expect(nodeQuery()).toBe('b0653a')
    expect(titleInput()).toHaveValue('Welcome Message')
  })

  it('moves focus into the drawer once the data has loaded', async () => {
    await renderIndexPage('/?node=b0653a')

    expect(drawer()).toHaveFocus()
  })

  it('removes a connector id from the URL and keeps the drawer closed', async () => {
    const { nodeQuery } = await renderIndexPage('/?node=161f52')

    expect(drawer()).not.toBeInTheDocument()
    expect(nodeQuery()).toBeUndefined()
  })

  it('removes an unknown id from the URL', async () => {
    const { router } = await renderIndexPage('/?node=does-not-exist&foo=bar')

    expect(drawer()).not.toBeInTheDocument()
    expect(router.currentRoute.value.query).toEqual({ foo: 'bar' })
  })

  it('ignores a repeated ?node= param', async () => {
    await renderIndexPage('/?node=d09c08&node=b0653a')

    expect(drawer()).not.toBeInTheDocument()
  })
})
