import { describe, expect, it } from 'vitest'
import { TIMEZONES } from '../../utils/constants'
import { formatTimezoneLabel, getTimezoneOptions } from '../../utils/timezones'

const WINTER = new Date('2026-01-15T12:00:00Z')
const SUMMER = new Date('2026-07-15T12:00:00Z')

describe('formatTimezoneLabel', () => {
  it('formats UTC with a zero offset', () => {
    expect(formatTimezoneLabel('UTC', 'UTC', WINTER)).toBe('(GMT+00:00) UTC')
  })

  it('formats a zone ahead of UTC', () => {
    expect(formatTimezoneLabel('Asia/Kuala_Lumpur', 'Kuala Lumpur', WINTER)).toBe('(GMT+08:00) Kuala Lumpur')
  })

  it('formats half-hour offsets', () => {
    expect(formatTimezoneLabel('Asia/Kolkata', 'Kolkata', WINTER)).toBe('(GMT+05:30) Kolkata')
  })

  it('follows daylight saving time', () => {
    expect(formatTimezoneLabel('America/New_York', 'New York', WINTER)).toBe('(GMT-05:00) New York')
    expect(formatTimezoneLabel('America/New_York', 'New York', SUMMER)).toBe('(GMT-04:00) New York')
  })
})

describe('getTimezoneOptions', () => {
  it('includes every common timezone, storing the IANA name as the value', () => {
    const options = getTimezoneOptions(WINTER)

    expect(options).toHaveLength(TIMEZONES.length)
    expect(options.find(option => option.value === 'Asia/Kuala_Lumpur')?.label).toBe('(GMT+08:00) Kuala Lumpur')
  })

  it('orders options by offset, west to east', () => {
    const offsets = getTimezoneOptions(WINTER).map(option => option.offsetMinutes)

    expect(offsets).toEqual([...offsets].sort((a, b) => a - b))
    expect(getTimezoneOptions(WINTER)[0]?.value).toBe('Pacific/Honolulu')
  })

  it('reorders when daylight saving time changes an offset', () => {
    const index = (date: Date, zone: string) => getTimezoneOptions(date).findIndex(option => option.value === zone)

    expect(index(WINTER, 'Europe/London')).toBeLessThan(index(WINTER, 'Europe/Paris'))
    expect(getTimezoneOptions(SUMMER).find(option => option.value === 'Europe/London')?.label).toBe('(GMT+01:00) London')
  })
})
