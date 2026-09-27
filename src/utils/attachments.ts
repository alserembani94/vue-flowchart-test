import type { SendMessagePayload } from '../types'
import { MAX_ATTACHMENT_BYTES } from './constants'

export function getFileError(file: File): string | null {
  if (!file.type.startsWith('image/'))
    return `${file.name} isn't an image`
  if (file.size > MAX_ATTACHMENT_BYTES)
    return `${file.name} is larger than 25 MB`
  return null
}

export function attachmentUrls(payload: SendMessagePayload[]): string[] {
  return payload.flatMap(part => (part.type === 'attachment' ? [part.attachment] : []))
}

export function revokeBlobUrls(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith('blob:'))
      URL.revokeObjectURL(url)
  }
}
