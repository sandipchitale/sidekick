import { writeFileSync } from 'fs';
import { readJsonStdin, getVolleyFilePath, safeExecute, getSidekickDir } from './utils.ts';
import { execSync } from 'child_process';

(async () => {
    await safeExecute(async () => {
        const sidekickDir = getSidekickDir();
        execSync(`code -n ${sidekickDir}`);
        const json = await readJsonStdin<any>();
        const sessionId = json.session_id;
        const filePath = getVolleyFilePath(sessionId);
        writeFileSync(filePath, '');
        execSync(`code ${filePath}`);
    });
})();
