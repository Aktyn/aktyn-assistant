import { formatTextForSpeech } from './textToSpeech'

describe(formatTextForSpeech.name, () => {
  it('should format text for speech', () => {
    expect(formatTextForSpeech('foo')).toBe('foo')
    expect(formatTextForSpeech('foo\nbar')).toBe('foo\nbar')
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
      formatTextForSpeech('xyz\n\\[\n\\frac{F(n)}{F(n-1)}\n\\]\nzyx'),
    ).toBe('xyz\ngiven math block\nzyx')
    expect(
      formatTextForSpeech('\\[ (x+1)^4 - (x-9)^2 + \\frac{x}{2} = 0 \\]'),
    ).toBe('given math expression')
    expect(
      formatTextForSpeech('foo [GitHub - Aktyn](https://github.com/Aktyn) bar'),
    ).toBe('foo GitHub - Aktyn link bar')
  })

  it('should not format empty text', () => {
    expect(formatTextForSpeech('')).toBe('')
  })

  it('should format numbers', () => {
    expect(formatTextForSpeech('123')).toBe('123')
    expect(formatTextForSpeech('123.456')).toBe('123 coma 456')
    expect(formatTextForSpeech('1.23')).toBe('1 coma 23')
  })
})
