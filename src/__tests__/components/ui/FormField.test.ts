// @vitest-environment happy-dom
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import BaseInput from '../../../components/ui/BaseInput.vue'
import FormField from '../../../components/ui/FormField.vue'

function renderField(props: { label: string, error?: string, hint?: string, optional?: boolean, hideLabel?: boolean }) {
  const Host = defineComponent(() => () => h(FormField, props, {
    default: (field: Record<string, unknown>) => h(BaseInput, field),
  }))
  return render(Host)
}

describe('formField', () => {
  it('links the label to the field', () => {
    renderField({ label: 'Title' })

    expect(screen.getByRole('textbox', { name: 'Title' })).toBeInTheDocument()
  })

  it('adds (optional) to the label, including the accessible name', () => {
    renderField({ label: 'Description', optional: true })

    expect(screen.getByRole('textbox', { name: 'Description (optional)' })).toBeInTheDocument()
  })

  it('can hide the label visually but keep it as the name', () => {
    renderField({ label: 'Message 1', hideLabel: true })

    expect(screen.getByText('Message 1')).toHaveClass('sr-only')
    expect(screen.getByRole('textbox', { name: 'Message 1' })).toBeInTheDocument()
  })

  it('marks the field invalid and links the error to it', () => {
    renderField({ label: 'Title', error: 'Title is required' })

    const field = screen.getByRole('textbox', { name: 'Title' })
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Title is required')
  })

  it('keeps the error out of the label', () => {
    renderField({ label: 'Title', error: 'Title is required' })

    expect(screen.getByRole('textbox', { name: 'Title' })).not.toHaveAccessibleName(/required/)
  })

  it('links a hint to the field, after the error', () => {
    renderField({ label: 'Type', error: 'Type is required', hint: 'Pick one' })

    expect(screen.getByRole('textbox', { name: 'Type' })).toHaveAccessibleDescription('Type is required Pick one')
  })

  it('leaves the field valid without an error', () => {
    renderField({ label: 'Title', hint: 'Keep it short' })

    const field = screen.getByRole('textbox', { name: 'Title' })
    expect(field).toHaveAttribute('aria-invalid', 'false')
    expect(field).toHaveAccessibleDescription('Keep it short')
  })
})
