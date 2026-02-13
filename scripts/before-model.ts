import { appendFileSync } from 'fs';
import { readJsonStdin, getVolleyFilePath, safeExecute, getSidekickDir } from './utils.ts';
import { execSync } from 'child_process';

(async () => {
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
})();
