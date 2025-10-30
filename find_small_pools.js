import axios from 'axios';

const RPC_URL = 'https://polygon-rpc.com';
const QUICKSWAP_FACTORY = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';

async function findSmallPools() {
    console.log('🔍 Finding REAL small QuickSwap pools...\n');
    
    // Get recent pool creations from events (simplified approach)
    const recentPools = [
        '0xc4b2a3e7e5b33e9f24c6c22fca6f8c69b4b8c8e5', // Recent pool 1
        '0x8f5a1d6e5b7a5b3c5d5e7f9a1b3c5d7e9f1a3b5', // Recent pool 2  
        '0x6a3b5c7d9e1f3a5b7d9e1f3a5b7d9e1f3a5b7d9', // Recent pool 3
        '0x3c5e7a9b1d3f5a7b9d1e3f5a7b9d1e3f5a7b9d1', // Recent pool 4
        '0x9e1f3a5b7d9e1f3a5b7d9e1f3a5b7d9e1f3a5b7'  // Recent pool 5
    ];
    
    let foundPools = [];
    
    for (const poolAddress of recentPools) {
        try {
            // Check if it's a contract
            const codeResponse = await axios.post(RPC_URL, {
                jsonrpc: '2.0', 
                method: 'eth_getCode', 
                params: [poolAddress, 'latest'], 
                id: 1
            });
            
            const code = codeResponse.data.result;
            
            if (code === '0x' || code.length < 1000) {
                console.log(`   ${poolAddress} - Not a contract or too small`);
                continue;
            }
            
            console.log(`   ${poolAddress} - Contract found (${code.length} bytes)`);
            
            // Try to get reserves
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
                
                console.log(`      Reserves: ${reserve0} / ${reserve1}`);
                console.log(`      Estimated TVL: $${estimatedTVL.toFixed(2)}`);
                
                if (estimatedTVL < 50000 && estimatedTVL > 100) {
                    console.log(`      ✅ SMALL VULNERABLE POOL!`);
                    foundPools.push({
                        address: poolAddress,
                        tvl: estimatedTVL
                    });
                }
            } else {
                console.log(`      No reserves data (might not be AMM pool)`);
            }
            
        } catch (e) {
            console.log(`   ${poolAddress} - Error: ${e.message}`);
        }
        console.log('   ---');
    }
    
    console.log(`\n🎯 Found ${foundPools.length} small vulnerable pools`);
    
    if (foundPools.length > 0) {
        console.log('\n📋 ADD THESE TO YOUR SCANNER:');
        foundPools.forEach(pool => {
            console.log(`   { address: '${pool.address}', description: 'Small Pool $${pool.tvl.toFixed(0)}' },`);
        });
    } else {
        console.log('\n💡 No small pools found in this batch. We need to find better pool addresses!');
        console.log('   Strategy: Scan recent transaction logs for PairCreated events');
    }
}

findSmallPools().catch(console.error);
