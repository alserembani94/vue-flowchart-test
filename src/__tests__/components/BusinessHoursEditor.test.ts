// @vitest-environment happy-dom
import type { ScheduleTime } from '../../types'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import BusinessHoursEditor from '../../components/BusinessHoursEditor.vue'

const TIMES: ScheduleTime[] = [
  { day: 'mon', startTime: '09:00', endTime: '17:00' },
  { day: 'tue', startTime: '10:00', endTime: '18:00' },
]

function renderEditor(timezone = 'UTC') {
  return render(BusinessHoursEditor, { props: { timezone, times: TIMES } })
}

const time = (label: string) => screen.getByLabelText(label)

describe('businessHoursEditor', () => {
  it('shows the timezone as a dropdown with GMT offsets', () => {
    renderEditor('UTC')

    const select = screen.getByRole('combobox', { name: 'Timezone' })
    expect(select).toHaveValue('UTC')
    expect(screen.getByRole('option', { name: '(GMT+00:00) UTC' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '(GMT+09:00) Tokyo' })).toBeInTheDocument()
  })

  it('emits a new timezone', async () => {
    const view = renderEditor()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Timezone' }), 'Asia/Tokyo')

    expect(view.emitted('update:timezone')).toEqual([['Asia/Tokyo']])
  })

  it('shows each day with editable start and end times', () => {
    renderEditor()

    expect(screen.getByRole('rowheader', { name: 'Monday' })).toBeInTheDocument()
    expect(time('Monday start time')).toHaveValue('09:00')
    expect(time('Monday end time')).toHaveValue('17:00')
    expect(time('Tuesday start time')).toHaveAttribute('type', 'time')
  })

  it('emits the whole schedule when a time changes', async () => {
    const view = renderEditor()

    await fireEvent.update(time('Monday end time'), '18:30')

    expect(view.emitted('update:times')).toEqual([[[
      { day: 'mon', startTime: '09:00', endTime: '18:30' },
      { day: 'tue', startTime: '10:00', endTime: '18:00' },
    ]]])
  })

  it('allows equal start and end times', async () => {
    const view = renderEditor()

    await fireEvent.update(time('Monday end time'), '09:00')

    expect(time('Monday end time')).toHaveAttribute('aria-invalid', 'false')
    expect(view.emitted('update:times')).toHaveLength(1)
  })

  it('shows an error and emits nothing when the end is before the start', async () => {
    const view = renderEditor()

    await fireEvent.update(time('Monday end time'), '08:00')

    expect(time('Monday end time')).toHaveAttribute('aria-invalid', 'true')
    expect(time('Monday end time')).toHaveAccessibleDescription('End time can\'t be before start time')
    expect(view.emitted('update:times')).toBeUndefined()
  })

  it('shows an error and emits nothing when a time is cleared', async () => {
    const view = renderEditor()

    await fireEvent.update(time('Monday start time'), '')

    expect(time('Monday start time')).toHaveAccessibleDescription('Start time is required')
    expect(view.emitted('update:times')).toBeUndefined()
  })

  it('lets you fix a row across both fields before checking it', async () => {
    const view = renderEditor()

    await fireEvent.update(time('Monday start time'), '18:00')
    await fireEvent.focusOut(time('Monday start time'), { relatedTarget: time('Monday end time') })
    await fireEvent.update(time('Monday end time'), '20:00')

    expect(time('Monday start time')).toHaveValue('18:00')
    expect(view.emitted('update:times')).toEqual([[[
      { day: 'mon', startTime: '18:00', endTime: '20:00' },
      { day: 'tue', startTime: '10:00', endTime: '18:00' },
    ]]])
  })

  it('restores the last valid times when focus leaves an invalid row', async () => {
    const view = renderEditor()
    await fireEvent.update(time('Monday end time'), '18:30')
    await fireEvent.update(time('Monday start time'), '')

    await fireEvent.focusOut(time('Monday start time'), { relatedTarget: null })

    expect(time('Monday start time')).toHaveValue('09:00')
    expect(time('Monday end time')).toHaveValue('18:30')
    expect(time('Monday start time')).toHaveAttribute('aria-invalid', 'false')
    expect(view.emitted('commit')).toHaveLength(1)
  })

  it('asks to save when focus leaves a row', async () => {
    const view = renderEditor()

    await fireEvent.focusOut(time('Tuesday end time'), { relatedTarget: null })

    expect(view.emitted('commit')).toHaveLength(1)
  })
})
