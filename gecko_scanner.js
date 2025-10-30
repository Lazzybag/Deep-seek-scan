import axios from 'axios';

const GECKO_API = 'https://api.geckoterminal.com/api/v2';
const MAX_TVL = 50000;

async function findSmallPoolsFromGecko() {
    console.log('🔍 Fetching REAL small pools from GeckoTerminal...\n');
    
    try {
        // Get trending pools on Polygon (they have TVL data)
        const response = await axios.get(`${GECKO_API}/networks/polygon/trending_pools`, {
            timeout: 10000
        });
        
        const pools = response.data.data;
        console.log(`📊 Found ${pools.length} trending pools from GeckoTerminal\n`);
        
        const smallPools = [];
        
        for (const pool of pools) {
            const attributes = pool.attributes;
            const tvl = parseFloat(attributes.reserve_in_usd || '0');
            const address = attributes.address;
            
            console.log(`🏊 ${attributes.name}`);
            console.log(`   Address: ${address}`);
            console.log(`   TVL: $${tvl.toFixed(2)}`);
            console.log(`   Volume 24h: $${parseFloat(attributes.volume_usd?.h24 || '0').toFixed(2)}`);
            
            if (tvl < MAX_TVL && tvl > 100) { // Filter small but not dead pools
                console.log(`   ✅ VULNERABLE CANDIDATE!`);
                smallPools.push({
                    address: address,
                    name: attributes.name,
                    tvl: tvl,
                    volume24h: parseFloat(attributes.volume_usd?.h24 || '0')
                });
            } else if (tvl <= 100) {
                console.log(`   💀 Too small/dead`);
            } else {
                console.log(`   💰 Too large`);
            }
            console.log('   ---');
        }
        
        console.log(`\n🎯 Found ${smallPools.length} vulnerable small pools!\n`);
        
        if (smallPools.length > 0) {
            console.log('📋 ADD THESE REAL POOLS TO YOUR SCANNER:');
            smallPools.forEach(pool => {
                console.log(`{ address: '${pool.address}', description: '${pool.name} ($${pool.tvl.toFixed(0)} TVL)' },`);
            });
            
            console.log('\n🚀 Now run your vulnerability scanner on these REAL pools!');
        } else {
            console.log('💡 No small pools in trending. Trying new pools...');
            await findNewPoolsFromGecko();
        }
        
        return smallPools;
        
    } catch (error) {
        console.log('❌ GeckoTerminal API failed:', error.message);
        console.log('💡 Falling back to alternative method...');
        await findPoolsAlternative();
        return [];
    }
}

async function findNewPoolsFromGecko() {
    try {
        console.log('\n🔍 Checking new pools on Polygon...');
        const response = await axios.get(`${GECKO_API}/networks/polygon/new_pools`, {
            timeout: 10000
        });
        
        const pools = response.data.data.slice(0, 10); // First 10 new pools
        const smallPools = [];
        
        for (const pool of pools) {
            const attributes = pool.attributes;
            const tvl = parseFloat(attributes.reserve_in_usd || '0');
            const address = attributes.address;
            
            console.log(`🆕 ${attributes.name}`);
            console.log(`   Address: ${address}`);
            console.log(`   TVL: $${tvl.toFixed(2)}`);
            
            if (tvl < MAX_TVL && tvl > 10) {
                console.log(`   ✅ NEW VULNERABLE POOL!`);
                smallPools.push({
                    address: address,
                    name: attributes.name,
                    tvl: tvl
                });
            }
            console.log('   ---');
        }
        
        if (smallPools.length > 0) {
            console.log('📋 NEW POOLS FOUND:');
            smallPools.forEach(pool => {
                console.log(`{ address: '${pool.address}', description: '${pool.name} ($${pool.tvl.toFixed(0)} TVL)' },`);
            });
        }
        
    } catch (error) {
        console.log('❌ Failed to fetch new pools:', error.message);
    }
}

async function findPoolsAlternative() {
    console.log('\n🔍 Using alternative method: Known small pools...');
    
    // Some known small pools (you can expand this list)
    const knownSmallPools = [
        '0x4a35582a710d7d42b4bbeb57b8b1b060a51c9c98',
        '0x8c1b40ea78081b70f661c3286aa74dcd5c8a2b7c'
    ];
    
    console.log('💡 Add these to test scanner functionality:');
    knownSmallPools.forEach(addr => {
        console.log(`{ address: '${addr}', description: 'Test Pool' },`);
    });
}

findSmallPoolsFromGecko().catch(console.error);
