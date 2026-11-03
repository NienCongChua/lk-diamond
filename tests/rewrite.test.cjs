'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'scripts/locket-custom.js'),'utf8');
const rc='https://firebaseremoteconfig.googleapis.com/v1/projects/locket-test/namespaces/firebase:fetch';
const sub='https://api.revenuecat.com/v1/subscribers/test-user';
let passed=0;
function run({url=rc,ua='Locket/2.0',body={entries:{}},headers={},request=false,status=200,settings={}}={}){
 let count=0,out,logs=[];
 const env={$request:{url,headers:{...(ua===null?{}:{'User-Agent':ua}),...headers}},$done:x=>{count++;out=JSON.parse(JSON.stringify(x));},console:{log:x=>logs.push(x)}};
 if(!request)env.$response={status,body:typeof body==='string'?body:JSON.stringify(body)};
 let code=source.replace('/* Presets from the inspected upstream snapshot.', 'Object.assign(SETTINGS,'+JSON.stringify(settings)+');\n/* Presets from the inspected upstream snapshot.');
 vm.runInNewContext(code,env,{timeout:1000,codeGeneration:{strings:false,wasm:false}});
 assert.equal(count,1,'must finish exactly once');return {out,logs,body:out.body?JSON.parse(out.body):undefined};
}
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('scope: unrelated application',()=>assert.deepEqual(run({ua:'OtherApp/1.0'}).out,{}));
test('scope: substring spoof',()=>assert.deepEqual(run({ua:'NotLocket/1.0'}).out,{}));
test('scope: missing UA',()=>assert.deepEqual(run({ua:null}).out,{}));
test('scope: case-insensitive header',()=>assert.ok(run({ua:null,headers:{'uSeR-aGeNt':'Locket/1.0'}}).body.entries));
test('scope: other Firebase project',()=>assert.deepEqual(run({url:rc.replace('locket-test','other-test')}).out,{}));
test('scope: unrelated host',()=>assert.deepEqual(run({url:'https://example.com/v1/subscribers/x'}).out,{}));
test('scope: deceptive host suffix',()=>assert.deepEqual(run({url:rc.replace('googleapis.com','googleapis.com.evil.test')}).out,{}));
test('scope: extra RevenueCat path',()=>assert.deepEqual(run({url:sub+'/attributes',body:{subscriber:{}}}).out,{}));
test('scope: HTTP skipped',()=>assert.deepEqual(run({url:rc.replace('https:','http:')}).out,{}));
test('scope: URL query supported',()=>assert.ok(run({url:rc+'?v=1'}).body));
test('malformed JSON passes through',()=>assert.deepEqual(run({body:'<html>Error</html>'}).out,{}));
test('non-object JSON passes through',()=>assert.deepEqual(run({body:'[]'}).out,{}));
test('missing entries passes through',()=>assert.deepEqual(run({body:{}}).out,{}));
test('error response passes through',()=>assert.deepEqual(run({body:{error:{message:'test'},entries:{}}}).out,{}));
test('HTTP error passes through',()=>assert.deepEqual(run({status:500}).out,{}));
test('HTTP status text supported',()=>assert.ok(run({status:'HTTP/1.1 200 OK'}).body));
test('large response passes through',()=>assert.deepEqual(run({body:' '.repeat(1048577)}).out,{}));
test('global off passes through',()=>assert.deepEqual(run({settings:{enabled:false}}).out,{}));
test('defaults: duration/quality and limits are consistent',()=>{let e=run().body.entries,c=JSON.parse(e.camera),r=JSON.parse(e.camera_roll);assert.equal(c.max_duration,45);assert.equal(r.trim_max_duration,45);assert.equal(e.video_quality_mbps,'0.6');assert.equal(r.max_upload_bytes,104857600);});
test('unknown fields and nested fields preserved',()=>{let e=run({body:{entries:{test:'keep',camera:'{"server_only":42}'}}}).body.entries;assert.equal(e.test,'keep');assert.equal(JSON.parse(e.camera).server_only,42);});
test('malformed nested object preserved',()=>assert.equal(run({body:{entries:{camera:'invalid'}}}).body.entries.camera,'invalid'));
test('no external image or invented photobooth injection',()=>{let e=run().body.entries;assert.equal(e.widget_frame_event,undefined);assert.equal(e.widget_frames_config,undefined);assert.equal(e.photobooth_config,undefined);assert.equal(e.settings_instagram_url,undefined);assert.ok(!JSON.stringify(e).includes('i.ibb.co'));});
test('132 distinct original captions plus 12 custom captions',()=>{let s=JSON.parse(run().body.entries.overlay_items);assert.equal(s.reduce((n,x)=>n+x.items.length,0),144);assert.equal(new Set(s.flatMap(x=>x.items.map(i=>i.overlay_id))).size,144);});
test('idempotent captions',()=>{let one=run().body,two=run({body:one}).body;assert.equal(two.entries.overlay_items,one.entries.overlay_items);});
test('custom captions editable after prior response',()=>{let one=run().body,two=run({body:one,settings:{customCaptions:[{id:'nien_coffee',text:'Changed',colors:['#FFFFFF'],color:'#000000'}]}}).body;let items=JSON.parse(two.entries.overlay_items).flatMap(s=>s.items);assert.equal(items.find(x=>x.overlay_id==='caption:nien_coffee').caption.text,'Changed');});
test('advertising option off preserves server ad flags',()=>{let e=run({settings:{hideAds:false},body:{entries:{history_ads_mode:'server',feature_gates:'{"remove_ads":"server"}'}}}).body.entries;assert.equal(e.history_ads_mode,'server');assert.equal(JSON.parse(e.feature_gates).remove_ads,'server');});
test('bounds on editable video values',()=>{let e=run({settings:{videoSeconds:9999,maxUploadMiB:-2,videoMbps:'bad'}}).body.entries;assert.equal(e.video_max_duration,'120');assert.equal(e.max_upload_bytes,'1048576');assert.equal(e.video_quality_mbps,'0.6');});
test('ETag only removed for matching Locket',()=>{let r=run({url:sub,request:true,headers:{'x-RevenueCat-eTag':'synthetic',Authorization:'synthetic-token','X-Keep':'yes'}});assert.equal(r.out.headers['x-RevenueCat-eTag'],undefined);assert.equal(r.out.headers.Authorization,'synthetic-token');assert.equal(r.out.headers['X-Keep'],'yes');});
test('other app ETag preserved',()=>assert.deepEqual(run({url:sub,request:true,ua:'OtherApp/1.0',headers:{'X-RevenueCat-ETag':'original'}}).out,{}));
test('ETag preserved with entitlement override off',()=>assert.deepEqual(run({url:sub,request:true,headers:{'X-RevenueCat-ETag':'x'},settings:{goldResponseOverride:false}}).out,{}));
test('subscription missing maps initialized without crash',()=>{let s=run({url:sub,body:{subscriber:{}}}).body.subscriber;assert.ok(s.entitlements.Gold);assert.equal(s.entitlements.pro,undefined);assert.equal(s.entitlements.Gold.expires_date,s.subscriptions.locket_1600_1y.expires_date);assert.equal(s.subscriptions.locket_1600_1y.price,undefined);assert.equal(s.subscriptions.locket_1600_1y.store_transaction_id,undefined);});
test('subscription for other app untouched',()=>assert.deepEqual(run({url:sub,ua:'OtherApp',body:{subscriber:{}}}).out,{}));
test('real active Gold preserved',()=>assert.deepEqual(run({url:sub,body:{subscriber:{entitlements:{Gold:{expires_date:'2099-01-01T00:00:00Z'}}}}}).out,{}));
test('real lifetime Gold preserved',()=>assert.deepEqual(run({url:sub,body:{subscriber:{entitlements:{Gold:{expires_date:null}}}}}).out,{}));
test('existing product record never overwritten',()=>assert.deepEqual(run({url:sub,body:{subscriber:{subscriptions:{locket_1600_1y:{store_transaction_id:'synthetic-real-record'}}}}}).out,{}));
test('invalid subscription field types preserved',()=>assert.deepEqual(run({url:sub,body:{subscriber:{subscriptions:[]}}}).out,{}));
test('future purchase date rejected',()=>assert.deepEqual(run({url:sub,body:{subscriber:{}},settings:{purchaseDate:'8888-01-01T00:00:00Z'}}).out,{}));
test('invalid expiry rejected',()=>assert.deepEqual(run({url:sub,body:{subscriber:{}},settings:{expiresDate:'bad'}}).out,{}));
test('debug never logs body or credentials',()=>{let r=run({settings:{debug:true},body:{entries:{secret:'synthetic-secret'}},headers:{Authorization:'synthetic-token'}});assert.ok(!r.logs.join('').includes('synthetic'));});
test('diagnostics read-only and string values redacted',()=>{
 let out,logs=[];vm.runInNewContext(fs.readFileSync(path.join(root,'scripts/locket-diagnostics.js'),'utf8'),{$request:{url:rc},$response:{body:JSON.stringify({entries:{photobooth_config:JSON.stringify({enabled:true,layout:'private-string',token:'secret',layouts:[{id:'private-id',rows:2}]})}})},$done:x=>out=JSON.parse(JSON.stringify(x)),console:{log:x=>logs.push(x)}},{timeout:500});
 assert.deepEqual(out,{});assert.ok(logs[0].includes('photobooth_config'));assert.ok(!/private-string|private-id|secret|token/.test(logs[0]));
});
test('live filter catalogue and unknown renderer fields survive',()=>{
 const live={sheet_filters:[{title:{vi:'Synthetic new group'},filter_ids:['synthetic_new_filter']}],picker_filters:['synthetic_new_filter'],renderer:{version:99},show_filter_button:false};
 const result=JSON.parse(run({body:{entries:{camera_filter_config:JSON.stringify(live)}}}).body.entries.camera_filter_config);
 assert.deepEqual(result.sheet_filters,live.sheet_filters);assert.deepEqual(result.picker_filters,live.picker_filters);assert.deepEqual(result.renderer,live.renderer);assert.equal(result.show_filter_button,true);
});
test('old filters only fill absent or empty lists',()=>{
 const result=JSON.parse(run({body:{entries:{camera_filter_config:'{"sheet_filters":[],"picker_filters":["synthetic_live"]}'}}}).body.entries.camera_filter_config);
 assert.equal(result.sheet_filters.length,6);assert.deepEqual(result.picker_filters,['synthetic_live']);
});
test('unrecognized filter list shape and malformed config preserved',()=>{
 const cfg=JSON.parse(run({body:{entries:{camera_filter_config:'{"sheet_filters":{"version":3},"picker_filters":null}'}}}).body.entries.camera_filter_config);
 assert.deepEqual(cfg.sheet_filters,{version:3});assert.equal(cfg.picker_filters,null);
 assert.equal(run({body:{entries:{camera_filter_config:'not-json'}}}).body.entries.camera_filter_config,'not-json');
});
test('filter merge idempotent and switch can disable it',()=>{
 const one=run().body;const two=run({body:one}).body;assert.equal(two.entries.camera_filter_config,one.entries.camera_filter_config);
 assert.equal(run({body:{entries:{camera_filter_config:'{"show_filter_button":false}'}},settings:{includeOriginalFilters:false}}).body.entries.camera_filter_config,'{"show_filter_button":false}');
});
console.log('\n'+passed+' tests passed. These are mocked JavaScript tests, not an iPhone compatibility test.');
