'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../scripts/locket-filter-probe.js'),'utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function run({url='https://api.locketcamera.com/applySyntheticFilter',request=false,body={},headers={'Content-Type':'application/json'},status=200}={}){
 let calls=0,out,logs=[];
 const req={url,method:'POST',headers:{Authorization:'SECRET_AUTH','User-Agent':'Locket/test'}};
 Object.defineProperty(req,'body',{get(){throw Error('Request body must not be accessed');}});
 const env={$request:req,console:{log:x=>logs.push(x)},$done:x=>{calls++;out=JSON.parse(JSON.stringify(x));}};
 if(!request)env.$response={status,headers,body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)};
 vm.runInNewContext(source,env,{timeout:500});assert.equal(calls,1);assert.deepEqual(out,{});
 return {logs,report:logs.length?JSON.parse(logs[0].split('[Locket filter probe] ')[1]):undefined};
}
test('request hook never reads upload body or logs headers',()=>{const r=run({request:true});assert.equal(r.report.body,'request-body-not-read');assert.ok(!r.logs[0].includes('SECRET_AUTH'));});
test('response schema redacts secrets, URLs, images, strings and dynamic keys',()=>{
 const body={result:{image_url:'https://private.invalid/picture?token=SECRET_URL',image_data:'data:image/png;base64,SECRET_IMAGE',prompt:'SECRET_PROMPT',user_id:'SECRET_ID',metadata:{'SECRET_DYNAMIC_KEY':'SECRET'},status:'SECRET_STATUS'}};
 const r=run({body});assert.ok(!r.logs[0].includes('SECRET'));assert.equal(r.report.schema.result.image_url,'<url-redacted>');assert.equal(r.report.schema.result.image_data,'<image-data-redacted>');assert.equal(r.report.schema.result.prompt,'string');
});
test('query parameters are never logged',()=>assert.ok(!run({url:'https://api.locketcamera.com/applySyntheticFilter?token=SECRET'}).logs[0].includes('SECRET')));
test('dynamic path redacted',()=>assert.equal(run({url:'https://api.locketcamera.com/users/SECRET/photo'}).report.route,'<path-redacted>'));
test('response status remains useful for native debugging',()=>assert.equal(run({status:'HTTP/1.1 403 Forbidden',body:{error:{message:'SECRET_REASON'}}}).report.status,403));
test('malformed JSON and binary fail open',()=>{assert.equal(run({body:'{bad'}).report.body,'unreadable-json');assert.equal(run({body:new Uint8Array([1,2,3]),headers:{'Content-Type':'image/png'}}).report.body,'not-inspected');});
test('large response is not parsed',()=>assert.equal(run({body:'['+' '.repeat(1048576)}).report.body,'not-inspected'));
test('exact host and HTTPS scope only',()=>{
 for(const url of ['https://api.locketcamera.com.evil.test/applyFilter','http://api.locketcamera.com/applyFilter','https://example.com/applyFilter','https://api.locketcamera.com@evil.test/applyFilter'])assert.equal(run({url}).logs.length,0);
});
test('config JSON strings decoded but filter IDs remain redacted',()=>{
 const r=run({url:'https://firebaseremoteconfig.googleapis.com/v1/projects/locket-test/namespaces/firebase:fetch',body:{entries:{camera_filter_config:JSON.stringify({sheet_filters:[{title:{vi:'SECRET_TITLE'},filter_ids:['SECRET_ID']}]}),other:'SECRET'}}});
 assert.equal(r.report.schema.camera_filter_config.sheet_filters.type,'array');assert.ok(!r.logs[0].includes('SECRET'));
});
test('recursion and sample size bounded',()=>{
 let body={image:'SECRET'};for(let i=0;i<20;i++)body={data:body};
 const r=run({body:{result:body,filters:Array(1000).fill({image_url:'https://SECRET.invalid'})}});
 assert.ok(r.logs[0].length<3000);assert.equal(r.report.schema.filters.length,1000);assert.equal(r.report.schema.filters.sample.length,2);
});
test('module request rule does not buffer uploads',()=>{
 const moduleText=fs.readFileSync(path.join(__dirname,'../Locket-Filter-Probe.local.sgmodule'),'utf8');
 const line=moduleText.split('\n').find(x=>x.startsWith('locket_filter_probe_request ='));
 assert.ok(line);assert.ok(!line.includes('requires-body=true'));assert.ok(!line.includes('max-size='));
 assert.ok(!moduleText.includes('firebaseremoteconfig.googleapis.com'));
});
console.log('\n'+passed+' probe tests passed. Native runtime is untested.');
