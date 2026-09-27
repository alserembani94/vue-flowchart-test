import type { FlowItem } from '../../types'

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export const flowItems: FlowItem[] = deepFreeze([
  {
    id: 1,
    parentId: -1,
    type: 'trigger',
    data: { type: 'conversationOpened', oncePerContact: false },
  },
  {
    id: 'd09c08',
    parentId: 1,
    type: 'dateTime',
    name: 'Business Hours',
    data: {
      times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }],
      connectors: ['161f52'],
      timezone: 'UTC',
      action: 'businessHours',
      description: 'Routes by office hours',
    },
  },
  {
    id: '161f52',
    parentId: 'd09c08',
    type: 'dateTimeConnector',
    data: { connectorType: 'success' },
  },
  {
    id: 'b0653a',
    parentId: '161f52',
    type: 'sendMessage',
    name: 'Welcome Message',
    data: { payload: [{ type: 'text', text: 'Hello there' }] },
  },
])
