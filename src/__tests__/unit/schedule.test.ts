import { describe, expect, it } from 'vitest'
import { getScheduleErrors, isValidSchedule } from '../../utils/schedule'

describe('getScheduleErrors', () => {
  it('accepts an end time after the start time', () => {
    expect(getScheduleErrors({ startTime: '09:00', endTime: '17:00' })).toEqual([])
  })

  it('accepts equal start and end times', () => {
    expect(getScheduleErrors({ startTime: '09:00', endTime: '09:00' })).toEqual([])
  })

  it('rejects an end time before the start time', () => {
    expect(getScheduleErrors({ startTime: '17:00', endTime: '09:00' })).toEqual(['endBeforeStart'])
  })

  it('requires both times', () => {
    expect(getScheduleErrors({ startTime: '', endTime: '17:00' })).toEqual(['startRequired'])
    expect(getScheduleErrors({ startTime: '09:00', endTime: '' })).toEqual(['endRequired'])
    expect(getScheduleErrors({ startTime: '', endTime: '' })).toEqual(['startRequired', 'endRequired'])
  })

  it('rejects malformed times', () => {
    expect(getScheduleErrors({ startTime: '25:00', endTime: '17:00' })).toEqual(['startRequired'])
  })
})

describe('isValidSchedule', () => {
  it('is valid only when every day is valid', () => {
    expect(isValidSchedule([{ day: 'mon', startTime: '09:00', endTime: '17:00' }])).toBe(true)
    expect(isValidSchedule([
      { day: 'mon', startTime: '09:00', endTime: '17:00' },
      { day: 'tue', startTime: '18:00', endTime: '17:00' },
    ])).toBe(false)
  })
})
