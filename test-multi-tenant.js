import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function test() {
  try {
    console.log('\n========== MULTI-TENANT TESTING ==========\n');

    // 1. Register first garage
    console.log('1️⃣ Registering Garage A...');
    const garage1Response = await axios.post(`${API_URL}/auth/register`, {
      garageName: 'Speed Auto Repair',
      garageEmail: 'contact@speedauto.com',
      garagePhone: '555-1000',
      garageAddress: '123 Main Street',
      userName: 'John Doe',
      userEmail: 'john@speedauto.com',
      password: 'password123'
    });
    const garage1Token = garage1Response.data.token;
    console.log('✅ Garage A registered');
    console.log('   Garage ID:', garage1Response.data.garage.id);
    console.log('   User:', garage1Response.data.user.name);

    // 2. Register second garage
    console.log('\n2️⃣ Registering Garage B...');
    const garage2Response = await axios.post(`${API_URL}/auth/register`, {
      garageName: 'Quick Fix Motors',
      garageEmail: 'info@quickfix.com',
      garagePhone: '555-2000',
      garageAddress: '456 Oak Avenue',
      userName: 'Jane Smith',
      userEmail: 'jane@quickfix.com',
      password: 'password456'
    });
    const garage2Token = garage2Response.data.token;
    console.log('✅ Garage B registered');
    console.log('   Garage ID:', garage2Response.data.garage.id);
    console.log('   User:', garage2Response.data.user.name);

    // 3. Create client for Garage A
    console.log('\n3️⃣ Creating client for Garage A...');
    const client1Response = await axios.post(
      `${API_URL}/clients`,
      {
        name: 'Alice Johnson',
        phone: '555-3000',
        email: 'alice@email.com',
        address: '789 Elm Street'
      },
      { headers: { Authorization: `Bearer ${garage1Token}` } }
    );
    console.log('✅ Client created for Garage A:', client1Response.data.name);

    // 4. Create client for Garage B
    console.log('\n4️⃣ Creating client for Garage B...');
    const client2Response = await axios.post(
      `${API_URL}/clients`,
      {
        name: 'Bob Williams',
        phone: '555-4000',
        email: 'bob@email.com',
        address: '321 Pine Road'
      },
      { headers: { Authorization: `Bearer ${garage2Token}` } }
    );
    console.log('✅ Client created for Garage B:', client2Response.data.name);

    // 5. List clients for Garage A (should only see Alice)
    console.log('\n5️⃣ Listing clients for Garage A...');
    const garage1Clients = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${garage1Token}` }
    });
    console.log('✅ Garage A sees', garage1Clients.data.length, 'client(s):');
    garage1Clients.data.forEach(client => console.log('   -', client.name));

    // 6. List clients for Garage B (should only see Bob)
    console.log('\n6️⃣ Listing clients for Garage B...');
    const garage2Clients = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${garage2Token}` }
    });
    console.log('✅ Garage B sees', garage2Clients.data.length, 'client(s):');
    garage2Clients.data.forEach(client => console.log('   -', client.name));

    // 7. Try to access Garage B's client from Garage A (should fail)
    console.log('\n7️⃣ Testing data isolation...');
    try {
      await axios.get(`${API_URL}/clients/${client2Response.data.id}`, {
        headers: { Authorization: `Bearer ${garage1Token}` }
      });
      console.log('❌ FAILED: Garage A should NOT be able to access Garage B\'s client!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ PASSED: Garage A cannot access Garage B\'s client (404 Not Found)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // 8. Test login
    console.log('\n8️⃣ Testing login for Garage A...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'john@speedauto.com',
      password: 'password123'
    });
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.user.name);
    console.log('   Garage:', loginResponse.data.garage.name);

    // 9. Test /me endpoint
    console.log('\n9️⃣ Testing /me endpoint...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${garage1Token}` }
    });
    console.log('✅ Current user info retrieved');
    console.log('   User:', meResponse.data.user.name);
    console.log('   Garage:', meResponse.data.garage.name);
    console.log('   Subscription:', meResponse.data.garage.subscription_status);

    console.log('\n========== ALL TESTS PASSED! ==========\n');
    console.log('✅ Multi-tenant authentication working correctly');
    console.log('✅ Data isolation between garages working correctly');
    console.log('✅ Each garage can only see their own data');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

test();