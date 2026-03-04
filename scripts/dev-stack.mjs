import { spawn } from 'node:child_process';

const children = [];

const start = (label, command, args) => {
    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: false,
        env: process.env
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.error(`${label} exited with code ${code}`);
        }
        process.exitCode = process.exitCode || code || 0;
    });

    children.push(child);
};

const shutdown = () => {
    children.forEach((child) => {
        if (!child.killed) {
            child.kill('SIGTERM');
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start('api', process.execPath, ['server/index.mjs']);
start('web', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev']);
