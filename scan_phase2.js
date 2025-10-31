import { AdvancedPoolScanner } from './src/scanner_phase2_fixed.js';

async function main() {
    const scanner = new AdvancedPoolScanner();
    await scanner.scanAdvanced();
}

main().catch(console.error);
