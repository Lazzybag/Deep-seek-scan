import axios from 'axios';

async function testEndpoints() {
  console.log('🔍 Finding correct V2 endpoint...\n');
  
  const tests = [
    'https://api.polygonscan.com/v2/contract/getsourcecode?address=0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827&apikey=HHDRZBAI2Q7KQY7QSCYYDRWAKCRJRQV66A',
    'https://api.polygonscan.com/v2/api?module=contract&action=getsourcecode&address=0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827&apikey=HHDRZBAI2Q7KQY7QSCYYDRWAKCRJRQV66A',
    'https://api.polygonscan.com/api/v2?module=contract&action=getsourcecode&address=0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827&apikey=HHDRZBAI2Q7KQY7QSCYYDRWAKCRJRQV66A'
  ];

  for (let i = 0; i < tests.length; i++) {
    try {
      console.log(`Testing URL #${i+1}:`);
      const response = await axios.get(tests[i]);
      console.log(`✅ SUCCESS: ${response.data.status} - ${response.data.message}`);
      console.log(`📡 WORKING URL: ${tests[i].split('?')[0]}`);
      return tests[i].split('?')[0];
    } catch (e) {
      console.log(`❌ Failed: ${e.response?.status || e.message}`);
    }
    console.log('---');
  }
  return null;
}

testEndpoints().catch(console.error);
