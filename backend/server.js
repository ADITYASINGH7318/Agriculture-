'use strict';
// Dependency-free local backend for the AgroPilot learning prototype.
// For personal/local development only; add authentication and a real database before public deployment.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const ROOT = __dirname;
// Load local .env without a third-party dependency. Real process environment always wins.
try { const envText = require('node:fs').readFileSync(path.join(ROOT, '.env'), 'utf8'); for (const line of envText.split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !m[1].startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2'); } } catch {}
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'agropilot-data.json');
const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const MAX_BODY = 7_000_000;
const UPLOAD_DIR = path.join(ROOT, 'uploads', 'crop-health');
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.ipynb':'application/json; charset=utf-8'};
const COLLECTIONS = new Set(['farms','activities','shortlists','recovery','calendar','cropScans','soilChecks','fieldInspections','healthReports','expenses','notifications','settings','uploads','chatMessages','decisions']);
let db = { farms: [], activities: [], shortlists: [], recovery: [], calendar: [], cropScans: [], soilChecks: [], fieldInspections: [], healthReports: [], expenses: [], notifications: [], settings: [], uploads: [], chatMessages: [], decisions: [] };
let writeQueue = Promise.resolve();
async function persist(){ writeQueue = writeQueue.then(async()=>{ await fs.mkdir(DATA_DIR,{recursive:true}); const tmp=DB_FILE+'.tmp'; await fs.writeFile(tmp,JSON.stringify(db,null,2)); await fs.rename(tmp,DB_FILE); }); return writeQueue; }
async function init(){ try { const loaded=JSON.parse(await fs.readFile(DB_FILE,'utf8')); db=Object.fromEntries([...COLLECTIONS].map(k=>[k,Array.isArray(loaded[k])?loaded[k]:[]])); } catch(e) { if(e.code!=='ENOENT') console.error('Could not read data file:',e.message); } }
function corsHeaders(req){ const origin=req.headers.origin||''; const allowed=FRONTEND_ORIGIN==='*'? '*':(origin===FRONTEND_ORIGIN?origin:FRONTEND_ORIGIN); return {'Access-Control-Allow-Origin':allowed,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'86400'}; }
function send(res,status,payload,req){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(req?corsHeaders(req):{})});res.end(JSON.stringify(payload));}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>MAX_BODY)throw Object.assign(new Error('Request body too large'),{status:413});}try{return raw?JSON.parse(raw):{};}catch{throw Object.assign(new Error('Invalid JSON body'),{status:400});}}
function safeItem(item){ if(!item||typeof item!=='object'||Array.isArray(item))throw Object.assign(new Error('Expected a JSON object'),{status:400}); return item; }

const AGENT_TOOLS = [
 {type:'function',function:{name:'get_farm_profile',description:'Read the current demo farm profile and stored weather status.',parameters:{type:'object',properties:{},additionalProperties:false}}},
 {type:'function',function:{name:'assess_irrigation',description:'Assess irrigation considerations from farmer-provided crop, moisture, rain probability and stage. Never control equipment.',parameters:{type:'object',properties:{crop:{type:'string'},moisture:{type:'string',enum:['low','medium','high']},rain_probability:{type:'number',minimum:0,maximum:100},growth_stage:{type:'string'}},required:['crop','moisture','rain_probability','growth_stage'],additionalProperties:false}}},
 {type:'function',function:{name:'crop_symptom_triage',description:'Return cautious symptom checks; not a diagnosis or pesticide prescription.',parameters:{type:'object',properties:{crop:{type:'string'},symptoms:{type:'string'},growth_stage:{type:'string'}},required:['crop','symptoms'],additionalProperties:false}}},
 {type:'function',function:{name:'find_official_schemes',description:'Return official government scheme links in this project.',parameters:{type:'object',properties:{topic:{type:'string'}},required:['topic'],additionalProperties:false}}},
 {type:'function',function:{name:'estimate_net_return',description:'Calculate a scenario-based estimated net return using user-provided values.',parameters:{type:'object',properties:{yield_per_acre_kg:{type:'number',minimum:0},area_acres:{type:'number',minimum:0},price_per_quintal:{type:'number',minimum:0},total_cost_rupees:{type:'number',minimum:0}},required:['yield_per_acre_kg','area_acres','price_per_quintal','total_cost_rupees'],additionalProperties:false}}},
 {type:'function',function:{name:'propose_farm_task',description:'Draft a farm-calendar task proposal. This tool does not save it; ask the user for confirmation first.',parameters:{type:'object',properties:{task:{type:'string'},crop:{type:'string'},due_date:{type:'string',description:'YYYY-MM-DD'},priority:{type:'string',enum:['Low','Medium','High']},reason:{type:'string'}},required:['task','crop','due_date','priority','reason'],additionalProperties:false}}}
];
function runAgentTool(name,args){
 if(name==='get_farm_profile')return {farm:db.farms[0]||null,weatherAvailable:false,note:'Only stored local demo data is available; no live weather is fetched by this tool.'};
 if(name==='assess_irrigation'){const wet=args.moisture==='high',dry=args.moisture==='low',rain=Number(args.rain_probability);return {crop:args.crop,stage:args.growth_stage,moisture:args.moisture,rain_probability:rain,recommendation:wet?'Do not add irrigation solely on this input; check drainage and root-zone conditions.':dry&&rain<50?'Verify dryness at root depth and consult local crop-stage guidance before irrigating.':dry&&rain>=50?'Recheck soil moisture after forecast rain before deciding.':'Recheck moisture at root depth and crop stage; do not use rain probability alone.',limits:'No sensor readings or irrigation equipment control; confirm field conditions.'};}
 if(name==='crop_symptom_triage'){return {crop:args.crop,symptoms:args.symptoms,checks:['Inspect several affected and healthy plants','Check both leaf sides and root-zone moisture','Record when symptoms started and whether they are spreading','Review recent irrigation and input history'],warning:'This is symptom triage, not a confirmed diagnosis. Do not choose pesticide or dose from this result alone; consult a local agriculture expert for severe or spreading damage.'};}
 if(name==='find_official_schemes')return {topic:args.topic,schemes:[{name:'PM-KISAN',url:'https://pmkisan.gov.in/'},{name:'PM Fasal Bima Yojana',url:'https://pmfby.gov.in/'},{name:'MyScheme',url:'https://www.myscheme.gov.in/'},{name:'Kisan Call Centre',phone:'1800-180-1551',url:'https://www.dackkms.gov.in/Account/aboutus.aspx'}],note:'Verify current eligibility, dates and details on official portals.'};
 if(name==='estimate_net_return'){const gross=(Number(args.yield_per_acre_kg)/100)*Number(args.area_acres)*Number(args.price_per_quintal);return {gross_revenue_rupees:Math.round(gross*100)/100,total_cost_rupees:Number(args.total_cost_rupees),estimated_net_return_rupees:Math.round((gross-Number(args.total_cost_rupees))*100)/100,assumptions:'Scenario only; assumes entered yield and price, excludes any unentered costs.'};}
 if(name==='propose_farm_task'){return {type:'task_proposal',proposal:{task:String(args.task).slice(0,180),crop:String(args.crop).slice(0,80),due_date:String(args.due_date).slice(0,10),priority:args.priority,reason:String(args.reason).slice(0,400)},requires_user_confirmation:true,note:'No task has been saved yet. Ask the user to confirm before submitting this proposal.'};}
 return {error:'Unknown tool'};
}
function localWorkflowAgent(question, farmContext){
 const q=String(question||'').toLowerCase();
 const toolsUsed=[]; const results=[]; const proposals=[];
 const call=(name,args={})=>{const result=runAgentTool(name,args);toolsUsed.push(name);results.push({name,result});if(result?.type==='task_proposal')proposals.push(result.proposal);return result;};
 const farm=(farmContext&&typeof farmContext==='object')?farmContext:(db.farms[0]||{});
 // Always ground the response in the farm profile tool, then orchestrate relevant tools by intent.
 const profile=call('get_farm_profile',{});
 const crop=String(farm.crop||farm.primaryCrop||'not specified');
 const stage=String(farm.growthStage||farm.stage||'not specified');
 const moistureRaw=String(farm.soilMoisture||farm.moisture||'medium').toLowerCase();
 const moisture=['low','medium','high'].includes(moistureRaw)?moistureRaw:(/dry|low|कम|सूख/.test(moistureRaw)?'low':/wet|high|गीला|अधिक/.test(moistureRaw)?'high':'medium');
 const rainMatch=q.match(/(?:rain|बारिश|वर्षा)[^0-9]{0,24}(\d{1,3})\s*%|\b(\d{1,3})\s*%[^.]{0,30}(?:rain|बारिश|वर्षा)/i);
 const rain=Math.max(0,Math.min(100,Number((rainMatch&&(rainMatch[1]||rainMatch[2]))||farm.rainProbability||20)));
 if(/irrigat|water|sinchai|सिंच|पानी|rain|बारिश|वर्षा/.test(q)){
   const irrigation=call('assess_irrigation',{crop,moisture,rain_probability:rain,growth_stage:stage});
   results[results.length-1].label='Irrigation assessment';
 }
 if(/yellow|spot|wilting|pest|insect|disease|symptom|leaf|patte|peele|कीट|रोग|पीले|मुरझ|धब्ब/.test(q)){
   const symptoms=String(question).slice(0,500);
   call('crop_symptom_triage',{crop,symptoms,growth_stage:stage});
 }
 if(/scheme|subsid|pm.?kisan|yojana|योजना|सरकारी|insurance|बीमा|कisan call|help line|helpline/.test(q))call('find_official_schemes',{topic:question.slice(0,250)});
 const nums=[...String(question).matchAll(/\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));
 if(/profit|return|munafa|मुनाफा|कमाई|net return|revenue/.test(q)&&nums.length>=4){
   call('estimate_net_return',{yield_per_acre_kg:nums[0],area_acres:nums[1],price_per_quintal:nums[2],total_cost_rupees:nums[3]});
 }
 if(/calendar|schedule|task|plan|योजना बनाओ|काम की सूची|remind|activity|काम कब/.test(q)){
   const due=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   call('propose_farm_task',{task:'Inspect field conditions and record observations',crop:crop==='not specified'?'Current crop':crop,due_date:due,priority:'Medium',reason:'Suggested by the local workflow agent. Confirm the field conditions and edit the task details before saving.'});
 }
 const lines=[];
 lines.push('I used AgroPilot’s local workflow agent to check your request against the available farm tools.');
 if(profile.farm){lines.push(`Farm profile: a saved farm profile is available${crop!=='not specified'?`; crop: ${crop}`:''}${stage!=='not specified'?`; growth stage: ${stage}`:''}.`);}else{lines.push('Farm profile: no saved farm profile was found, so recommendations use the details in your message and cautious defaults.');}
 for(const entry of results){
   const r=entry.result; const n=entry.name;
   if(n==='assess_irrigation')lines.push(`Irrigation tool: ${r.recommendation} Input assumptions: soil moisture ${r.moisture}, rain probability ${r.rain_probability}%. ${r.limits}`);
   else if(n==='crop_symptom_triage')lines.push(`Crop symptom tool: check these points: ${r.checks.join('; ')}. ${r.warning}`);
   else if(n==='find_official_schemes')lines.push(`Official resources: ${r.schemes.map(x=>x.name+(x.phone?' ('+x.phone+')':'')+' — '+x.url).join('; ')}. ${r.note}`);
   else if(n==='estimate_net_return')lines.push(`Scenario estimate: gross revenue ₹${r.gross_revenue_rupees}; entered cost ₹${r.total_cost_rupees}; estimated net return ₹${r.estimated_net_return_rupees}. ${r.assumptions}`);
   else if(n==='propose_farm_task')lines.push(`Task proposal created (not saved): ${r.proposal.task}, crop ${r.proposal.crop}, due ${r.proposal.due_date}, priority ${r.proposal.priority}. Use “Approve and save task” only after reviewing it.`);
 }
 if(toolsUsed.length===1)lines.push('Tell me the crop, growth stage, observed soil moisture, and what you noticed to enable more specific tool checks.');
 lines.push('This local agent can orchestrate the project’s built-in tools without an external API key. It does not fetch live weather/market data, diagnose disease from a photo, or control farm equipment.');
 return {ok:true,reply:lines.join('\n\n'),mode:'local-tool-orchestration-agent',toolsUsed,proposals};
}

async function agentApi(req,res,url){
 if(req.method==='GET'&&url.pathname==='/api/agent/status')return send(res,200,{ok:true,configured:Boolean(process.env.OPENAI_API_KEY),mode:process.env.OPENAI_API_KEY?'LLM tool-calling agent':'Local tool-orchestration agent',provider:process.env.OPENAI_API_KEY?'OpenAI-compatible tool calling':'Built-in local workflow (no API key required)',model:process.env.OPENAI_MODEL||null,tools:AGENT_TOOLS.map(t=>t.function.name)},req);
 if(req.method==='POST'&&url.pathname==='/api/agent/run'){
  const payload=safeItem(await body(req)); const question=String(payload.message||'').trim().slice(0,2000); if(!question)return send(res,400,{error:'message is required'},req);
  if(!process.env.OPENAI_API_KEY){const local=localWorkflowAgent(question,payload.farm||db.farms[0]||null);return send(res,200,local,req);}
  const farmContext=payload.farm&&typeof payload.farm==='object'?JSON.stringify(payload.farm).slice(0,2500):'No current farm supplied';
  const proposals=[];const messages=[{role:'system',content:'You are AgroPilot Farm Agent. Help with farming in clear English or Hindi/Hinglish matching the user. Use tools when they improve the answer; explain which tools you used. Never claim live data unless a tool returned it. Never claim disease diagnosis. Do not prescribe pesticide doses. Never say you controlled pumps or other equipment. For task proposals, do not imply the task was saved; ask the user to confirm. Be cautious and state uncertainty.'},{role:'user',content:`Farm context: ${farmContext}\nUser request: ${question}`}];
  const endpoint=process.env.OPENAI_BASE_URL||'https://api.openai.com/v1/chat/completions';
  for(let turn=0;turn<5;turn++){
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages,tools:AGENT_TOOLS,tool_choice:'auto',temperature:0.2})});
   if(!response.ok){const detail=(await response.text()).slice(0,500);return send(res,502,{error:`AI provider request failed (${response.status}). Check API key/model/network.`,detail},req);}
   const data=await response.json(),msg=data.choices?.[0]?.message;if(!msg)return send(res,502,{error:'AI provider returned an unexpected response.'},req);messages.push(msg);
   const calls=msg.tool_calls||[];if(!calls.length)return send(res,200,{ok:true,reply:msg.content||'I could not produce a response. Please try again.',mode:'tool-calling-agent',proposals},req);
   for(const call of calls){let args={};try{args=JSON.parse(call.function.arguments||'{}')}catch{}const result=runAgentTool(call.function.name,args);if(result?.type==='task_proposal')proposals.push(result.proposal);messages.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(result)});}
  }
  return send(res,200,{ok:true,reply:'I reached the tool-use limit for this turn. Please ask a smaller, more specific question.',mode:'tool-calling-agent'},req);
 }
 if(req.method==='POST'&&url.pathname==='/api/agent/approve-task'){
  const payload=safeItem(await body(req));const p=safeItem(payload.proposal||{});if(!p.task||!p.due_date)return send(res,400,{error:'A task proposal with task and due_date is required'},req);
  const item={task:String(p.task).slice(0,180),crop:String(p.crop||'Not specified').slice(0,80),dueDate:String(p.due_date).slice(0,10),priority:['Low','Medium','High'].includes(p.priority)?p.priority:'Medium',notes:String(p.reason||'AI-generated proposal confirmed by user').slice(0,500),status:'open',createdAt:new Date().toISOString(),source:'agentic-ai-user-approved'};
  item.id=randomUUID();db.calendar=[item,...db.calendar].slice(0,500);await persist();return send(res,201,{ok:true,message:'Task saved after explicit user confirmation.',item},req);
 }
 return null;
}

async function api(req,res,url){
  if(url.pathname.startsWith('/api/agent/')){await agentApi(req,res,url);if(res.writableEnded)return;}
  if(req.method==='GET'&&url.pathname==='/api/integrations/status')return send(res,200,{ok:true,weather:{provider:'Open-Meteo',configured:true,keyRequired:false},market:{provider:'data.gov.in Agmarknet dataset',configured:Boolean(process.env.DATA_GOV_IN_API_KEY),keyRequired:true},cropDoctor:{provider:'Plant.id health assessment',configured:Boolean(process.env.PLANT_ID_API_KEY),keyRequired:true},agent:{provider:process.env.OPENAI_BASE_URL?'OpenAI-compatible endpoint':'OpenAI',configured:Boolean(process.env.OPENAI_API_KEY),keyRequired:true}},req);
  if(req.method==='GET'&&url.pathname==='/api/market-prices'){
    const apiKey=process.env.DATA_GOV_IN_API_KEY;
    if(!apiKey)return send(res,200,{ok:false,configured:false,source:'data.gov.in',message:'Live mandi rates need a free data.gov.in API key. Sample values remain clearly labelled as demo data.',records:[]},req);
    const state=String(url.searchParams.get('state')||'Haryana').slice(0,80),district=String(url.searchParams.get('district')||'').slice(0,80),commodity=String(url.searchParams.get('commodity')||'').slice(0,80);
    const params=new URLSearchParams({ 'api-key':apiKey,format:'json',limit:'100' });
    if(state)params.set('filters[state]',state);if(district)params.set('filters[district]',district);if(commodity)params.set('filters[commodity]',commodity);
    try { const upstream=await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?${params}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!upstream.ok)return send(res,502,{ok:false,configured:true,message:`Government data service returned ${upstream.status}. Verify the API key, resource access and filters.`,records:[]},req);const data=await upstream.json();const records=(data.records||[]).map(r=>({commodity:r.commodity||'—',market:r.market||r.market_name||'—',district:r.district||'—',state:r.state||state,variety:r.variety||'—',minPrice:Number(r.min_price)||null,maxPrice:Number(r.max_price)||null,modalPrice:Number(r.modal_price)||null,date:r.arrival_date||r.price_date||'—'}));return send(res,200,{ok:true,configured:true,source:'data.gov.in — Current Daily Price of Various Commodities',count:records.length,records,fetchedAt:new Date().toISOString()},req); }
    catch(e){return send(res,502,{ok:false,configured:true,message:`Could not reach the government price API: ${e.message}`,records:[]},req);}
  }
  if(req.method==='POST'&&url.pathname==='/api/crop-doctor'){
    const apiKey=process.env.PLANT_ID_API_KEY;if(!apiKey)return send(res,503,{ok:false,configured:false,error:'AI image diagnosis is not configured yet. Add PLANT_ID_API_KEY to .env; symptom triage remains available.'},req);
    const payload=safeItem(await body(req));const image=String(payload.image||'');const match=image.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);if(!match)return send(res,400,{ok:false,error:'Provide a JPEG, PNG or WebP image data URL.'},req);const bytes=Buffer.from(match[2],'base64');if(!bytes.length||bytes.length>4*1024*1024)return send(res,413,{ok:false,error:'Image must be smaller than 4 MB for remote analysis.'},req);
    try{const upstream=await fetch('https://api.plant.id/api/v3/health_assessment?details=local_name,description,treatment,classification&language=en',{method:'POST',headers:{'Content-Type':'application/json','Api-Key':apiKey},body:JSON.stringify({images:[match[2]],latitude:Number.isFinite(Number(payload.latitude))?Number(payload.latitude):undefined,longitude:Number.isFinite(Number(payload.longitude))?Number(payload.longitude):undefined,similar_images:true}),signal:AbortSignal.timeout(30000)});const raw=await upstream.text();let data;try{data=JSON.parse(raw)}catch{data={message:raw.slice(0,300)}};if(!upstream.ok)return send(res,502,{ok:false,error:`Plant health provider returned ${upstream.status}. Check your provider key, account quota and network.`,detail:data.message||data.error||''},req);const health=data.health_assessment||{};const diseases=Array.isArray(health.diseases)?health.diseases:[];return send(res,200,{ok:true,provider:'Plant.id',isHealthy:health.is_healthy??null,healthProbability:health.is_healthy_probability??null,diseases:diseases.slice(0,5).map(d=>({name:d.name||d.local_name||'Possible condition',probability:Number(d.probability)||0,description:d.description?.value||d.description||'',treatment:d.treatment?.value||d.treatment||''})),note:'AI screening result only. Confirm with a qualified local agriculture expert before treatment.',fetchedAt:new Date().toISOString()},req);}catch(e){return send(res,502,{ok:false,error:`AI provider request failed: ${e.message}`},req);}
  }
  if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,service:'AgroPilot local backend',storage:'JSON file',timestamp:new Date().toISOString()},req);
  if(req.method==='GET'&&url.pathname==='/api/farms')return send(res,200,{items:db.farms},req);
  if(req.method==='GET'&&url.pathname==='/api/activities')return send(res,200,{items:db.activities},req);
  if(req.method==='GET'&&url.pathname==='/api/shortlists')return send(res,200,{items:db.shortlists},req);
  if(req.method==='GET'&&url.pathname==='/api/uploads')return send(res,200,{items:db.uploads.map(({id,originalName,mimeType,size,createdAt,url})=>({id,originalName,mimeType,size,createdAt,url}))},req);
  if(req.method==='POST'&&url.pathname==='/api/uploads'){
    const payload=safeItem(await body(req));
    if(typeof payload.dataUrl!=='string')return send(res,400,{error:'dataUrl is required'},req);
    const match=payload.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if(!match)return send(res,415,{error:'Only JPEG, PNG, or WebP images are allowed'},req);
    const mimeType=match[1], buffer=Buffer.from(match[2],'base64');
    if(!buffer.length||buffer.length>MAX_IMAGE_BYTES)return send(res,413,{error:'Image must be smaller than 4 MB'},req);
    const id=randomUUID(), ext=mimeType==='image/jpeg'?'jpg':mimeType.split('/')[1];
    await fs.mkdir(UPLOAD_DIR,{recursive:true});
    const filePath=path.join(UPLOAD_DIR,`${id}.${ext}`);
    await fs.writeFile(filePath,buffer,{flag:'wx'});
    const item={id,originalName:String(payload.originalName||'crop-photo').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,100),mimeType,size:buffer.length,createdAt:new Date().toISOString(),url:`/uploads/crop-health/${id}.${ext}`,crop:String(payload.crop||'').slice(0,80),location:String(payload.location||'').slice(0,160)};
    db.uploads=[item,...db.uploads].slice(0,500); await persist();
    return send(res,201,{ok:true,item},req);
  }
  // Generic persisted collections used by the farm calendar, recovery tracker and future modules.
  const dataMatch=url.pathname.match(/^\/api\/data\/([a-zA-Z]+)(?:\/([a-zA-Z0-9-]+))?$/);
  if(dataMatch){
    const [,collection,actionOrId]=dataMatch;
    if(!COLLECTIONS.has(collection))return send(res,404,{error:'Unknown collection'},req);
    if(req.method==='GET'&&!actionOrId)return send(res,200,{items:db[collection]},req);
    if(req.method==='PUT'&&actionOrId==='replace'){
      const payload=await body(req); if(!Array.isArray(payload.items))return send(res,400,{error:'Expected items array'},req);
      if(payload.items.length>500)return send(res,413,{error:'Too many items (maximum 500)'},req);
      db[collection]=payload.items.map(x=>({...safeItem(x),id:x.id??randomUUID()})); await persist();
      return send(res,200,{ok:true,count:db[collection].length,items:db[collection]},req);
    }
    if(req.method==='POST'&&!actionOrId){
      const item=safeItem(await body(req)); const saved={...item,id:item.id??randomUUID(),serverSavedAt:new Date().toISOString()};
      db[collection]=[saved,...db[collection]].slice(0,500); await persist(); return send(res,201,{ok:true,item:saved},req);
    }
    if(req.method==='DELETE'&&actionOrId){
      const before=db[collection].length; db[collection]=db[collection].filter(x=>String(x.id)!==actionOrId);
      if(before===db[collection].length)return send(res,404,{error:'Item not found'},req); await persist(); return send(res,200,{ok:true,deleted:1},req);
    }
    return send(res,405,{error:'Method not allowed for collection route'},req);
  }
  const routes={'/api/farms':'farms','/api/activities':'activities','/api/shortlists':'shortlists'};
  if(req.method==='POST'&&routes[url.pathname]){
    const key=routes[url.pathname], item=safeItem(await body(req));
    const saved={...item,id:item.id??randomUUID(),serverSavedAt:new Date().toISOString()};
    // Keep demo data bounded to prevent unbounded local JSON growth.
    db[key]=[saved,...db[key]].slice(0,key==='shortlists'?100:500);
    await persist(); return send(res,201,{ok:true,item:saved},req);
  }
  return send(res,404,{error:'API route not found'},req);
}
async function staticFile(req,res,url){
  let pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const full=path.resolve(ROOT,'.'+pathname);
  if(!full.startsWith(ROOT+path.sep)&&full!==ROOT)return send(res,403,{error:'Forbidden'},req);
  try{const stat=await fs.stat(full);if(!stat.isFile())return send(res,404,{error:'Not found'},req);const data=await fs.readFile(full);res.writeHead(200,{'Content-Type':MIME[path.extname(full).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':path.basename(full)==='index.html'?'no-cache':'public, max-age=3600'});res.end(data);}catch{send(res,404,{error:'Not found'},req);}
}
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(req.method==='OPTIONS'){res.writeHead(204,corsHeaders(req));return res.end();}if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed'},req);return await staticFile(req,res,url);}catch(e){send(res,e.status||500,{error:e.status?e.message:'Internal server error'},req);if(!e.status)console.error(e);}});
init().then(()=>server.listen(PORT,'0.0.0.0',()=>console.log(`AgroPilot running at http://127.0.0.1:${PORT}`)));
