import Tokenizer from 'sentence-tokenizer'

import { getUserConfigValue } from '../user'
import { logger } from '../utils'

import { speak } from './textToSpeech'

const minimumTextLengthEligibleForSpeechSynthesis = 128

export class BufferedSpeech {
  private buffer = ''
  private finished = false
  private readonly tokenizer = new Tokenizer('AI')
  private readonly abortController = new AbortController()
  private readonly language = getUserConfigValue('textToSpeechLanguage')

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

    const combinedSentencesLength =
      this.tokenizer.sentences?.reduce(
        (acc, sentence) => acc + sentence.length,
        0,
      ) ?? 0

    const blockBoundaries = [
      { start: '```', end: '\n```' },
      { start: '\\[', end: '\\]' },
    ]
    for (const blockBoundary of blockBoundaries) {
      const startIndex = this.buffer.lastIndexOf(blockBoundary.start)
      if (startIndex !== -1) {
        const endIndex = this.buffer.indexOf(
          blockBoundary.end,
          startIndex + blockBoundary.start.length,
        )
        if (endIndex === -1) {
          return false
        }
      }
    }

    return (
      combinedSentencesLength >= minimumTextLengthEligibleForSpeechSynthesis ||
      this.buffer.lastIndexOf('\n') >=
        minimumTextLengthEligibleForSpeechSynthesis
    )
  }

  private trimLargeContent(content: string) {
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

    content = this.trimLargeContent(content)
    this.buffer = this.buffer.slice(content.length)

    this.onSpeaking?.(false)
    speak(content, this.language, this.abortController.signal)
      .catch(logger.error)
      .finally(() => {
        if (this.finished) {
          this.onSpeaking?.(true)
        }
      })
  }

  private synthesize(force = false) {
    if (!this.buffer.length) {
      return
    }

    if (force) {
      this.speak(this.buffer)
      this.synthesize(true)
      return
    }

    let lineBreakIndex = this.buffer.indexOf('\n')
    while (
      lineBreakIndex !== -1 &&
      lineBreakIndex < minimumTextLengthEligibleForSpeechSynthesis
    ) {
      lineBreakIndex = this.buffer.indexOf('\n', lineBreakIndex + 1)
    }
    if (lineBreakIndex >= minimumTextLengthEligibleForSpeechSynthesis) {
      const content = this.buffer.slice(0, lineBreakIndex + 1)
      this.speak(content)
      return
    }

    const sentences = this.tokenizer.getSentences()
    let includeSentences = 0,
      includedSentencesLength = 0
    if (sentences.length > 0) {
      do {
        includedSentencesLength += sentences[includeSentences].length
        includeSentences++
      } while (
        includedSentencesLength < minimumTextLengthEligibleForSpeechSynthesis &&
        includeSentences < sentences.length
      )

      const sentencesContent = sentences.slice(0, includeSentences).join('')
      if (
        sentencesContent.length >= minimumTextLengthEligibleForSpeechSynthesis
      ) {
        this.speak(sentencesContent)
      }
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
    if (!this.abortController.signal.aborted) {
      logger.info('Aborting buffered speech')
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
