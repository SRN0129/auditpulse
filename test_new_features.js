const http = require('http');

async function testAll() {
  console.log('--- TESTING NEW AUTONOMOUS FEATURES ---');

  // 1. Dispatcher Settings
  console.log('\n1. Fetching Dispatcher Settings...');
  const dispSettings = await (await fetch('http://localhost:3000/api/dispatcher/settings')).json();
  console.log('Dispatcher Settings Response:', dispSettings);

  // 2. Dispatcher Batch
  console.log('\n2. Testing Dispatcher Batch (2 emails)...');
  const dispBatch = await (await fetch('http://localhost:3000/api/dispatcher/send-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchSize: 2 })
  })).json();
  console.log('Dispatch Batch Result:', dispBatch);

  // 3. Social Posts List
  console.log('\n3. Fetching Social Posts...');
  const socialList = await (await fetch('http://localhost:3000/api/social/posts')).json();
  console.log('Social Posts Count:', socialList.posts?.length, 'Status:', socialList.status);

  // 4. Synthesize Fresh Social Posts
  console.log('\n4. Synthesizing Fresh Social Posts...');
  const genSocial = await (await fetch('http://localhost:3000/api/social/generate', { method: 'POST' })).json();
  console.log('Synthesized Social Posts:', genSocial);

  // 5. Publish one post
  if (genSocial.posts && genSocial.posts[0]) {
    const targetId = genSocial.posts[0].id;
    console.log(`\n5. Publishing post ${targetId}...`);
    const pubRes = await (await fetch(`http://localhost:3000/api/social/publish/${targetId}`, { method: 'POST' })).json();
    console.log('Publish result:', pubRes);
  }

  // 6. Autonomous Pulse
  console.log('\n6. Executing Autonomous Pulse...');
  const pulseRes = await (await fetch('http://localhost:3000/api/cron/autonomous-pulse?source=test_suite', { method: 'POST' })).json();
  console.log('Pulse success:', pulseRes.success, 'Pulse #:', pulseRes.pulseCount);
  console.log('Pulse Summary Marketing:', pulseRes.summary?.results?.marketing);
  console.log('Pulse Summary Social:', pulseRes.summary?.results?.social);

  // 7. System Status Verification
  console.log('\n7. Checking System Status Telemetry...');
  const sysStatus = await (await fetch('http://localhost:3000/api/system/status')).json();
  console.log('Dispatcher Stats:', sysStatus.dispatcherStats);
  console.log('Social Stats:', sysStatus.socialStats);
  console.log('Social Posts Count:', sysStatus.socialPosts?.length);

  console.log('\n--- ALL LOCAL CHECKS COMPLETED SUCCESSFULLY ---');
}

testAll().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
