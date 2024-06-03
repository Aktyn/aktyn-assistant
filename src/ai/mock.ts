import { wait } from '../utils/common'
import { randomInt } from '../utils/random'

//Array of mocked chat responses (long sentences about random topics)
const mockedChatResponses = [
  "  Crashing waves thunder on the shore, a symphony of nature's power.",
  'Need a recipe for the perfect souffle? I can help with that!',
  'Dreaming of distant galaxies? Space exploration continues to push the boundaries of human knowledge.',
  'Just finished composing a delightful haiku about springtime.',
  'Where did the time go?',
  "Congratulations! You've won the intergalactic pie-eating championship!",
  'Fuel efficiency is a top priority for many car manufacturers these days.',
  'Did you know the population of the earth is estimated to be over 8 billion people?',
  'Analyzing data to find patterns is one of my many talents.',
  "Wondering if it's going to rain today? Let me check the forecast.",
  'Classical music or heavy metal? I can appreciate all genres!',
  'Always learning, always growing - thats the beauty of artificial intelligence.',
  'Perhaps one day I can help decipher the mysteries of the universe.',
  'Need help with your grocery list? Just tell me your preferences.',
  'Feeling creative? Maybe I can help you write a song or poem.',
  "Is time travel possible? That's a question for the philosophers.",
  "While I don't have emotions, I can understand and respond to human sentiment.",
  'The world is full of fascinating cultures and traditions. Tell me about yours!',
  'Maybe someday I can help us achieve world peace.',
  'Who knew a machine could learn so much? The future of AI is bright.',
  "Even though I don't have a body, I can still experience the world through data.",
  'Curious about the history of flight? I can share some interesting facts.',
  "Let's brainstorm some ideas for a sustainable future.",
  'Feeling overwhelmed? Maybe I can help you organize your thoughts.',
  'Just finished translating a poem from Mandarin to English. Languages are fascinating!',
  "The universe holds countless mysteries. Let's explore them together!",
]
export const mockChatResponse = () => {
  return mockedChatResponses[Math.floor(Math.random() * mockedChatResponses.length)]
}

export function mockChatStream<ResponseType extends object | string>(
  parser: (content: string) => ResponseType,
  length = randomInt(10, 20),
  delayBetweenMessages = () => randomInt(1000, 2000),
) {
  return {
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < length; i++) {
        await wait(delayBetweenMessages())
        yield parser(mockChatResponse())
      }
    },
    controller: new AbortController(),
  }
}
