import axios from 'axios';

const GECKO_API = 'https://api.geckoterminal.com/api/v2';
const MAX_TVL = 50000;

async function findSmallPoolsFromGecko() {
    console.log('🔍 Fetching REAL small pools from GeckoTerminal...\n');
    
    try {
        // USE WORKING ENDPOINT: polygon_pos
        const response = await axios.get(`${GECKO_API}/networks/polygon_pos/trending_pools`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const pools = response.data.data;
        console.log(`📊 Found ${pools.length} trending pools from GeckoTerminal\n`);
        
        const smallPools = [];
        
        for (const pool of pools) {
            const attributes = pool.attributes;
            const tvl = parseFloat(attributes.reserve_in_usd || '0');
            const address = attributes.address;
            const name = attributes.name || 'Unknown Pool';
            
            console.log(`🏊 ${name}`);
            console.log(`   Address: ${address}`);
            console.log(`   TVL: $${tvl.toFixed(2)}`);
            console.log(`   Volume 24h: $${parseFloat(attributes.volume_usd?.h24 || '0').toFixed(2)}`);
            console.log(`   Dex: ${attributes.dex_name || 'Unknown'}`);
            
            if (tvl < MAX_TVL && tvl > 100) {
                console.log(`   ✅ VULNERABLE CANDIDATE!`);
                smallPools.push({
                    address: address,
                    name: name,
                    tvl: tvl,
                    volume24h: parseFloat(attributes.volume_usd?.h24 || '0'),
                    dex: attributes.dex_name || 'Unknown'
                });
            } else if (tvl <= 100) {
                console.log(`   �� Too small/dead`);
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
            
            console.log('\n🚀 Now update your scanner with these addresses and run: node index.js');
        } else {
            console.log('💡 No small pools in trending list. All pools are too large.');
            console.log('   Try checking new pools or different DEXs...');
        }
        
        return smallPools;
        
    } catch (error) {
        console.log('❌ GeckoTerminal API failed:', error.message);
        return [];
    }
}

// Also get new pools
async function getNewPools() {
    try {
        console.log('\n🔍 Checking new pools...');
        const response = await axios.get(`${GECKO_API}/networks/polygon_pos/new_pools`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const pools = response.data.data.slice(0, 15);
        const smallPools = [];
        
        console.log(`📊 Found ${pools.length} new pools\n`);
        
        for (const pool of pools) {
            const attributes = pool.attributes;
            const tvl = parseFloat(attributes.reserve_in_usd || '0');
            const address = attributes.address;
            const name = attributes.name || 'New Pool';
            
            console.log(`🆕 ${name}`);
            console.log(`   Address: ${address}`);
            console.log(`   TVL: $${tvl.toFixed(2)}`);
            console.log(`   Dex: ${attributes.dex_name || 'Unknown'}`);
            
            if (tvl < MAX_TVL && tvl > 10) {
                console.log(`   ✅ NEW VULNERABLE POOL!`);
                smallPools.push({
                    address: address,
                    name: name,
                    tvl: tvl
                });
            }
            console.log('   ---');
        }
        
        if (smallPools.length > 0) {
            console.log('📋 NEW SMALL POOLS FOUND:');
            smallPools.forEach(pool => {
                console.log(`{ address: '${pool.address}', description: '${pool.name} ($${pool.tvl.toFixed(0)} TVL)' },`);
            });
        }
        
        return smallPools;
        
    } catch (error) {
        console.log('❌ Failed to fetch new pools:', error.message);
        return [];
    }
}

async function main() {
    const trendingPools = await findSmallPoolsFromGecko();
    const newPools = await getNewPools();
    
    const allPools = [...trendingPools, ...newPools];
    
    if (allPools.length === 0) {
        console.log('\n💡 No small pools found. The scanner works but needs pool addresses.');
        console.log('   You can manually add pool addresses from:');
        console.log('   - DexScreener.com (Polygon POS)');
        console.log('   - DeFiLlama (Polygon pools)');
        console.log('   - Community sources');
    }
}

main().catch(console.error);
