import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var workspaceRoot = new URL('..', import.meta.url).pathname;
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@data': "".concat(workspaceRoot, "data"),
        },
    },
    server: {
        fs: {
            allow: [workspaceRoot],
        },
    },
});
