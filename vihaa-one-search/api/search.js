const INSTANCES=[
  "https://search.inetol.net/search",
  "https://searx.be/search",
  "https://searx.tiekoetter.com/search",
  "https://searx.work/search"
];

function pickCategory(mode){
  if(mode==="images")return "images";
  if(mode==="videos")return "videos";
  if(mode==="news")return "news";
  if(mode==="scholar")return "science";
  return "general";
}
function clean(s=""){return String(s).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
async function fetchJson(url,ms=3200){
  const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(url,{signal:c.signal,headers:{"User-Agent":"VIHAA-ONE-Search/1.0","Accept":"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}
}
async function searx(q,mode){
  const category=pickCategory(mode);
  for(const base of INSTANCES){
    try{
      const u=base+"?q="+encodeURIComponent(q)+"&format=json&language=auto&safesearch=1&categories="+encodeURIComponent(category);
      const d=await fetchJson(u);
      if(Array.isArray(d.results)&&d.results.length){
        return {provider:new URL(base).hostname,results:d.results.slice(0,mode==="research"?25:12).map(x=>({
          title:clean(x.title),url:x.url||x.img_src||"",content:clean(x.content||x.description||""),engine:Array.isArray(x.engines)?x.engines.join(", "):(x.engine||new URL(base).hostname),thumbnail:x.thumbnail||x.img_src||null
        }))};
      }
    }catch(e){}
  }
  return null;
}
async function wikipedia(q){
  const u="https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrlimit=8&prop=info%7Cextracts&inprop=url&exintro=1&explaintext=1&exsentences=2&format=json&origin=*";
  try{
    const d=await fetchJson(u,4000);const pages=Object.values(d.query?.pages||{});
    return pages.map(p=>({title:p.title,url:p.fullurl||("https://en.wikipedia.org/?curid="+p.pageid),content:clean(p.extract||""),engine:"Wikipedia"}));
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
function highlights(results){
  return results.map(r=>clean(r.content)).filter(x=>x.length>45).slice(0,4).map(x=>x.length>180?x.slice(0,177)+"…":x);
}
export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=180, stale-while-revalidate=600");
  res.setHeader("X-Content-Type-Options","nosniff");
  const q=clean(req.query?.q||"").slice(0,300);const mode=clean(req.query?.mode||"web");
  if(!q)return res.status(400).json({error:"Missing q",results:[]});
  let result=await searx(q,mode);
  if(!result){
    const [w,d]=await Promise.all([wikipedia(q),ddg(q)]);
    const merged=[...d,...w].filter((x,i,a)=>x.url&&a.findIndex(y=>y.url===x.url)===i);
    result={provider:"DuckDuckGo + Wikipedia fallback",results:merged};
  }
  res.status(200).json({query:q,mode,provider:result.provider,results:result.results,highlights:highlights(result.results)});
}