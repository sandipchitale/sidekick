import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { safeExecute, getSidekickDir, readJsonStdin, getVolleyFilePath } from './utils.ts';

(async () => {
    await safeExecute(async () => {
        const sidekickDir = getSidekickDir();
        execSync(`code -n ${sidekickDir}`);
        const json = await readJsonStdin<any>();
        console.log(JSON.stringify(json, null, 2));
        const sessionId = json.session_id;
        const filePath = getVolleyFilePath(sessionId);
        writeFileSync(filePath, '');
    });
})();
