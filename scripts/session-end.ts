import { existsSync, unlinkSync } from 'fs';
import { readJsonStdin, getVolleyFilePath, safeExecute } from './utils.ts';

(async () => {
    await safeExecute(async () => {
        const json = await readJsonStdin<any>();
        const sessionId = json.session_id;
        const filePath = getVolleyFilePath(sessionId);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    });
})();