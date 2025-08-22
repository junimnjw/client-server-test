// test-download.js - 다운로드 기능 테스트
const http = require('http');

const testDownload = async (endpoint, url, filename) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ url, filename });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Testing download functionality...\n');
  
  const testUrl = 'https://httpbin.org/bytes/1024'; // 1KB 테스트 파일
  const filename = 'test-file.bin';
  
  try {
    // 1. 기본 다운로드 테스트
    console.log('📥 Testing basic download...');
    const basicResult = await testDownload('/download', testUrl, filename);
    console.log('Basic download result:', basicResult);
    
    // 2. 진행률이 있는 다운로드 테스트
    console.log('\n📊 Testing download with progress...');
    const progressResult = await testDownload('/download-with-progress', testUrl, `progress-${filename}`);
    console.log('Progress download result:', progressResult);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// 서버가 실행 중인지 확인
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

const main = async () => {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   cd server && npm start');
    return;
  }
  
  console.log('✅ Server is running. Starting tests...\n');
  await runTests();
};

main();
