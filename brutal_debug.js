import axios from 'axios';

const RPC_URL = 'https://polygon-rpc.com';
const TEST_POOL = '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827';

async function brutalDebug() {
    console.log('🔍 BRUTAL DEBUG - Finding the exact issue...\n');
    
    // Test 1: Basic RPC connection
    console.log('1. Testing RPC connection...');
    try {
        const block = await axios.post(RPC_URL, {
            jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1
        });
        console.log('   ✅ RPC OK - Block:', parseInt(block.data.result, 16));
    } catch (e) {
        console.log('   ❌ RPC FAILED:', e.message);
        return;
    }

    // Test 2: Check if pool contract exists
    console.log('2. Testing pool contract...');
    try {
        const code = await axios.post(RPC_URL, {
            jsonrpc: '2.0', method: 'eth_getCode', params: [TEST_POOL, 'latest'], id: 1
        });
        console.log('   ✅ Pool exists - Code length:', code.data.result.length);
    } catch (e) {
        console.log('   ❌ Pool check failed:', e.message);
        return;
    }

    // Test 3: Try different getReserves signatures
    console.log('3. Testing getReserves() signatures...');
    const signatures = [
        '0x0902f1ac', // Standard Uniswap V2
        '0x0dfe1681', // Alternative
        '0x1e3dd18b'  // Another alternative
    ];
    
    for (const sig of signatures) {
        try {
            const result = await axios.post(RPC_URL, {
                jsonrpc: '2.0', method: 'eth_call', params: [{
                    to: TEST_POOL,
                    data: sig
                }, 'latest'], id: 1
            }, { timeout: 5000 });
            
            if (result.data.result && result.data.result !== '0x') {
                console.log('   ✅ WORKING SIGNATURE:', sig);
                console.log('      Result:', result.data.result);
                return;
            } else {
                console.log('   ❌ Failed:', sig, '- Empty result');
            }
        } catch (e) {
            console.log('   ❌ Failed:', sig, '-', e.response?.data?.error?.message || e.message);
        }
    }
    
    console.log('\n💀 ALL SIGNATURES FAILED! QuickSwap might use different ABI');
}

brutalDebug().catch(console.error);
