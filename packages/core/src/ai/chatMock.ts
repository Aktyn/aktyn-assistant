import { wait, randomInt, getRandomElement } from '@aktyn-assistant/common'

const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lectus mauris ultrices eros in cursus. Ornare lectus sit amet est placerat in. Dis parturient montes nascetur ridiculus mus mauris vitae. Ultrices mi tempus imperdiet nulla. Erat imperdiet sed euismod nisi. Aliquet lectus proin nibh nisl condimentum id venenatis a condimentum. Ut sem nulla pharetra diam sit amet nisl suscipit adipiscing. At augue eget arcu dictum varius. Netus et malesuada fames ac turpis egestas integer eget aliquet. Semper viverra nam libero justo. Lobortis feugiat vivamus at augue eget. Netus et malesuada fames ac turpis. Et magnis dis parturient montes. Diam phasellus vestibulum lorem sed risus ultricies tristique nulla aliquet. Rutrum tellus pellentesque eu tincidunt. Aliquet eget sit amet tellus cras. Aenean pharetra magna ac placerat vestibulum lectus mauris ultrices eros. Ullamcorper malesuada proin libero nunc consequat.

Aenean pharetra magna ac placerat vestibulum. Dignissim cras tincidunt lobortis feugiat vivamus at. Purus in mollis nunc sed id semper. Ultricies leo integer malesuada nunc. Sed tempus urna et pharetra pharetra massa massa. Consequat mauris nunc congue nisi vitae suscipit tellus mauris. Maecenas sed enim ut sem. Semper feugiat nibh sed pulvinar proin gravida. Sed risus pretium quam vulputate dignissim. Imperdiet sed euismod nisi porta lorem mollis. Odio ut sem nulla pharetra diam. Faucibus interdum posuere lorem ipsum dolor. Pulvinar etiam non quam lacus suspendisse faucibus interdum posuere lorem. Enim ut tellus elementum sagittis vitae et leo duis ut. In eu mi bibendum neque egestas congue quisque egestas diam. Viverra nibh cras pulvinar mattis nunc sed blandit libero.

Ac placerat vestibulum lectus mauris ultrices eros in cursus turpis. Viverra aliquet eget sit amet. Tincidunt vitae semper quis lectus nulla at volutpat. Quam id leo in vitae turpis massa sed. Lorem donec massa sapien faucibus et molestie. Amet luctus venenatis lectus magna fringilla urna porttitor rhoncus dolor. Eget felis eget nunc lobortis mattis aliquam faucibus purus. Vitae tortor condimentum lacinia quis vel. Pellentesque pulvinar pellentesque habitant morbi tristique senectus et netus. Sed risus ultricies tristique nulla aliquet enim tortor.`

const RESPONSE_WITH_CODE = `Test with \`<inline code blocks>\` and multiline code blocks:

\`\`\`bash
#!/bin/bash
stat --format="%y %n" * | sort -k1 | awk '{print $1, $2}' | awk '{print $1}' FS="-" | uniq -c
\`\`\`

\`\`\`javascript
// Hablabla
const test = (x=>!0+' '+x.substr(23,11)+' is '+x.x+' '+!1+' '+x.substr(0,8))(Function+0)
console.log(test) //Yep

/**
 * foo
 * bar
 */
function foo() {
  console.log('foo')
}
\`\`\`

\`\`\`cpp
// Example Hello World program
#include <iostream>

int main() {
  std::cout << "Hello World!";
  return 0;
}
\`\`\`

Part of real response:
- \`stat --format="%y %n" *\` will display the creation date and filename of each file in the directory.
- \`sort -k1\` will sort the output based on the creation date.
- \`awk '{print $1, $2}'\` will select and print the date and time part of the output.
- \`awk '{print $1}' FS="-"\` will extract and print only the day part of the date.
- \`uniq -c\` will display the unique days along with the count of files created on each day.

You can run this command in the directory of interest to list every file grouped by the day on which it was created.`

const RESPONSE_WITH_MARKDOWN = `start

1. **Substitute \\( f(x) = 0 \\)**:
   \\[ (x+1)^4 - (x-9)^2 + \\frac{x}{2} = 0 \\]

2. **Simplify each term**:
   - \\( (x+1)^4 \\) is an expression that can be expanded but simplifying directly might not be easy.
   - \\( (x-9)^2 \\) can be expanded as \\( x^2 - 18x + 81 \\).
   - \\(\frac{x}{2}\\) is already simplified.

\`inline code test\`

# Test 1
## Test 2
### Test 3
#### Test 4
##### Test 5
###### Test 6

---

\`\`\`bash
#!/bin/bash
# comment
stat --format="%y %n" * | sort -k1 | awk '{print $1, $2}' | awk '{print $1}' FS="-" | uniq -c
\`\`\`

end`

const RESPONSE_WITH_LINKS = `There are a few possible references to "Aktyn" based on the context, but here are the most relevant ones:

1. **Aktyn as a GitHub User**: Radosław Krajewski, who uses the handle "Aktyn" on GitHub, has developed various projects, including a multi-player browser game, a website project for a GTA V Role Play server, and a neural network evolving with a genetic algorithm. [GitHub - Aktyn](https://github.com/Aktyn)

2. **Aktyn Training System**: A technologically advanced simulator designed for tactical and shooting training used by military personnel. It involves training with pneumatic training carbines or standard-issue weapons loaded with training ammunition. [Aktyn Training System](https://fabrykabroni.pl/en/en/offer/training-systems/aktyn-training-system)

If you were referring to a specific context or individual, could you please provide more details for a precise explanation?`

const RESPONSE_WITH_NUMBERS = `The Fibonacci sequence is closely related to the golden ratio (approximately 1.6180339887). As the Fibonacci sequence progresses, the ratio of consecutive Fibonacci numbers approaches the golden ratio.

Specifically, if you take two consecutive Fibonacci numbers \\( F(n) \\) and \\( F(n-1) \\), the ratio:

\\[
\\frac{F(n)}{F(n-1)}
\\]

converges to the golden ratio as \\( n \\) increases. This means that the larger the Fibonacci numbers, the closer their ratio is to the golden ratio.

Mathematically, this relationship can be expressed as:

\\[
\\lim_{n \\to \\infty} \frac{F(n+1)}{F(n)} = \\phi
\\]

where \\( \\phi \\) is the golden ratio. The connection between the Fibonacci sequence and the golden ratio appears in various areas of art, architecture, and nature.`

export const LOREM_IPSUM_WORDS = LOREM_IPSUM.trim()
  .replace(/\.\s/g, '.\n')
  .split(' ')
  .map((word) => word.trim() + ' ')

export const RESPONSE_WITH_CODE_WORDS = RESPONSE_WITH_CODE.trim()
  .split(' ')
  .map((word) => word + ' ')

export const RESPONSE_WITH_MARKDOWN_WORDS = RESPONSE_WITH_MARKDOWN.trim()
  .split(' ')
  .map((word) => word + ' ')

export const RESPONSE_WITH_LINKS_WORDS = RESPONSE_WITH_LINKS.trim()
  .split(' ')
  .map((word) => word + ' ')

export const RESPONSE_WITH_NUMBERS_WORDS = RESPONSE_WITH_NUMBERS.trim()
  .split(' ')
  .map((word) => word + ' ')

export function mockChatStream<ResponseType extends object | string>(
  parser: (content: string, isLast: boolean) => ResponseType,
  length?: number,
  delayBetweenMessages = () => randomInt(10, 50),
) {
  const source =
    randomInt(0, 10) > 9
      ? LOREM_IPSUM_WORDS
      : getRandomElement([
          RESPONSE_WITH_CODE_WORDS,
          RESPONSE_WITH_MARKDOWN_WORDS,
          RESPONSE_WITH_LINKS_WORDS,
          RESPONSE_WITH_NUMBERS_WORDS,
        ])

  length = Math.min(length ?? source.length, source.length)

  const controller = new AbortController()
  return {
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < length; i++) {
        if (controller.signal.aborted) {
          return
        }

        await wait(delayBetweenMessages())
        yield parser(source[i], i === length - 1)
      }
    },
    controller,
  }
}
