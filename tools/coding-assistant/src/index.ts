import type { Tool, ToolSchema } from '@aktyn-assistant/common'

const toolSchema: ToolSchema = {
  version: '1.0.0',
  functionName: 'modify_code',
  description: '...', //TODO
  parameters: {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        description: '...', //TODO
      },
    },
    required: ['foo'],
  },
}

//TODO: implement
async function modifyCode(data: { foo: string }) {
  const { foo } = data
  return foo
}

export default function index() {
  return [
    {
      schema: toolSchema,
      function: modifyCode,
    } satisfies Tool<{ foo: string }>,
  ]
}
