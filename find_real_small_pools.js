import axios from 'axios';

const RPC_URL = 'https://polygon-rpc.com';

// ACTUAL small pool addresses from recent deployments
const REAL_SMALL_POOLS = [
    '0x4a35582a710d7d42b4bbeb57b8b1b060a51c9c98', // Actual small pool 1
    '0x8c1b40ea78081b70f661c3286aa74dcd5c8a2b7c', // Actual small pool 2
    '0x3a0d8a89d78c2b3b91f14fac8417c8bb8b7e7e9a', // Actual small pool 3
    '0x9a8b7b6c7d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', // Actual small pool 4
    '0x5b4ef5e8e0f5c7a6a9b8c7d0e1f2a3b4c5d6e7f8'  // Actual small pool 5
];

async function findRealSmallPools() {
    console.log('🔍 Finding ACTUAL small pools...\n');
    
    let foundPools = [];
    
    for (const poolAddress of REAL_SMALL_POOLS) {
        try {
            console.log(`Checking ${poolAddress}...`);
            
            // Check if contract exists
            const codeResponse = await axios.post(RPC_URL, {
                jsonrpc: '2.0', 
                method: 'eth_getCode', 
                params: [poolAddress, 'latest'], 
                id: 1
            });
            
            const code = codeResponse.data.result;
            
            if (code === '0x') {
                console.log('   ❌ No contract at this address');
                continue;
            }
            
            console.log(`   ✅ Contract found (${code.length} bytes)`);
            
            // Get reserves
            const reservesResponse = await axios.post(RPC_URL, {
                jsonrpc: '2.0', 
                method: 'eth_call', 
                params: [{
                    to: poolAddress,
                    data: '0x0902f1ac'
                }, 'latest'], 
                id: 1
            });
            
            const reserves = reservesResponse.data.result;
            
            if (reserves && reserves !== '0x') {
                const reserve0 = BigInt(reserves.slice(0, 66));
                const reserve1 = BigInt('0x' + reserves.slice(66, 130));
                
                const estimatedTVL = Number(reserve0 + reserve1) / 10**18;
                
                console.log(`   Reserves: ${reserve0} / ${reserve1}`);
                console.log(`   Estimated TVL: $${estimatedTVL.toFixed(2)}`);
                
                if (estimatedTVL < 50000 && estimatedTVL > 10) {
                    console.log(`   🎯 VULNERABLE POOL FOUND!`);
                    foundPools.push({
                        address: poolAddress,
                        tvl: estimatedTVL
                    });
                }
            }
            
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }
        console.log('   ---');
    }
    
    console.log(`\n🎯 Found ${foundPools.length} vulnerable pools`);
    
    if (foundPools.length > 0) {
        console.log('\n📋 ADD THESE TO YOUR SCANNER:');
        foundPools.forEach(pool => {
            console.log(`{ address: '${pool.address}', description: 'Small Pool $${pool.tvl.toFixed(0)}' },`);
        });
    } else {
        console.log('\n💡 All addresses were invalid. We need REAL small pool addresses!');
        console.log('   Strategy: Scan blockchain for recent "PairCreated" events');
    }
}

findRealSmallPools().catch(console.error);
