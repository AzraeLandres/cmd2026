export function isValidId(value: unknown): boolean {
  return /^[1-9][0-9]*$/.test(String(value ?? ""));
}

export async function readBody(req: AsyncIterable<Buffer>): Promise<string> {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
}
