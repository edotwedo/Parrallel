// Cloudflare Worker API for Parallel. Requires D1 binding DB and ADMIN_TOKEN secret.
// Do not deploy until bindings and a moderation workflow are configured.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const fields=["category","title","description","location","author"];
const limits={category:20,title:100,description:1000,location:80,author:50};
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==="/api/health")return json({ok:true,storage:!!env.DB});
 if(!env.DB)return json({error:"Database not configured"},503);
 if(request.method==="GET"&&url.pathname==="/api/posts"){
  const {results}=await env.DB.prepare("SELECT id,category,title,description,location,author,created_at FROM posts WHERE status='approved' ORDER BY created_at DESC LIMIT 100").all();
  return json({posts:results});
 }
 if(request.method==="POST"&&url.pathname==="/api/posts"){
  if(Number(request.headers.get("content-length")||0)>4096)return json({error:"Request too large"},413);
  let body;try{body=await request.json()}catch{return json({error:"Invalid JSON"},400)}
  if(!body||typeof body!=="object")return json({error:"Invalid post"},400);
  for(const f of fields){if(typeof body[f]!=="string"||!body[f].trim()||body[f].length>limits[f])return json({error:"Invalid "+f},400)}
  if(!["I Have","I Need","I Can Teach","Let's Build"].includes(body.category))return json({error:"Invalid category"},400);
  const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO posts (id,category,title,description,location,author,status) VALUES (?,?,?,?,?,?,'pending')").bind(id,...fields.map(f=>body[f].trim())).run();
  return json({id,status:"pending",message:"Submitted for review"},202);
 }
 if(url.pathname==="/api/admin/pending"||url.pathname==="/api/admin/review"){
  if(!env.ADMIN_TOKEN||request.headers.get("authorization")!=="Bearer "+env.ADMIN_TOKEN)return json({error:"Unauthorized"},401);
  if(request.method==="GET"&&url.pathname==="/api/admin/pending"){
   const {results}=await env.DB.prepare("SELECT * FROM posts WHERE status='pending' ORDER BY created_at ASC LIMIT 100").all();return json({posts:results});
  }
  if(request.method==="POST"&&url.pathname==="/api/admin/review"){
   let body;try{body=await request.json()}catch{return json({error:"Invalid JSON"},400)}
   if(typeof body?.id!=="string"||!["approved","rejected"].includes(body?.status))return json({error:"Invalid review"},400);
   const result=await env.DB.prepare("UPDATE posts SET status=? WHERE id=? AND status='pending'").bind(body.status,body.id).run();
   return json({updated:result.meta.changes>0});
  }
 }
 return json({error:"Not found"},404);
}};
