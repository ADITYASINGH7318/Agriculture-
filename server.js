'use strict';
// Dependency-free local backend for the AgroPilot learning prototype.
// For personal/local development only; add authentication and a real database before public deployment.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'agropilot-data.json');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 7_000_000;
const UPLOAD_DIR = path.join(ROOT, 'uploads', 'crop-health');
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.ipynb':'application/json; charset=utf-8'};
const COLLECTIONS = new Set(['farms','activities','shortlists','recovery','calendar','cropScans','soilChecks','fieldInspections','healthReports','expenses','notifications','settings','uploads']);
let db = { farms: [], activities: [], shortlists: [], recovery: [], calendar: [], cropScans: [], soilChecks: [], fieldInspections: [], healthReports: [], expenses: [], notifications: [], settings: [], uploads: [] };
let writeQueue = Promise.resolve();
async function persist(){ writeQueue = writeQueue.then(async()=>{ await fs.mkdir(DATA_DIR,{recursive:true}); const tmp=DB_FILE+'.tmp'; await fs.writeFile(tmp,JSON.stringify(db,null,2)); await fs.rename(tmp,DB_FILE); }); return writeQueue; }
async function init(){ try { const loaded=JSON.parse(await fs.readFile(DB_FILE,'utf8')); db=Object.fromEntries([...COLLECTIONS].map(k=>[k,Array.isArray(loaded[k])?loaded[k]:[]])); } catch(e) { if(e.code!=='ENOENT') console.error('Could not read data file:',e.message); } }
function send(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>MAX_BODY)throw Object.assign(new Error('Request body too large'),{status:413});}try{return raw?JSON.parse(raw):{};}catch{throw Object.assign(new Error('Invalid JSON body'),{status:400});}}
function safeItem(item){ if(!item||typeof item!=='object'||Array.isArray(item))throw Object.assign(new Error('Expected a JSON object'),{status:400}); return item; }
async function api(req,res,url){
  if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,service:'AgroPilot local backend',storage:'JSON file',timestamp:new Date().toISOString()});
  if(req.method==='GET'&&url.pathname==='/api/farms')return send(res,200,{items:db.farms});
  if(req.method==='GET'&&url.pathname==='/api/activities')return send(res,200,{items:db.activities});
  if(req.method==='GET'&&url.pathname==='/api/shortlists')return send(res,200,{items:db.shortlists});
  if(req.method==='GET'&&url.pathname==='/api/uploads')return send(res,200,{items:db.uploads.map(({id,originalName,mimeType,size,createdAt,url})=>({id,originalName,mimeType,size,createdAt,url}))});
  if(req.method==='POST'&&url.pathname==='/api/uploads'){
    const payload=safeItem(await body(req));
    if(typeof payload.dataUrl!=='string')return send(res,400,{error:'dataUrl is required'});
    const match=payload.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if(!match)return send(res,415,{error:'Only JPEG, PNG, or WebP images are allowed'});
    const mimeType=match[1], buffer=Buffer.from(match[2],'base64');
    if(!buffer.length||buffer.length>MAX_IMAGE_BYTES)return send(res,413,{error:'Image must be smaller than 4 MB'});
    const id=randomUUID(), ext=mimeType==='image/jpeg'?'jpg':mimeType.split('/')[1];
    await fs.mkdir(UPLOAD_DIR,{recursive:true});
    const filePath=path.join(UPLOAD_DIR,`${id}.${ext}`);
    await fs.writeFile(filePath,buffer,{flag:'wx'});
    const item={id,originalName:String(payload.originalName||'crop-photo').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,100),mimeType,size:buffer.length,createdAt:new Date().toISOString(),url:`/uploads/crop-health/${id}.${ext}`,crop:String(payload.crop||'').slice(0,80),location:String(payload.location||'').slice(0,160)};
    db.uploads=[item,...db.uploads].slice(0,500); await persist();
    return send(res,201,{ok:true,item});
  }
  // Generic persisted collections used by the farm calendar, recovery tracker and future modules.
  const dataMatch=url.pathname.match(/^\/api\/data\/([a-zA-Z]+)(?:\/([a-zA-Z0-9-]+))?$/);
  if(dataMatch){
    const [,collection,actionOrId]=dataMatch;
    if(!COLLECTIONS.has(collection))return send(res,404,{error:'Unknown collection'});
    if(req.method==='GET'&&!actionOrId)return send(res,200,{items:db[collection]});
    if(req.method==='PUT'&&actionOrId==='replace'){
      const payload=await body(req); if(!Array.isArray(payload.items))return send(res,400,{error:'Expected items array'});
      if(payload.items.length>500)return send(res,413,{error:'Too many items (maximum 500)'});
      db[collection]=payload.items.map(x=>({...safeItem(x),id:x.id??randomUUID()})); await persist();
      return send(res,200,{ok:true,count:db[collection].length,items:db[collection]});
    }
    if(req.method==='POST'&&!actionOrId){
      const item=safeItem(await body(req)); const saved={...item,id:item.id??randomUUID(),serverSavedAt:new Date().toISOString()};
      db[collection]=[saved,...db[collection]].slice(0,500); await persist(); return send(res,201,{ok:true,item:saved});
    }
    if(req.method==='DELETE'&&actionOrId){
      const before=db[collection].length; db[collection]=db[collection].filter(x=>String(x.id)!==actionOrId);
      if(before===db[collection].length)return send(res,404,{error:'Item not found'}); await persist(); return send(res,200,{ok:true,deleted:1});
    }
    return send(res,405,{error:'Method not allowed for collection route'});
  }
  const routes={'/api/farms':'farms','/api/activities':'activities','/api/shortlists':'shortlists'};
  if(req.method==='POST'&&routes[url.pathname]){
    const key=routes[url.pathname], item=safeItem(await body(req));
    const saved={...item,id:item.id??randomUUID(),serverSavedAt:new Date().toISOString()};
    // Keep demo data bounded to prevent unbounded local JSON growth.
    db[key]=[saved,...db[key]].slice(0,key==='shortlists'?100:500);
    await persist(); return send(res,201,{ok:true,item:saved});
  }
  return send(res,404,{error:'API route not found'});
}
async function staticFile(req,res,url){
  let pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const full=path.resolve(ROOT,'.'+pathname);
  if(!full.startsWith(ROOT+path.sep)&&full!==ROOT)return send(res,403,{error:'Forbidden'});
  try{const stat=await fs.stat(full);if(!stat.isFile())return send(res,404,{error:'Not found'});const data=await fs.readFile(full);res.writeHead(200,{'Content-Type':MIME[path.extname(full).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':path.basename(full)==='index.html'?'no-cache':'public, max-age=3600'});res.end(data);}catch{send(res,404,{error:'Not found'});}
}
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed'});return await staticFile(req,res,url);}catch(e){send(res,e.status||500,{error:e.status?e.message:'Internal server error'});if(!e.status)console.error(e);}});
init().then(()=>server.listen(PORT,'127.0.0.1',()=>console.log(`AgroPilot running at http://127.0.0.1:${PORT}`)));
