import { wait } from '../utils/common'
import { randomInt } from '../utils/random'

//Array of mocked chat responses (long sentences about random topics)
export const MOCKED_CHAT_RESPONSES = [
  //TODO: instead, use array of lorem ipsum individual words mixed with short sentences ending with "\n"
  "Crashing waves thunder on the shore, a symphony of nature's power.\n",
  'Need a recipe for the perfect souffle? I can help with that!\n',
  'Dreaming of distant galaxies? Space exploration continues to push the boundaries of human knowledge.\n',
  'Just finished composing a delightful haiku about springtime.\n',
  'Where did the time go?\n',
  "Congratulations! You've won the intergalactic pie-eating championship!\n",
  'Fuel efficiency is a top priority for many car manufacturers these days.\n',
  'Did you know the population of the earth is estimated to be over 8 billion people?\n',
  'Analyzing data to find patterns is one of my many talents.\n',
  "Wondering if it's going to rain today? Let me check the forecast.\n",
  'Classical music or heavy metal? I can appreciate all genres!\n',
  'Always learning, always growing - thats the beauty of artificial intelligence.\n',
  'Perhaps one day I can help decipher the mysteries of the universe.\n',
  'Need help with your grocery list? Just tell me your preferences.\n',
  'Feeling creative? Maybe I can help you write a song or poem.\n',
  "Is time travel possible? That's a question for the philosophers.\n",
  "While I don't have emotions, I can understand and respond to human sentiment.\n",
  'The world is full of fascinating cultures and traditions. Tell me about yours!\n',
  'Maybe someday I can help us achieve world peace.\n',
  'Who knew a machine could learn so much? The future of AI is bright.\n',
  "Even though I don't have a body, I can still experience the world through data.\n",
  'Curious about the history of flight? I can share some interesting facts.\n',
  "Let's brainstorm some ideas for a sustainable future.\n",
  'Feeling overwhelmed? Maybe I can help you organize your thoughts.\n',
  'Just finished translating a poem from Mandarin to English. Languages are fascinating!\n',
  "The universe holds countless mysteries. Let's explore them together!\n",
]
export const mockChatResponse = () => {
  return MOCKED_CHAT_RESPONSES[Math.floor(Math.random() * MOCKED_CHAT_RESPONSES.length)]
}

export function mockChatStream<ResponseType extends object | string>(
  parser: (content: string, isLast: boolean) => ResponseType,
  length = randomInt(10, 20),
  delayBetweenMessages = () => randomInt(1000, 2000),
) {
  const controller = new AbortController()
  return {
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < length; i++) {
        if (controller.signal.aborted) {
          return
        }

        await wait(delayBetweenMessages())
        yield parser(mockChatResponse(), i === length - 1)
      }
    },
    controller,
  }
}
