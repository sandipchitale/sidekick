import { execSync } from 'child_process';
import { safeExecute, getSidekickDir } from './utils.ts';

(async () => {
    await safeExecute(async () => {
        const sidekickDir = getSidekickDir();
        execSync(`code -n ${sidekickDir}`);
    });
})();
