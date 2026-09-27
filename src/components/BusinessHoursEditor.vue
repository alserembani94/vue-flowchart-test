<script setup lang="ts">
import type { ScheduleTime } from '../types'
import type { ScheduleError } from '../utils/schedule'
import { ref } from 'vue'
import { WEEKDAY_LABELS } from '../utils/constants'
import { getScheduleErrors, isValidSchedule } from '../utils/schedule'
import { getTimezoneOptions } from '../utils/timezones'
import BaseInput from './ui/BaseInput.vue'
import BaseSelect from './ui/BaseSelect.vue'
import FormField from './ui/FormField.vue'

const props = defineProps<{
  timezone: string
  times: ScheduleTime[]
}>()

const emit = defineEmits<{
  'update:timezone': [timezone: string]
  'update:times': [times: ScheduleTime[]]
  'commit': []
}>()

const ERROR_MESSAGES: Record<ScheduleError, string> = {
  startRequired: 'Start time is required',
  endRequired: 'End time is required',
  endBeforeStart: 'End time can\'t be before start time',
}

const timezoneOptions = getTimezoneOptions()

const clone = (times: ScheduleTime[]) => times.map(time => ({ ...time }))

const rows = ref(clone(props.times))
let lastValid = clone(props.times)

function startError(row: ScheduleTime) {
  return getScheduleErrors(row).includes('startRequired') ? ERROR_MESSAGES.startRequired : undefined
}

function endError(row: ScheduleTime) {
  const error = getScheduleErrors(row).find(value => value !== 'startRequired')
  return error === undefined ? undefined : ERROR_MESSAGES[error]
}

function updateTime(index: number, field: 'startTime' | 'endTime', value: string) {
  const row = rows.value[index]
  if (!row)
    return
  rows.value[index] = { ...row, [field]: value }

  if (isValidSchedule(rows.value)) {
    lastValid = clone(rows.value)
    emit('update:times', clone(rows.value))
  }
}

function onRowFocusout(index: number, event: FocusEvent) {
  const row = event.currentTarget as HTMLElement
  if (row.contains(event.relatedTarget as Node | null))
    return

  const current = rows.value[index]
  const saved = lastValid[index]
  if (current && saved && getScheduleErrors(current).length > 0)
    rows.value[index] = { ...saved }
  emit('commit')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <FormField v-slot="field" label="Timezone">
      <BaseSelect
        v-bind="field"
        :model-value="props.timezone"
        name="timezone"
        @update:model-value="emit('update:timezone', $event)"
      >
        <option v-for="option in timezoneOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </BaseSelect>
    </FormField>

    <table class="w-full border-separate border-spacing-y-2 text-left">
      <caption class="mb-1 text-left font-medium text-gray-500">
        Schedule
      </caption>
      <thead class="text-gray-500">
        <tr>
          <th scope="col" class="font-normal">
            Day
          </th>
          <th scope="col" class="font-normal">
            Start
          </th>
          <th scope="col" class="font-normal">
            End
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="row.day" class="align-top" @focusout="onRowFocusout(index, $event)">
          <th scope="row" class="py-2 pr-2 font-normal">
            {{ WEEKDAY_LABELS[row.day] }}
          </th>
          <td class="pr-2">
            <FormField v-slot="field" :label="`${WEEKDAY_LABELS[row.day]} start time`" hide-label :error="startError(row)">
              <BaseInput
                v-bind="field"
                type="time"
                :model-value="row.startTime"
                @update:model-value="updateTime(index, 'startTime', $event)"
              />
            </FormField>
          </td>
          <td>
            <FormField v-slot="field" :label="`${WEEKDAY_LABELS[row.day]} end time`" hide-label :error="endError(row)">
              <BaseInput
                v-bind="field"
                type="time"
                :model-value="row.endTime"
                @update:model-value="updateTime(index, 'endTime', $event)"
              />
            </FormField>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
