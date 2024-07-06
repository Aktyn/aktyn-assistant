import Tokenizer from 'sentence-tokenizer'

import { speak } from './textToSpeech'

export class BufferedSpeech {
  private buffer = ''
  private finished = false
  private readonly tokenizer = new Tokenizer('AI')
  private speakPromise: Promise<void> | null = null
  private readonly abortController = new AbortController()

  constructor(private readonly onSpeaking?: (finished: boolean) => void) {}

  isFinished() {
    return this.finished
  }

  get controller() {
    return this.abortController
  }

  private isViableForSpeechSynthesis() {
    if (this.finished) {
      return false
    }
    return (
      this.tokenizer.getSentences().length > 0 ||
      this.buffer.lastIndexOf('\n') >= 32
    )
  }

  private preventToLargeContent(content: string) {
    const limit = 384

    if (
      content.length > limit &&
      content.includes('\n') &&
      !content.match(/```([^\n]+)?\n.*\n```/g) &&
      !content.match(/```[\s\S]*?```/g)
    ) {
      const lines = content.split('\n')
      let includeLines = lines.length
      let lengthSum = lines.reduce((acc, line) => acc + line.length, 0)
      while (includeLines > 1 && lengthSum > limit) {
        lengthSum -= lines[includeLines - 1].length
        includeLines--
      }
      return lines.slice(0, includeLines).join('\n')
    }

    return content
  }

  private speak(content: string) {
    if (this.abortController.signal.aborted) {
      return
    }

    content = this.preventToLargeContent(content)
    this.buffer = this.buffer.slice(content.length)

    this.onSpeaking?.(false)
    this.speakPromise = speak(content, this.abortController.signal)
      .then(() => {
        this.speakPromise = null
        if (this.finished) {
          this.onSpeaking?.(true)
        }
      })
      .catch(console.error)
  }

  private synthesize(force = false) {
    if (!this.buffer.length) {
      return
    }

    if (this.speakPromise) {
      this.speakPromise.then(() => this.synthesize(true)).catch(console.error)
      return
    }

    if (force) {
      this.speak(this.buffer)
      return
    }

    let lineBreakIndex = this.buffer.indexOf('\n')
    while (lineBreakIndex !== -1 && lineBreakIndex < 32) {
      lineBreakIndex = this.buffer.indexOf('\n', lineBreakIndex + 1)
    }
    if (lineBreakIndex >= 32) {
      const content = this.buffer.slice(0, lineBreakIndex + 1)
      this.speak(content)
      return
    }

    const sentences = this.tokenizer.getSentences().slice(0, -1)
    const sentencesContent = sentences.join('')
    if (sentences.length > 1 && sentencesContent.length >= 32) {
      const sentencesContent = sentences.join('')
      this.speak(sentencesContent)
      return
    }
  }

  append(value: string) {
    if (this.finished || this.abortController.signal.aborted) {
      return
    }

    this.tokenizer.setEntry((this.buffer += value))
    if (this.isViableForSpeechSynthesis()) {
      this.synthesize()
    }
  }

  abort() {
    this.buffer = ''
    this.finished = true
    if (this.speakPromise && !this.abortController.signal.aborted) {
      console.info('Aborting buffered speech')
      this.abortController.abort()
    }
  }

  finalize() {
    if (this.finished || !this.buffer || this.abortController.signal.aborted) {
      this.onSpeaking?.(true)
    }

    if (this.finished) {
      return
    }

    this.synthesize(true)
    this.finished = true
  }
}
