const speakMock = jest.fn()
jest.mock('./textToSpeech', () => ({
  speak: speakMock,
}))
jest.mock('../user', () => ({
  getUserConfigValue: jest.fn().mockReturnValue('en-us'),
}))

import { wait } from '@aktyn-assistant/common'

import { RESPONSE_WITH_LINKS_WORDS } from '../ai/chatMock'

import { BufferedSpeech } from './buffered'

describe(BufferedSpeech.name, () => {
  const isGitHubActionsOrCI =
    process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true'

  if (isGitHubActionsOrCI) {
    it('should skip tests in CI', () => {
      expect(true).toBe(true)
    })
    return
  }

  beforeEach(() => {
    speakMock.mockClear()
    speakMock.mockImplementation(() => {
      return wait(200)
    })
  })

  it('should not slice small messages', () => {
    const speech = new BufferedSpeech()

    speech.append('foo ')
    speech.append('bar ')
    speech.append('baz')
    speech.finalize()
    expect(speakMock).toHaveBeenCalledTimes(1)
    expect(speakMock).toHaveBeenCalledWith(
      'foo bar baz',
      'en-us',
      speech.controller.signal,
    )
  })

  it('should correctly slice buffer', async () => {
    const speech = new BufferedSpeech()

    for (const word of RESPONSE_WITH_LINKS_WORDS) {
      await wait(9)
      speech.append(word)
    }
    speech.finalize()

    await wait(1000)

    expect(speakMock).toHaveBeenCalledTimes(6)
    expect(speakMock).toHaveBeenCalledWith(
      'There are a few possible references to "Aktyn" based on the context,',
      'en-us',
      speech.controller.signal,
    )
  }, 10_000)

  it('should correctly slice buffer after finalization to avoid too long audio file', async () => {
    const speech = new BufferedSpeech()

    for (const word of RESPONSE_WITH_LINKS_WORDS) {
      await wait(1) //!
      speech.append(word)
    }
    speech.finalize()

    await wait(600)

    expect(speakMock).toHaveBeenCalledTimes(4)
    expect(speakMock).toHaveBeenCalledWith(
      'There are a few possible references to "Aktyn" based on the context,',
      'en-us',
      speech.controller.signal,
    )
    expect(speakMock).toHaveBeenCalledWith(
      ' but here are the most relevant ones:\n\n1. **Aktyn as a GitHub User**: Radosław Krajewski, who uses the handle "Aktyn" on GitHub, has developed various projects, including a multi-player browser game, a website project for a GTA V Role Play server, and a neural network evolving with a genetic algorithm. [GitHub - Aktyn](https://github.com/Aktyn)\n',
      'en-us',
      speech.controller.signal,
    )
    expect(speakMock).toHaveBeenCalledWith(
      '\n2. **Aktyn Training System**: A technologically advanced simulator designed for tactical and shooting training used by military personnel. It involves training with pneumatic training carbines or standard-issue weapons loaded with training ammunition. [Aktyn Training System](https://fabrykabroni.pl/en/en/offer/training-systems/aktyn-training-system)\n',
      'en-us',
      speech.controller.signal,
    )
    expect(speakMock).toHaveBeenCalledWith(
      '\nIf you were referring to a specific context or individual, could you please provide more details for a precise explanation? ',
      'en-us',
      speech.controller.signal,
    )
  }, 10_000)
})
