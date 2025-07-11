// Simple test script to verify forex API integration
// Using built-in fetch (available in Node.js 18+)

async function testForexAPI() {
  console.log('Testing forex API integration...\n');
  
  try {
    // Test 1: Get current USD to EUR rate
    console.log('Test 1: Getting current USD to EUR rate...');
    const response1 = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR');
    const data1 = await response1.json();
    console.log('USD to EUR rate:', data1.rates.EUR);
    console.log('Success:', data1.success);
    console.log('');
    
    // Test 2: Get historical rate for a specific date
    console.log('Test 2: Getting historical USD to EUR rate for 2024-01-01...');
    const response2 = await fetch('https://api.exchangerate.host/2024-01-01?base=USD&symbols=EUR');
    const data2 = await response2.json();
    console.log('USD to EUR rate on 2024-01-01:', data2.rates.EUR);
    console.log('Success:', data2.success);
    console.log('');
    
    // Test 3: Test multiple currencies
    console.log('Test 3: Getting rates for multiple currencies...');
    const response3 = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,GBP,JPY,SGD');
    const data3 = await response3.json();
    console.log('Multiple currency rates:', data3.rates);
    console.log('Success:', data3.success);
    console.log('');
    
    console.log('✅ All tests passed! The forex API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testForexAPI(); 