import axios from 'axios';

const GECKO_API = 'https://api.geckoterminal.com/api/v2';

async function debugGeckoAPI() {
    console.log('🔍 Debugging GeckoTerminal API...\n');
    
    // Test different endpoint variations
    const endpoints = [
        '/networks/polygon/trending_pools',
        '/networks/polygon_pos/trending_pools',
        '/networks/matic/trending_pools',
        '/networks/polygon/pools',
        '/networks/polygon_pos/pools'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await axios.get(`${GECKO_API}${endpoint}`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            console.log(`✅ SUCCESS: Status ${response.status}`);
            console.log(`   Data keys:`, Object.keys(response.data));
            
            if (response.data.data && response.data.data.length > 0) {
                const pool = response.data.data[0];
                console.log(`   First pool: ${pool.attributes?.name || 'N/A'}`);
                console.log(`   TVL: $${pool.attributes?.reserve_in_usd || 'N/A'}`);
                break;
            }
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log(`   Error data:`, JSON.stringify(error.response.data).slice(0, 200));
            }
        }
        console.log('---');
    }
    
    // Test if API base is reachable
    console.log('\n🔧 Testing API base connectivity...');
    try {
        const baseTest = await axios.get('https://api.geckoterminal.com/api/v2', { timeout: 5000 });
        console.log('✅ API base reachable');
    } catch (e) {
        console.log('❌ API base unreachable:', e.message);
    }
}

debugGeckoAPI().catch(console.error);
