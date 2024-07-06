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

  private isViableForSpeechSynthesis() {
    if (this.finished) {
      return false
    }
    return (
      this.tokenizer.getSentences().length > 0 ||
      this.buffer.lastIndexOf('\n') >= 32
    )
  }

  private speak(content: string) {
    if (this.abortController.signal.aborted) {
      return
    }

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
      this.buffer = ''
      return
    }

    let lineBreakIndex = this.buffer.indexOf('\n')
    while (lineBreakIndex !== -1 && lineBreakIndex < 32) {
      lineBreakIndex = this.buffer.indexOf('\n', lineBreakIndex + 1)
    }
    if (lineBreakIndex >= 32) {
      const content = this.buffer.slice(0, lineBreakIndex + 1)
      this.buffer = this.buffer.slice(content.length)
      this.speak(content)
      return
    }

    const sentences = this.tokenizer.getSentences().slice(0, -1)
    const sentencesContent = sentences.join('')
    if (sentences.length > 1 && sentencesContent.length >= 32) {
      const sentencesContent = sentences.join('')
      const breakIndex =
        this.buffer.lastIndexOf(sentences.at(-1)!) + sentences.at(-1)!.length
      this.buffer = this.buffer.slice(breakIndex)
      this.speak(sentencesContent)
      return
    }
  }

  append(content: string) {
    if (this.finished || this.abortController.signal.aborted) {
      return
    }

    this.tokenizer.setEntry((this.buffer += content))
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
