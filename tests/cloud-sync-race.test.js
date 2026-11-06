import test from 'node:test';
import assert from 'node:assert/strict';
import '../cloud-sync.js';
const C=globalThis.CloudSync;
function fixture(rejectApply = false) {
  const app = 'race-fixture';
  const rows = new Map([['cloud.session.' + app, JSON.stringify({access:'test-token',refresh:'test-refresh',exp:Date.now()+3600000,email:'fixture@example.invalid',uid:'fixture'})]]);
  let local = {records:[]}, applied = false, release, requested;
  const gate = new Promise(r => {release = r;});
  const called = new Promise(r => {requested = r;});
  const client = C.create({url:'https://fixture.example.invalid',anonKey:'public-fixture-key-long-enough',app,
    storage:{getItem:k=>rows.get(k)||null,setItem:(k,v)=>rows.set(k,v),removeItem:k=>rows.delete(k)},
    snapshot:()=>local,isEmpty:d=>d.records.length===0,apply:d=>{if(rejectApply==='false')return false;if(rejectApply)throw new Error('invalid snapshot');applied=true;local=d;},
    fetch:async()=>{requested();await gate;return {ok:true,status:200,text:async()=>JSON.stringify([{data:{records:['cloud record']},revision:1}])};}
  });
  return {client,called,release,edit:()=>{local={records:['new unsaved local record']};},local:()=>local,applied:()=>applied,rows};
}
for (const mode of ['sync','resolve']) {
  test(mode + ' preserves edits made while a cloud read is pending', async()=>{
    const f=fixture();const pending=mode==='sync'?f.client.sync():f.client.resolve('cloud');
    await f.called;f.edit();f.release();const result=await pending;
    assert.equal(result.status,'conflict');
    assert.equal(f.applied(),false);
    assert.deepEqual(f.local(),{records:['new unsaved local record']});
    assert.equal(f.rows.has('cloud.meta.race-fixture'),false);
  });
}

for (const mode of ['sync','resolve']) {
  test(mode + ' does not mark a rejected remote snapshot as applied', async()=>{
    const f=fixture(true);const pending=mode==='sync'?f.client.sync():f.client.resolve('cloud');
    await f.called;f.release();const result=await pending;
    assert.equal(result.status,'error');
    assert.equal(f.rows.has('cloud.meta.race-fixture'),false);
    assert.deepEqual(f.local(),{records:[]});
  });
}

for (const mode of ['sync','resolve']) {
  test(mode + ' still applies an unchanged local snapshot normally', async()=>{
    const f=fixture();const pending=mode==='sync'?f.client.sync():f.client.resolve('cloud');
    await f.called;f.release();const result=await pending;
    assert.equal(result.status,'pulled');
    assert.equal(f.applied(),true);
    assert.deepEqual(f.local(),{records:['cloud record']});
    assert.equal(f.rows.has('cloud.meta.race-fixture'),true);
  });
}

for (const mode of ['sync','resolve']) {
  test(mode + ' reports an explicit apply failure without sync metadata', async()=>{
    const f=fixture('false');const pending=mode==='sync'?f.client.sync():f.client.resolve('cloud');
    await f.called;f.release();const result=await pending;
    assert.equal(result.status,'error');
    assert.equal(result.code,'apply');
    assert.equal(f.rows.has('cloud.meta.race-fixture'),false);
  });
}
