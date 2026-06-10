
const fetch = require('node-fetch');
const {HttpsProxyAgent} = require('https-proxy-agent');
const fs2 = require('fs');
require('dotenv').config();
const agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const knownServices = JSON.parse(fs2.readFileSync('./data/knownServices.json','utf8'));
const KNOWN_SET = new Set(knownServices.addresses.map(a=>a.toLowerCase()));
const hubsPath = process.argv[2];
if (!hubsPath){console.error('Usage: node build_graph.js <hubs.json>');process.exit(1);}
const hubsData = JSON.parse(fs2.readFileSync(hubsPath,'utf8'));
async function getTopFunder(addr){
  try{
    const url = 'https://api.helius.xyz/v0/addresses/'+addr+'/transactions?api-key='+HELIUS_KEY+'&limit=100&type=TRANSFER';
    const txs = await (await fetch(url,{agent})).json();
    if(!Array.isArray(txs)) return null;
    const inc = new Map();
    for(const tx of txs){
      for(const t of (tx.nativeTransfers||[])){
        if(t.toUserAccount!==addr||t.amount<1000000) continue;
        const f=t.fromUserAccount;
        if(!f||f===addr||KNOWN_SET.has(f.toLowerCase())) continue;
        const e=inc.get(f)??{count:0,sol:0};
        e.count++;e.sol+=t.amount/1e9;inc.set(f,e);
      }
    }
    if(inc.size===0) return null;
    const top=[...inc.entries()].sort((a,b)=>b[1].count-a[1].count)[0];
    return {wallet:top[0],count:top[1].count,sol:top[1].sol};
  }catch{return null;}
}
function hubScore(creatorCount,childCount,hasParent){
  let s=0;
  s+=Math.min(creatorCount*0.08,0.40);
  s+=Math.min(childCount*0.10,0.30);
  if(hasParent) s+=0.10;
  return Math.min(Math.round(s*100)/100,1.0);
}
async function main(){
  const level1=hubsData.hub_ranking??[];
  console.error('Level-2 graph: '+level1.length+' wallets...');
  const graph=new Map();
  for(const hub of level1){
    graph.set(hub.hub_wallet,{wallet:hub.hub_wallet,level:1,parent:null,creator_count:hub.creator_count,hub_score:0});
  }
  const parentMap=new Map();
  for(let i=0;i<level1.length;i++){
    const w=level1[i].hub_wallet;
    const res=await getTopFunder(w);
    const parent=res?.wallet??null;
    console.error('['+( i+1)+'/'+level1.length+'] '+w.slice(0,8)+'... -> '+(parent?parent.slice(0,8)+'...':'none'));
    if(graph.has(w)) graph.get(w).parent=parent;
    if(parent){
      const s=parentMap.get(parent)??[];s.push(w);parentMap.set(parent,s);
      if(!graph.has(parent)) graph.set(parent,{wallet:parent,level:2,parent:null,creator_count:0,hub_score:0});
    }
  }
  for(const node of graph.values()){
    const childCount=(parentMap.get(node.wallet)??[]).length;
    node.hub_score=hubScore(node.creator_count,childCount,!!node.parent);
  }
  const clusters=[];
  let idx=2;
  for(const [parent,children] of parentMap.entries()){
    if(children.length<2) continue;
    const totalCreators=children.reduce((s,w)=>s+(graph.get(w)?.creator_count??0),0);
    const conf=Math.min(0.25+children.length*0.12+totalCreators*0.03,0.90);
    clusters.push({
      cluster_id:'CLUSTER_'+String(idx++).padStart(3,'0'),
      hub_wallet:parent,level:2,child_hubs:children,
      child_hub_count:children.length,total_creators:totalCreators,
      confidence_score:Math.round(conf*100)/100,
      signals:children.length>=3?['funding_overlap_l2','multi_child_hub']:['funding_overlap_l2'],
      status:conf>=0.6?'confirmed':conf>=0.4?'probable':'candidate',
    });
  }
  const hubRanking=[...graph.values()].sort((a,b)=>b.hub_score-a.hub_score).map(n=>({
    wallet:n.wallet,level:n.level,creator_count:n.creator_count,
    child_hub_count:(parentMap.get(n.wallet)??[]).length,hub_score:n.hub_score,parent:n.parent,
  }));
  const metrics={
    date:new Date().toISOString().split('T')[0],
    creators_analyzed:hubsData.creators_analyzed??0,
    funders_discovered:level1.length,
    parent_funders_discovered:[...parentMap.keys()].length,
    clusters_l1:hubsData.cluster_candidates??0,
    clusters_l2:clusters.length,
    largest_cluster_creators:clusters.length?Math.max(...clusters.map(c=>c.total_creators)):0,
  };
  const output={generated_at:new Date().toISOString(),wallets_analyzed:graph.size,clusters_found:clusters.length,hub_ranking:hubRanking,clusters,metrics};
  const outPath=hubsPath.replace('hubs','graph');
  fs2.writeFileSync(outPath,JSON.stringify(output,null,2));
  console.error('Saved to '+outPath);
  console.log('\n=== HUB RANKING ===');
  for(const h of hubRanking.filter(h=>h.hub_score>0).slice(0,10))
    console.log((h.hub_score>=0.5?'X':'-')+' '+h.wallet.slice(0,14)+'... L'+h.level+' score:'+h.hub_score+' creators:'+h.creator_count+' children:'+h.child_hub_count);
  if(clusters.length){
    console.log('\n=== NEW CLUSTERS ===');
    for(const c of clusters)
      console.log(c.cluster_id+' children:'+c.child_hub_count+' creators:'+c.total_creators+' conf:'+c.confidence_score+' ['+c.status+']');
  }else{console.log('\nNo L2 clusters in this batch.');}
  console.log('\n=== METRICS ===');
  console.log(JSON.stringify(metrics,null,2));
}
main().catch(e=>console.error(e.message));
