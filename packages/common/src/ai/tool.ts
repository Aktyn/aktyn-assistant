/** @see https://platform.openai.com/docs/guides/function-calling */
export type ToolSchema = {
  version?: string

  /**
   * Allowed symbols: a-z, A-Z, 0-9, underscores and dashes\
   * Maximum length: 64 characters
   */
  functionName: string

  /**
   * Function description, used to determine when and how to call the function by the AI.
   */
  description: string

  /** @see https://json-schema.org/understanding-json-schema/ */
  parameters?: Record<string, unknown>
}

export type Tool<DataType extends object = object> = {
  schema: ToolSchema
  function: (data: DataType) => string | Promise<string>
}

export function validateTool(tool: unknown) {
  if (typeof tool !== 'object' || tool === null) {
    return 'Tool is not an object'
  }

  if (!('function' in tool) || typeof tool.function !== 'function') {
    return 'Tool is missing function'
  }

  if (
    !('schema' in tool) ||
    typeof tool.schema !== 'object' ||
    tool.schema === null
  ) {
    return 'Tool is missing schema'
  }

  const schema = tool.schema
  if (
    !('functionName' in schema) ||
    typeof schema.functionName !== 'string' ||
    !schema.functionName.match(/^[a-zA-Z0-9_]{1,64}$/)
  ) {
    return 'Tool schema is missing functionName or it has invalid format'
  }

  return null
}
