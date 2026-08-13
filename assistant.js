(()=>{
const DATA=window.ELAHA_ASSISTANT_DATA; if(!DATA)return;
const normalize=s=>String(s||'').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/[ـ]/g,'').replace(/[ًٌٍَُِّْ]/g,'').replace(/[؟?!.,،؛:()\[\]{}«»"']/g,' ').replace(/[\u200c\u200f]/g,' ').replace(/\s+/g,' ').trim();
const tokens=s=>normalize(s).split(' ').filter(Boolean);
const stop=new Set(['من','می','میخوام','می‌خوام','را','رو','در','به','از','برای','که','این','آن','یه','یک','چطور','چگونه','لطفا','لطفاً','میشه','می‌شود','هست','است','درباره','تو','و','یا']);
const clean=s=>tokens(s).filter(x=>!stop.has(x));
const edit=(a,b)=>{if(a===b)return 1; if(!a||!b)return 0; let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let cur=[i];for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur;}return 1-Math.min(prev[b.length],Math.max(a.length,b.length))/Math.max(a.length,b.length);};
const similarity=(q,k)=>{const a=clean(q),b=clean(k);if(!a.length||!b.length)return 0;let hits=0;for(const x of a){if(b.includes(x)){hits+=1;continue;}if(b.some(y=>Math.max(x.length,y.length)>3&&edit(x,y)>=.72))hits+=.7;}return hits/Math.max(a.length,b.length);};
const allKeys=DATA.facts.flatMap(f=>f.keys.map(k=>[f,k]));
function findBest(query){let best=null,bestScore=0;for(const [fact,key] of allKeys){let score=similarity(query,key);const nq=normalize(query),nk=normalize(key);if(nq.includes(nk))score+=.45;const q=clean(query),kw=clean(key);for(const t of kw)if(nq.includes(t))score+=.06;score=Math.min(score,1);if(score>bestScore){best={fact,key};bestScore=score;}}return {best,score:bestScore};}
function answer(query,history){const q=normalize(query);if(!q)return {text:'یک سؤال کوتاه بنویس تا باهم جوابش را پیدا کنیم 🌸',links:[]};
if(/^(سلام|درود|سلاممم|وقت بخیر|خوبی|چطوری|چه خبر)$/.test(q))return {text:'سلام! من «یارِ الهه» هستم 🦋🤍\nبرای سؤال‌های مربوط به مدرسه، اطلاعات سایت را دقیق جست‌وجو می‌کنم و چیزی را که نمی‌دانم حدس نمی‌زنم.',links:[['معرفی مدرسه','#school'],['بازی‌ها','#game'],['والدین','#parents']]};
if(/^(ممنون|مرسی|تشکر|خیلی ممنون)/.test(q))return {text:'خواهش می‌کنم 🌷 هر وقت درباره مدرسه سؤال داشتی، من اینجا هستم.',links:[]};
if(/^(خداحافظ|فعلا|فعلاً|بای)$/.test(q))return {text:'فعلاً 🌸 امیدوارم دوباره مهمان دنیای الهه بشی.',links:[]};
if(q.includes('مدرسه کج')||q.includes('آدرس')||q.includes('نشانی'))return {text:DATA.facts.find(f=>f.id==='address').answer,links:[['باز کردن بخش مدرسه','#school']]};
if((q.includes('چند')||q.includes('کدام')||q.includes('چه پایه'))&&(q.includes('پایه')||q.includes('کلاس')))return {text:'طبق اطلاعات فعلی، مدرسه در مقطع پیش‌دبستانی و ابتدایی است. جزئیات دقیق پایه‌ها هنوز وارد نشده و بعد از دریافت اطلاعات رسمی اضافه می‌شود.',links:[['مدرسه ما','#school']]};
const {best,score}=findBest(query);
if(best&&score>=.35)return {text:best.fact.answer,links:best.fact.links||[],score};
if(history?.lastFact&&/^(اون|آن|این|همین|پس|و|یعنی|خب)/.test(q))return {text:`اگر منظورت ادامه‌ی «${history.lastFact}» است، سؤال را کمی کامل‌تر بنویس تا دقیق جواب بدهم. 🌱`,links:[]};
const fb=DATA.fallback;return {text:fb[Math.floor(Math.random()*fb.length)],links:[]};}
function mount(){
const root=document.createElement('div');root.id='elaha-assistant';root.innerHTML=`<button class="ea-launch" aria-label="باز کردن دستیار یار الهه"><img src="assets/logo-elaha.png" alt=""><span class="ea-badge">یار الهه</span><i>✦</i></button><section class="ea-panel" role="dialog" aria-label="دستیار یار الهه" aria-hidden="true"><header><div class="ea-head-brand"><img src="assets/logo-elaha.png" alt=""><div><strong>یارِ الهه 🦋</strong><small>دستیار آفلاین مدرسه</small></div></div><button class="ea-close" aria-label="بستن">×</button></header><div class="ea-note">بدون API و بدون ارسال سؤال‌ها به سرور. پاسخ‌ها از دانش‌نامه‌ی سایت تولید می‌شوند.</div><div class="ea-messages" aria-live="polite"></div><div class="ea-suggest"><button>آدرس مدرسه کجاست؟</button><button>چه بخش‌هایی دارد؟</button><button>بازی‌ها را معرفی کن</button></div><form class="ea-form"><input autocomplete="off" placeholder="مثلاً: ساعت مدرسه چه موقع است؟" aria-label="سؤال شما"><button aria-label="ارسال">➤</button></form><div class="ea-status">دانش‌نامه‌ی فعلی: اطلاعات عمومی مدرسه</div></section>`;document.body.appendChild(root);
const panel=root.querySelector('.ea-panel'),launch=root.querySelector('.ea-launch'),close=root.querySelector('.ea-close'),messages=root.querySelector('.ea-messages'),input=root.querySelector('input'),form=root.querySelector('form');let history={lastFact:''};
const add=(who,text,links=[])=>{const row=document.createElement('div');row.className=`ea-msg ${who}`;const bubble=document.createElement('div');bubble.textContent=text;row.appendChild(bubble);if(links.length){const nav=document.createElement('div');nav.className='ea-links';links.forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;a.addEventListener('click',()=>closePanel());nav.appendChild(a);});row.appendChild(nav);}messages.appendChild(row);messages.scrollTop=messages.scrollHeight;};
const openPanel=()=>{panel.classList.add('open');panel.setAttribute('aria-hidden','false');setTimeout(()=>input.focus(),120);};const closePanel=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');};
launch.addEventListener('click',()=>panel.classList.contains('open')?closePanel():openPanel());close.addEventListener('click',closePanel);document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();});
add('bot','سلام! من یارِ الهه هستم 🌸\nهر چیزی درباره مدرسه خواستی بپرس. من فقط بر اساس اطلاعات ثبت‌شده جواب می‌دهم.');
root.querySelectorAll('.ea-suggest button').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;form.requestSubmit();}));
form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q)return;add('user',q);input.value='';const res=answer(q,history);if(res.score&&res.score>.5){const f=findBest(q);history.lastFact=f.best?.fact?.id||'';}add('bot',res.text,res.links);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();