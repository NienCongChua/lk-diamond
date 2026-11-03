/* Read-only structural diagnostics. Logs key names/types, never tokens or string values. */
(function(){
  function record(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
  function shape(x,depth){
    if(depth>4)return '<max-depth>';
    if(Array.isArray(x))return {type:'array',length:x.length,sample:x.slice(0,2).map(function(v){return shape(v,depth+1);})};
    if(record(x)){var o={};Object.keys(x).slice(0,60).forEach(function(k){
      // Drop potentially user-defined object keys rather than log account identifiers.
      if(!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(k)||/token|secret|password|email|user|device|auth|uid/i.test(k))return;
      o[k]=shape(x[k],depth+1);
    });return o;}
    return x===null?'null':typeof x;
  }
  try{
    var url=String($request.url||'');
    if(!/^https:\/\/firebaseremoteconfig\.googleapis\.com\/v1\/projects\/locket-[A-Za-z0-9_-]+\//.test(url))return $done({});
    var raw=JSON.parse($response.body),e=raw.entries,result={};
    if(record(e))Object.keys(e).filter(function(k){return /photobooth|photo_booth|collage|frame|layout|camera_filter|(^|_)ai(_|$)/i.test(k);}).forEach(function(k){
      if(!/^[A-Za-z][A-Za-z0-9_]{0,100}$/.test(k))return;
      var v=e[k];try{v=JSON.parse(v);}catch(_){}result[k]=shape(v,0);
    });
    console.log('[Locket schema only] '+JSON.stringify(result));
  }catch(_){console.log('[Locket schema only] No readable configuration.');}
  $done({});
})();
