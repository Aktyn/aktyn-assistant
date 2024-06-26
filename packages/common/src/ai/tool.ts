/** @see https://platform.openai.com/docs/guides/function-calling */
export type ToolSchema = {
  /**
   * Allowed symbols: a-z, A-Z, 0-9, underscores and dashes\
   * Maximum length: 64 characters
   */
  functionName: string

  /**
   * Function description, used to determine when and how to call the function by the AI.
   */
  description?: string

  /** @see https://json-schema.org/understanding-json-schema/ */
  parameters?: Record<string, unknown>
}

export type Tool = {
  schema: ToolSchema
  function: (data: unknown) => string | Promise<string>
}

//TODO: more advanced validation for better developer feedback
export function isTool(tool: unknown): tool is Tool {
  if (typeof tool !== 'object' || tool === null) {
    return false
  }

  if (!('function' in tool) || typeof tool.function !== 'function') {
    return false
  }

  if (
    !('schema' in tool) ||
    typeof tool.schema !== 'object' ||
    tool.schema === null
  ) {
    return false
  }

  const schema = tool.schema
  if (
    !('functionName' in schema) ||
    typeof schema.functionName !== 'string' ||
    !schema.functionName.match(/^[a-zA-Z0-9_]{1,64}$/)
  ) {
    return false
  }

  return true
}
