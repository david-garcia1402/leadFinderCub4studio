import {normalize} from './leads.mjs';
const base='https://api.outscraper.com';
async function request(path, key) {
 const res=await fetch(base+path,{headers:{'X-API-KEY':key},signal:AbortSignal.timeout(45000)});
 if(res.status===204) throw new Error('The provider could not complete this search.');
 if(!res.ok) throw new Error(`Search service returned ${res.status}. Please contact support.`);
 const data=await res.json();
 if(data.status==='Failure'||data.error) throw new Error('The provider could not complete this search.');
 if(data.status==='Pending'||res.status===202) return {pending:true,providerId:data.id};
 return {pending:false,leads:(data.data||[]).flat().filter(x=>x&&x.name).map(x=>normalize(x))};
}
export const beginSearch=(s,key)=>request('/google-maps-search?'+new URLSearchParams({query:`${s.niche}, ${s.location}`,limit:String(s.limit),async:'true',language:'en'}),key);
export const checkSearch=(id,key)=>request('/requests/'+encodeURIComponent(id),key);
