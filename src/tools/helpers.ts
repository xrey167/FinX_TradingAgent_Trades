/**
 * Tool Helper Functions
 * Standardized patterns for tool implementation
 */

/**
 * Tool result type matching Claude Agent SDK expectations
 */
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
  metadata?: {
    sourceUrl?: string;
    sourceUrls?: string[];
    timestamp?: string;
    apiCost?: number;
  };
}

/**
 * Create tool parameters, filtering out undefined values
 */
export function createToolParams<T extends Record<string, any>>(
  params: T
): Partial<T> {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Partial<T>);
}

/**
 * Format tool result with optional metadata
 */
export function formatToolResult(
  data: unknown,
  metadata?: {
    sourceUrl?: string;
    sourceUrls?: string[];
    timestamp?: string;
    apiCost?: number;
  }
): ToolResult {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    ...(metadata && { metadata }),
  };
}

/**
 * Format tool error with consistent structure
 */
export function formatToolError(error: unknown, context?: string): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  const fullMessage = context ? `${context}: ${message}` : message;

  return {
    content: [
      {
        type: 'text' as const,
        text: fullMessage,
      },
    ],
    isError: true,
  };
}

/**
 * Validate required environment variable
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable not set. Add to .env file.`);
  }
  return value;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Calculate cache key for tool results
 */
export function createCacheKey(
  toolName: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${toolName}:${sortedParams}`;
}
