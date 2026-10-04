const http=require("http");
const fs=require("fs");
const path=require("path");

const PORT=process.env.PORT||10000;
const INDEX=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const INSTANCES=["https://search.inetol.net/search","https://searx.be/search","https://searx.tiekoetter.com/search","https://searx.work/search"];

function clean(s=""){return String(s).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function category(mode){return mode==="images"?"images":mode==="videos"?"videos":mode==="news"?"news":mode==="scholar"?"science":"general"}
async function fetchJson(url,ms=3200){
  const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(url,{signal:c.signal,headers:{"User-Agent":"VIHAA-ONE-Search/1.0","Accept":"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}
}
async function searx(q,mode){
  for(const base of INSTANCES){
    try{
      const d=await fetchJson(base+"?q="+encodeURIComponent(q)+"&format=json&language=auto&safesearch=1&categories="+category(mode));
      if(Array.isArray(d.results)&&d.results.length){
        return {provider:new URL(base).hostname,results:d.results.slice(0,mode==="research"?25:12).map(x=>({
          title:clean(x.title),url:x.url||x.img_src||"",content:clean(x.content||x.description||""),engine:Array.isArray(x.engines)?x.engines.join(", "):(x.engine||new URL(base).hostname),thumbnail:x.thumbnail||x.img_src||null
        }))};
      }
    }catch{}
  }
  return null;
}
async function wikipedia(q){
  try{
    const u="https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrlimit=8&prop=info%7Cextracts&inprop=url&exintro=1&explaintext=1&exsentences=2&format=json&origin=*";
    const d=await fetchJson(u,4000);return Object.values(d.query?.pages||{}).map(p=>({title:p.title,url:p.fullurl||("https://en.wikipedia.org/?curid="+p.pageid),content:clean(p.extract||""),engine:"Wikipedia"}));
  }catch{return []}
}
async function ddg(q){
  try{
    const d=await fetchJson("https://api.duckduckgo.com/?q="+encodeURIComponent(q)+"&format=json&no_html=1&skip_disambig=1",4000);
    const out=[];if(d.AbstractURL&&d.AbstractText)out.push({title:d.Heading||q,url:d.AbstractURL,content:d.AbstractText,engine:d.AbstractSource||"DuckDuckGo"});
    for(const t of d.RelatedTopics||[]){if(t.FirstURL&&t.Text)out.push({title:t.Text.split(" - ")[0],url:t.FirstURL,content:t.Text,engine:"DuckDuckGo"})}
    return out.slice(0,8);
  }catch{return []}
}
function highlights(results){return results.map(r=>clean(r.content)).filter(x=>x.length>45).slice(0,4).map(x=>x.length>180?x.slice(0,177)+"…":x)}
function json(res,status,obj){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"public,max-age=120","X-Content-Type-Options":"nosniff"});res.end(JSON.stringify(obj))}
async function handleSearch(req,res,url){
  const q=clean(url.searchParams.get("q")||"").slice(0,300),mode=clean(url.searchParams.get("mode")||"web");
  if(!q)return json(res,400,{error:"Missing q",results:[]});
  let result=await searx(q,mode);
  if(!result){
    const [w,d]=await Promise.all([wikipedia(q),ddg(q)]);
    const merged=[...d,...w].filter((x,i,a)=>x.url&&a.findIndex(y=>y.url===x.url)===i);
    result={provider:"DuckDuckGo + Wikipedia fallback",results:merged};
  }
  return json(res,200,{query:q,mode,provider:result.provider,results:result.results,highlights:highlights(result.results)});
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/api/search")return await handleSearch(req,res,url);
    if(url.pathname==="/health")return json(res,200,{ok:true,service:"VIHAA ONE Search"});
    if(url.pathname==="/"||url.pathname==="/index.html"){
      res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"public,max-age=60","Referrer-Policy":"strict-origin-when-cross-origin","X-Frame-Options":"SAMEORIGIN"});
      return res.end(INDEX);
    }
    res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not found");
  }catch(e){json(res,500,{error:"Internal search error",results:[]})}
});
server.listen(PORT,"0.0.0.0",()=>console.log("VIHAA ONE Search listening on "+PORT));