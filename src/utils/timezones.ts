import { TIMEZONES } from './constants'

export interface TimezoneOption {
  value: string
  label: string
  offsetMinutes: number
}

export function getTimezoneOffset(zone: string, date: Date): string {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find(part => part.type === 'timeZoneName')
    ?.value ?? 'GMT'
  return name === 'GMT' ? 'GMT+00:00' : name
}

function toMinutes(offset: string): number {
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offset)
  if (!match)
    return 0
  const [, sign, hours, minutes] = match
  return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes))
}

export function formatTimezoneLabel(zone: string, name: string, date: Date): string {
  return `(${getTimezoneOffset(zone, date)}) ${name}`
}

export function getTimezoneOptions(date: Date = new Date()): TimezoneOption[] {
  return TIMEZONES
    .map(({ zone, name }) => {
      const offset = getTimezoneOffset(zone, date)
      return { value: zone, label: `(${offset}) ${name}`, offsetMinutes: toMinutes(offset) }
    })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label))
}
