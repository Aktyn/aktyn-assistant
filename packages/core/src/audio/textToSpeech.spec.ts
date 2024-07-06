import { formatTextForSpeech } from './textToSpeech'

describe(formatTextForSpeech.name, () => {
  it('should format text for speech', () => {
    expect(formatTextForSpeech('foo')).toBe('foo')
    expect(formatTextForSpeech('foo\nbar')).toBe('foo bar')
    expect(formatTextForSpeech('**foo**')).toBe('foo')
    expect(formatTextForSpeech('### foo')).toBe('foo')
    expect(formatTextForSpeech('`foo`')).toBe('given code or command')
    expect(formatTextForSpeech('```\nfoo\n```')).toBe('given code block')
    expect(formatTextForSpeech('```bash\nbar\n```')).toBe('given code block')
    expect(
      formatTextForSpeech(`\`\`\`bash
#!/bin/bash
stat --format="%y %n" * | sort -k1 | awk '{print $1, $2}' | awk '{print $1}' FS="-" | uniq -c
\`\`\``),
    ).toBe('given code block')
    expect(formatTextForSpeech('\\( (x+1)^4 \\)')).toBe('given math expression')
    expect(
      formatTextForSpeech('\\[ (x+1)^4 - (x-9)^2 + \\frac{x}{2} = 0 \\]'),
    ).toBe('given math expression')
  })
})
