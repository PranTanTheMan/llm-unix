export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
}

export type ContentBlock = TextContent | ToolUseBlock;

export interface ClaudeResponse {
  content: ContentBlock[];
}

export interface TimestampResponse {
  timestamp: number;
}

export interface ErrorResponse {
  error: string;
}
