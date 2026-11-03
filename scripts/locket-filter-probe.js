/* Native filter investigation. Read-only: no HTTP client, storage or body changes.
 * Request hooks use headers only; they MUST NOT buffer photo uploads.
 * Logs contain route names and allowlisted JSON field types, never field values.
 */
(function () {
  var PREFIX='[Locket filter probe] ';
  var ALLOWED=/^(data|result|results|error|errors|code|status|success|message|items|filters|filter|filter_id|filter_ids|camera_filter_config|sheet_filters|picker_filters|allows_custom_filters|show_filter_button|sheet_enabled|open_sheet_immediately|id|name|title|en|vi|type|source|url|image|images|image_url|image_urls|input|output|inputs|outputs|input_image|output_image|input_url|output_url|thumbnail|thumbnail_url|preview|preview_url|icon|asset|assets|asset_url|mask|mask_url|frame|frames|layout|layouts|rows|columns|slots|width|height|format|mime_type|content_type|model|models|model_id|endpoint|endpoints|parameters|options|config|metadata|prompt|negative_prompt|job|job_id|task|task_id|state|progress|poll_url|polling_url|completed|created_at|updated_at|expires_at|enabled|version|bytes|size|count|total|next|cursor|limit|storage_path|download_url|upload_url|base64|image_base64|image_data)$/;
  function record(x) { return !!x && typeof x==='object' && !Array.isArray(x); }
  function header(headers,name) {
    var keys=Object.keys(headers||{});
    for(var i=0;i<keys.length;i++) if(keys[i].toLowerCase()===name) return String(headers[keys[i]]);
    return '';
  }
  function describe(value,depth,budget) {
    if(--budget.nodes<0 || depth>7) return '<limit>';
    if(value===null) return 'null';
    if(Array.isArray(value)) return {type:'array',length:value.length,sample:value.slice(0,2).map(function(x){return describe(x,depth+1,budget);})};
    if(record(value)) {
      var out=Object.create(null),omitted=0;
      Object.keys(value).slice(0,100).forEach(function(key) {
        if(!ALLOWED.test(key)) { omitted++; return; }
        out[key]=describe(value[key],depth+1,budget);
      });
      if(omitted) out._omitted_fields=omitted;
      if(Object.keys(value).length>100) out._truncated=true;
      return out;
    }
    if(typeof value==='string') {
      if(/^https?:\/\//i.test(value)) return '<url-redacted>';
      if(/^data:image\//i.test(value)) return '<image-data-redacted>';
    }
    return typeof value;
  }
  function routeName(path) {
    // No dynamic IDs, query parameters, storage paths or account names.
    if(/^\/(?:get|fetch|apply|generate|create|poll|render|process|transform|submit|list|run|check|upload|download)[A-Z][A-Za-z]{1,60}\/?$/.test(path)) return path.replace(/\/$/,'');
    return '<path-redacted>';
  }
  try {
    var request=$request||{},url=String(request.url||'');
    var api=url.match(/^https:\/\/api\.locketcamera\.com(\/[^?#]*)?(?:\?[^#]*)?$/);
    var config=/^https:\/\/firebaseremoteconfig\.googleapis\.com\/v1\/projects\/locket-[A-Za-z0-9_-]+\/namespaces\/[^/?#]+:fetch(?:\?[^#]*)?$/.test(url);
    if(!api && !config) return $done({});
    var isResponse=typeof $response!=='undefined';
    var report={version:1,phase:isResponse?'response':'request',host:api?'api.locketcamera.com':'firebaseremoteconfig.googleapis.com',route:api?routeName(api[1]||'/'):'<locket-remote-config>'};
    var method=String(request.method||'').toUpperCase();
    report.method=/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method)?method:'<unknown>';
    var message=isResponse?$response:request;
    var contentType=header(message.headers,'content-type').split(';')[0].trim().toLowerCase();
    report.content_type=/^(application\/(json|octet-stream|protobuf)|image\/(png|jpeg|webp)|multipart\/form-data|text\/plain)$/.test(contentType)?contentType:'<other-or-missing>';
    if(isResponse) {
      var status=String(message.statusCode===undefined?message.status:message.statusCode).match(/\b([1-5][0-9]{2})\b/);
      report.status=status?Number(status[1]):'<unknown>';
      var body=message.body;
      if(typeof body==='string' && body.length<=1048576 && /^\s*[\[{]/.test(body)) {
        try {
          var parsed=JSON.parse(body),budget={nodes:180};
          if(config) {
            var values=record(parsed)&&record(parsed.entries)?parsed.entries:{};
            report.schema=Object.create(null);
            ['camera_filter_config','photobooth_config','photo_booth_config'].forEach(function(key){
              if(values[key]===undefined) return;
              var value=values[key];
              if(typeof value==='string') { try{value=JSON.parse(value);}catch(_){} }
              report.schema[key]=describe(value,0,budget);
            });
          } else report.schema=describe(parsed,0,budget);
        } catch(_) { report.body='unreadable-json'; }
      } else report.body='not-inspected';
    } else report.body='request-body-not-read';
    console.log(PREFIX+JSON.stringify(report));
  } catch(_) {
    console.log(PREFIX+'{"error":"probe-failed-open"}');
  }
  $done({});
})();
