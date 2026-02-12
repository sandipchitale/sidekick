import { join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync } from 'fs';

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export async function readJsonStdin<T>(): Promise<T> {
    const stdin = await readStdin();
    return JSON.parse(stdin);
}


export function getSidekickDir(): string {
    const sidekickDir = join(tmpdir(), 'gemini-cli-sidekick');
    mkdirSync(sidekickDir, { recursive: true });
    return sidekickDir;
}

export function getVolleyFilePath(sessionId: string): string {
    return join(getSidekickDir(), `${sessionId}.md`);
}

export async function safeExecute(fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
    } catch (error) {
        console.error('Error executing hook:', error);
        process.exit(1);
    }
}
