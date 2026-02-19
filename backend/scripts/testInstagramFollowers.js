require('dotenv').config();
const axios = require('axios');
const prisma = require('../lib/prisma');

(async () => {
  // Find Instagram connections
  const conns = await prisma.integrationConnection.findMany({
    where: { provider: { in: ['INSTAGRAM_ORGANIC', 'INSTAGRAM_PUBLIC', 'INSTAGRAM'] } },
    include: { company: { select: { name: true } } }
  });
  console.log('Instagram connections:', conns.length);
  conns.forEach(c => console.log(`  ${c.provider} / ${c.company.name} / ${c.externalAccountId}`));

  if (conns.length === 0) {
    console.log('\nNo Instagram connections found. Testing Windsor API directly...');
  }

  const apiKey = process.env.WINDSOR_API_KEY;

  // Test 1: Instagram endpoint with follower_count
  console.log('\n=== Test 1: instagram endpoint ===');
  try {
    const resp = await axios.get('https://connectors.windsor.ai/instagram', {
      params: {
        api_key: apiKey,
        date_preset: 'last_28d',
        fields: 'date,follower_count,follower_count_1d,impressions,reach',
        _renderer: 'json'
      },
      timeout: 30000
    });
    const data = resp.data?.data || resp.data;
    console.log('Rows:', Array.isArray(data) ? data.length : typeof data);
    if (Array.isArray(data) && data.length > 0) {
      console.log('Sample row:', JSON.stringify(data[0]));
      // Check if follower_count has actual values
      const withFollowers = data.filter(r => r.follower_count && Number(r.follower_count) > 0);
      console.log(`Rows with follower_count > 0: ${withFollowers.length}/${data.length}`);
      if (withFollowers.length > 0) {
        console.log('Latest with followers:', JSON.stringify(withFollowers[withFollowers.length - 1]));
      }
      // Check follower_count_1d
      const with1d = data.filter(r => r.follower_count_1d && Number(r.follower_count_1d) !== 0);
      console.log(`Rows with follower_count_1d != 0: ${with1d.length}/${data.length}`);
    }
  } catch (err) {
    console.log('Error:', err.response?.status, err.message);
  }

  // Test 2: Instagram Public endpoint
  console.log('\n=== Test 2: instagram_public endpoint ===');
  try {
    const resp = await axios.get('https://connectors.windsor.ai/instagram_public', {
      params: {
        api_key: apiKey,
        date_preset: 'last_28d',
        fields: 'date,profile_followers_count,profile_follows_count,profile_media_count,profile_username',
        _renderer: 'json'
      },
      timeout: 30000
    });
    const data = resp.data?.data || resp.data;
    console.log('Rows:', Array.isArray(data) ? data.length : typeof data);
    if (Array.isArray(data) && data.length > 0) {
      console.log('Sample row:', JSON.stringify(data[0]));
      const withFollowers = data.filter(r => r.profile_followers_count && Number(r.profile_followers_count) > 0);
      console.log(`Rows with profile_followers_count > 0: ${withFollowers.length}/${data.length}`);
      if (withFollowers.length > 0) {
        console.log('Latest:', JSON.stringify(withFollowers[withFollowers.length - 1]));
      }
    }
  } catch (err) {
    console.log('Error:', err.response?.status, err.message);
  }

  // Test 3: Check ALL available instagram fields
  console.log('\n=== Test 3: All field names in instagram response ===');
  try {
    const resp = await axios.get('https://connectors.windsor.ai/instagram', {
      params: {
        api_key: apiKey,
        date_preset: 'last_7d',
        fields: 'date,follower_count,follower_count_1d,followers_count,total_followers_count,impressions,reach,profile_views',
        _renderer: 'json'
      },
      timeout: 30000
    });
    const data = resp.data?.data || resp.data;
    if (Array.isArray(data) && data.length > 0) {
      const allKeys = new Set();
      data.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
      console.log('All fields in response:', [...allKeys].join(', '));
      console.log('Last row:', JSON.stringify(data[data.length - 1]));
    }
  } catch (err) {
    console.log('Error:', err.response?.status, err.message);
  }

  await prisma.$disconnect();
})();
