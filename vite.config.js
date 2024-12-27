import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: './public', // Define a raiz como o diretório do projeto
    build: {
        outDir: path.resolve(__dirname, './dist'), // Saída dos arquivos
        emptyOutDir: true, // Limpa a pasta de saída antes do build
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'), // Alias para a pasta "src"
            three: path.resolve(__dirname, './node_modules/three'),
        },
    },
    server: {
        open: false, // Abre automaticamente o navegador
    },
});
