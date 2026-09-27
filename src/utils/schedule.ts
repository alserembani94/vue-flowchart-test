import type { ScheduleTime } from '../types'

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export type ScheduleError = 'startRequired' | 'endRequired' | 'endBeforeStart'

export function getScheduleErrors({ startTime, endTime }: Pick<ScheduleTime, 'startTime' | 'endTime'>): ScheduleError[] {
  const errors: ScheduleError[] = []
  if (!TIME_PATTERN.test(startTime))
    errors.push('startRequired')
  if (!TIME_PATTERN.test(endTime))
    errors.push('endRequired')
  if (errors.length === 0 && endTime < startTime)
    errors.push('endBeforeStart')
  return errors
}

export function isValidSchedule(times: ScheduleTime[]): boolean {
  return times.every(time => getScheduleErrors(time).length === 0)
}
