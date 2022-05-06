// this file is ignored by prettier because it hits SyntaxError on `import.meta.url`

import {fileURLToPath} from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
export const projectRootDir = path.resolve(__filename, '../..');
