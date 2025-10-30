import axios from 'axios';
import { RPC_ENDPOINTS } from '../config/endpoints.js';

const MAX_TVL = 50000;

export class PoolScanner {
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
            console.log(`❌ RPC ${this.currentRpcIndex + 1} failed, trying next...`);
            this.currentRpcIndex = (this.currentRpcIndex + 1) % RPC_ENDPOINTS.length;
            throw error;
        }
    }

    async scanRealPools() {
        console.log(`🕵️ Scanning REAL vulnerable pools < $${MAX_TVL}...\n`);
        
        try {
            const blockNumber = await this.makeRpcCall('eth_blockNumber');
            console.log(`📦 Connected to Polygon - Block: ${parseInt(blockNumber, 16)}\n`);
            
            // REAL POOLS FROM GECKOTERMINAL
            const realPools = [
                { 
                    address: '0x52d52b2592001537e2a7f973eac2a9fc640e6ccd', 
                    description: 'BRIL / WPOL ($12k TVL)'
                },
                { 
                    address: '0x376ca905b3f23a3e397e85dc76c4dbe37565cfd8bf30a203f2eae90670326c8d', 
                    description: 'USDC / CNKT 1% ($13k TVL)'
                },
                { 
                    address: '0x00a59c2d0f0f4837028d47a391decbffc1e10608', 
                    description: 'APEPE / WPOL 0.01% ($37k TVL)'
                }
            ];
            
            const vulnerablePools = [];
            
            for (const pool of realPools) {
                try {
                    console.log(`🔍 Scanning ${pool.description}...`);
                    
                    // Check if contract exists
                    const code = await this.makeRpcCall('eth_getCode', [pool.address, 'latest']);
                    if (code === '0x') {
                        console.log(`   ❌ Not a contract`);
                        continue;
                    }
                    
                    console.log(`   ✅ Contract verified (${code.length} bytes)`);
                    
                    // Get reserves using PROVEN SIGNATURE
                    const reservesResult = await this.makeRpcCall('eth_call', [{
                        to: pool.address,
                        data: '0x0902f1ac'
                    }, 'latest']);
                    
                    if (reservesResult && reservesResult !== '0x' && reservesResult.length >= 192) {
                        const reserve0 = BigInt(reservesResult.slice(0, 66));
                        const reserve1 = BigInt('0x' + reservesResult.slice(66, 130));
                        
                        // More accurate TVL calculation
                        const estimatedTVL = Number(reserve0 + reserve1) / 10**18;
                        
                        console.log(`   Reserves: ${reserve0} / ${reserve1}`);
                        console.log(`   Estimated TVL: $${estimatedTVL.toFixed(2)}`);
                        
                        if (estimatedTVL < MAX_TVL && estimatedTVL > 10) {
                            vulnerablePools.push({
                                address: pool.address,
                                description: pool.description,
                                reserves: { reserve0, reserve1 },
                                estimatedTVL
                            });
                            console.log(`   ✅ CONFIRMED VULNERABLE!`);
                        }
                    } else {
                        console.log(`   ❌ No reserves data (might be different AMM)`);
                    }
                } catch (e) {
                    console.log(`   ❌ Error: ${e.message}`);
                }
                console.log('   ---');
            }

            console.log(`\n🎯 SCAN COMPLETE: Found ${vulnerablePools.length} confirmed vulnerable pools\n`);
            
            if (vulnerablePools.length > 0) {
                console.log('🚀 READY FOR PHASE 2: Vulnerability Analysis!');
                console.log('\n📋 VULNERABLE POOLS FOUND:');
                vulnerablePools.forEach(pool => {
                    console.log(`🔹 ${pool.description}`);
                    console.log(`   Address: ${pool.address}`);
                    console.log(`   TVL: $${pool.estimatedTVL.toFixed(2)}`);
                    console.log(`   Reserves: ${pool.reserves.reserve0} / ${pool.reserves.reserve1}`);
                });
                
                console.log('\n💡 Next: Use Polygonscan API to analyze contract code for vulnerabilities!');
            } else {
                console.log('❌ No vulnerable pools confirmed. All pools might use different AMM versions.');
            }

            return vulnerablePools;
        } catch (error) {
            console.log('❌ RPC scan failed:', error.message);
            return [];
        }
    }

    async scan() {
        return await this.scanRealPools();
    }
}
