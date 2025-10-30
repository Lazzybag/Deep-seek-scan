import axios from 'axios';

const RPC_URL = 'https://polygon-rpc.com';

async function debugPoolFinding() {
    console.log('🔍 DEBUGGING POOL FINDING ERRORS...\n');
    
    const testAddresses = [
        '0xc4b2a3e7e5b33e9f24c6c22fca6f8c69b4b8c8e5',
        '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827' // Known working pool
    ];
    
    for (const address of testAddresses) {
        console.log(`Testing ${address}:`);
        
        try {
            // Test 1: eth_getCode
            const codeResponse = await axios.post(RPC_URL, {
                jsonrpc: '2.0', 
                method: 'eth_getCode', 
                params: [address, 'latest'], 
                id: 1
            });
            
            console.log('   eth_getCode response:', JSON.stringify(codeResponse.data));
            
            if (codeResponse.data && codeResponse.data.result) {
                console.log('   Code length:', codeResponse.data.result.length);
            } else {
                console.log('   ❌ NO RESULT IN RESPONSE');
            }
            
        } catch (e) {
            console.log('   ❌ eth_getCode error:', e.message);
            console.log('   Response data:', e.response?.data);
        }
        
        console.log('   ---');
    }
}

debugPoolFinding().catch(console.error);
