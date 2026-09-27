import { describe, expect, it } from 'vitest'
import { attachmentUrls, getFileError } from '../../utils/attachments'
import { MAX_ATTACHMENT_BYTES } from '../../utils/constants'

function fakeFile(name: string, type: string, size: number) {
  return { name, type, size } as File
}

describe('getFileError', () => {
  it('accepts an image within the size limit', () => {
    expect(getFileError(fakeFile('photo.png', 'image/png', MAX_ATTACHMENT_BYTES))).toBeNull()
  })

  it('rejects files that are not images', () => {
    expect(getFileError(fakeFile('notes.pdf', 'application/pdf', 10))).toBe('notes.pdf isn\'t an image')
  })

  it('rejects images larger than 25 MB', () => {
    expect(getFileError(fakeFile('huge.jpg', 'image/jpeg', MAX_ATTACHMENT_BYTES + 1))).toBe('huge.jpg is larger than 25 MB')
  })
})

describe('attachmentUrls', () => {
  it('lists attachment URLs in order, skipping texts', () => {
    expect(attachmentUrls([
      { type: 'attachment', attachment: 'a' },
      { type: 'text', text: 'hi' },
      { type: 'attachment', attachment: 'b' },
    ])).toEqual(['a', 'b'])
  })
})
