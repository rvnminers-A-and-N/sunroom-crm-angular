import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { streamSSE } from './sse-stream';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build a minimal Response whose body is a ReadableStream of SSE lines. */
function sseResponse(raw: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(raw));
      controller.close();
    },
  });
  return new Response(stream, { status, statusText: status === 200 ? 'OK' : 'Error' });
}

/** Collect every yielded value from an async generator into an array. */
async function collect(gen: AsyncGenerator<string, void, undefined>): Promise<string[]> {
  const tokens: string[] = [];
  for await (const t of gen) {
    tokens.push(t);
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('streamSSE', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('yields tokens from SSE data lines and stops at [DONE]', async () => {
    const body =
      'data: {"token":"Hello"}\n\ndata: {"token":" world"}\n\ndata: [DONE]\n\n';

    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    const tokens = await collect(streamSSE('/test', {}, 'tok123'));
    expect(tokens).toEqual(['Hello', ' world']);
  });

  it('skips empty lines and lines that do not start with "data: "', async () => {
    const body = '\n\nevent: ping\n\ndata: {"token":"a"}\n\ndata: [DONE]\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual(['a']);
  });

  it('throws an error when the response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse('', 500));

    await expect(collect(streamSSE('/test', {}, null))).rejects.toThrow(
      'Stream request failed: 500',
    );
  });

  it('throws when the parsed JSON contains an error field', async () => {
    const body = 'data: {"error":"something broke"}\n\ndata: [DONE]\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    await expect(collect(streamSSE('/test', {}, null))).rejects.toThrow(
      'something broke',
    );
  });

  it('continues on SyntaxError (malformed JSON)', async () => {
    const body =
      'data: NOT-JSON\n\ndata: {"token":"ok"}\n\ndata: [DONE]\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual(['ok']);
  });

  it('re-throws non-SyntaxError errors from the JSON parse block', async () => {
    // An error field triggers `throw new Error(parsed.error)` which is NOT a
    // SyntaxError, so it must propagate.
    const body = 'data: {"error":"fatal"}\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    await expect(collect(streamSSE('/test', {}, null))).rejects.toThrow('fatal');
  });

  it('sends an Authorization header when a token is provided', async () => {
    const body = 'data: [DONE]\n\n';
    const mockFetch = vi.fn().mockResolvedValue(sseResponse(body));
    globalThis.fetch = mockFetch;

    await collect(streamSSE('/path', { q: 1 }, 'my-jwt'));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/path'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt',
        }),
      }),
    );
  });

  it('omits Authorization header when token is null', async () => {
    const body = 'data: [DONE]\n\n';
    const mockFetch = vi.fn().mockResolvedValue(sseResponse(body));
    globalThis.fetch = mockFetch;

    await collect(streamSSE('/path', {}, null));

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('passes the signal to fetch', async () => {
    const body = 'data: [DONE]\n\n';
    const mockFetch = vi.fn().mockResolvedValue(sseResponse(body));
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await collect(streamSSE('/path', {}, null, controller.signal));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('handles multi-chunk streaming correctly', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"token":"He',
      'llo"}\n\ndata: {"token":" W',
      'orld"}\n\ndata: [DONE]\n\n',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
    const response = new Response(stream, { status: 200 });
    globalThis.fetch = vi.fn().mockResolvedValue(response);

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual(['Hello', ' World']);
  });

  it('skips data lines where token field is absent', async () => {
    const body = 'data: {"other":"value"}\n\ndata: {"token":"yes"}\n\ndata: [DONE]\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual(['yes']);
  });

  it('handles stream that ends without [DONE] (reader done)', async () => {
    const body = 'data: {"token":"only"}\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual(['only']);
  });

  it('handles pull-based ReadableStream with multiple read() calls', async () => {
    const encoder = new TextEncoder();
    const parts = [
      'data: {"token":"A"}\n\n',
      'data: {"token":"B"}\n\n',
      'data: [DONE]\n\n',
    ];
    let index = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index < parts.length) {
          controller.enqueue(encoder.encode(parts[index]));
          index++;
        } else {
          controller.close();
        }
      },
    });
    const response = new Response(stream, { status: 200 });
    globalThis.fetch = vi.fn().mockResolvedValue(response);

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual(['A', 'B']);
  });

  it('handles empty stream body (reader immediately done)', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    const response = new Response(stream, { status: 200 });
    globalThis.fetch = vi.fn().mockResolvedValue(response);

    const tokens = await collect(streamSSE('/test', {}, null));
    expect(tokens).toEqual([]);
  });

  it('uses empty string fallback when lines.pop() returns undefined', async () => {
    // Temporarily patch Array.prototype.pop to return undefined once,
    // exercising the ?? '' fallback branch on line 35.
    const originalPop = Array.prototype.pop;
    let callCount = 0;
    Array.prototype.pop = function (this: unknown[]) {
      callCount++;
      // The first pop call in the split-handling loop is the one on line 35.
      // Let it return undefined once to exercise the ?? '' branch.
      if (callCount === 1) {
        originalPop.call(this); // actually pop the element
        return undefined as unknown as ReturnType<typeof originalPop>;
      }
      return originalPop.call(this);
    };

    const body = 'data: {"token":"pop"}\n\ndata: [DONE]\n\n';
    globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

    try {
      const tokens = await collect(streamSSE('/test', {}, null));
      expect(tokens).toEqual(['pop']);
    } finally {
      Array.prototype.pop = originalPop;
    }
  });
});
