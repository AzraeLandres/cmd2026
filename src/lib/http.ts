export function isValidId(value: unknown): boolean {
  const str = String(value ?? '');
  return /^[1-9][0-9]*$/.test(str);
}

export async function readBody(req: AsyncIterable<Buffer>): Promise<string> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  return body;
}
