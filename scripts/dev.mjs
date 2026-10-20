import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createStaticServer } from './static-server.mjs';
import './prepare-react.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = createStaticServer(root);
// Only routes without React implementations use this local compatibility server.
legacy.listen(0, '127.0.0.1', () => {
  const origin = `http://127.0.0.1:${legacy.address().port}`;
  const next = spawn(
    process.execPath,
    [path.join(root, 'react-app/node_modules/next/dist/bin/next'), 'dev', ...process.argv.slice(2)],
    {
      cwd: path.join(root, 'react-app'),
      stdio: 'inherit',
      env: { ...process.env, LEGACY_ORIGIN: origin },
    }
  );
  const stop = () => {
    next.kill();
    legacy.close();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  next.on('error', (error) => {
    console.error(error);
    legacy.close();
    process.exitCode = 1;
  });
  next.on('exit', (code) => {
    legacy.close();
    process.exitCode = code || 0;
  });
});
