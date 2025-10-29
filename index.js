import { PoolScanner } from './src/scanner.js';

async function main() {
    const scanner = new PoolScanner();
    await scanner.scan();
}

main().catch(console.error);
