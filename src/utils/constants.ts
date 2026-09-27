export const INPUT_DEBOUNCE_MS = 300

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export const MAX_VISIBLE_MESSAGE_LINES = 5

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export const WEEKDAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
} as const

export const DEFAULT_BUSINESS_HOURS = { startTime: '09:00', endTime: '17:00' }

export const TIMEZONES = [
  { zone: 'Pacific/Honolulu', name: 'Honolulu' },
  { zone: 'America/Anchorage', name: 'Anchorage' },
  { zone: 'America/Los_Angeles', name: 'Los Angeles' },
  { zone: 'America/Denver', name: 'Denver' },
  { zone: 'America/Chicago', name: 'Chicago' },
  { zone: 'America/New_York', name: 'New York' },
  { zone: 'America/Sao_Paulo', name: 'São Paulo' },
  { zone: 'UTC', name: 'UTC' },
  { zone: 'Europe/London', name: 'London' },
  { zone: 'Europe/Paris', name: 'Paris' },
  { zone: 'Europe/Berlin', name: 'Berlin' },
  { zone: 'Africa/Cairo', name: 'Cairo' },
  { zone: 'Europe/Moscow', name: 'Moscow' },
  { zone: 'Asia/Dubai', name: 'Dubai' },
  { zone: 'Asia/Karachi', name: 'Karachi' },
  { zone: 'Asia/Kolkata', name: 'Kolkata' },
  { zone: 'Asia/Dhaka', name: 'Dhaka' },
  { zone: 'Asia/Bangkok', name: 'Bangkok' },
  { zone: 'Asia/Jakarta', name: 'Jakarta' },
  { zone: 'Asia/Kuala_Lumpur', name: 'Kuala Lumpur' },
  { zone: 'Asia/Singapore', name: 'Singapore' },
  { zone: 'Asia/Shanghai', name: 'Shanghai' },
  { zone: 'Asia/Hong_Kong', name: 'Hong Kong' },
  { zone: 'Asia/Tokyo', name: 'Tokyo' },
  { zone: 'Asia/Seoul', name: 'Seoul' },
  { zone: 'Australia/Sydney', name: 'Sydney' },
  { zone: 'Pacific/Auckland', name: 'Auckland' },
] as const

export const MOVE_HISTORY_LIMIT = 50
