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
        if (timeSinceLastCall < 200) { // 5 calls/sec = 200ms between calls
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
            const response = await axios.get(this.baseUrl, { params });
            return response.data;
        } catch (error) {
            console.error(`Polygonscan API Error: ${error.message}`);
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
