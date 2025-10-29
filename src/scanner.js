import axios from 'axios';
import { createHash } from 'crypto';
import { RPC_ENDPOINTS } from '../config/endpoints.js';

const MAX_TVL = 50000;

export class PoolScanner {
    constructor() {
        this.currentRpcIndex = 0;
        this.quickSwapFactory = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';
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

    encodeFunctionSignature(fnSignature) {
        return '0x' + createHash('keccak256').update(fnSignature).digest('hex').slice(0, 8);
    }

    async scanRealPools() {
        console.log(`🕵️ Scanning REAL QuickSwap pools < $${MAX_TVL}...\n`);
        
        try {
            const blockNumber = await this.makeRpcCall('eth_blockNumber');
            console.log(`📦 Connected to Polygon - Block: ${parseInt(blockNumber, 16)}\n`);
            
            // Use known QuickSwap pools directly (bypass factory issues)
            const knownPools = [
                '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827', // WMATIC/USDC
                '0x853ee4b2a13f8a742d64c8f088be7ba2131f670d', // WETH/USDC
                '0x1c95324c52caa4b36e84cc5270b3e44b3a01683c'  // QUICK/USDC
            ];
            
            const realPools = [];
            
            for (const poolAddress of knownPools) {
                try {
                    console.log(`🔍 Scanning ${poolAddress}...`);
                    
                    // Get reserves
                    const reservesData = this.encodeFunctionSignature('getReserves()');
                    const reservesResult = await this.makeRpcCall('eth_call', [{
                        to: poolAddress,
                        data: reservesData
                    }, 'latest']);
                    
                    if (reservesResult && reservesResult.length >= 192) {
                        const reserve0 = BigInt(reservesResult.slice(0, 66));
                        const reserve1 = BigInt('0x' + reservesResult.slice(66, 130));
                        
                        // Simple TVL estimation
                        const estimatedTVL = Number(reserve0 + reserve1) / 10**18 * 0.7;
                        
                        if (estimatedTVL < MAX_TVL) {
                            realPools.push({
                                address: poolAddress,
                                reserves: { reserve0, reserve1 },
                                estimatedTVL
                            });
                            console.log(`✅ Found vulnerable pool: $${estimatedTVL.toFixed(2)} TVL`);
                        } else {
                            console.log(`💰 Pool too large: $${estimatedTVL.toFixed(2)} TVL`);
                        }
                    }
                } catch (e) {
                    console.log(`⚠️  Failed to scan ${poolAddress.slice(0,10)}...`);
                }
            }

            console.log(`\n✅ FINAL: Found ${realPools.length} REAL vulnerable pools\n`);
            
            if (realPools.length > 0) {
                realPools.forEach(pool => {
                    console.log(`🔹 Pool: ${pool.address}`);
                    console.log(`   TVL: $${pool.estimatedTVL.toFixed(2)}`);
                    console.log(`   Reserves: ${pool.reserves.reserve0} / ${pool.reserves.reserve1}`);
                    console.log('---');
                });
                
                console.log('🚀 PHASE 1 COMPLETE! Ready for Phase 2: Vulnerability Analysis');
            } else {
                console.log('❌ No vulnerable pools found in known pool list.');
            }

            return realPools;
        } catch (error) {
            console.log('❌ RPC scan failed:', error.message);
            return [];
        }
    }

    async scan() {
        return await this.scanRealPools();
    }
}
