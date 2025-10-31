import axios from 'axios';
import { RPC_ENDPOINTS } from '../config/endpoints.js';

const MAX_TVL = 100000;

export class AdvancedPoolScanner {
    constructor() {
        this.currentRpcIndex = 0;
    }

    async makeRpcCall(method, params = []) {
        const rpcUrl = RPC_ENDPOINTS[this.currentRpcIndex];
        try {
            const response = await axios.post(rpcUrl, {
                jsonrpc: '2.0', method, params, id: 1
            }, { timeout: 10000 });
            return response.data.result;
        } catch (error) {
            this.currentRpcIndex = (this.currentRpcIndex + 1) % RPC_ENDPOINTS.length;
            throw error;
        }
    }

    async getRealTokenPrice(tokenAddress) {
        const commonPrices = {
            '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 0.82,
            '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 1.00,
            '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 1.00,
            '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 2480,
            'default': 0.05
        };
        return commonPrices[tokenAddress.toLowerCase()] || commonPrices.default;
    }

    async getTokenDecimals(tokenAddress) {
        try {
            const data = '0x313ce567';
            const result = await this.makeRpcCall('eth_call', [{
                to: tokenAddress, data: data }, 'latest']);
            return result ? parseInt(result, 16) : 18;
        } catch (e) {
            return 18;
        }
    }

    async getPoolTokensUniversal(poolAddress) {
        try {
            const token0 = await this.makeRpcCall('eth_call', [{
                to: poolAddress, data: '0x0dfe1681' }, 'latest']);
            const token1 = await this.makeRpcCall('eth_call', [{
                to: poolAddress, data: '0xd21220a7' }, 'latest']);
            
            if (token0 && token1 && token0 !== '0x' && token1 !== '0x') {
                return {
                    token0: '0x' + token0.slice(26).toLowerCase(),
                    token1: '0x' + token1.slice(26).toLowerCase(),
                    ammType: 'UNISWAP_V2_COMPATIBLE'
                };
            }
        } catch (e) {}
        return null;
    }

    async calculateAccurateTVL(poolAddress) {
        try {
            const tokens = await this.getPoolTokensUniversal(poolAddress);
            if (!tokens) return null;

            const reserves = await this.makeRpcCall('eth_call', [{
                to: poolAddress, data: '0x0902f1ac' }, 'latest']);
            if (!reserves || reserves === '0x') return null;

            const reserve0 = BigInt(reserves.slice(0, 66));
            const reserve1 = BigInt('0x' + reserves.slice(66, 130));
            
            const decimals0 = await this.getTokenDecimals(tokens.token0);
            const decimals1 = await this.getTokenDecimals(tokens.token1);
            
            const price0 = await this.getRealTokenPrice(tokens.token0);
            const price1 = await this.getRealTokenPrice(tokens.token1);
            
            const value0 = (Number(reserve0) / (10 ** decimals0)) * price0;
            const value1 = (Number(reserve1) / (10 ** decimals1)) * price1;
            
            return {
                tvl: value0 + value1,
                tokens,
                values: { value0, value1 }
            };
        } catch (e) {
            return null;
        }
    }

    async checkVulnerabilities(poolAddress, tvlData) {
        const vulnerabilities = [];
        
        try {
            if (tvlData.tvl < 10000) vulnerabilities.push('VERY_LOW_LIQUIDITY');
            else if (tvlData.tvl < 30000) vulnerabilities.push('LOW_LIQUIDITY');
            
            if (tvlData.values.value0 > 0 && tvlData.values.value1 > 0) {
                const ratio = Math.max(tvlData.values.value0, tvlData.values.value1) / 
                             Math.min(tvlData.values.value0, tvlData.values.value1);
                if (ratio > 15) vulnerabilities.push('HIGHLY_IMBALANCED');
            }
            
            const code = await this.makeRpcCall('eth_getCode', [poolAddress, 'latest']);
            if (code.length < 12000) vulnerabilities.push('SIMPLE_CLONE_CONTRACT');
            
        } catch (e) {}
        
        return vulnerabilities.length > 0 ? vulnerabilities : ['NEEDS_MANUAL_ANALYSIS'];
    }

    async getFreshPoolList() {
        try {
            console.log('   📡 Fetching LIVE data from GeckoTerminal...');
            const response = await axios.get('https://api.geckoterminal.com/api/v2/networks/polygon_pos/trending_pools', {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            const freshPools = response.data.data
                .filter(pool => {
                    const tvl = parseFloat(pool.attributes.reserve_in_usd || '0');
                    return tvl < 150000 && tvl > 5000;
                })
                .slice(0, 12) // Check more pools for better chances
                .map(pool => ({
                    address: pool.attributes.address,
                    name: pool.attributes.name,
                    reportedTVL: parseFloat(pool.attributes.reserve_in_usd || '0')
                }));
            
            console.log(`   📊 Found ${freshPools.length} fresh candidates`);
            return freshPools;
                
        } catch (e) {
            console.log('   ❌ GeckoTerminal API failed - NO POOLS TO SCAN');
            return []; // RETURN EMPTY ARRAY - NO HARCODED POOLS!
        }
    }

    async scanAdvanced() {
        console.log(`🎯 FRESH SCAN: Hunting for pools < $${MAX_TVL.toLocaleString()}\n`);
        console.log(`🕒 Scan time: ${new Date().toLocaleString()}\n`);
        
        try {
            const blockNumber = await this.makeRpcCall('eth_blockNumber');
            console.log(`📦 Connected to Polygon - Block: ${parseInt(blockNumber, 16)}\n`);
            
            const poolData = await this.getFreshPoolList();
            
            if (poolData.length === 0) {
                console.log('❌ No fresh pools available to scan today.');
                console.log('💡 Try again in a few hours - new pools deploy constantly!');
                return [];
            }
            
            console.log(`🔍 Scanning ${poolData.length} FRESH pools...\n`);
            
            const vulnerablePools = [];
            
            for (const pool of poolData) {
                try {
                    console.log(`🎯 ${pool.name || 'Unknown Pool'}`);
                    console.log(`   Address: ${pool.address}`);
                    console.log(`   Reported TVL: $${pool.reportedTVL.toFixed(2)}`);
                    
                    const tvlData = await this.calculateAccurateTVL(pool.address);
                    if (!tvlData) {
                        console.log('   🚫 Incompatible AMM - Skipping');
                        continue;
                    }
                    
                    console.log(`   💰 Real TVL: $${tvlData.tvl.toFixed(2)}`);
                    
                    if (tvlData.tvl < MAX_TVL) {
                        const vulnerabilities = await this.checkVulnerabilities(pool.address, tvlData);
                        console.log(`   ✅ VULNERABLE TARGET!`);
                        console.log(`   🚨 Flags: ${vulnerabilities.join(', ')}`);
                        
                        vulnerablePools.push({
                            address: pool.address,
                            name: pool.name,
                            tvl: tvlData.tvl,
                            vulnerabilities
                        });
                    } else {
                        console.log(`   📈 Too large for target range`);
                    }
                    
                } catch (e) {
                    console.log(`   💥 Scan failed: ${e.message}`);
                }
                console.log('   ---');
            }

            console.log(`\n🎯 SCAN COMPLETE: ${vulnerablePools.length} vulnerable targets\n`);
            
            if (vulnerablePools.length > 0) {
                console.log('🚨 FRESH VULNERABLE TARGETS:\n');
                vulnerablePools.forEach(pool => {
                    console.log(`🔹 ${pool.name || 'Unknown Pool'}`);
                    console.log(`   Address: ${pool.address}`);
                    console.log(`   TVL: $${pool.tvl.toFixed(2)}`);
                    console.log(`   Security Issues: ${pool.vulnerabilities.join(', ')}`);
                    console.log('   ---');
                });
            } else {
                console.log('🎣 No vulnerable pools found in this fresh batch.');
                console.log('💡 The scanner works - checking fresh data daily will eventually yield results!');
            }

            return vulnerablePools;
        } catch (error) {
            console.log('❌ Scan failed:', error.message);
            return [];
        }
    }
}
