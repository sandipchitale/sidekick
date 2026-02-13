import { appendFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper functions (formerly in utils.ts)
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function readJsonStdin<T>(): Promise<T> {
    const stdin = await readStdin();
    return JSON.parse(stdin);
}


function getSidekickDir(): string {
    const sidekickDir = join(tmpdir(), 'gemini-cli-sidekick');
    mkdirSync(sidekickDir, { recursive: true });
    return sidekickDir;
}

function getVolleyFilePath(sessionId: string): string {
    return join(getSidekickDir(), `${sessionId}.md`);
}

async function safeExecute(fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
    } catch (error) {
        console.error('Error executing hook:', error);
        process.exit(1);
    }
}

// Sidekick main logic
const hookName = process.argv[2];

if (!hookName) {
    console.error('Usage: node sidekick.js <hook-name>');
    process.exit(1);
}

(async () => {
    try {
        switch (hookName) {
            case 'session-start':
                await safeExecute(async () => {
                    const sidekickDir = getSidekickDir();
                    execSync(`code -n ${sidekickDir}`);
                    const json = await readJsonStdin<any>();
                    // console.log(JSON.stringify(json, null, 2));
                    const sessionId = json.session_id;
                    const filePath = getVolleyFilePath(sessionId);
                    writeFileSync(filePath, '');
                });
                break;
            case 'before-model':
                await safeExecute(async () => {
                    const sidekickDir = getSidekickDir();
                    execSync(`code -n ${sidekickDir}`);
                    const json = await readJsonStdin<any>();
                    const sessionId = json.session_id;
                    const filePath = getVolleyFilePath(sessionId);
                    if (json.llm_request.messages.at(-1).content !== '') {
                        appendFileSync(filePath, `\n\n# Prompt\n\n${json.llm_request.messages.at(-1).content}\n\n# Response\n\n`);
                    }
                    execSync(`code ${filePath}`);
                });
                break;
            case 'after-model':
                 {
                    const sidekickDir = getSidekickDir();
                    // execSync(`code -n ${sidekickDir}`);
                    await safeExecute(async () => {
                        const json = await readJsonStdin<any>();
                        const sessionId = json.session_id;
                        const filePath = getVolleyFilePath(sessionId);
                        appendFileSync(filePath, `${json.llm_response.text}`);
                    });
                }
                break;
            case 'session-end':
                await safeExecute(async () => {
                    const json = await readJsonStdin<any>();
                    const sessionId = json.session_id;
                    const filePath = getVolleyFilePath(sessionId);
                    if (existsSync(filePath)) {
                        unlinkSync(filePath);
                    }
                });
                break;
            default:
                console.error(`Unknown hook: ${hookName}`);
                process.exit(1);
        }
    } catch (error) {
        console.error('Error executing hook:', error);
        process.exit(1);
    }
})();
