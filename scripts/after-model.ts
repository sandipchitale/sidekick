import { appendFileSync } from 'fs';
import { readJsonStdin, getVolleyFilePath, safeExecute, getSidekickDir } from './utils.ts';
import { execSync } from 'child_process';

(async () => {
    const sidekickDir = getSidekickDir();
    execSync(`code -n ${sidekickDir}`);
    await safeExecute(async () => {
        const json = await readJsonStdin<any>();
        const sessionId = json.session_id;
        const filePath = getVolleyFilePath(sessionId);
        appendFileSync(filePath, `${json.llm_response.text}`);
    });
})();
