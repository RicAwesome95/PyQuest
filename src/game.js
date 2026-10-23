// ===== name (change here to rename the game everywhere) =====
const NAME=['Serpent ','&amp; Bean'];
const NAME_FULL='Serpent & Bean';
const NAME_SLUG='serpent_and_bean';
const LOG_KEY='serpent_log_v3';
// ==GEN START==
// ---------- utilities ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let RNG=Math.random;
const rint=(a,b)=>a+Math.floor(RNG()*(b-a+1));
const pick=a=>a[Math.floor(RNG()*a.length)];
const chance=p=>RNG()<p;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(RNG()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const MAX_D=15;

// ---------- difficulty settings: what a generated program may contain at each level ----------
// D1: assignments + arithmetic · D2: += -= *= · D3: if/else · D4: for loops · D5: elif, while, // and %
// D6: lists · D7: 'and' conditions · D8: nested loops · higher levels: longer programs, deeper nesting, more variables
function cfg(D){
  return{D,
    nVars:D<=2?2:D<=5?3:4,
    nStmts:D<=2?D+1:Math.min(5,2+Math.floor(D*0.25)),maxLines:Math.min(18,5+D),minLines:3+Math.floor(D*0.5),
    depthMax:D<=2?0:D<=4?1:D<=9?2:3,
    aug:D>=2, ifs:D>=3, fors:D>=4, elif:D>=5, whiles:D>=5, divmod:D>=5, lists:D>=6, and:D>=7, nested:D>=8,
    maxNum:D<=3?9:D<=7?12:20, maxIter:D<=5?4:D<=9?5:6,
    maxSteps:12+7*D};
}

// ---------- program generator: builds a small Python program as a tree, then prints it ----------
const VARNAMES=['x','y','z','n'];
function genProgram(D){
  const c=cfg(D),vars=VARNAMES.slice(0,c.nVars),useList=c.lists&&chance(0.7);
  const loopVars=['i','j','k'];
  const init=vars.map(v=>({t:'assign',v,e:{t:'num',v:rint(0,c.maxNum)}}));
  if(useList)init.push({t:'list',v:'nums',items:Array.from({length:rint(2,4)},()=>rint(1,9))});
  let loopDepth=0;
  function atom(scope){ // a variable (or loop variable) or a small number
    const pool=[...vars,...scope];
    if(chance(0.35))return{t:'num',v:rint(1,c.maxNum)};
    return{t:'var',v:pick(pool)};
  }
  function expr(scope){
    const r=RNG();
    if(useList&&r<0.15)return chance(0.5)?{t:'len',v:'nums'}:{t:'idx',v:'nums',i:{t:'num',v:0}};
    if(r<0.45)return atom(scope);
    const ops=['+','-'];if(c.D>=2)ops.push('*');if(c.divmod)ops.push('//','%');
    const op=pick(ops);
    if(op==='//'||op==='%')return{t:'bin',op,a:{t:'var',v:pick([...vars,...scope])},b:{t:'num',v:rint(2,5)}};
    if(op==='*')return{t:'bin',op,a:atom(scope),b:{t:'num',v:rint(2,3)}};
    const a=atom(scope);let b=atom(scope);
    if(a.t==='var'&&b.t==='var'&&a.v===b.v)b={t:'num',v:rint(1,c.maxNum)};
    return{t:'bin',op,a,b};
  }
  function cond(scope){
    const mk=()=>{const a=pick([...vars,...scope]);let b=chance(0.6)?{t:'num',v:rint(1,c.maxNum)}:{t:'var',v:pick(vars)};
      if(b.t==='var'&&b.v===a)b={t:'num',v:rint(1,c.maxNum)};
      return{t:'cmp',op:pick(['>','<','>=','<=','==','!=']),a:{t:'var',v:a},b};};
    if(c.and&&chance(0.4))return{t:'logic',op:pick(['and','or']),a:mk(),b:mk()};
    if(c.divmod&&chance(0.25))return{t:'cmp',op:'==',a:{t:'bin',op:'%',a:{t:'var',v:pick([...vars,...scope])},b:{t:'num',v:2}},b:{t:'num',v:pick([0,1])}};
    return mk();
  }
  function simple(scope){
    if(useList&&chance(0.25))return{t:'append',v:'nums',e:expr(scope)};
    if(c.aug&&chance(0.55)){const v=pick(vars),op=pick(c.D>=3?['+=','-=','*=']:['+=','-=']);
      let e=op==='*='?{t:'num',v:rint(2,3)}:expr(scope);
      if(JSON.stringify(e).includes('"v":"'+v+'"'))e={t:'num',v:rint(1,c.maxNum)};
      return{t:'aug',v,op,e};}
    const v=pick(vars);let e=expr(scope);
    if(e.t==='var'&&e.v===v)e={t:'bin',op:'+',a:e,b:{t:'num',v:rint(1,c.maxNum)}};
    return{t:'assign',v,e};
  }
  function block(depth,n,scope){
    const out=[];
    for(let s=0;s<n;s++){
      const canNest=depth<c.depthMax,r=RNG();
      if(canNest&&c.fors&&r<0.3&&(loopDepth===0||c.nested)){
        const lv=loopVars[loopDepth];loopDepth++;
        const it=rint(2,loopDepth>1?3:c.maxIter),start=chance(0.5)?0:rint(1,3),step=c.D>=6&&chance(0.3)?2:1;
        out.push({t:'for',v:lv,start,stop:start+it*step,step,body:block(depth+1,rint(1,2),[...scope,lv])});loopDepth--;
      }else if(canNest&&c.whiles&&loopDepth===0&&r<0.42){
        const v=pick(vars);loopDepth++;
        const body=block(depth+1,rint(0,1),scope).filter(st=>!(st.v===v));
        body.push({t:'aug',v,op:'+=',e:{t:'num',v:rint(1,4)}});
        out.push({t:'while',cond:{t:'cmp',op:pick(['<','<=']),a:{t:'var',v},b:{t:'num',v:rint(5,c.maxNum+10)}},body});loopDepth--;
      }else if(canNest&&c.ifs&&r<0.6){
        const st={t:'if',cond:cond(scope),body:block(depth+1,rint(1,2),scope),elifs:[],els:null};
        if(c.elif&&chance(0.35))st.elifs.push({cond:cond(scope),body:block(depth+1,1,scope)});
        if(chance(0.6))st.els=block(depth+1,1,scope);
        out.push(st);
      }else out.push(simple(scope));
    }
    return out;
  }
  const body=block(0,c.nStmts,[]);
  // what to print: a variable the program actually changes (the last one changed, most of the time)
  const changed=[];walk(body,s=>{if((s.t==='assign'||s.t==='aug')&&vars.includes(s.v))changed.push(s.v);});
  let printE;
  const r=RNG(),target=changed.length?(chance(0.7)?changed[changed.length-1]:pick(changed)):pick(vars);
  if(useList&&r<0.3)printE=pick([{t:'len',v:'nums'},{t:'sum',v:'nums'},{t:'idx',v:'nums',i:{t:'num',v:-1}}]);
  else if(useList&&r<0.4)printE={t:'var',v:'nums'};
  else if(c.D>=6&&r<0.55){let o=pick(vars.filter(v=>v!==target));printE={t:'pair',a:o,b:target};}
  else printE={t:'var',v:target};
  return{D,init,body,printE,useList,cfg:c};
}

// ---------- Python source code from the tree ----------
function exprSrc(e){
  switch(e.t){
    case'num':return String(e.v);
    case'var':return e.v;
    case'len':return`len(${e.v})`;
    case'sum':return`sum(${e.v})`;
    case'idx':return`${e.v}[${exprSrc(e.i)}]`;
    case'bin':{const pr=o=>o==='+'||o==='-'?1:2,P=pr(e.op);
      const L=e.a.t==='bin'&&pr(e.a.op)<P?`(${exprSrc(e.a)})`:exprSrc(e.a);
      const R=e.b.t==='bin'&&(pr(e.b.op)<P||(pr(e.b.op)===P&&e.op!=='+'&&e.op!=='*'))?`(${exprSrc(e.b)})`:exprSrc(e.b);
      return`${L} ${e.op} ${R}`;}
    case'cmp':return`${exprSrc(e.a)} ${e.op} ${exprSrc(e.b)}`;
    case'logic':return`${exprSrc(e.a)} ${e.op} ${exprSrc(e.b)}`;
    case'pair':return`${e.a}, ${e.b}`;
  }
}
function toSource(P){
  const L=[],ind=d=>'    '.repeat(d);
  const emit=(st,d)=>{
    switch(st.t){
      case'assign':L.push(ind(d)+`${st.v} = ${exprSrc(st.e)}`);break;
      case'list':L.push(ind(d)+`${st.v} = [${st.items.join(', ')}]`);break;
      case'aug':L.push(ind(d)+`${st.v} ${st.op} ${exprSrc(st.e)}`);break;
      case'append':L.push(ind(d)+`${st.v}.append(${exprSrc(st.e)})`);break;
      case'for':{const Sx=x=>typeof x==='number'?String(x):exprSrc(x),r=st.step!==1?`range(${Sx(st.start)}, ${Sx(st.stop)}, ${st.step})`:st.start!==0?`range(${Sx(st.start)}, ${Sx(st.stop)})`:`range(${Sx(st.stop)})`;
        L.push(ind(d)+`for ${st.v} in ${r}:`);st.body.forEach(s=>emit(s,d+1));break;}
      case'while':L.push(ind(d)+`while ${exprSrc(st.cond)}:`);st.body.forEach(s=>emit(s,d+1));break;
      case'if':L.push(ind(d)+`if ${exprSrc(st.cond)}:`);st.body.forEach(s=>emit(s,d+1));
        for(const el of st.elifs){L.push(ind(d)+`elif ${exprSrc(el.cond)}:`);el.body.forEach(s=>emit(s,d+1));}
        if(st.els){L.push(ind(d)+'else:');st.els.forEach(s=>emit(s,d+1));}break;
    }
  };
  P.init.forEach(s=>emit(s,0));P.body.forEach(s=>emit(s,0));
  L.push(`print(${exprSrc(P.printE)})`);
  return L.join('\n');
}

// ---------- interpreter (Python semantics for ints, // and %) ----------
// bug modes simulate common tracing mistakes; they produce the wrong answer options
class Halt extends Error{}
function run(P,bug){
  const env={},state={steps:0,flipped:false,augDone:false};
  const fdiv=(a,b)=>Math.floor(a/b),fmod=(a,b)=>a-b*Math.floor(a/b);
  const val=e=>{
    switch(e.t){
      case'num':return e.v;
      case'var':if(!(e.v in env))throw new Halt('undef');return env[e.v];
      case'len':return env[e.v].length;
      case'sum':return env[e.v].reduce((s,x)=>s+x,0);
      case'idx':{const L=env[e.v],i=val(e.i),k=i<0?L.length+i:i;if(k<0||k>=L.length)throw new Halt('index');return L[k];}
      case'bin':{const a=val(e.a),b=val(e.b);return e.op==='+'?a+b:e.op==='-'?a-b:e.op==='*'?a*b:e.op==='//'?fdiv(a,b):fmod(a,b);}
      case'cmp':{const a=val(e.a),b=val(e.b);let op=e.op;if(bug==='extra'&&e._loop&&op==='<')op='<=';
        return op==='>'?a>b:op==='<'?a<b:op==='>='?a>=b:op==='<='?a<=b:op==='=='?a===b:a!==b;}
      case'logic':{const a=val(e.a),b=val(e.b);return e.op==='and'?a&&b:a||b;}
    }
  };
  const chk=v=>{if(typeof v==='number'&&(Math.abs(v)>999||!Number.isInteger(v)))throw new Halt('big');return v;};
  const exec=(st)=>{
    if(++state.steps>400)throw new Halt('steps');
    switch(st.t){
      case'assign':env[st.v]=chk(val(st.e));break;
      case'list':env[st.v]=st.items.slice();break;
      case'aug':{if(!(st.v in env))throw new Halt('undef');const e=chk(val(st.e));
        if(bug==='aug'&&!state.augDone){state.augDone=true;env[st.v]=e;break;}
        env[st.v]=chk(st.op==='+='?env[st.v]+e:st.op==='-='?env[st.v]-e:env[st.v]*e);break;}
      case'append':env[st.v].push(chk(val(st.e)));if(env[st.v].length>10)throw new Halt('long');break;
      case'for':{const st0=typeof st.start==='number'?st.start:val(st.start),sp0=typeof st.stop==='number'?st.stop:val(st.stop),stop=bug==='extra'?sp0+st.step:sp0;
        for(let i=st0;i<stop;i+=st.step){env[st.v]=i;st.body.forEach(exec);state.steps++;}break;}
      case'while':{st.cond._loop=true;let n=0;while(val(st.cond)){if(++n>12)throw new Halt('while');st.body.forEach(exec);state.steps++;}break;}
      case'if':{let c=val(st.cond);if(bug==='flip'&&!state.flipped){state.flipped=true;c=!c;}
        if(c){st.body.forEach(exec);break;}
        for(const el of st.elifs)if(val(el.cond)){el.body.forEach(exec);return;}
        if(st.els)st.els.forEach(exec);break;}
    }
  };
  P.init.forEach(exec);
  const body=bug==='skip'?P.body.slice(0,-1):P.body;
  body.forEach(exec);
  const pe=P.printE;
  const show=v=>Array.isArray(v)?'['+v.join(', ')+']':String(v);
  const out=pe.t==='pair'?`${show(env[pe.a])} ${show(env[pe.b])}`:show(val(pe));
  return{out,steps:state.steps,env};
}
function walk(stmts,f,d=0){for(const s of stmts){f(s,d);if(s.body)walk(s.body,f,d+1);if(s.elifs)s.elifs.forEach(e=>walk(e.body,f,d+1));if(s.els)walk(s.els,f,d+1);}}
function features(P,steps,src){
  let depth=0,loops=0,conds=0,nested=false;
  walk(P.body,(s,d)=>{if(s.t==='for'||s.t==='while'){loops++;if(d>0)nested=true;}if(s.t==='if')conds++;depth=Math.max(depth,d+((s.body)?1:0));});
  return{lines:src.split('\n').length,depth,loops,conds,steps,hasList:P.useList?1:0,nested:nested?1:0};
}
// the main concept of a challenge (used for hints and as the BKT skill)
function mainConcept(P,f){
  const c=P.cfg;let k='arithmetic';
  walk(P.body,s=>{});
  if(P.body.some(s=>s.t==='aug'))k='assignment';
  if(f.conds)k='conditionals';
  if(f.loops)k=P.body.some(s=>s.t==='while')?'while-loops':'for-loops';
  if(f.hasList)k='lists';
  if(f.nested||f.depth>=2&&f.loops)k='nested';
  return k;
}
const CONCEPTS={
  'arithmetic':{name:'Variables & arithmetic',tip:'Go line by line and write down each variable\'s value after every line.'},
  'assignment':{name:'Updating variables',tip:'x += 3 means x = x + 3. Use the value x has at that moment.'},
  'conditionals':{name:'Conditionals',tip:'Check the condition with the current values. Only one branch runs: the first true one, or else.'},
  'for-loops':{name:'For loops',tip:'range(a, b) stops before b. List every value the loop variable takes, then run the body once for each.'},
  'while-loops':{name:'While loops',tip:'Check the condition before every pass and stop as soon as it is false.'},
  'lists':{name:'Lists',tip:'append adds to the end, len counts items, index 0 is the first item and -1 the last.'},
  'nested':{name:'Nested blocks',tip:'The inner block runs completely for each pass of the outer loop. Keep a small table of values.'},
  'loop-if':{name:'Loops with if',tip:'For each pass of the loop, check the if condition with the current value of the loop variable.'},
  'while-if':{name:'While loops with if',tip:'Each pass: check the while condition, then run only the if-branch that matches, then update.'},
  'list-loop':{name:'Looping over lists',tip:'nums[i] changes as i changes. Write down i and nums[i] for every pass.'},
  'logic':{name:'elif, and, or',tip:'and needs both sides true; or needs at least one. elif is checked only when the earlier conditions were false.'},
  'nested-loops':{name:'Nested loops',tip:'The inner loop runs completely for each pass of the outer loop. Count passes with a small table.'},
  'nested-if':{name:'Nested loops with if',tip:'Go pair by pair (i, j) and check the condition for each pair.'},
  'nested-while':{name:'Loops inside loops (while)',tip:'For each outer value, run the inner while loop until its condition is false, then move on.'},
};
// generate a full challenge at difficulty D (retries until the program is valid and traceable)
// ---------- meaningful program templates (levels 1–15) ----------
// Each template is a small program with a clear purpose (sum, count, find the max, savings, ...).
// Only the numbers change, and higher levels within a template's range use bigger values.
const N=v=>({t:'num',v}),V=n=>({t:'var',v:n}),Bn=(op,a,b)=>({t:'bin',op,a,b}),Cm=(op,a,b)=>({t:'cmp',op,a,b}),Lg=(op,a,b)=>({t:'logic',op,a,b});
const As=(v,e)=>({t:'assign',v,e}),Au=(v,op,e)=>({t:'aug',v,op,e}),Ls=(v,items)=>({t:'list',v,items}),Ap=(v,e)=>({t:'append',v,e}),Ix=(v,i)=>({t:'idx',v,i});
const Fo=(v,start,stop,body,step=1)=>({t:'for',v,start,stop,step,body}),Wh=(cond,body)=>({t:'while',cond,body});
const If=(cond,body,els=null,elifs=[])=>({t:'if',cond,body,elifs,els});
const prog=(init,body,printE)=>({init,body,printE,useList:JSON.stringify([init,body,printE]).includes('"list"')||JSON.stringify([init,body,printE]).includes('"idx"'),cfg:{}});
const TEMPLATES=[
  // ---- levels 1–2: variables and arithmetic ----
  {c:'arithmetic',lo:1,hi:2,make:D=>{const a=rint(5,20),b=rint(2,9);return prog([As('coins',N(a))],[As('coins',Bn('+',V('coins'),N(b)))],V('coins'));}},
  {c:'arithmetic',lo:1,hi:2,make:D=>{const p=rint(5,25),q=rint(2,5);return prog([As('price',N(p)),As('qty',N(q))],[As('total',Bn('*',V('price'),V('qty')))],V('total'));}},
  {c:'arithmetic',lo:1,hi:2,make:D=>{const a=rint(10,30),b=rint(2,9);return prog([As('apples',N(a)),As('eaten',N(b))],[As('left',Bn('-',V('apples'),V('eaten')))],V('left'));}},
  // ---- levels 2–3: updating variables ----
  {c:'assignment',lo:2,hi:3,make:D=>{const a=rint(10,40),b=rint(5,15),c=rint(2,9);return prog([As('score',N(a))],[Au('score','+=',N(b)),Au('score','-=',N(c))],V('score'));}},
  {c:'assignment',lo:2,hi:3,make:D=>{const a=rint(2,6),b=rint(1,9);return prog([As('steps',N(0))],[Au('steps','+=',N(a)),Au('steps','*=',N(2)),Au('steps','+=',N(b))],V('steps'));}},
  {c:'assignment',lo:2,hi:3,make:D=>{const m=rint(50,100),s=rint(10,30),c=rint(5,15);return prog([As('money',N(m)),As('spent',N(s))],[Au('money','-=',V('spent')),Au('money','-=',N(c))],V('money'));}},
  // ---- levels 3–4: if / else ----
  {c:'conditionals',lo:3,hi:4,make:D=>{const s=rint(60,95);return prog([As('score',N(s))],[If(Cm('>=',V('score'),N(75)),[As('bonus',N(10))],[As('bonus',N(0))]),Au('score','+=',V('bonus'))],V('score'));}},
  {c:'conditionals',lo:3,hi:4,make:D=>{const t=rint(8,25),l=rint(1,2),k=rint(1,3);return prog([As('temp',N(t)),As('layers',N(l))],[If(Cm('<',V('temp'),N(15)),[Au('layers','+=',N(k))])],V('layers'));}},
  {c:'conditionals',lo:3,hi:4,make:D=>{const a=rint(10,80);return prog([As('age',N(a)),As('fare',N(13))],[If(Cm('>=',V('age'),N(60)),[Au('fare','-=',N(3))],[If(Cm('<',V('age'),N(18)),[Au('fare','-=',N(2))])])],V('fare'));}},
  // ---- levels 4–5: simple for loops ----
  {c:'for-loops',lo:4,hi:5,make:D=>{const n=rint(3,6+D-4),s=rint(1,2),t0=rint(0,5);return prog([As('total',N(t0))],[Fo('i',s,n+1,[Au('total','+=',V('i'))])],V('total'));}},
  {c:'for-loops',lo:4,hi:5,make:D=>{const n=rint(3,7),k=rint(2,5),s0=rint(0,4);return prog([As('stars',N(s0))],[Fo('i',0,n,[Au('stars','+=',N(k))])],V('stars'));}},
  {c:'for-loops',lo:4,hi:5,make:D=>{const n=rint(3,5+D-4),c0=rint(1,3);return prog([As('cells',N(c0))],[Fo('day',0,n,[Au('cells','*=',N(2))])],V('cells'));}},
  // ---- levels 5–8: loop + if, while, // and % ----
  {c:'loop-if',lo:5,hi:7,make:D=>{const n=rint(6,10+D-5),m=pick([2,3,4]);return prog([As('count',N(0))],[Fo('i',1,n+1,[If(Cm('==',Bn('%',V('i'),N(m)),N(0)),[Au('count','+=',N(1))])])],V('count'));}},
  {c:'while-loops',lo:5,hi:7,make:D=>{const c=rint(3,6),f=c*rint(3,5)+rint(0,c-1);return prog([As('fuel',N(f)),As('trips',N(0))],[Wh(Cm('>=',V('fuel'),N(c)),[Au('fuel','-=',N(c)),Au('trips','+=',N(1))])],V('trips'));}},
  {c:'while-loops',lo:5,hi:7,make:D=>{const a=rint(15,40),g=a*rint(3,6)-rint(0,10);return prog([As('savings',N(0)),As('weeks',N(0))],[Wh(Cm('<',V('savings'),N(g)),[Au('savings','+=',N(a)),Au('weeks','+=',N(1))])],V('weeks'));}},
  {c:'while-loops',lo:6,hi:8,make:D=>{const n=rint(100,999);return prog([As('n',N(n)),As('digits',N(0))],[Wh(Cm('>',V('n'),N(0)),[Au('digits','+=',Bn('%',V('n'),N(10))),As('n',Bn('//',V('n'),N(10)))])],V('digits'));}},
  // ---- levels 6–9: lists ----
  {c:'lists',lo:6,hi:8,make:D=>{const k=rint(3,4),it=Array.from({length:k},()=>rint(5,30));return prog([Ls('prices',it),As('total',N(0))],[Fo('i',0,k,[Au('total','+=',Ix('prices',V('i')))])],V('total'));}},
  {c:'lists',lo:6,hi:8,make:D=>{const it=Array.from({length:rint(2,4)},()=>rint(1,9)),x=rint(1,9),y=rint(1,9);return prog([Ls('scores',it)],[Ap('scores',N(x)),Ap('scores',N(y))],{t:'sum',v:'scores'});}},
  {c:'list-loop',lo:7,hi:9,make:D=>{const k=rint(4,5),it=Array.from({length:k},()=>rint(1,50));return prog([Ls('nums',it),As('biggest',Ix('nums',N(0)))],[Fo('i',1,k,[If(Cm('>',Ix('nums',V('i')),V('biggest')),[As('biggest',Ix('nums',V('i')))])])],V('biggest'));}},
  // ---- levels 7–10: elif, and / or ----
  {c:'logic',lo:7,hi:9,make:D=>{const s=rint(50,100);return prog([As('score',N(s))],[If(Cm('>=',V('score'),N(90)),[As('grade',N(1))],[As('grade',N(3))],[{cond:Cm('>=',V('score'),N(75)),body:[As('grade',N(2))]}])],V('grade'));}},
  {c:'logic',lo:7,hi:10,make:D=>{const n=rint(10,15+D-7),[p,q]=pick([[3,5],[2,7],[3,4],[4,5]]);return prog([As('count',N(0))],[Fo('i',1,n+1,[If(Lg('or',Cm('==',Bn('%',V('i'),N(p)),N(0)),Cm('==',Bn('%',V('i'),N(q)),N(0))),[Au('count','+=',N(1))])])],V('count'));}},
  {c:'logic',lo:7,hi:10,make:D=>{const n=rint(8,10+D-7),k=rint(2,5);return prog([As('total',N(0))],[Fo('i',1,n+1,[If(Lg('and',Cm('==',Bn('%',V('i'),N(2)),N(1)),Cm('>',V('i'),N(k))),[Au('total','+=',V('i'))])])],V('total'));}},
  // ---- levels 8–11: nested loops ----
  {c:'nested-loops',lo:8,hi:10,make:D=>{const a=rint(2,5),b=rint(2,6),k=rint(1,3);return prog([As('cells',N(0))],[Fo('row',0,a,[Fo('col',0,b,[Au('cells','+=',N(k))])])],V('cells'));}},
  {c:'nested-loops',lo:9,hi:11,make:D=>{const a=rint(2,4),b=rint(2,4),t0=rint(0,5);return prog([As('total',N(t0))],[Fo('i',1,a+1,[Fo('j',1,b+1,[Au('total','+=',Bn('*',V('i'),V('j')))])])],V('total'));}},
  {c:'nested-loops',lo:8,hi:11,make:D=>{const n=rint(3,5+(D>=10?1:0)),k=rint(1,2);return prog([As('stars',N(0))],[Fo('i',1,n+1,[Fo('j',0,V('i'),[Au('stars','+=',N(k))])])],V('stars'));}},
  // ---- levels 10–13: nested + conditions ----
  {c:'nested-if',lo:10,hi:12,make:D=>{const n=rint(3,5),k=rint(3,n+4),op=pick(['==','<','>']);return prog([As('pairs',N(0))],[Fo('i',1,n+1,[Fo('j',1,n+1,[If(Cm(op,Bn('+',V('i'),V('j')),N(k)),[Au('pairs','+=',N(1))])])])],V('pairs'));}},
  {c:'while-if',lo:10,hi:13,make:D=>{const n=pick([3,5,6,8,10,12,13,16,20,21,32,40,64,80,128]);return prog([As('n',N(n)),As('steps',N(0))],[Wh(Cm('!=',V('n'),N(1)),[If(Cm('==',Bn('%',V('n'),N(2)),N(0)),[As('n',Bn('//',V('n'),N(2)))],[As('n',Bn('+',Bn('*',N(3),V('n')),N(1)))]),Au('steps','+=',N(1))])],V('steps'));}},
  {c:'list-loop',lo:10,hi:12,make:D=>{const it=Array.from({length:5},()=>rint(1,20));return prog([Ls('nums',it),Ls('evens',[])],[Fo('i',0,5,[If(Cm('==',Bn('%',Ix('nums',V('i')),N(2)),N(0)),[Ap('evens',Ix('nums',V('i')))])])],{t:'len',v:'evens'});}},
  // ---- levels 12–15: combined ideas ----
  {c:'loop-if',lo:12,hi:14,make:D=>{const b=rint(100,300),dep=rint(20,60),fee=rint(10,25),m=rint(4,6);return prog([As('balance',N(b))],[Fo('month',1,m+1,[Au('balance','+=',N(dep)),If(Cm('==',Bn('%',V('month'),N(3)),N(0)),[Au('balance','-=',N(fee))])])],V('balance'));}},
  {c:'nested-if',lo:12,hi:15,make:D=>{const a=rint(2,4),b=rint(3,5);return prog([As('even',N(0)),As('odd',N(0))],[Fo('i',1,a+1,[Fo('j',1,b+1,[If(Cm('==',Bn('%',Bn(pick(['+','*']),V('i'),V('j')),N(2)),N(0)),[Au('even','+=',N(1))],[Au('odd','+=',N(1))])])])],{t:'pair',a:'even',b:'odd'});}},
  {c:'list-loop',lo:12,hi:15,make:D=>{const it=Array.from({length:6},()=>rint(1,40));return prog([Ls('temps',it),As('low',Ix('temps',N(0))),As('high',Ix('temps',N(0)))],[Fo('i',1,6,[If(Cm('<',Ix('temps',V('i')),V('low')),[As('low',Ix('temps',V('i')))],null,[{cond:Cm('>',Ix('temps',V('i')),V('high')),body:[As('high',Ix('temps',V('i')))]}])])],Bn('-',V('high'),V('low')));}},
  {c:'nested-while',lo:13,hi:15,make:D=>{const a=rint(8,25);return prog([As('total',N(0))],[Fo('i',1,a+1,[As('n',V('i')),Wh(Cm('>',V('n'),N(0)),[Au('total','+=',Bn('%',V('n'),N(10))),As('n',Bn('//',V('n'),N(10)))])])],V('total'));}},
  {c:'nested-while',lo:14,hi:15,make:D=>{const m=rint(8,20);return prog([As('count',N(0))],[Fo('n',2,m+1,[As('d',N(2)),As('prime',N(1)),Wh(Cm('<=',Bn('*',V('d'),V('d')),V('n')),[If(Cm('==',Bn('%',V('n'),V('d')),N(0)),[As('prime',N(0))]),Au('d','+=',N(1))]),Au('count','+=',V('prime'))])],V('count'));}},
  {c:'nested-if',lo:13,hi:15,make:D=>{const it=Array.from({length:4},()=>rint(1,9));const t=it[0]+it[rint(1,3)];return prog([Ls('nums',it),As('count',N(0))],[Fo('i',0,4,[Fo('j',Bn('+',V('i'),N(1)),4,[If(Cm('==',Bn('+',Ix('nums',V('i')),Ix('nums',V('j'))),N(t)),[Au('count','+=',N(1))])])])],V('count'));}},
];
function genTemplate(D){const ok=TEMPLATES.filter(t=>D>=t.lo&&D<=t.hi),t=pick(ok),P=t.make(D);P.concept=t.c;return P;}
const USE_TEMPLATES=true; // false = the old random program builder
function makeChallenge(D){
  const c=cfg(D);
  for(let tries=0;tries<400;tries++){
    const P=USE_TEMPLATES?genTemplate(D):genProgram(D);let r;
    try{r=run(P);}catch(e){continue;}
    if(r.steps>(USE_TEMPLATES?300:c.maxSteps))continue;
    const src=toSource(P),f=features(P,r.steps,src);
    if(!USE_TEMPLATES){
    // each level must actually use its new construct
    if(D>=3&&D<=4&&!f.conds)continue;
    if(D>=4&&!f.loops)continue;
    if(D>=6&&D<=7&&!f.hasList&&!f.conds)continue;
    if(D>=8&&!f.nested&&f.depth<2)continue;
    if(D>=10&&f.depth<2)continue;
    if(f.lines<c.minLines||f.lines>c.maxLines)continue;
    // the printed value should depend on the program, not just the first line
    const trivial=P.printE.t==='var'&&P.init.some(s=>s.v===P.printE.v&&s.e&&String(s.e.v)===r.out);
    if(trivial)continue;
    }
    // wrong options from common tracing mistakes, then near misses
    const wrong=[];
    for(const bug of['extra','flip','skip','aug']){try{const o=run(P,bug).out;if(o!==r.out&&!wrong.includes(o))wrong.push(o);}catch(e){}}
    const n=Number(r.out);
    for(const d of[1,-1,2,-2,3,10]){if(wrong.length>=6)break;if(!isNaN(n)&&r.out.trim()!==''&&!r.out.includes(' ')){const s=String(n+d);if(!wrong.includes(s)&&s!==r.out)wrong.push(s);}}
    if(wrong.length<3&&r.out.includes(' ')){const[a,b]=r.out.split(' ').map(Number);
      for(const s of[`${b} ${a}`,`${a+1} ${b}`,`${a} ${b+1}`,`${a-1} ${b}`,`${a} ${b-1}`])if(s!==r.out&&!wrong.includes(s))wrong.push(s);}
    if(wrong.length<3)continue;
    const chosen=shuffle(wrong.slice(0,4)).slice(0,3);
    return{D,P,code:src,answer:r.out,options:shuffle([r.out,...chosen]),feat:f,concept:P.concept||mainConcept(P,f)};
  }
  throw new Error('could not generate D='+D);
}
// ==GEN END==
const clone=o=>JSON.parse(JSON.stringify(o));
// quests use only programs where every line matters: deleting any line changes the output
function stmtLists(P){const out=[P.init,P.body];const go=a=>a.forEach(s=>{if(s.body){out.push(s.body);go(s.body);}if(s.elifs)s.elifs.forEach(e=>{out.push(e.body);go(e.body);});if(s.els){out.push(s.els);go(s.els);}});go(P.init);go(P.body);return out;}
function everyLineMatters(P,base){
  const L=stmtLists(P);
  for(let li=0;li<L.length;li++)for(let i=0;i<L[li].length;i++){
    if(li>=2&&L[li].length===1)continue; // a block body can't be empty; removing the whole block is tested in its parent list
    const Q=clone(P),LQ=stmtLists(Q);LQ[li].splice(i,1);
    let out;try{out=run(Q).out;}catch(e){continue;}
    if(out===base)return false;
  }
  return true;
}
// remove lines that don't change the output, one at a time, until every line matters
function prune(P,base){
  for(let guard=0;guard<40;guard++){const L=stmtLists(P);let cut=null;
    for(let li=0;li<L.length&&!cut;li++)for(let i=0;i<L[li].length;i++){
      if(li>=2&&L[li].length===1)continue;const Q=clone(P);stmtLists(Q)[li].splice(i,1);
      let out;try{out=run(Q).out;}catch(e){continue;}if(out===base){cut=Q;break;}}
    if(!cut)return P;P=cut;}
  return P;
}
function makeCleanChallenge(D){
  if(USE_TEMPLATES)return makeChallenge(D);
  const cf=cfg(D);let fallback=null;
  for(let t=0;t<60;t++){
    let c;try{c=makeChallenge(D);}catch(e){continue;}if(!fallback)fallback=c;
    const P=prune(clone(c.P),c.answer);let r;try{r=run(P);}catch(e){continue;}
    if(r.out!==c.answer)continue;
    const src=toSource(P),f=features(P,r.steps,src);
    if(D>=3&&D<=4&&!f.conds)continue;
    if(D>=4&&!f.loops)continue;
    if(D>=8&&!f.nested&&f.depth<2)continue;
    if(D>=10&&f.depth<2)continue;
    if(f.lines<Math.max(4,cf.minLines-2))continue;
    if(!everyLineMatters(P,c.answer))continue;
    return Object.assign({},c,{P,code:src,feat:f,concept:mainConcept(P,f)});
  }
  return fallback||makeCleanChallenge(Math.max(1,D-1));
}


// ---------- MLP: inputs → 16 ReLU → 8 ReLU → 1 sigmoid, Adam, binary cross-entropy ----------
class MLP{
  constructor(sizes,rnd){this.sizes=sizes;this.L=sizes.length-1;this.t=0;this.W=[];this.b=[];this.mW=[];this.vW=[];this.mb=[];this.vb=[];
    for(let l=0;l<this.L;l++){const nI=sizes[l],nO=sizes[l+1],lim=Math.sqrt(6/nI)*(l===this.L-1?0.5:1);
      this.W.push(Float64Array.from({length:nI*nO},()=>(rnd()*2-1)*lim));this.b.push(new Float64Array(nO).fill(l<this.L-1?0.01:0));
      this.mW.push(new Float64Array(nI*nO));this.vW.push(new Float64Array(nI*nO));this.mb.push(new Float64Array(nO));this.vb.push(new Float64Array(nO));}}
  forward(x){const acts=[x];for(let l=0;l<this.L;l++){const nI=this.sizes[l],nO=this.sizes[l+1],a=acts[l],W=this.W[l],out=new Float64Array(nO);
      for(let o=0;o<nO;o++){let z=this.b[l][o];for(let i=0;i<nI;i++)z+=W[o*nI+i]*a[i];out[o]=l<this.L-1?(z>0?z:0):1/(1+Math.exp(-z));}acts.push(out);}return acts;}
  predict(x){return this.forward(x)[this.L][0];}
  accum(x,y,gW,gb){const acts=this.forward(x);let delta=[acts[this.L][0]-y]; // dBCE/dz for a sigmoid output
    for(let l=this.L-1;l>=0;l--){const nI=this.sizes[l],nO=this.sizes[l+1],a=acts[l],W=this.W[l];
      for(let o=0;o<nO;o++){gb[l][o]+=delta[o];for(let i=0;i<nI;i++)gW[l][o*nI+i]+=delta[o]*a[i];}
      if(l>0){const nd=new Float64Array(nI);for(let i=0;i<nI;i++){if(a[i]<=0)continue;let s=0;for(let o=0;o<nO;o++)s+=W[o*nI+i]*delta[o];nd[i]=s;}delta=nd;}}}
  zeros(){return[this.W.map(w=>new Float64Array(w.length)),this.b.map(b=>new Float64Array(b.length))];}
  step(gW,gb,n,lr){this.t++;const b1=.9,b2=.999,eps=1e-8,c1=1-Math.pow(b1,this.t),c2=1-Math.pow(b2,this.t);
    const upd=(P,G,M,V)=>{for(let k=0;k<P.length;k++){const g=G[k]/n;M[k]=b1*M[k]+(1-b1)*g;V[k]=b2*V[k]+(1-b2)*g*g;P[k]-=lr*(M[k]/c1)/(Math.sqrt(V[k]/c2)+eps);}};
    for(let l=0;l<this.L;l++){upd(this.W[l],gW[l],this.mW[l],this.vW[l]);upd(this.b[l],gb[l],this.mb[l],this.vb[l]);}}
  fit(X,Y,{epochs=15,batch=32,lr=0.003,rnd=Math.random}={}){const idx=X.map((_,i)=>i);
    for(let ep=0;ep<epochs;ep++){for(let i=idx.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
      for(let s=0;s<idx.length;s+=batch){const[gW,gb]=this.zeros(),e=Math.min(idx.length,s+batch);for(let k=s;k<e;k++)this.accum(X[idx[k]],Y[idx[k]],gW,gb);this.step(gW,gb,e-s,lr);}}}
  trainOne(x,y,lr){const[gW,gb]=this.zeros();this.accum(x,y,gW,gb);this.step(gW,gb,1,lr);}
}
// ---------- baseline: logistic regression on the same features ----------
class LogReg{
  constructor(n){this.w=new Float64Array(n);this.b=0;}
  predict(x){let z=this.b;for(let i=0;i<x.length;i++)z+=this.w[i]*x[i];return 1/(1+Math.exp(-z));}
  trainOne(x,y,lr){const g=this.predict(x)-y;for(let i=0;i<x.length;i++)this.w[i]-=lr*g*x[i];this.b-=lr*g;}
  fit(X,Y,{epochs=20,lr=0.05,rnd=Math.random}={}){const idx=X.map((_,i)=>i);
    for(let ep=0;ep<epochs;ep++){for(let i=idx.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
      const a=lr*(1-ep/(epochs*1.5));for(const i of idx)this.trainOne(X[i],Y[i],a);}}
}
// ---------- baseline: Bayesian Knowledge Tracing, one skill per concept tag, fitted by grid search ----------
const BKT_GRID=(()=>{const g=[];for(const L0 of[.1,.3,.5,.7,.9])for(const T of[.02,.05,.1,.2,.3])for(const S of[.05,.1,.2,.3])for(const G of[.1,.2,.3,.4])g.push({L0,T,S,G});return g;})();
function bktSeqs(rows){const m=new Map();for(const r of rows){const k=r.learner+'|'+r.concept;if(!m.has(k))m.set(k,{c:r.concept,ys:[]});m.get(k).ys.push(r.y);}return[...m.values()];}
function bktLL(seqs,P){let ll=0;for(const s of seqs){let L=P.L0;for(const y of s.ys){const pc=L*(1-P.S)+(1-L)*P.G;ll+=y?Math.log(pc):Math.log(1-pc);L=y?L*(1-P.S)/pc:L*P.S/(1-pc);L=L+(1-L)*P.T;}}return ll;}
function bktFitOne(seqs){let best=BKT_GRID[0],bl=-Infinity;for(const P of BKT_GRID){const l=bktLL(seqs,P);if(l>bl){bl=l;best=P;}}return best;}
function fitBKT(rows){const seqs=bktSeqs(rows),by={};for(const s of seqs)(by[s.c]=by[s.c]||[]).push(s);
  const model={global:bktFitOne(seqs),byC:{}};for(const c in by)model.byC[c]=bktFitOne(by[c]);return model;}
const bktParams=(m,c)=>m.byC[c]||m.global; // a concept never seen in training falls back to the global parameters
function bktProb(m,state,c){const P=bktParams(m,c),L=state[c]??P.L0;return L*(1-P.S)+(1-L)*P.G;}
function bktUpdate(m,state,c,y){const P=bktParams(m,c);let L=state[c]??P.L0;const pc=L*(1-P.S)+(1-L)*P.G;L=y?L*(1-P.S)/pc:L*P.S/(1-pc);state[c]=L+(1-L)*P.T;}
function bktPredictRows(m,rows){const st={};return rows.map(r=>{const s=(st[r.learner]=st[r.learner]||{});const p=bktProb(m,s,r.concept);bktUpdate(m,s,r.concept,r.y);return p;});}

// ---------- metrics ----------
function auc(ps,ys){const idx=ps.map((_,i)=>i).sort((a,b)=>ps[a]-ps[b]);let sumPos=0,nPos=0;
  for(let i=0;i<idx.length;){let j=i;while(j<idx.length&&ps[idx[j]]===ps[idx[i]])j++;const avg=(i+1+j)/2;for(let k=i;k<j;k++)if(ys[idx[k]]){sumPos+=avg;nPos++;}i=j;}
  const nNeg=ys.length-nPos;return nPos&&nNeg?(sumPos-nPos*(nPos+1)/2)/(nPos*nNeg):NaN;}
function metrics(ps,ys){let tp=0,fp=0,fn=0,tn=0,br=0;
  ps.forEach((p,i)=>{const y=ys[i],h=p>=.5;if(h&&y)tp++;else if(h)fp++;else if(y)fn++;else tn++;br+=(p-y)*(p-y);});
  const n=ys.length,prec=tp+fp?tp/(tp+fp):0,rec=tp+fn?tp/(tp+fn):0;
  return{n,acc:n?(tp+tn)/n:NaN,prec,rec,f1:prec+rec?2*prec*rec/(prec+rec):0,auc:auc(ps,ys),brier:n?br/n:NaN};}


// ---------- features (same for simulated learners and live play) ----------
const FEATS=[['f_acc_all','Overall accuracy'],['f_acc_recent','Recent accuracy (last 5)'],['f_acc_near','Accuracy at similar difficulty'],['f_last','Last challenge solved?'],
  ['f_time','Recent time used'],['f_streak','Current streak'],['f_max_level','Highest level solved'],['f_recent_level','Recent average level'],
  ['f_hint_rate','Recent hint use'],['f_retry_rate','Recent retries'],['f_acc_concept','Accuracy on this concept'],
  ['f_level','Challenge level'],['f_lines','Lines of code'],['f_depth','Nesting depth'],['f_loops','Loops'],['f_steps','Steps to trace'],['f_has_list','Uses a list?'],['f_jump','Level jump vs. recent']];
const NF=FEATS.length;
// hist items: {D, concept, y, tfrac, hint, attempts}   y = solved on the first try without a hint
function featurize(hist,ch){
  const n=hist.length,sm=a=>(a.filter(h=>h.y).length+1)/(a.length+2),rec=hist.slice(-5);
  let streak=0;for(let i=n-1;i>=0&&hist[i].y;i--)streak++;
  let hi=0;for(const h of hist)if(h.y&&h.D>hi)hi=h.D;
  const avg=f=>rec.length?rec.reduce((s,h)=>s+f(h),0)/rec.length:0;
  const recD=rec.length?avg(h=>h.D):1,f=ch.feat;
  return[
    sm(hist),sm(rec),sm(hist.filter(h=>Math.abs(h.D-ch.D)<=1)),n?hist[n-1].y:0.5,
    rec.length?avg(h=>h.tfrac):0.5,Math.min(streak,5)/5,hi/MAX_D,recD/MAX_D,
    avg(h=>h.hint),avg(h=>Math.max(1,h.attempts)>1?1:0),sm(hist.filter(h=>h.concept===ch.concept)),
    ch.D/MAX_D,Math.min(1,f.lines/18),f.depth/3,Math.min(1,f.loops/4),Math.min(1,f.steps/60),f.hasList,Math.max(-1,Math.min(1,(ch.D-recD)/5)),
  ];
}
function ruleP(hist,ch){ // baseline: recent accuracy, lowered for each level above the last one
  const rec=hist.slice(-5),acc=(rec.filter(h=>h.y).length+1)/(rec.length+2),last=hist.length?hist[hist.length-1].D:1;
  return Math.min(.95,Math.max(.05,acc-0.12*(ch.D-last)));
}

// ---------- simulated learners (Thesis 1 allows synthetic data) ----------
const sig=z=>1/(1+Math.exp(-z));
function gauss(r){let u=0;while(!u)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
// how hard a challenge really is for a simulated learner: mostly its level, plus its code features
const effD=ch=>{const f=ch.feat;return 0.55*ch.D+0.06*f.steps+0.45*f.depth+0.3*f.hasList+0.15*f.conds;};
function makeLearner(r){return{r,s:Math.max(0.5,Math.min(13,4+gauss(r)*1.8)),fam:{},lr:0.03+r()*0.08,hintProp:r()*0.5};}
function learnerAttempt(L,ch){
  const r=L.r,fam=L.fam[ch.concept]||0,dE=effD(ch);
  const p=0.15+0.8*sig(1.1*(L.s-dE)+1.0+0.4*fam);
  const hint=r()<L.hintProp*(1-p);
  let y=0,solved=false,attempts=1;
  if(hint){solved=r()<p+(1-p)*0.35;if(!solved){attempts=2;solved=r()<0.3+0.4*p;}}
  else if(r()<p){y=1;solved=true;}
  else{attempts=2;solved=r()<0.3+0.4*p;}
  let tfrac=Math.min(1,Math.max(0.05,0.2+0.5*(1-p)+gauss(r)*0.1+(attempts-1)*0.15+(hint?0.1:0)));if(!solved&&r()<0.15)tfrac=1;
  L.s+=solved?L.lr*(dE>=L.s-1?1.2:0.4):L.lr*0.15;
  L.fam[ch.concept]=Math.min(1.5,fam+(solved?0.3:0.1));
  return{y,solved,attempts,hint:hint?1:0,tfrac};
}

// ---------- a seeded pool of generated challenges, so simulations run fast ----------
let POOL=null;
function buildPool(seed,perLevel){
  const keep=RNG;RNG=mulberry32(seed);const pool={};
  for(let D=1;D<=MAX_D;D++){pool[D]=[];for(let k=0;k<perLevel;k++){const c=makeChallenge(D);pool[D].push({D,feat:c.feat,concept:c.concept});}}
  RNG=keep;return pool;
}
const fromPool=(D,r)=>{const a=POOL[D];return a[Math.floor(r()*a.length)];};

// ---------- level selection (shared by live play and the simulations) ----------
const TARGET=0.85,BAND=0.10;
function allowedLevels(hist){
  if(!hist.length)return[1,2];
  const last=hist[hist.length-1],D=last.D;let streak=0;for(let i=hist.length-1;i>=0&&hist[i].y;i--)streak++;
  const L=last.y?[D,D+1].concat(streak>=3?[D+2]:[]):[D-1,D];
  return[...new Set(L.map(v=>Math.max(1,Math.min(MAX_D,v))))];
}
function pickLevelWhy(mode,turn,hist,pf){
  if(mode==='fixed')return{d:Math.min(MAX_D,1+Math.floor(turn/2)),why:'fixed schedule'};
  const allowed=allowedLevels(hist),last=hist.length?hist[hist.length-1]:null;
  let run=0;if(last)for(let i=hist.length-1;i>=0&&hist[i].y&&hist[i].D===last.D;i--)run++;
  let streak=0;for(let i=hist.length-1;i>=0&&hist[i].y;i--)streak++;
  const ok=allowed.filter(v=>pf(v)>=TARGET-BAND),best=ok.length?Math.max(...ok):null;
  if(best!==null&&last&&best>last.D)return{d:best,why:'hardest level near the 85% target'};
  // mastery step-up: 3 first-try solves in a row at this level -> go up; 6 in a row -> jump 2 levels
  if(last&&run>=3&&last.D<MAX_D){
    if(streak>=6&&allowed.includes(last.D+2)&&pf(last.D+2)>=0.5)return{d:last.D+2,why:'fast step-up (6 in a row)'};
    if(pf(last.D+1)>=0.6)return{d:last.D+1,why:'mastery step-up (3 in a row)'};
  }
  if(best!==null)return{d:best,why:'hardest level near the 85% target'};
  if(last&&last.y)return{d:last.D,why:'stay after a solve'};
  return{d:allowed.reduce((b,v)=>pf(v)>pf(b)?v:b,allowed[0]),why:'highest predicted success'};
}

// ---------- MLP-driven selection (ours): no step-up rules ----------
// The generator makes candidates at every level within 3 of the last challenge (a safety limit on jumps only).
// The MLP predicts this learner's chance of solving each one, and the game serves the candidate whose
// predicted first-try success is closest to the 85% target. Strong players get harder code because the model
// predicts high success for them; struggling players get easier code because it predicts low success.
const WINDOW=3,PER_LEVEL=2;
function candidateLevels(hist){if(!hist.length)return[1]; // everyone starts at level 1
  const ref=hist[hist.length-1].D,out=[];for(let v=Math.max(1,ref-WINDOW);v<=Math.min(MAX_D,ref+WINDOW);v++)out.push(v);return out;}
function pickClosest(list,pf){let best=null,bs=Infinity,bp=0;for(const c of list){const p=pf(c),s=Math.abs(p-TARGET)-0.002*c.D;if(s<bs){bs=s;best=c;bp=p;}}return{c:best,p:bp};}

// ---------- simulated datasets ----------
// level choice varies by learner: random levels, levels near the learner's skill, a staircase from level 1,
// or (with a model) the adaptive policy itself with 25% exploration
function simulateDataset(nL,nA,r,startId,model){
  const rows=[];
  for(let i=0;i<nL;i++){
    const L=makeLearner(r),hist=[],u=r(),how=model?'policy':u<1/3?'random':u<2/3?'near':'stair';let stair=1;
    for(let t=0;t<nA;t++){
      let ch;
      if(how==='policy'){
        const list=[];for(const v of candidateLevels(hist))for(let k=0;k<PER_LEVEL;k++)list.push(fromPool(v,r));
        ch=r()<0.25?list[Math.floor(r()*list.length)]:pickClosest(list,c=>model.predict(featurize(hist,c))).c;
      }else{
        const d=how==='stair'?stair:Math.max(1,Math.min(MAX_D,how==='random'?1+Math.floor(r()*12):Math.round(L.s+gauss(r)*1.2)));
        ch=fromPool(d,r);
      }
      const x=featurize(hist,ch),pRule=ruleP(hist,ch),o=learnerAttempt(L,ch);
      rows.push({learner:startId+i,t,D:ch.D,concept:ch.concept,feat:ch.feat,x,y:o.y,pRule,solved:o.solved?1:0,attempts:o.attempts,hint:o.hint,tfrac:o.tfrac});
      hist.push({D:ch.D,concept:ch.concept,y:o.y,tfrac:o.tfrac,hint:o.hint,attempts:o.attempts});
      stair=Math.max(1,Math.min(MAX_D,stair+(o.y?1:-1)));
    }
  }
  return rows;
}
// two stages: (1) random / near-skill / staircase learners; (2) learners playing under the adaptive policy with the stage-1 model
function trainModels(r,nL,id0){
  const s1=simulateDataset(nL,30,r,id0);
  const test=x=>x.learner%5===0,m=new MLP([NF,16,8,1],r);
  const tr1=s1.filter(x=>!test(x));m.fit(tr1.map(x=>x.x),tr1.map(x=>x.y),{epochs:10,rnd:r});
  const s2=simulateDataset(nL,30,r,id0+5000,m);
  const rows=[...s1,...s2],tr=rows.filter(x=>!test(x)),va=rows.filter(test);
  m.fit(tr.map(x=>x.x),tr.map(x=>x.y),{epochs:6,rnd:r});
  const l=new LogReg(NF);l.fit(tr.map(x=>x.x),tr.map(x=>x.y),{rnd:r});
  return{mlp:m,lr:l,bkt:fitBKT(tr),tr,va};
}

// ---------- pretraining for live play ----------
const pre=mulberry32(20261015);
POOL=buildPool(777,40);
let net=null,lin=null,bktModel=null,NET0=null,LIN0=null;const PRETRAIN={};
// every run starts from the same pretrained models, so one player's run never changes the next player's game
function cloneModel(m){const c=Object.create(Object.getPrototypeOf(m));for(const k of Object.keys(m)){const v=m[k];
  c[k]=v instanceof Float64Array?v.slice():Array.isArray(v)?v.map(a=>a instanceof Float64Array?a.slice():a):v;}return c;}
(function(){
  const M=trainModels(pre,250,0);net=M.mlp;lin=M.lr;bktModel=M.bkt;NET0=cloneModel(net);LIN0=cloneModel(lin);
  const ys=M.va.map(r=>r.y);
  Object.assign(PRETRAIN,{n:M.tr.length,nL:new Set(M.tr.map(x=>x.learner)).size,nVal:M.va.length,
    mlp:metrics(M.va.map(r=>net.predict(r.x)),ys),lr:metrics(M.va.map(r=>lin.predict(r.x)),ys),bkt:metrics(bktPredictRows(bktModel,M.va),ys),rule:metrics(M.va.map(r=>r.pRule),ys)});
})();

// ---------- game state ----------
const FLOORS=3,ROOMS_PER_FLOOR=4,BOSS_HP=3,HEARTS=5;
const $=id=>document.getElementById(id);
let mode='adaptive',S=null,timerRAF=null,reveal=false;
document.querySelectorAll('.gameName').forEach(el=>el.innerHTML=`${NAME[0]}<span>${NAME[1]}</span>`);
document.title=`${NAME_FULL} · Adaptive Code Dungeon`;
function loadLog(){try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch(e){return[]}}
function saveLog(rows){try{localStorage.setItem(LOG_KEY,JSON.stringify(rows))}catch(e){}}
function seg(id,cb){document.querySelectorAll(`#${id} button`).forEach(b=>b.onclick=()=>{document.querySelectorAll(`#${id} button`).forEach(x=>x.classList.remove('sel'));b.classList.add('sel');cb(b.dataset.v);});}
seg('segMode',v=>mode=v);
$('chkReveal').onchange=e=>setReveal(e.target.checked);
$('chkRevealTitle').onchange=e=>setReveal(e.target.checked);
$('chkPanel').onchange=e=>$('side').classList.toggle('hidden',!e.target.checked);
$('btnStart').onclick=start;$('btnAgain').onclick=()=>show('scrTitle');
$('btnCsv').onclick=()=>downloadCsv(S.rows,`${NAME_SLUG}_${S.id}.csv`);
$('btnCsvAll').onclick=()=>downloadCsv(loadLog(),`${NAME_SLUG}_all_runs.csv`);
$('btnHint').onclick=useHint;
$('btnShopGo').onclick=descend;
$('btnEval').onclick=$('btnEval2').onclick=()=>show('scrEval');
$('btnEvalBack').onclick=()=>show(S&&S.done?'scrEnd':'scrTitle');
$('btnRunEval').onclick=()=>startEval();
document.querySelectorAll('#survey .rate').forEach(b=>b.onclick=()=>answerSurvey(+b.dataset.v));

function show(id){['scrTitle','scrGame','scrEnd','scrEval','scrPre'].forEach(s=>$(s).classList.toggle('hidden',s!==id));$('wrap').classList.toggle('wide',id==='scrEval');$('wrap').classList.toggle('pre',id==='scrPre');window.scrollTo(0,0);}
function start(){
  const pc=($('participant').value||'').trim().replace(/[^A-Za-z0-9_-]/g,'').slice(0,20);
  net=cloneModel(NET0);lin=cloneModel(LIN0);
  S={id:Date.now().toString(36),participant:pc,mode,turn:0,floor:1,room:1,boss:false,bossHp:BOSS_HP,hearts:HEARTS,score:0,hist:[],rows:[],ev:[],bkt:{},hints:0,floorD:[],done:false,result:'',
    coins:0,xp:0,rank:1,combo:0,bestCombo:0,crits:0,kills:0,shield:0,banner:false,bannerActive:false,bossesBeaten:0,flawless:0,noHintFloor:0,
    floorHeartsLost:0,floorHints:0,mapState:{},bossShown:0,bought:[],walkX:0};
  $('fx').innerHTML='';$('scene').className='scene';
  if($('chkPretest').checked)startPretest();else{show('scrGame');nextTurn();}
}
function predictFor(hist,ch){const x=featurize(hist,ch);return{x,m:net.predict(x),l:lin.predict(x),b:bktProb(bktModel,S.bkt,ch.concept),r:ruleP(hist,ch)};}
function chooseChallenge(){
  if(S.mode==='fixed'){const d=Math.min(MAX_D,1+Math.floor(S.turn/2)),ch=makeCleanChallenge(d);ch.pred=predictFor(S.hist,ch);return{ch,why:'fixed schedule (same for every player)',cands:[ch]};}
  const list=[];for(const v of candidateLevels(S.hist))for(let k=0;k<PER_LEVEL;k++){let ch;try{ch=makeCleanChallenge(v);}catch(e){continue;}ch.pred=predictFor(S.hist,ch);list.push(ch);}
  if(S.turn>=2&&S.turn%5===4){const c=list[Math.floor(Math.random()*list.length)];c.explore=1;
    return{ch:c,why:`exploration question: picked at random (the MLP predicts ${Math.round(c.pred.m*100)}%), so prediction accuracy can be measured across easy and hard challenges`,cands:list};}
  const{c,p}=pickClosest(list,ch=>ch.pred.m);
  return{ch:c,why:`the MLP predicts ${Math.round(p*100)}% success for this one, the closest to 85% of ${list.length} generated candidates`,cands:list};
}
// ===================== battle layer (presentation only) =====================
// Everything here is cosmetic or affects survival only (hearts/shields). The challenge itself
// (timer, 2 tries, 1 hint, first-try label, features) is unchanged, so the logged data stays comparable.
const MONSTERS={
  'arithmetic':{name:'Number Slime',shape:'slime',col:'#6fcf7f'},
  'assignment':{name:'Swap Sprite',shape:'ghost',col:'#b98cf0'},
  'conditionals':{name:'If Imp',shape:'imp',col:'#ef8a5c'},
  'for-loops':{name:'Loop Wraith',shape:'ghost',col:'#79a8ff'},
  'while-loops':{name:'While Golem',shape:'golem',col:'#8fa3b8'},
  'lists':{name:'List Mimic',shape:'mimic',col:'#c9894a'},
  'nested':{name:'Nested Beholder',shape:'eye',col:'#d45a8f'},
  'loop-if':{name:'Branch Wraith',shape:'ghost',col:'#5fb3c9'},
  'while-if':{name:'Collatz Golem',shape:'golem',col:'#a38fb8'},
  'list-loop':{name:'Array Mimic',shape:'mimic',col:'#b8794a'},
  'logic':{name:'Logic Imp',shape:'imp',col:'#d96b8a'},
  'nested-loops':{name:'Nested Beholder',shape:'eye',col:'#d45a8f'},
  'nested-if':{name:'Twin Beholder',shape:'eye',col:'#9b5ad4'},
  'nested-while':{name:'Deep Golem',shape:'golem',col:'#5f7f9e'},
};
const BOSSES=[{name:'The Slime King',shape:'slime',col:'#4fb36a'},{name:'The Loop Lich',shape:'ghost',col:'#8d6be0'},{name:'The Stack Titan',shape:'golem',col:'#6f86a3'}];
function eyes(y,s=1){return`<g transform="translate(50 ${y}) scale(${s})"><circle cx="-13" cy="0" r="8" fill="#fff"/><circle cx="13" cy="0" r="8" fill="#fff"/>
  <circle cx="-11" cy="2" r="4" fill="#12141c"/><circle cx="11" cy="2" r="4" fill="#12141c"/>
  <path d="M-22 -10 L-6 -5 M22 -10 L6 -5" stroke="#12141c" stroke-width="3" stroke-linecap="round"/></g>`;}
function monsterSVG(shape,col,boss){
  const dk='rgba(0,0,0,.22)',hl='rgba(255,255,255,.25)';let g='';
  if(shape==='slime')g=`<path d="M8 96 C8 52 26 26 50 26 C74 26 92 52 92 96 Z" fill="${col}"/><path d="M8 96 C20 88 30 98 40 92 C50 98 60 88 70 94 C80 98 86 90 92 96Z" fill="${dk}"/>
    <ellipse cx="34" cy="44" rx="9" ry="5" fill="${hl}"/>${eyes(60)}<path d="M38 80 Q50 72 62 80" stroke="#12141c" stroke-width="3" fill="none"/>`;
  else if(shape==='ghost')g=`<path d="M18 96 V50 C18 26 32 12 50 12 C68 12 82 26 82 50 V96 L72 86 L61 96 L50 86 L39 96 L28 86 Z" fill="${col}" opacity=".92"/>
    <ellipse cx="36" cy="30" rx="8" ry="5" fill="${hl}"/>${eyes(46)}<ellipse cx="50" cy="70" rx="9" ry="7" fill="#12141c"/>`;
  else if(shape==='imp')g=`<path d="M26 34 L16 6 L40 26Z M74 34 L84 6 L60 26Z" fill="#7a2f22"/><path d="M14 96 C14 54 30 28 50 28 C70 28 86 54 86 96 Z" fill="${col}"/>
    <path d="M86 84 Q100 76 94 62 L98 58 L90 60" stroke="${col}" stroke-width="5" fill="none"/>${eyes(56)}<path d="M36 76 L44 82 L50 76 L56 82 L64 76" stroke="#12141c" stroke-width="3" fill="none"/>`;
  else if(shape==='golem')g=`<rect x="14" y="22" width="72" height="74" rx="10" fill="${col}"/><rect x="4" y="44" width="14" height="36" rx="5" fill="${col}"/><rect x="82" y="44" width="14" height="36" rx="5" fill="${col}"/>
    <path d="M30 30 L38 44 L32 54 M70 70 L62 80 L68 90" stroke="${dk}" stroke-width="3" fill="none"/><rect x="28" y="42" width="14" height="9" fill="#ffd96a"/><rect x="58" y="42" width="14" height="9" fill="#ffd96a"/>
    <rect x="34" y="68" width="32" height="7" rx="2" fill="#12141c"/>`;
  else if(shape==='mimic')g=`<rect x="10" y="50" width="80" height="46" rx="6" fill="${col}"/><path d="M14 50 L20 18 L80 18 L86 50Z" fill="${col}" transform="rotate(-12 14 50)"/>
    <path d="M14 50 L86 50 L86 58 L14 58Z" fill="#12141c"/><path d="M16 50 L22 58 L28 50 L34 58 L40 50 L46 58 L52 50 L58 58 L64 50 L70 58 L76 50 L82 58 L86 50" fill="#fff"/>
    <rect x="44" y="64" width="12" height="14" rx="2" fill="#f2c14e"/><circle cx="38" cy="36" r="5" fill="#ffd96a"/><circle cx="58" cy="32" r="5" fill="#ffd96a"/>
    <rect x="10" y="86" width="80" height="4" fill="${dk}"/>`;
  else g=`<path d="M30 30 L22 8 M50 24 L50 4 M70 30 L78 8" stroke="${col}" stroke-width="4"/><circle cx="22" cy="8" r="6" fill="#fff"/><circle cx="50" cy="4" r="6" fill="#fff"/><circle cx="78" cy="8" r="6" fill="#fff"/>
    <circle cx="22" cy="9" r="3" fill="#12141c"/><circle cx="50" cy="5" r="3" fill="#12141c"/><circle cx="78" cy="9" r="3" fill="#12141c"/>
    <circle cx="50" cy="60" r="36" fill="${col}"/><circle cx="50" cy="56" r="17" fill="#fff"/><circle cx="50" cy="58" r="8" fill="#12141c"/><path d="M33 48 L67 48" stroke="#12141c" stroke-width="4"/>
    <path d="M34 82 L40 76 L46 82 L52 76 L58 82 L64 76" stroke="#12141c" stroke-width="3" fill="none"/>`;
  const crown=boss?`<path d="M28 ${shape==='golem'?24:shape==='ghost'?14:28} l6 -18 l10 12 l6 -16 l6 16 l10 -12 l6 18 Z" fill="#f2c14e" stroke="#a87b16" stroke-width="2"/>`:'';
  return`<svg viewBox="0 -10 100 110" aria-hidden="true">${g}${crown}</svg>`;
}
// ---- sound (tiny WebAudio synth, no files) ----
let AC=null,muted=false;try{muted=localStorage.getItem('sb_muted')==='1'}catch(e){}
function sfx(kind){
  if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  const P={hit:[[520,880],.12,'square',.05],crit:[[700,1400],.18,'square',.06],hurt:[[220,90],.3,'sawtooth',.06],coin:[[988,1319],.12,'triangle',.06],
    level:[[523,659,784,1047],.45,'triangle',.07],wrong:[[300,240],.15,'square',.04],boss:[[110,82],.6,'sawtooth',.06],shield:[[600,300],.25,'sine',.08],win:[[523,659,784,1047,1319],.7,'triangle',.07]}[kind];
  if(!P)return;const[fr,dur,type,vol]=P,t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;
  fr.forEach((f,i)=>o.frequency.setValueAtTime(f,t+i*dur/fr.length));g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.02);
}
$('btnMute').onclick=()=>setMute(!muted);setTimeout(()=>setMute(muted));
function setMute(v){muted=v;$('btnMute').textContent=v?'🔇':'🔊';try{localStorage.setItem('sb_muted',v?'1':'0')}catch(e){}}
// ---- scene helpers ----
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function retrigger(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
function floatText(txt,cls,x,y){const d=document.createElement('div');d.className='dmg '+cls;d.textContent=txt;d.style.left=x+'px';d.style.top=y+'px';$('fx').appendChild(d);setTimeout(()=>d.remove(),1000);}
function enemyXY(){const sc=$('scene').getBoundingClientRect(),e=$('enemy').getBoundingClientRect();return{x:e.left-sc.left+e.width/2-20,y:e.top-sc.top+10};}
function heroXY(){const sc=$('scene').getBoundingClientRect(),h=$('hero').getBoundingClientRect();return{x:h.left-sc.left+10,y:h.top-sc.top-10};}
function spawnEnemy(){
  const c=S.cur,m=S.boss?BOSSES[(S.floor-1)%BOSSES.length]:MONSTERS[c.concept]||MONSTERS.arithmetic,en=$('enemy');
  const same=S.boss&&S.bossShown===S.floor;
  if(!same){en.className='enemy out'+(S.boss?' boss':'');$('eBody').innerHTML=monsterSVG(m.shape,m.col,S.boss);void en.offsetWidth;en.className='enemy'+(S.boss?' boss':'');
    if(S.boss){S.bossShown=S.floor;sfx('boss');banner(`${m.name}`,`Floor ${S.floor} boss · ${BOSS_HP} hits to defeat`);}}
  $('eName').innerHTML=`${S.boss?'👑 ':''}${m.name}<small>Lv ${c.D}</small>`;
  $('eHp').innerHTML=S.boss?Array.from({length:BOSS_HP},(_,i)=>`<i class="${i<S.bossHp?'on':''}"></i>`).join(''):'<i class="on"></i>';
  $('tLabel').textContent=`⚔ ${m.name} attacks in`;
}
function renderMap(){
  let h=`<b>Floor ${Math.min(S.floor,FLOORS)}</b>`;
  for(let r=1;r<=ROOMS_PER_FLOOR;r++){const st=S.mapState[r];h+=`<i class="${st||''}${!S.boss&&r===S.room?' cur':''}"></i>`;}
  h+=`<i class="skull${S.boss?' cur':''}">💀</i>`;$('map').innerHTML=h;
}
function renderHud(){
  $('hudHearts').textContent='♥'.repeat(Math.max(0,S.hearts))+'♡'.repeat(Math.max(0,HEARTS-S.hearts));
  $('hudScore').textContent=S.score;$('hudCoins').textContent=S.coins;$('hudShieldN').textContent=S.shield;
  $('hudShield').classList.toggle('hidden',!S.shield);
  const need=rankNeed(S.rank);$('rankTxt').textContent=`Rank ${S.rank} · ${S.xp}/${need} XP`;$('xpBar').style.width=Math.min(100,S.xp/need*100)+'%';
  const cb=$('combo');cb.textContent=S.combo>=2?`🔥 Combo x${S.combo}`:'';cb.classList.toggle('on',S.combo>=2);
}
const rankNeed=r=>200+150*r;
function gainXp(n){S.xp+=n;let up=false;while(S.xp>=rankNeed(S.rank)){S.xp-=rankNeed(S.rank);S.rank++;up=true;}if(up){sfx('level');banner(`Rank up! Rank ${S.rank}`,'Your spells grow stronger');}}
function banner(t,sub){const b=$('banner');b.innerHTML=`${t}${sub?`<small>${sub}</small>`:''}`;b.classList.remove('hidden');retrigger(b,'banner');clearTimeout(banner.h);banner.h=setTimeout(()=>b.classList.add('hidden'),1500);}
// hero hits: damage and coins grow with level, speed (crit) and combo
async function heroAttack(c,dmg,crit){
  retrigger($('hero'),'cast');sfx(crit?'crit':'hit');
  const bolt=document.createElement('div');bolt.className='bolt'+(crit?' crit':'');$('fx').appendChild(bolt);
  const ex=enemyXY();void bolt.offsetWidth;bolt.style.left=ex.x+'px';await wait(330);bolt.remove();
  retrigger($('enemy'),'hurt');floatText((crit?'CRIT! ':'')+'-'+dmg,crit?'crit':'',ex.x-10,ex.y+55);
  return{dmg,crit};
}
async function enemyAttack(blocked){
  const en=$('enemy');retrigger(en,'attack');await wait(230);
  if(blocked){retrigger($('shieldFx'),'on');sfx('shield');const h=heroXY();floatText('BLOCKED','coin',h.x,h.y);await wait(380);return true;}
  retrigger($('hero'),'hurt');retrigger($('scene'),'flashred');sfx('hurt');const h=heroXY();floatText('-1 ♥','bad',h.x,h.y);await wait(380);return false;
}
// ---- camp / shop between floors ----
const SHOP=[
  {id:'heal',ic:'🧪',name:'Healing potion',desc:'Restore 1 heart (max 5).',price:50,ok:()=>S.hearts<HEARTS,use:()=>{S.hearts++;}},
  {id:'shield',ic:'🛡',name:'Code shield',desc:'Blocks the next heart you would lose.',price:60,ok:()=>true,use:()=>{S.shield++;}},
  {id:'banner',ic:'🚩',name:'War banner',desc:'Double score on the next floor.',price:50,ok:()=>!S.banner,use:()=>{S.banner=true;}},
];
function openShop(){
  $('shopFloor').textContent=S.floor+1;const draw=()=>{$('shopCoins').textContent=S.coins;
    $('shopGrid').innerHTML=SHOP.map(it=>`<button class="item" data-id="${it.id}" ${S.coins<it.price||!it.ok()?'disabled':''}><span class="ic">${it.ic}</span><b>${it.name}</b><small>${it.desc}</small><span class="price">🪙 ${it.price}</span></button>`).join('');
    document.querySelectorAll('#shopGrid .item').forEach(b=>b.onclick=()=>{const it=SHOP.find(x=>x.id===b.dataset.id);if(S.coins<it.price||!it.ok())return;S.coins-=it.price;it.use();S.bought.push(it.id);sfx('coin');renderHud();draw();});};
  draw();$('shop').classList.remove('hidden');
}
function badgeList(){
  const at=S.rows.filter(r=>r.event==='attempt');
  return[
    {ic:'👑',n:'Boss slayer',d:'Defeat all 3 bosses',got:S.bossesBeaten>=FLOORS},
    {ic:'💎',n:'Flawless floor',d:'Clear a floor without losing a heart',got:S.flawless>0},
    {ic:'⚡',n:'Speed coder',d:'Land 5 critical hits',got:S.crits>=5},
    {ic:'🔥',n:'Combo master',d:'Reach a x5 combo',got:S.bestCombo>=5},
    {ic:'🧠',n:'Deep tracer',d:'Solve a level 10+ challenge',got:at.some(r=>r.solved&&r.level>=10)},
    {ic:'🎯',n:'No hints needed',d:'Finish a floor without hints',got:S.noHintFloor>0},
  ];
}

function nextTurn(){
  if(S.hearts<=0)return finish('defeated');
  if(S.floor>FLOORS)return finish('cleared');
  const{ch,why,cands}=chooseChallenge();
  S.cur=Object.assign(ch,{why,t0:performance.now(),tries:0,chosen:[],hint:false,revealed:false,limit:Math.min(90,30+2.5*ch.feat.lines)});S.locked=false;
  const c=S.cur;
  $('hudFloor').textContent=`Floor ${S.floor}/${FLOORS} · ${S.boss?'BOSS':'Room '+S.room+'/'+ROOMS_PER_FLOOR}`;
  $('hudTopic').innerHTML=`${CONCEPTS[c.concept].name} · Lv ${c.D}`;
  $('qText').textContent=S.boss?`Boss fight! Trace the code to strike (${S.bossHp} HP left).`:'Trace the code. The right output casts your spell.';
  $('code').innerHTML=highlight(c.code);
  $('tip').classList.add('hidden');$('btnHint').disabled=false;$('lives').textContent='Tries: ●●';
  spawnEnemy();renderMap();renderHud();
  const box=$('opts');box.innerHTML='';
  c.options.forEach((o,i)=>{const b=document.createElement('button');b.className='opt';b.dataset.val=o;b.innerHTML=`<span class="k">${'ABCD'[i]}</span>`;
    b.appendChild(document.createTextNode(o));b.onclick=()=>answer(o,b);box.appendChild(b);});
  applyReveal();renderPanel(c,cands,why);runTimer();
}
function setReveal(v){reveal=v;$('chkReveal').checked=v;$('chkRevealTitle').checked=v;applyReveal();}
function applyReveal(){
  if(!S||!S.cur||S.locked)return;
  if(reveal)S.cur.revealed=true;
  document.querySelectorAll('.opt').forEach(b=>b.classList.toggle('reveal',reveal&&b.dataset.val===S.cur.answer));
}
function streak(){let s=0;for(let i=S.hist.length-1;i>=0&&S.hist[i].y;i--)s++;return s;}
function useHint(){
  if(!S||S.locked||S.cur.hint)return;const c=S.cur;c.hint=true;S.hints++;
  const wrong=[...document.querySelectorAll('.opt')].filter(b=>!b.disabled&&b.dataset.val!==c.answer);
  if(wrong.length){const b=wrong[Math.floor(Math.random()*wrong.length)];b.disabled=true;b.classList.add('gone');}
  $('tip').textContent='💡 '+CONCEPTS[c.concept].tip;$('tip').classList.remove('hidden');$('btnHint').disabled=true;
}
function runTimer(){
  cancelAnimationFrame(timerRAF);
  const tick=()=>{const el=(performance.now()-S.cur.t0)/1000,f=Math.max(0,1-el/S.cur.limit),bar=$('timerBar');
    bar.style.width=(f*100)+'%';$('tSecs').textContent=Math.ceil(f*S.cur.limit)+'s';bar.style.background=f<.25?'var(--bad)':f<.5?'var(--accent2)':'var(--accent)';
    if(f<=0&&!S.locked){answer(null,null);return;}if(!S.locked)timerRAF=requestAnimationFrame(tick);};
  timerRAF=requestAnimationFrame(tick);
}
function shake(){$('scene').classList.remove('shake');void $('scene').offsetWidth;$('scene').classList.add('shake');}
function answer(choice,btn){
  if(S.locked)return;const c=S.cur;
  if(choice!==null&&choice!==c.answer&&c.tries===0){
    c.tries=1;c.chosen.push(choice);btn.classList.add('wrong');btn.disabled=true;$('lives').textContent='Tries: ●○';
    retrigger($('enemy'),'angry');sfx('wrong');toast('Missed! One more try before it strikes.','var(--accent2)');return;}
  if(choice!==null)c.chosen.push(choice);
  S.locked=true;cancelAnimationFrame(timerRAF);
  const secs=Math.min(c.limit,(performance.now()-c.t0)/1000),tfrac=secs/c.limit,solved=choice===c.answer,attempts=c.chosen.length;
  const y=solved&&attempts===1&&!c.hint?1:0;
  document.querySelectorAll('.opt').forEach(b=>{b.disabled=true;b.classList.remove('reveal');if(b.dataset.val===c.answer)b.classList.add('right');});
  if(btn&&!solved)btn.classList.add('wrong');
  const p=c.pred;S.ev.push({y,m:p.m,l:p.l,b:p.b,r:p.r});
  // battle state (survival + rewards only; the challenge data above is unchanged)
  const wasBoss=S.boss,crit=!!(y&&tfrac<0.35);let blocked=false;
  S.combo=y?S.combo+1:0;S.bestCombo=Math.max(S.bestCombo,S.combo);if(crit)S.crits++;if(c.hint)S.floorHints++;
  const mult=(1+0.25*Math.max(0,S.combo-1))*(crit?1.5:1)*(c.hint?0.75:1)*(attempts>1?0.5:1);
  const dmg=solved?Math.round(20*c.D*mult)+(wasBoss?10:0):0;
  let coinGain=solved?4+2*c.D+(crit?5:0):0;
  if(solved){S.score+=dmg*5*(S.bannerActive?2:1);}
  else if(S.shield>0){S.shield--;blocked=true;}else{S.hearts--;S.floorHeartsLost++;}
  const roomLabel=S.boss?'boss':String(S.room);
  const row={event:'attempt',participant:S.participant,session:S.id,mode:S.mode,turn:S.turn+1,floor:S.floor,room:roomLabel,
    level:c.D,concept:c.concept,lines:c.feat.lines,depth:c.feat.depth,loops:c.feat.loops,steps:c.feat.steps,has_list:c.feat.hasList,selection:c.why,explore:c.explore?1:0,
    ...Object.fromEntries(FEATS.map(([k],i)=>[k,p.x[i].toFixed(4)])),
    p_mlp:p.m.toFixed(4),p_lr:p.l.toFixed(4),p_bkt:p.b.toFixed(4),p_rule:p.r.toFixed(4),
    label_first_try:y,solved:solved?1:0,attempts,hints_used:c.hint?1:0,response_s:secs.toFixed(2),timed_out:choice===null?1:0,
    choice_1:c.chosen[0]??'',choice_2:c.chosen[1]??'',answer:c.answer,answer_shown:c.revealed?1:0,hearts_left:S.hearts,shield_blocked:blocked?1:0,combo:S.combo,crit:crit?1:0,survey_rating:'',timestamp:new Date().toISOString()};
  S.rows.push(row);const log=loadLog();log.push(row);saveLog(log);
  for(let k=0;k<3;k++){net.trainOne(p.x,y,0.002);lin.trainOne(p.x,y,0.02);}
  bktUpdate(bktModel,S.bkt,c.concept,y);
  S.hist.push({D:c.D,concept:c.concept,y,tfrac,hint:c.hint?1:0,attempts:Math.max(1,attempts)});S.floorD.push(c.D);S.turn++;
  // progress through the dungeon
  let after=nextTurn,msg,killed=false;
  if(wasBoss){
    if(solved){S.bossHp--;killed=S.bossHp<=0;msg=killed?'Boss defeated!':`Hit! Boss HP ${S.bossHp}/${BOSS_HP}`;}
    else msg=choice===null?'Too slow! The boss strikes.':`The boss strikes back (answer: ${c.answer})`;
    if(killed){S.bossesBeaten++;S.kills++;coinGain+=40;if(S.floorHeartsLost===0)S.flawless++;if(S.floorHints===0)S.noHintFloor++;after=()=>openSurvey();}
  }else{
    killed=solved;S.mapState[S.room]=solved?'done':'fail';if(solved)S.kills++;
    msg=solved?(crit?'Critical hit!':y?'Monster defeated!':'Defeated (with help)'):choice===null?'Too slow! It strikes first.':`It hits you! (answer: ${c.answer})`;
    S.room++;if(S.room>ROOMS_PER_FLOOR){S.boss=true;S.bossHp=BOSS_HP;}
  }
  S.coins+=coinGain;
  S.rows[S.rows.length-1].coins=S.coins;
  renderMetrics();
  (async()=>{
    if(solved){
      await heroAttack(c,dmg,crit);
      if(S.combo>=2)retrigger($('combo'),'pop');
      if(wasBoss)$('eHp').innerHTML=Array.from({length:BOSS_HP},(_,i)=>`<i class="${i<S.bossHp?'on':''}"></i>`).join('');
      toast(msg,crit?'var(--accent2)':'var(--accent)');
      if(killed){await wait(220);$('enemy').classList.add('die');const ex=enemyXY();sfx('coin');floatText(`+${coinGain} 🪙`,'coin',ex.x,ex.y+40);}
      gainXp(killed?dmg+(wasBoss?60:0):dmg);renderHud();
      await wait(killed?750:650);
      if(!wasBoss)await walkOn();
    }else{
      toast(msg,'var(--bad)');await wait(250);await enemyAttack(blocked);renderHud();gainXp(3);
      await wait(1500);
      if(!wasBoss){$('enemy').classList.add('out');await wait(350);await walkOn();}
    }
    after();
  })();
}
async function walkOn(){
  S.walkX-=180;const sc=$('scene');sc.classList.add('walking');
  sc.querySelector('.wallbricks').style.backgroundPosition=sc.querySelector('.floor').style.backgroundPosition=S.walkX+'px 0';
  await wait(850);sc.classList.remove('walking');
}
// ---------- pre-test: the same 15 tracing questions (one per level) for every player (an independent skill measure) ----------
// Generated once with a fixed seed, so every student gets identical items. Results are logged but never fed to the models.
const PRE_LEVELS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
const PRETEST=(()=>{const keep=RNG;RNG=mulberry32(4242);const items=PRE_LEVELS.map(D=>{const c=makeCleanChallenge(D);return{D,code:c.code,answer:c.answer,options:c.options,concept:c.concept};});RNG=keep;return items;})();
let PRE=null;
function logRow(o){const row={event:o.event,participant:S.participant,session:S.id,mode:S.mode,...o,timestamp:new Date().toISOString()};S.rows.push(row);const log=loadLog();log.push(row);saveLog(log);}
function startPretest(){PRE={i:0,score:0,w:0,t0:0};show('scrPre');showPre();}
function showPre(){
  const it=PRETEST[PRE.i];$('preInfo').textContent=`Question ${PRE.i+1} of ${PRETEST.length} · this does not affect the game`;$('preBar').style.width=(PRE.i/PRETEST.length*100)+'%';
  $('preCode').innerHTML=highlight(it.code);const box=$('preOpts');box.innerHTML='';
  it.options.forEach((o,k)=>{const bt=document.createElement('button');bt.className='popt';bt.dataset.val=o;bt.innerHTML=`<span class="k">${'ABCD'[k]}</span>`;bt.appendChild(document.createTextNode(o));bt.onclick=()=>answerPre(o);box.appendChild(bt);});
  PRE.t0=performance.now();
}
function answerPre(choice){
  if(!PRE||PRE.i>=PRETEST.length)return;const it=PRETEST[PRE.i],ok=choice===it.answer?1:0;PRE.score+=ok;PRE.w+=ok*it.D;
  logRow({event:'pretest',item:PRE.i+1,level:it.D,concept:it.concept,choice:choice??'skip',answer:it.answer,correct:ok,response_s:((performance.now()-PRE.t0)/1000).toFixed(2)});
  PRE.i++;if(PRE.i<PRETEST.length)return showPre();
  S.pretest={score:PRE.score,max:PRETEST.length,weighted:PRE.w,weightedMax:PRE_LEVELS.reduce((a,x)=>a+x,0)};
  logRow({event:'pretest_summary',pretest_score:PRE.score,pretest_max:PRETEST.length,pretest_weighted:PRE.w,pretest_weighted_max:S.pretest.weightedMax});
  show('scrGame');nextTurn();
}
$('btnPreSkip').onclick=()=>answerPre(null);
document.addEventListener('keydown',e=>{if($('scrPre').classList.contains('hidden')||!PRE)return;const k=e.key.toLowerCase();
  const i='abcd'.includes(k)&&k.length===1?'abcd'.indexOf(k):'1234'.includes(k)&&k.length===1?+k-1:-1;const bt=document.querySelectorAll('#preOpts .popt')[i];if(bt){e.preventDefault();bt.click();}});
// validation survey after each boss: did the difficulty match the player?
function openSurvey(){$('survey').classList.remove('hidden');$('surveyFloor').textContent=S.floor;}
function answerSurvey(v){
  $('survey').classList.add('hidden');
  const fd=S.floorD.slice();const row={event:'survey',participant:S.participant,session:S.id,mode:S.mode,turn:S.turn,floor:S.floor,room:'survey',
    level:(fd.reduce((s,x)=>s+x,0)/fd.length).toFixed(2),survey_rating:v,timestamp:new Date().toISOString()};
  S.rows.push(row);const log=loadLog();log.push(row);saveLog(log);
  if(S.floor<FLOORS)openShop();else{S.floor++;nextTurn();}
}
function descend(){
  $('shop').classList.add('hidden');S.floor++;S.room=1;S.boss=false;S.floorD=[];S.mapState={};
  S.bannerActive=S.banner;S.banner=false;S.floorHeartsLost=0;S.floorHints=0;
  banner(`Floor ${S.floor}`,S.bannerActive?'War banner raised: double score!':'Deeper into the dungeon');nextTurn();
}
function toast(t,color){const el=$('toast');el.textContent=t;el.style.color=color;el.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove('show'),1300);}
const pc=v=>Math.round(v*100)+'%';
function renderPanel(cur,cands,why){
  const list=(Array.isArray(cands)?cands:Object.values(cands)).slice().sort((a,b)=>a.D-b.D||a.pred.m-b.pred.m);
  $('predBody').innerHTML=list.map(c=>{const p=c.pred,v=c.D;return`<tr class="${c===cur?'chosen':''}"><td>${v}</td>
    <td style="font-size:12px">${c.feat.lines} lines · depth ${c.feat.depth}</td>
    <td><div class="bar"><i style="width:${p.m*100}%"></i><span class="tgt" style="left:${TARGET*100}%"></span></div></td>
    <td class="mono">${pc(p.m)}</td><td class="mono muted">${pc(p.l)}</td><td class="mono muted">${pc(p.b)}</td><td class="mono muted">${pc(p.r)}</td></tr>`;}).join('');
  $('whyNote').textContent=why?'Why this one: '+why+'.':'';
  const x=cur.pred.x;
  $('featBox').innerHTML=FEATS.map(([,n],i)=>`<span>${n}</span><span>${x[i].toFixed(2)}</span>`).join('');
  renderMetrics();
}
function runAcc(key){const n=S&&S.ev?S.ev.length:0;return n?pc(S.ev.filter(e=>(e[key]>=.5)===!!e.y).length/n):'–';}
function renderMetrics(){
  const n=S&&S.ev?S.ev.length:0,sr=n?pc(S.hist.filter(h=>h.y).length/n):'–';
  $('metricBox').innerHTML=`<div class="metric"><span>Mode</span><b>${S&&S.mode?S.mode:'–'}</b></div>
    <div class="metric"><span>First-try success (target 85%)</span><b>${sr}</b></div>
    <div class="metric"><span>MLP accuracy this run</span><b>${runAcc('m')}</b></div>
    <div class="metric"><span>Logistic regression</span><b>${runAcc('l')}</b></div>
    <div class="metric"><span>BKT</span><b>${runAcc('b')}</b></div>
    <div class="metric"><span>Rule-based</span><b>${runAcc('r')}</b></div>`;
}
$('pretrainNote').innerHTML=`Pretrained on ${PRETRAIN.n.toLocaleString()} simulated attempts (${PRETRAIN.nL} learners). Held-out test (${PRETRAIN.nVal.toLocaleString()} attempts, unseen learners), AUC:
  MLP ${PRETRAIN.mlp.auc.toFixed(2)} · LR ${PRETRAIN.lr.auc.toFixed(2)} · BKT ${PRETRAIN.bkt.auc.toFixed(2)} · Rule ${PRETRAIN.rule.auc.toFixed(2)}. The models keep learning from each of your answers.`;
function finish(result){
  S.done=true;S.result=result;show('scrEnd');
  const at=S.rows.filter(r=>r.event==='attempt'),n=at.length,ok=S.hist.filter(h=>h.y).length,sv=S.rows.filter(r=>r.event==='survey');
  $('endTitle').innerHTML=result==='cleared'?'Dungeon <span>cleared</span>':'Out of <span>hearts</span>';
  $('endMode').textContent=(S.mode==='adaptive'?'Mode: Adaptive (MLP generated each challenge)':'Mode: Fixed schedule')+` · Reached floor ${Math.min(S.floor,FLOORS)} of ${FLOORS}`+(S.participant?` · Participant ${S.participant}`:'');
  $('stScore').textContent=S.score;$('stRate').textContent=n?pc(ok/n):'–';
  $('stLevel').textContent=Math.max(0,...at.filter(r=>r.solved).map(r=>r.level));
  $('stSolved').textContent=n?pc(at.filter(r=>r.solved).length/n):'–';$('stHints').textContent=S.hints;
  $('stPre').textContent=S.pretest?`${S.pretest.score} / ${S.pretest.max}`:'–';
  $('stSurvey').textContent=sv.length?(sv.reduce((s,r)=>s+r.survey_rating,0)/sv.length).toFixed(1)+' / 5':'–';
  $('stRank').textContent=S.rank;$('stKills').textContent=S.kills;$('stCombo').textContent='x'+S.bestCombo;
  $('badges').innerHTML=badgeList().map(b=>`<div class="badge${b.got?'':' locked'}"><span class="bi">${b.ic}</span><div><b>${b.n}</b><small>${b.d}</small></div></div>`).join('');
  sfx(result==='cleared'?'win':'hurt');
  $('stMlp').textContent=runAcc('m');$('stLr').textContent=runAcc('l');$('stBkt').textContent=runAcc('b');$('stRule').textContent=runAcc('r');
}
function downloadCsv(rows,name){
  if(!rows||!rows.length)return;const keys=[];rows.forEach(r=>Object.keys(r).forEach(k=>{if(!keys.includes(k))keys.push(k);}));
  const esc=v=>{v=String(v??'');return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const csv=[keys.join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();a.remove();
}
function highlight(src){
  const esc=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc.replace(/\b(if|elif|else|for|in|while|and|or|not)\b|\b(print|range|len|sum|append)\b|\b(\d+)\b/g,
    (m,k,f,n)=>k?`<span class="kw">${k}</span>`:f?`<span class="fn">${f}</span>`:`<span class="num">${n}</span>`);
}
document.addEventListener('keydown',e=>{
  if(!S||S.locked||$('scrGame').classList.contains('hidden')||!$('survey').classList.contains('hidden')||!$('shop').classList.contains('hidden'))return;const k=e.key.toLowerCase();
  if(k==='h'){useHint();return;}
  const i='abcd'.includes(k)&&k.length===1?'abcd'.indexOf(k):+e.key-1;const b=document.querySelectorAll('.opt')[i];if(b&&!b.disabled)b.click();});

// =====================================================================
// Thesis evaluation (simulated learners)
// =====================================================================
const MODELS=[['mlp','MLP (ours)'],['lr','Logistic regression'],['bkt','BKT'],['rule','Rule-based']];
let EVAL=null;
function pearson(a,b){const n=a.length,ma=a.reduce((s,x)=>s+x,0)/n,mb=b.reduce((s,x)=>s+x,0)/n;let sab=0,sa=0,sb=0;for(let i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2;}return sab/Math.sqrt(sa*sb);}
function policySim(models,seed,nL){
  const pols=[['fixed','Fixed schedule'],['rule','Rule-based staircase'],['mlp','MLP-driven (ours)']],out=[],T=21;
  for(const[key,label]of pols){let sr=0,gap=0,avgLv=0;const skills=[],levels=[];
    for(let i=0;i<nL;i++){const r=mulberry32(seed*31+i),L=makeLearner(r),hist=[];
      for(let t=0;t<T;t++){
        let c;
        if(key==='mlp'){const list=[];for(const v of candidateLevels(hist))for(let k=0;k<PER_LEVEL;k++)list.push(fromPool(v,r));
          c=pickClosest(list,x=>models.mlp.predict(featurize(hist,x))).c;}
        else{const lv=key==='fixed'?[Math.min(MAX_D,1+Math.floor(t/2))]:allowedLevels(hist),cands={};for(const v of lv)cands[v]=fromPool(v,r);
          const d=pickLevelWhy(key==='fixed'?'fixed':'adaptive',t,hist,v=>cands[v]?ruleP(hist,cands[v]):0).d;c=cands[d]||fromPool(d,r);}
        const o=learnerAttempt(L,c);
        hist.push({D:c.D,concept:c.concept,y:o.y,tfrac:o.tfrac,hint:o.hint,attempts:o.attempts});}
      const rate=hist.filter(h=>h.y).length/T;sr+=rate;gap+=Math.abs(rate-TARGET);avgLv+=hist.reduce((s,h)=>s+h.D,0)/T;
      skills.push(L.s);levels.push(hist.slice(-6).reduce((s,h)=>s+h.D,0)/6);}
    out.push({key,label,rate:sr/nL,gap:gap/nL,avgLv:avgLv/nL,match:pearson(skills,levels)});}
  return out;
}
function startEval(seed){
  seed=seed||20261015;$('btnRunEval').disabled=true;$('evalStatus').textContent='Simulating learners and training the models… (a few seconds)';
  setTimeout(()=>{try{EVAL=runEval(seed);renderEval();$('evalStatus').textContent='';}catch(err){$('evalStatus').textContent='Error: '+err.message;console.error(err);}
    $('btnRunEval').disabled=false;$('btnRunEval').textContent='Re-run with a new seed';$('btnRunEval').onclick=()=>startEval(1+Math.floor(Math.random()*1e6));},40);
}
function runEval(seed){
  const t0=performance.now(),r=mulberry32(seed);
  const M=trainModels(r,160,0);
  const te=M.va,ys=te.map(x=>x.y);
  const P={mlp:te.map(x=>M.mlp.predict(x.x)),lr:te.map(x=>M.lr.predict(x.x)),bkt:bktPredictRows(M.bkt,te),rule:te.map(x=>x.pRule)};
  const all={},bands={};
  const BANDS=[['Easy (levels 1–3)',d=>d<=3],['Medium (4–7)',d=>d>=4&&d<=7],['Hard (8+)',d=>d>=8]];
  for(const[k]of MODELS){all[k]=metrics(P[k],ys);
    bands[k]=BANDS.map(([,f])=>{const idx=te.map((x,i)=>f(x.D)?i:-1).filter(i=>i>=0);return metrics(idx.map(i=>P[k][i]),idx.map(i=>ys[i]));});}
  const bandN=BANDS.map(([,f])=>te.filter(x=>f(x.D)).length);
  const policy=policySim(M,seed,150);
  const log=loadLog().filter(x=>x.event==='attempt'&&x.p_mlp!==undefined&&+x.answer_shown!==1);
  let real=null;if(log.length>=10){const ry=log.map(x=>+x.label_first_try);real={n:log.length,res:Object.fromEntries(MODELS.map(([k])=>[k,metrics(log.map(x=>+x['p_'+k]),ry)]))};}
  const sv=loadLog().filter(x=>x.event==='survey');
  const bySess={};for(const x of loadLog()){const s=bySess[x.session]=bySess[x.session]||{pre:null,lv:[],mode:x.mode,shown:0};
    if(x.event==='pretest_summary')s.pre=+x.pretest_weighted;if(x.event==='attempt'){s.lv.push(+x.level);if(+x.answer_shown===1)s.shown=1;}}
  const pairs=Object.values(bySess).filter(s=>s.pre!==null&&s.mode==='adaptive'&&!s.shown&&s.lv.length>=6).map(s=>[s.pre,s.lv.slice(-6).reduce((a,b)=>a+b,0)/6]);
  const realMatch={n:pairs.length,r:pairs.length>=3?pearson(pairs.map(p=>p[0]),pairs.map(p=>p[1])):NaN,pairs};
  return{seed,all,bands,bandNames:BANDS.map(b=>b[0]),bandN,policy,real,realMatch,survey:sv,data:[...M.tr,...M.va],nTrain:M.tr.length,nTest:te.length,base:ys.reduce((s,v)=>s+v,0)/ys.length,ms:performance.now()-t0};
}
const f3=v=>isNaN(v)?'–':v.toFixed(3);
function table(head,rows,bestCols){
  const best={};for(const ci in bestCols){const vals=rows.map(r=>r[ci]).filter(v=>typeof v==='number'&&!isNaN(v));best[ci]=bestCols[ci]==='max'?Math.max(...vals):Math.min(...vals);}
  return`<div class="tscroll"><table class="ev"><thead><tr>${head.map((h,i)=>`<th class="${i?'n':''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>
    i===0?`<td>${v}</td>`:`<td class="n${bestCols[i]&&v===best[i]?' best':''}">${typeof v==='number'?f3(v):v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderEval(){
  const E=EVAL;
  let h=`<h3>1 · Prediction performance</h3><p class="note" style="margin-top:0">${E.nTest.toLocaleString()} test attempts from simulated learners the models never saw. Label = solved on the first try without a hint. Brier score: lower is better.</p>`;
  h+=table(['Model','Accuracy','Precision','Recall','F1-score','AUC','Brier ↓'],MODELS.map(([k,n])=>{const m=E.all[k];return[n,m.acc,m.prec,m.rec,m.f1,m.auc,m.brier];}),{1:'max',2:'max',3:'max',4:'max',5:'max',6:'min'});
  h+=`<h3>2 · By challenge difficulty (AUC)</h3><p class="note" style="margin-top:0">Does the model still predict well on hard generated challenges? Attempts: ${E.bandN.join(' / ')}.</p>`;
  h+=table(['Model',...E.bandNames],MODELS.map(([k,n])=>[n,...E.bands[k].map(m=>m.auc)]),{1:'max',2:'max',3:'max'});
  h+=`<h3>3 · Does the difficulty match the learner?</h3><p class="note" style="margin-top:0">150 new simulated learners play 21 challenges under each policy. <b>Rule-based staircase</b> = fixed step-up/step-down rules; <b>MLP-driven</b> = the MLP scores generated candidates and serves the one closest to 85%, with no step-up rules. <b>Skill match</b> = correlation between each learner's actual skill and the level the game ended up giving them (higher = the game finds the right level for each learner).</p>`;
  h+=table(['Policy','First-try success','Distance from 85% ↓','Average level','Skill match (r)'],E.policy.map(p=>[p.label,pc(p.rate),pc(p.gap),p.avgLv.toFixed(2),isNaN(p.match)?'none (same for all)':p.match]),{4:'max'});
  if(E.real){h+=`<h3>4 · Logged play on this device (real attempts)</h3><p class="note" style="margin-top:0">${E.real.n} attempts. Each prediction was made before the player answered. Rooms where "show answer" was on are left out.</p>`;
    h+=table(['Model','Accuracy','F1-score','AUC','Brier ↓'],MODELS.map(([k,n])=>{const m=E.real.res[k];return[n,m.acc,m.f1,m.auc,m.brier];}),{1:'max',2:'max',3:'max',4:'min'});}
  else h+=`<h3>4 · Logged play on this device</h3><p class="note" style="margin-top:0">Play at least 10 challenges (without "show answer") and run this again to also score the models on real attempts.</p>`;
  if(E.survey.length){const c=[1,2,3,4,5].map(v=>E.survey.filter(s=>+s.survey_rating===v).length);
    h+=`<h3>5 · Player difficulty survey (this device)</h3><p class="note" style="margin-top:0">After each boss, players rate the floor from 1 (too easy) to 5 (too hard). 3 = just right.</p>`;
    h+=table(['Responses','1 Too easy','2 Easy','3 Just right','4 Hard','5 Too hard'],[[String(E.survey.length),...c.map(String)]],{});}
  {const R=E.realMatch;h+=`<h3>6 · Skill match with real players (this device)</h3><p class="note" style="margin-top:0">For each adaptive run with a pre-test: the pre-test score (weighted by item level) vs. the average level the game gave in the last 6 challenges. A positive correlation means stronger students got harder challenges.</p>`;
    h+=R.n>=3?table(['Runs','Correlation (r)'],[[String(R.n),f3(R.r)]],{}):`<p class="muted">Needs at least 3 adaptive runs with a pre-test and 6+ challenges (now: ${R.n}).</p>`;}
  h+=`<div class="row"><button class="btn ghost" id="btnEvalCsv">Download results (CSV)</button><button class="btn ghost" id="btnDataCsv">Download simulated dataset (CSV)</button></div>
  <p class="note">Seed ${E.seed} · ${E.nTrain.toLocaleString()} training / ${E.nTest.toLocaleString()} test attempts · first-try success in the test data ${pc(E.base)} · ran in ${(E.ms/1000).toFixed(1)} s.
  These numbers come from simulated learners, so they show that the pipeline works, not how real students behave. Thesis 2 replaces them with real gameplay, a pre-test and the difficulty survey.</p>`;
  $('evalOut').innerHTML=h;
  $('btnEvalCsv').onclick=()=>{const rows=[];
    for(const[k,n]of MODELS){const m=E.all[k];rows.push({section:'prediction',subset:'all',model:n,n:m.n,accuracy:f3(m.acc),precision:f3(m.prec),recall:f3(m.rec),f1:f3(m.f1),auc:f3(m.auc),brier:f3(m.brier)});
      E.bands[k].forEach((b,i)=>rows.push({section:'prediction',subset:E.bandNames[i],model:n,n:b.n,accuracy:f3(b.acc),precision:f3(b.prec),recall:f3(b.rec),f1:f3(b.f1),auc:f3(b.auc),brier:f3(b.brier)}));}
    for(const p of E.policy)rows.push({section:'policy',subset:'',model:p.label,n:150,success_rate:f3(p.rate),distance_from_target:f3(p.gap),avg_level:p.avgLv.toFixed(3),skill_match_r:f3(p.match)});
    downloadCsv(rows,`evaluation_seed${E.seed}.csv`);};
  $('btnDataCsv').onclick=()=>downloadCsv(E.data.map(x=>({learner:x.learner,split:x.learner%5===0?'test':'train',t:x.t,level:x.D,concept:x.concept,lines:x.feat.lines,depth:x.feat.depth,loops:x.feat.loops,steps:x.feat.steps,has_list:x.feat.hasList,
    ...Object.fromEntries(FEATS.map(([k],i)=>[k,x.x[i].toFixed(4)])),label_first_try:x.y,solved:x.solved,attempts:x.attempts,hints_used:x.hint,time_frac:x.tfrac.toFixed(3)})),`simulated_dataset_seed${E.seed}.csv`);
}
// initial panel
(function(){S={hist:[],bkt:{},ev:[],mode:'adaptive'};const cands={};for(const d of[1,2]){const ch=makeChallenge(d);ch.pred=predictFor([],ch);cands[d]=ch;}renderPanel(cands[1],cands,'');S=null;renderMetrics();})();

