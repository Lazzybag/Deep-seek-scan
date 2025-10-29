import axios from 'axios';

const RPC_URL = 'https://polygon-rpc.com';
const QUICKSWAP_FACTORY = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';

async function debugFactory() {
    console.log('🔍 Debugging QuickSwap Factory...\n');
    
    // Test 1: Check if factory contract exists
    const codeCall = await axios.post(RPC_URL, {
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [QUICKSWAP_FACTORY, 'latest'],
        id: 1
    });
    
    console.log('📄 Factory contract code length:', codeCall.data.result.length);
    
    // Test 2: Try different method signatures
    const methods = [
        { name: 'allPairsLength', sig: '0x0dfe1681' },
        { name: 'allPairsLength (alt)', sig: '0x1e3dd18b' },
        { name: 'totalPairs', sig: '0xe17cbf50' }
    ];
    
    for (const method of methods) {
        try {
            const response = await axios.post(RPC_URL, {
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: QUICKSWAP_FACTORY,
                    data: method.sig
                }, 'latest'],
                id: 1
            });
            
            const result = response.data.result;
            const decimalResult = result ? parseInt(result, 16) : 0;
            console.log(`🔧 ${method.name}: ${result} (${decimalResult} pools)`);
        } catch (e) {
            console.log(`❌ ${method.name} failed: ${e.message}`);
        }
    }
    
    // Test 3: Check a known working pool
    console.log('\n📋 Checking known QuickSwap pool...');
    const knownPool = '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827'; // WMATIC/USDC
    const reservesCall = await axios.post(RPC_URL, {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
            to: knownPool,
            data: '0x0902f1ac' // getReserves()
        }, 'latest'],
        id: 1
    });
    
    console.log('�� Known pool reserves:', reservesCall.data.result);
}

debugFactory().catch(console.error);
