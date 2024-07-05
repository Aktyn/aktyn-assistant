import { formatTextForSpeech } from './textToSpeech'

describe(formatTextForSpeech.name, () => {
  it('should format text for speech', () => {
    expect(formatTextForSpeech('foo')).toBe('foo')
    expect(formatTextForSpeech('foo\nbar')).toBe('foo bar')
    expect(formatTextForSpeech('**foo**')).toBe('foo')
    expect(formatTextForSpeech('### foo')).toBe('foo')
    expect(formatTextForSpeech('`foo`')).toBe('given code or command')
    expect(formatTextForSpeech('```\nfoo\n```')).toBe('given code block')
  })
})
