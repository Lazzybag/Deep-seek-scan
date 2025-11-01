import { AdvancedPoolScanner } from './src/scanner.js';

async function main() {
    const scanner = new AdvancedPoolScanner();
    await scanner.scanAdvanced();
}

main().catch(console.error);
