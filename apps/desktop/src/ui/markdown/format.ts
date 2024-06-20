import { createElement } from '../utils/dom'

import {
  createCodeBlockElement,
  createInlineCodeBlockElement,
} from './codeBlocks'
import { trimSymbol } from './common'
import { createHeadingElement, type HeadingLevel } from './headings'

enum BlockType {
  InlineCode = 'inlineCode',
  CodeBlock = 'codeBlock',
  Heading = 'heading',
  Bold = 'bold',
}

type BlockInfoBase = { start: number; end: number; priority: number }
type BlockInfo = BlockInfoBase &
  (
    | {
        type: BlockType.InlineCode
        priority: 1
      }
    | {
        type: BlockType.CodeBlock
        priority: 3
        language?: string
      }
    | {
        type: BlockType.Heading
        priority: 2
        level: HeadingLevel
      }
    | {
        type: BlockType.Bold
        priority: 0
      }
  )

const blockFinders: {
  [key in BlockType]: {
    regex: RegExp
    requiredMatches: number
    getAdditionalData: (
      match: RegExpMatchArray,
    ) => Omit<{ type: key } & BlockInfo, keyof BlockInfoBase | 'type'>
  }
} = {
  [BlockType.InlineCode]: {
    regex: /`([^`\n]+)`/,
    requiredMatches: 2,
    getAdditionalData: () => ({}),
  },
  [BlockType.CodeBlock]: {
    regex: /```([^`\n]+)?\n([^`]+)```/,
    requiredMatches: 3,
    getAdditionalData: (match) => ({
      language: match[1] as string | undefined,
    }),
  },
  [BlockType.Heading]: {
    regex: /^(#{1,6})\s.*\n/m,
    requiredMatches: 2,
    getAdditionalData: (match) => ({
      level: match[1].length as HeadingLevel,
    }),
  },
  [BlockType.Bold]: {
    regex: /\*{2}([^*]+)\*{2}/,
    requiredMatches: 2,
    getAdditionalData: () => ({}),
  },
}

export function formatMarkdown(element: HTMLElement) {
  const text = element.innerText
  const foundBlocks: BlockInfo[] = []

  if (detectUnclosedBlock(text)) {
    return
  }

  for (const type of Object.values(BlockType)) {
    const finder = blockFinders[type]
    let pivot = 0
    while (pivot < text.length) {
      const match = text.substring(pivot).match(finder.regex)
      if (!match || match.index === undefined) {
        break
      }

      if (match.length >= finder.requiredMatches) {
        const start = pivot + match.index
        const end = start + match[0].length
        foundBlocks.push({
          start,
          end,
          type,
          ...finder.getAdditionalData(match),
        } as BlockInfo)
      }

      pivot += Math.max(1, match.index + match[0].length)
    }
  }

  replaceElementWithBlocks(element, foundBlocks)
}

function replaceElementWithBlocks(element: HTMLElement, blocks: BlockInfo[]) {
  blocks.sort((a, b) => a.start - b.start)

  const content = element.innerText
  const nodes: Node[] = []

  let pivot = 0,
    ignoreNextBlock = false
  for (let i = 0; i < blocks.length; i++) {
    if (ignoreNextBlock) {
      ignoreNextBlock = false
      continue
    }

    const block = blocks[i]
    if (i < blocks.length - 1 && block.end > blocks[i + 1].start) {
      console.warn('Found overlapping code blocks', block, blocks[i + 1])
      if (block.priority < blocks[i + 1].priority) {
        continue
      } else {
        ignoreNextBlock = true
      }
    }

    const contentLeft = content.substring(pivot, block.start)
    const blockContent = content.substring(block.start, block.end)
    if (contentLeft.length) {
      nodes.push(createElement('span', { content: contentLeft }))
    }

    switch (block.type) {
      case BlockType.InlineCode:
        nodes.push(createInlineCodeBlockElement(blockContent))
        break
      case BlockType.CodeBlock:
        nodes.push(createCodeBlockElement(block.language, blockContent))
        break
      case BlockType.Heading:
        nodes.push(createHeadingElement(block.level, blockContent))
        break
      case BlockType.Bold:
        nodes.push(
          createElement('b', { content: trimSymbol(blockContent, '\\*') }),
        )
        break
    }
    pivot = block.end
  }
  const contentRight = content.substring(pivot)
  if (contentRight.length) {
    nodes.push(createElement('span', { content: contentRight }))
  }

  element.replaceWith(...nodes)
}

function detectUnclosedBlock(text: string) {
  const matches = [text.matchAll(/`{3}/g), text.matchAll(/\*{2}/gm)]
  if (matches.some((match) => Array.from(match).length % 2 !== 0)) {
    return true
  }

  return false
}
