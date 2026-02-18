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

const json = await readJsonStdin<any>();

const hookName = json.hook_event_name;

(async () => {
    try {
        switch (hookName) {
            case 'SessionStart':
                await safeExecute(async () => {
                    const sidekickDir = getSidekickDir();
                    execSync(`code -n ${sidekickDir}`); 
                    const sessionId = json.session_id;
                    const filePath = getVolleyFilePath(sessionId);
                    const timestamp = new Date(json.timestamp).toLocaleString();
                    writeFileSync(filePath, `\n\n# Session: ${sessionId} ( ${timestamp} ) \n\n`);
                    execSync(`code ${join(getSidekickDir(), `${sessionId}.md`)}`);
                });
                break;
            case 'BeforeModel':
                await safeExecute(async () => {
                    const sidekickDir = getSidekickDir();
                    execSync(`code -n ${sidekickDir}`); 
                    const sessionId = json.session_id;
                    const filePath = getVolleyFilePath(sessionId);
                    if (json.llm_request.messages.at(-1).content !== '') {
                        const timestamp = new Date(json.timestamp).toLocaleString();
                        appendFileSync(filePath, `\n\n## Prompt ( Model: ${json.llm_request.model} ) ( ${timestamp} )\n\n${json.llm_request.messages.at(-1).content}`);
                        appendFileSync(filePath, `\n\n### Response\n\n`);
                    }
                    execSync(`code ${filePath}`);
                });
                break;
            case 'AfterModel':
                {
                    const sidekickDir = getSidekickDir();
                    execSync(`code -n ${sidekickDir}`);
                    await safeExecute(async () => {
                        const sessionId = json.session_id;
                        const filePath = getVolleyFilePath(sessionId);
                        appendFileSync(filePath, `${json.llm_response.text}`);
                    });
                }
                break;
            case 'SessionEnd':
                await safeExecute(async () => {
                    if (process.env.GEMINI_SIDEKICK_KEEP_SESSION_FILE === 'true') {
                        return;
                    }
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
