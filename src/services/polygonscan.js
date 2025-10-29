import { POLYGONSCAN_API, POLYGONSCAN_API_KEY } from '../../config/endpoints.js';
import axios from 'axios';

export class PolygonscanService {
    constructor() {
        this.apiKey = POLYGONSCAN_API_KEY;
        this.baseUrl = POLYGONSCAN_API;
        this.lastCallTime = 0;
    }

    async throttle() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        if (timeSinceLastCall < 200) {
            await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastCall));
        }
        this.lastCallTime = Date.now();
    }

    async makeApiCall(module, action, address = '') {
        await this.throttle();
        
        const params = {
            module,
            action,
            address,
            apikey: this.apiKey
        };

        try {
            // V2 API uses different endpoint structure
            const url = `${this.baseUrl}/${module}/${action}`;
            const response = await axios.get(url, { 
                params,
                headers: {
                    'Accept': 'application/json'
                }
            });
            console.log('🔍 V2 API Response Status:', response.data.status);
            return response.data;
        } catch (error) {
            console.error(`Polygonscan V2 API Error: ${error.response?.data || error.message}`);
            return null;
        }
    }

    async getContractSource(contractAddress) {
        return await this.makeApiCall('contract', 'getsourcecode', contractAddress);
    }

    async getContractTransactions(contractAddress) {
        return await this.makeApiCall('account', 'txlist', contractAddress);
    }
}
