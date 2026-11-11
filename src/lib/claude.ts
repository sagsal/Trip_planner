/**
 * Small helper for asking Claude (Anthropic API) for a structured answer through one tool.
 * The key is read only from the server environment (ANTHROPIC_API_KEY in .env.local).
 */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
export const ASSISTANT_MODEL = process.env.ANTHROPIC_ASSISTANT_MODEL || 'claude-haiku-5-5';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askClaudeTool<T = any>(opts: {
  system: string;
  messages: ClaudeMessage[];
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<{ input: T | null; usage?: any; error?: string }> {
  if (!ANTHROPIC_API_KEY) return { input: null, error: 'AI isn’t set up.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: opts.maxTokens ?? 4000,
        system: `${opts.system}\nAlways answer by calling the ${opts.tool.name} tool exactly once.`,
        tools: [opts.tool],
        messages: opts.messages,
      }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('AI assistant failed:', res.status, data?.error?.message);
      return { input: null, error: res.status === 429 ? 'The AI is busy — please try again in a moment.' : 'The AI couldn’t answer right now.' };
    }
    const block = (data.content || []).find((b: any) => b?.type === 'tool_use' && b?.name === opts.tool.name);
    let input = block?.input ?? null;
    // Lists sometimes arrive as JSON text; unpack them
    const unstring = (v: any): any => {
      if (typeof v === 'string') {
        const t = v.trim();
        if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
          try { return unstring(JSON.parse(t)); } catch { return v; }
        }
        return v;
      }
      if (Array.isArray(v)) return v.map(unstring);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, unstring(x)]));
      return v;
    };
    input = unstring(input);
    return { input, usage: data.usage };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    console.error('AI assistant error:', e instanceof Error ? e.message : e);
    return { input: null, error: aborted ? 'The AI took too long — please try again.' : 'The AI couldn’t answer right now.' };
  } finally {
    clearTimeout(timer);
  }
}
