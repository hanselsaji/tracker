import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const START_DATE = "2026-05-08";
const START_WEIGHT = 63;
const TARGET_WEIGHT = 78;
const WEEK_SCHEDULE = ["A","BOXING","B","BOXING","C","D","REST"];

const WORKOUTS = {
  A:{ name:"Back & Biceps", tag:"PULL DAY", color:"#ef4444", exercises:[
    {key:"a1",name:"Pull-ups",sets:5,reps:"Max reps",note:"Dead hang, full ROM — your main weapon"},
    {key:"a2",name:"Dumbbell Rows",sets:4,reps:"10 each arm",note:"12.5kg — elbow to hip, no momentum"},
    {key:"a3",name:"Dumbbell Curls",sets:3,reps:"12",note:"7.5kg — controlled, no swing"},
    {key:"a4",name:"Rear Delt Fly",sets:3,reps:"15",note:"5kg — squeeze at top"},
    {key:"a5",name:"Dead Hangs",sets:3,reps:"30 sec",note:"Grip + shoulder health"},
  ]},
  B:{ name:"Chest & Shoulders", tag:"PUSH DAY", color:"#f97316", exercises:[
    {key:"b1",name:"Pike Push-ups",sets:4,reps:"Max reps",note:"Progress toward handstand push-up"},
    {key:"b2",name:"DB Shoulder Press",sets:4,reps:"10",note:"10kg each — V-taper builder"},
    {key:"b3",name:"Lateral Raises",sets:4,reps:"15",note:"5kg each — slow and controlled"},
    {key:"b4",name:"Floor DB Press",sets:4,reps:"10",note:"12.5kg each — chest squeeze at top"},
    {key:"b5",name:"Chair Dips",sets:3,reps:"Max reps",note:"Between two sturdy chairs"},
  ]},
  C:{ name:"Legs", tag:"LEG DAY", color:"#eab308", exercises:[
    {key:"c1",name:"Goblet Squats",sets:4,reps:"12",note:"Heaviest dumbbell — full depth"},
    {key:"c2",name:"Romanian Deadlifts",sets:4,reps:"10",note:"Both DBs — feel the hamstring stretch"},
    {key:"c3",name:"Lunges",sets:3,reps:"12 each leg",note:"Walking lunges with dumbbells"},
    {key:"c4",name:"Calf Raises",sets:5,reps:"25",note:"Step edge if possible — slow tempo"},
    {key:"c5",name:"Jump Squats",sets:3,reps:"10",note:"Explosive — land soft"},
  ]},
  D:{ name:"Full Body", tag:"EXPLOSIVE DAY", color:"#8b5cf6", exercises:[
    {key:"d1",name:"Pull-up Max Set",sets:1,reps:"All-out max",note:"Beat last week's number"},
    {key:"d2",name:"Push-up Max Set",sets:1,reps:"All-out max",note:"Perfect form throughout"},
    {key:"d3",name:"Squat Jumps",sets:3,reps:"10",note:"Max height every rep"},
    {key:"d4",name:"DB Squat to Press",sets:4,reps:"8",note:"7.5kg each — squat down, press overhead"},
    {key:"d5",name:"Core Circuit",sets:3,reps:"5 min",note:"20 crunches + 10 leg raises + 30s plank, no rest"},
  ]},
  BOXING:{ name:"Boxing", tag:"SKILL DAY", color:"#06b6d4", exercises:[
    {key:"bx1",name:"Jump Rope / High Knees",sets:1,reps:"3 min",note:"Warm-up — get the rhythm"},
    {key:"bx2",name:"Footwork Drills",sets:1,reps:"5 min",note:"Forward, back, left, right in stance"},
    {key:"bx3",name:"Shadowboxing Rounds",sets:4,reps:"2 min each",note:"Jab + Cross — 1 min rest between"},
    {key:"bx4",name:"Core Finisher",sets:3,reps:"10 min total",note:"Crunches + leg raises + plank"},
  ]},
  REST:{ name:"Rest Day", tag:"RECOVERY", color:"#4b5563", exercises:[] },
};

const MEALS = [
  {id:1,time:"7:00 AM",name:"Morning Fuel",emoji:"🌅",calories:780,protein:28,items:["2 bananas","3 boiled eggs","Oats in full-fat milk","1 tbsp peanut butter"]},
  {id:2,time:"12:30 PM",name:"Lunch",emoji:"🍚",calories:1040,protein:32,items:["3 cups rice","Dal or sambar","2 eggs or curd","Veg curry + chutney"]},
  {id:3,time:"4:00 PM",name:"Pre-Workout",emoji:"⚡",calories:390,protein:10,items:["1 banana","1 tbsp peanut butter","2-3 dates","1 glass full-fat milk"]},
  {id:4,time:"7:30 PM",name:"Dinner",emoji:"🍽️",calories:845,protein:28,items:["3 cups rice or 2 chapathi","Egg curry or green gram","Thoran","1 tsp ghee"]},
  {id:5,time:"9:30 PM",name:"Before Bed",emoji:"🌙",calories:380,protein:18,items:["1 glass full-fat milk","2 boiled eggs","1 banana"]},
];

const BASE_CAL = 3435;
const BASE_PROTEIN = 116;

// ─── STARK-WAYNE ──────────────────────────────────────────────────
const SW_PILLARS = [
  { id:"body", label:"BODY", side:"WAYNE", color:"#ef4444", icon:"⚔️", tasks:[
    {key:"trained",   label:"Train 45+ mins",            sub:"Dumbbells + pull-up bar, no shortcuts"},
    {key:"protein",   label:"Hit protein target",        sub:"116g+ protein — no protein, no growth"},
    {key:"noJunk",    label:"Zero junk food",            sub:"One cheat = day reset, no exceptions"},
  ]},
  { id:"mind", label:"MIND", side:"STARK", color:"#f59e0b", icon:"🧠", tasks:[
    {key:"read10",      label:"Read 10 pages",           sub:"Non-fiction — strategy, psychology, technical"},
    {key:"noScrollAM",  label:"No scroll before 10am",  sub:"First hour belongs to you, not the feed"},
  ]},
  { id:"craft", label:"CRAFT", side:"STARK", color:"#3b82f6", icon:"⚙️", tasks:[
    {key:"skillWork",   label:"1hr deliberate skill work", sub:"TryHackMe / lab / code — tutorials don't count"},
    {key:"documented",  label:"Document something",        sub:"Writeup, note, or commit — proof you built"},
  ]},
  { id:"identity", label:"IDENTITY", side:"WAYNE", color:"#8b5cf6", icon:"🧊", tasks:[
    {key:"coldShower", label:"Cold shower", sub:"Train the override muscle — every single day"},
  ]},
];

const ALL_SW_KEYS = SW_PILLARS.flatMap(p=>p.tasks.map(t=>t.key));
const emptySW = () => Object.fromEntries(ALL_SW_KEYS.map(k=>[k,false]));
const emptySWMeta = () => ({streak:0,longestStreak:0,lastCompletedDate:null,failCounts:Object.fromEntries(ALL_SW_KEYS.map(k=>[k,0]))});

// ─── HELPERS ──────────────────────────────────────────────────────
const getTodayStr = () => new Date().toISOString().split("T")[0];
const getDOW = s => (new Date(s+"T12:00:00").getDay()+6)%7;
const getDayNum = s => Math.floor((new Date(s+"T00:00:00")-new Date(START_DATE+"T00:00:00"))/86400000)+1;
const getPhase = n => n<=61?{num:1,name:"Foundation",color:"#ef4444"}:n<=152?{num:2,name:"Build",color:"#f97316"}:{num:3,name:"Sharpen",color:"#eab308"};
const fmtDate = s => new Date(s+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
const prevDay = s => { const d=new Date(s+"T12:00:00"); d.setDate(d.getDate()-1); return d.toISOString().split("T")[0]; };
const emptyLog = () => ({meals:[false,false,false,false,false],workoutDone:false,waterGlasses:0,sleepTime:"",wakeTime:"",weight:"",isFootballDay:false,sets:{}});

// ─── CIRCLE METER ─────────────────────────────────────────────────
function CircleMeter({pct, size=155}) {
  const r=size*0.38, circ=2*Math.PI*r, offset=circ*(1-Math.min(100,pct)/100);
  const col=pct>=100?"#22c55e":pct>=60?"#f59e0b":pct>=30?"#f97316":"#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{filter:`drop-shadow(0 0 10px ${col}35)`}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c1c1c" strokeWidth="9"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="9"
        strokeDasharray={`${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 0.7s ease"}}/>
      <text x={size/2} y={size/2-8} textAnchor="middle" fill="#fff" fontSize={size*0.2} fontWeight="700" fontFamily="monospace">{Math.round(pct)}%</text>
      <text x={size/2} y={size/2+12} textAnchor="middle" fill="#555" fontSize={size*0.072} fontFamily="monospace" letterSpacing="1.5">EXECUTION</text>
    </svg>
  );
}

// ─── APP ──────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("today");
  const [log, setLog] = useState(emptyLog());
  const [weights, setWeights] = useState([]);
  const [swLog, setSWLog] = useState(emptySW());
  const [swMeta, setSWMeta] = useState(emptySWMeta());
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = getTodayStr();
  const dayNum = getDayNum(today);
  const phase = getPhase(Math.max(1,dayNum));
  const wType = WEEK_SCHEDULE[getDOW(today)];
  const workout = WORKOUTS[wType];

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get(`log:${today}`);if(r)setLog(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get("wts");if(r)setWeights(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(`sw:${today}`);if(r)setSWLog(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get("sw-meta");if(r)setSWMeta(JSON.parse(r.value));}catch{}
      setReady(true);
    })();
  },[]);

  const persistLog = useCallback(async n=>{
    try{await window.storage.set(`log:${today}`,JSON.stringify(n));setSaved(true);setTimeout(()=>setSaved(false),1200);}catch{}
  },[today]);

  const upd = patch => setLog(prev=>{ const n={...prev,...patch}; persistLog(n); return n; });

  const toggleSW = key => {
    setSWLog(prev=>{
      const next={...prev,[key]:!prev[key]};
      const allDone=ALL_SW_KEYS.every(k=>next[k]);
      setSWMeta(m=>{
        const nm={...m,failCounts:{...m.failCounts}};
        if(!next[key]) nm.failCounts[key]=(nm.failCounts[key]||0)+1;
        if(allDone){
          if(m.lastCompletedDate===prevDay(today)){
            nm.streak=(m.streak||0)+1;
          } else if(m.lastCompletedDate!==today){
            nm.streak=1;
          }
          nm.longestStreak=Math.max(nm.longestStreak||0,nm.streak);
          nm.lastCompletedDate=today;
        }
        (async()=>{
          try{await window.storage.set(`sw:${today}`,JSON.stringify(next));}catch{}
          try{await window.storage.set("sw-meta",JSON.stringify(nm));}catch{}
        })();
        return nm;
      });
      return next;
    });
  };

  const saveWeight = async()=>{
    if(!log.weight)return;
    const e={date:today,weight:parseFloat(log.weight)};
    const nw=[...weights.filter(w=>w.date!==today),e].sort((a,b)=>a.date.localeCompare(b.date));
    setWeights(nw);
    try{await window.storage.set("wts",JSON.stringify(nw));}catch{}
  };

  const curW=weights.length?weights[weights.length-1].weight:START_WEIGHT;
  const gained=(curW-START_WEIGHT).toFixed(1);
  const toGo=(TARGET_WEIGHT-curW).toFixed(1);
  const wtPct=Math.min(100,Math.max(0,((curW-START_WEIGHT)/(TARGET_WEIGHT-START_WEIGHT))*100));
  const calEaten=log.meals.reduce((s,d,i)=>s+(d?MEALS[i].calories:0),0);
  const calTarget=BASE_CAL+(log.isFootballDay?600:0);
  const swDone=ALL_SW_KEYS.filter(k=>swLog[k]).length;
  const swPct=(swDone/ALL_SW_KEYS.length)*100;
  const allSWDone=swDone===ALL_SW_KEYS.length;
  const starkTasks=SW_PILLARS.filter(p=>p.side==="STARK").flatMap(p=>p.tasks);
  const wayneTasks=SW_PILLARS.filter(p=>p.side==="WAYNE").flatMap(p=>p.tasks);
  const starkDone=starkTasks.filter(t=>swLog[t.key]).length;
  const wayneDone=wayneTasks.filter(t=>swLog[t.key]).length;
  const chartData=[{label:"Start",weight:START_WEIGHT},...weights.map(w=>({label:w.date.slice(5),weight:w.weight})),{label:"Goal",weight:TARGET_WEIGHT}];
  const weakest=(()=>{
    const fc=swMeta.failCounts||{};
    const top=Object.entries(fc).sort((a,b)=>b[1]-a[1])[0];
    if(!top||top[1]===0)return null;
    const task=SW_PILLARS.flatMap(p=>p.tasks).find(t=>t.key===top[0]);
    return task?{...task,count:top[1]}:null;
  })();

  const B="#111", BB="#0c0c0c", BRD="1px solid #1c1c1c";
  const card=(on)=>({background:on?"#0d1f0d":B,border:`1px solid ${on?"#22c55e25":"#1c1c1c"}`,borderRadius:8,padding:"11px 13px",marginBottom:8,cursor:"pointer",transition:"all 0.2s"});
  const dot=(on,col="#22c55e")=>({width:20,height:20,borderRadius:"50%",border:`2px solid ${on?col:"#2a2a2a"}`,background:on?col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.5rem",color:"#fff",flexShrink:0,marginTop:2});
  const setB=(on,col)=>({width:30,height:30,borderRadius:6,cursor:"pointer",background:on?col:"#1a1a1a",border:`1px solid ${on?col:"#2a2a2a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",color:on?"#fff":"#3a3a3a",transition:"all 0.15s"});

  if(!ready)return(
    <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>
      <div style={{color:"#ef4444",letterSpacing:"0.3em",fontSize:"0.75rem"}}>LOADING PROTOCOL...</div>
    </div>
  );

  return(
    <div style={{background:"#080808",minHeight:"100vh",maxWidth:480,margin:"0 auto",fontFamily:"'Courier New',monospace",color:"#e2e2e2",paddingBottom:90}}>

      {/* HEADER */}
      <div style={{background:BB,borderBottom:BRD,padding:"14px 18px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"0.5rem",letterSpacing:"0.35em",color:"#ef4444",fontWeight:700,marginBottom:2}}>▶ BLOODHOUNDS MODE</div>
            <div style={{fontSize:"1rem",fontWeight:700,color:"#fff",letterSpacing:"0.08em"}}>GUN-WOO PROTOCOL</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"0.5rem",color:phase.color,letterSpacing:"0.15em"}}>PHASE {phase.num} · {phase.name.toUpperCase()}</div>
            <div style={{fontSize:"0.75rem",color:"#fff",fontWeight:700}}>DAY {Math.max(1,dayNum)}</div>
            {saved&&<div style={{fontSize:"0.5rem",color:"#22c55e"}}>✓ SAVED</div>}
          </div>
        </div>
        <div style={{marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.52rem",color:"#444",marginBottom:3}}>
            <span>{curW}kg now</span><span>+{gained}kg · {toGo}kg left</span><span style={{color:"#ef4444"}}>78kg target</span>
          </div>
          <div style={{background:"#1a1a1a",borderRadius:2,height:3,overflow:"hidden"}}>
            <div style={{width:`${wtPct}%`,height:"100%",background:"linear-gradient(90deg,#ef4444,#f97316)",transition:"width 0.5s"}}/>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:"flex",background:BB,borderBottom:BRD,position:"sticky",top:0,zIndex:10}}>
        {[["today","TODAY"],["workout","TRAIN"],["progress","STATS"],["plan","PLAN"],["sw","S·W"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 2px",background:"none",border:"none",borderBottom:tab===id?"2px solid #ef4444":"2px solid transparent",color:tab===id?"#fff":"#3a3a3a",fontSize:"0.5rem",letterSpacing:"0.15em",cursor:"pointer",fontFamily:"'Courier New',monospace",fontWeight:tab===id?700:400,transition:"all 0.15s"}}>{lbl}</button>
        ))}
      </div>

      {/* ════ TODAY ════ */}
      {tab==="today"&&<div style={{padding:"16px 18px 0"}}>
        <div style={{marginBottom:13}}>
          <div style={{fontSize:"0.56rem",color:"#444",letterSpacing:"0.1em",marginBottom:4}}>{fmtDate(today).toUpperCase()}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:workout.color+"18",border:`1px solid ${workout.color}35`,borderRadius:4,padding:"3px 9px",fontSize:"0.56rem",color:workout.color,letterSpacing:"0.1em",fontWeight:700}}>{workout.tag}</div>
            <div style={{fontSize:"0.56rem",color:"#444"}}>{workout.name}</div>
          </div>
        </div>

        <div style={{background:B,border:BRD,borderRadius:8,padding:"11px 13px",marginBottom:11,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:"0.63rem"}}>⚽ Football Today?</div><div style={{fontSize:"0.52rem",color:"#444",marginTop:2}}>+600 cal to target</div></div>
          <div style={{width:42,height:22,borderRadius:11,background:log.isFootballDay?"#22c55e":"#2a2a2a",cursor:"pointer",position:"relative",transition:"background 0.2s"}} onClick={()=>upd({isFootballDay:!log.isFootballDay})}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:log.isFootballDay?22:2,transition:"left 0.2s"}}/>
          </div>
        </div>

        <div style={{background:B,border:BRD,borderRadius:8,padding:"11px 13px",marginBottom:11}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:5}}>CALORIES TODAY</div>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
            <span style={{fontSize:"1.5rem",fontWeight:700,color:calEaten>=calTarget*0.75?"#22c55e":"#ef4444"}}>{calEaten.toLocaleString()}</span>
            <span style={{fontSize:"0.6rem",color:"#444"}}>/ {calTarget.toLocaleString()} kcal</span>
          </div>
          <div style={{background:"#1a1a1a",borderRadius:2,height:3,overflow:"hidden"}}>
            <div style={{width:`${Math.min(100,(calEaten/calTarget)*100)}%`,height:"100%",background:"#22c55e",transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:"0.52rem",color:"#444",marginTop:4}}>{log.meals.filter(Boolean).length}/5 meals · {BASE_PROTEIN}g protein target</div>
        </div>

        <div style={{fontSize:"0.5rem",letterSpacing:"0.25em",color:"#3a3a3a",marginBottom:9}}>MEALS — TAP TO MARK EATEN</div>
        {MEALS.map((meal,i)=>(
          <div key={meal.id} style={card(log.meals[i])} onClick={()=>{const m=[...log.meals];m[i]=!m[i];upd({meals:m});}}>
            <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
              <div style={dot(log.meals[i])}>{log.meals[i]?"✓":""}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontSize:"0.68rem",fontWeight:700,color:log.meals[i]?"#22c55e":"#e2e2e2"}}>{meal.emoji} {meal.name}</div>
                  <div style={{fontSize:"0.52rem",color:"#444"}}>{meal.time}</div>
                </div>
                <div style={{fontSize:"0.52rem",color:"#444",marginTop:3,lineHeight:1.7}}>{meal.items.join(" · ")}</div>
                <div style={{display:"flex",gap:13,marginTop:5}}>
                  <span style={{fontSize:"0.52rem",color:"#f97316"}}>{meal.calories} kcal</span>
                  <span style={{fontSize:"0.52rem",color:"#60a5fa"}}>{meal.protein}g protein</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div style={{background:B,border:BRD,borderRadius:8,padding:"11px 13px",margin:"5px 0 11px"}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:9}}>💧 WATER — {log.waterGlasses}/8 GLASSES</div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:8},(_,i)=>(
              <div key={i} onClick={()=>upd({waterGlasses:log.waterGlasses===i+1?i:i+1})}
                style={{flex:1,height:24,borderRadius:4,cursor:"pointer",background:i<log.waterGlasses?"#1d4ed8":"#1a1a1a",border:`1px solid ${i<log.waterGlasses?"#3b82f6":"#2a2a2a"}`,transition:"all 0.15s"}}/>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
          {[["sleepTime","😴 SLEPT AT"],["wakeTime","⏰ WOKE AT"]].map(([k,lbl])=>(
            <div key={k} style={{background:B,border:BRD,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.1em",marginBottom:5}}>{lbl}</div>
              <input type="time" value={log[k]} onChange={e=>upd({[k]:e.target.value})}
                style={{background:"transparent",border:"none",color:"#e2e2e2",fontFamily:"'Courier New',monospace",fontSize:"0.78rem",outline:"none",width:"100%"}}/>
            </div>
          ))}
        </div>

        <div style={{...card(log.workoutDone),display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}
          onClick={()=>upd({workoutDone:!log.workoutDone})}>
          <div>
            <div style={{fontSize:"0.66rem",color:log.workoutDone?"#22c55e":"#e2e2e2",fontWeight:700}}>
              {wType==="REST"?"🛌 Rest Day":wType==="BOXING"?"🥊 Boxing Done":`💪 ${workout.name} Done`}
            </div>
            <div style={{fontSize:"0.52rem",color:"#444",marginTop:2}}>Tap to mark complete</div>
          </div>
          <div style={{fontSize:"1.2rem"}}>{log.workoutDone?"✅":"⬜"}</div>
        </div>

        <div style={{background:B,border:BRD,borderRadius:8,padding:"11px 13px",marginBottom:20}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:8}}>⚖️ LOG WEIGHT (OPTIONAL)</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="number" step="0.1" placeholder="63.0" value={log.weight} onChange={e=>upd({weight:e.target.value})}
              style={{flex:1,background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:6,color:"#e2e2e2",padding:"8px 11px",fontFamily:"'Courier New',monospace",fontSize:"0.78rem",outline:"none"}}/>
            <span style={{color:"#444",fontSize:"0.68rem"}}>kg</span>
            <button onClick={saveWeight} style={{background:"#ef4444",border:"none",borderRadius:6,color:"#fff",padding:"8px 13px",cursor:"pointer",fontSize:"0.52rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:700}}>SAVE</button>
          </div>
        </div>
      </div>}

      {/* ════ WORKOUT ════ */}
      {tab==="workout"&&<div style={{padding:"16px 18px 0"}}>
        <div style={{marginBottom:13}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:3}}>TODAY'S SESSION</div>
          <div style={{fontSize:"1.05rem",fontWeight:700,color:workout.color,letterSpacing:"0.06em"}}>{workout.name.toUpperCase()}</div>
          <div style={{fontSize:"0.56rem",color:"#444",marginTop:2}}>{fmtDate(today)}</div>
        </div>
        {wType==="REST"?(
          <div style={{background:B,border:BRD,borderRadius:8,padding:28,textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:"2rem",marginBottom:8}}>😴</div>
            <div style={{color:"#444",fontSize:"0.63rem",lineHeight:1.9}}>REST DAY<br/>Eat all 5 meals. Sleep by 10:30 PM.<br/>Recovery IS the protocol.</div>
          </div>
        ):(
          <>
            {workout.exercises.map(ex=>{
              const done=Array.from({length:ex.sets},(_,i)=>log.sets?.[`${ex.key}_${i}`]).filter(Boolean).length;
              const all=done===ex.sets;
              return(
                <div key={ex.key} style={{background:all?"#0d1f0d":B,border:`1px solid ${all?"#22c55e25":"#1c1c1c"}`,borderRadius:8,padding:"11px 13px",marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <div>
                      <div style={{fontSize:"0.7rem",fontWeight:700,color:all?"#22c55e":"#e2e2e2"}}>{ex.name}</div>
                      <div style={{fontSize:"0.52rem",color:"#444",marginTop:2}}>{ex.sets} sets × {ex.reps}</div>
                      <div style={{fontSize:"0.52rem",color:"#2a2a2a",marginTop:1}}>{ex.note}</div>
                    </div>
                    <div style={{fontSize:"0.6rem",color:all?"#22c55e":"#444",fontWeight:700}}>{done}/{ex.sets}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {Array.from({length:ex.sets},(_,i)=>{
                      const sd=log.sets?.[`${ex.key}_${i}`];
                      return<div key={i} style={setB(sd,workout.color)} onClick={()=>{const ns={...log.sets,[`${ex.key}_${i}`]:!sd};upd({sets:ns});}}>{sd?"✓":i+1}</div>;
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{background:"#0a0a0a",border:BRD,borderRadius:8,padding:"11px 13px",marginBottom:20}}>
              <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:4}}>REST PROTOCOL</div>
              <div style={{fontSize:"0.58rem",color:"#333",lineHeight:1.8}}>60–90 sec between sets · Water between exercises · Add weight when last set feels easy</div>
            </div>
          </>
        )}
      </div>}

      {/* ════ STATS ════ */}
      {tab==="progress"&&<div style={{padding:"16px 18px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:16}}>
          {[{l:"CURRENT",v:`${curW}kg`,c:"#e2e2e2"},{l:"GAINED",v:`+${gained}kg`,c:"#22c55e"},{l:"TO GO",v:`${toGo}kg`,c:"#ef4444"}].map(st=>(
            <div key={st.l} style={{background:B,border:BRD,borderRadius:8,padding:"11px 9px",textAlign:"center"}}>
              <div style={{fontSize:"0.47rem",color:"#444",letterSpacing:"0.2em",marginBottom:3}}>{st.l}</div>
              <div style={{fontSize:"0.95rem",fontWeight:700,color:st.c}}>{st.v}</div>
            </div>
          ))}
        </div>

        <div style={{background:B,border:BRD,borderRadius:8,padding:"13px 11px",marginBottom:13}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:11}}>WEIGHT JOURNEY → 78KG</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{top:5,right:8,left:-22,bottom:0}}>
              <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor="#ef4444" stopOpacity={0.35}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient></defs>
              <XAxis dataKey="label" tick={{fill:"#444",fontSize:9}}/><YAxis domain={[60,80]} tick={{fill:"#444",fontSize:9}}/>
              <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:6,fontFamily:"monospace",fontSize:11}} itemStyle={{color:"#ef4444"}} labelStyle={{color:"#888"}}/>
              <ReferenceLine y={78} stroke="#ef444430" strokeDasharray="3 3" label={{value:"TARGET",fill:"#ef4444",fontSize:9,position:"right"}}/>
              <Area type="monotone" dataKey="weight" stroke="#ef4444" fill="url(#wg)" strokeWidth={2} dot={{fill:"#ef4444",r:3}} connectNulls/>
            </AreaChart>
          </ResponsiveContainer>
          {weights.length===0&&<div style={{textAlign:"center",fontSize:"0.56rem",color:"#333",marginTop:4}}>Log weight daily to see the curve build</div>}
        </div>

        <div style={{background:B,border:BRD,borderRadius:8,padding:"13px",marginBottom:12}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:11}}>PHASE TIMELINE</div>
          {[{n:1,name:"Foundation",days:"Day 1–61",target:"67–68kg",col:"#ef4444",s:1},{n:2,name:"Build",days:"Day 62–152",target:"73–74kg",col:"#f97316",s:62},{n:3,name:"Sharpen",days:"Day 153–365",target:"78–80kg",col:"#eab308",s:153}].map(p=>{
            const active=phase.num===p.n;
            return(
              <div key={p.n} style={{display:"flex",gap:11,marginBottom:10,alignItems:"flex-start"}}>
                <div style={{width:5,borderRadius:3,background:dayNum>=p.s?p.col:"#222",flexShrink:0,alignSelf:"stretch",minHeight:32}}/>
                <div>
                  <div style={{fontSize:"0.63rem",fontWeight:active?700:400,color:active?p.col:"#444"}}>Phase {p.n}: {p.name}{active?" ← YOU ARE HERE":""}</div>
                  <div style={{fontSize:"0.52rem",color:"#333",marginTop:2}}>{p.days} · Target {p.target}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{background:B,border:BRD,borderRadius:8,padding:"13px",marginBottom:20}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:11}}>6-MONTH MILESTONES</div>
          {[{mo:"Month 1",kg:66,check:"Sleep fixed. 3+ meals daily. Every session done."},{mo:"Month 2",kg:68,check:"Visible shoulder change. Pull-ups 12+."},{mo:"Month 3",kg:70,check:"Weighted pull-ups started. V-taper forming."},{mo:"Month 4",kg:71,check:"People notice. DB shoulder press 15kg+."},{mo:"Month 5",kg:73,check:"You look like you train. Boxing combos clean."},{mo:"Month 6",kg:75,check:"Visible definition. Foundation complete."}].map(m=>{
            const reached=curW>=m.kg-0.5;
            return(
              <div key={m.mo} style={{display:"flex",gap:9,marginBottom:9}}>
                <div style={{fontSize:"0.7rem",marginTop:1}}>{reached?"✅":"⬜"}</div>
                <div>
                  <div style={{fontSize:"0.6rem",color:reached?"#22c55e":"#e2e2e2",fontWeight:reached?700:400}}>{m.mo} — {m.kg}kg</div>
                  <div style={{fontSize:"0.52rem",color:"#333",marginTop:2}}>{m.check}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* ════ PLAN ════ */}
      {tab==="plan"&&<div style={{padding:"16px 18px 0"}}>
        <div style={{fontSize:"0.5rem",letterSpacing:"0.25em",color:"#3a3a3a",marginBottom:9}}>DAILY MEAL PLAN — {BASE_CAL.toLocaleString()} KCAL BASE</div>
        {MEALS.map(meal=>(
          <div key={meal.id} style={{background:B,border:BRD,borderRadius:8,padding:"11px 13px",marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:"0.68rem",fontWeight:700}}>{meal.emoji} {meal.name}</div>
              <div style={{fontSize:"0.56rem",color:"#444"}}>{meal.time}</div>
            </div>
            <div style={{fontSize:"0.56rem",color:"#444",lineHeight:1.8}}>{meal.items.join(" · ")}</div>
            <div style={{display:"flex",gap:13,marginTop:6,paddingTop:6,borderTop:"1px solid #191919"}}>
              <span style={{fontSize:"0.52rem",color:"#f97316"}}>🔥 {meal.calories} kcal</span>
              <span style={{fontSize:"0.52rem",color:"#60a5fa"}}>💪 {meal.protein}g protein</span>
            </div>
          </div>
        ))}
        <div style={{background:"#0a0a0a",border:BRD,borderRadius:6,padding:"9px 12px",marginBottom:16,fontSize:"0.56rem",color:"#444",lineHeight:1.7}}>
          ⚽ Football days: extra cup rice at Meal 2+4, extra glass milk = +600 cal
        </div>

        <div style={{fontSize:"0.5rem",letterSpacing:"0.25em",color:"#3a3a3a",marginBottom:9}}>WEEKLY SCHEDULE</div>
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>{
          const w=WORKOUTS[WEEK_SCHEDULE[i]];
          return(
            <div key={day} style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
              <div style={{width:26,fontSize:"0.56rem",color:"#444",flexShrink:0}}>{day}</div>
              <div style={{flex:1,background:B,border:`1px solid ${w.color}18`,borderRadius:6,padding:"7px 11px",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:"0.6rem",color:WEEK_SCHEDULE[i]==="REST"?"#333":"#e2e2e2"}}>{w.name}</span>
                <span style={{fontSize:"0.52rem",color:w.color}}>{w.tag}</span>
              </div>
            </div>
          );
        })}

        <div style={{background:B,border:BRD,borderRadius:8,padding:"13px",marginTop:11,marginBottom:20}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:9}}>BOXING — PHASE 1 SESSION</div>
          {[{s:"Warm-up",d:"Jump rope or high knees — 3 minutes"},{s:"Footwork",d:"Stance movement drills — 5 minutes"},{s:"Shadowboxing",d:"4 × 2 min rounds, 1 min rest between"},{s:"Combos",d:"Jab · Cross · Hook · Uppercut in order"},{s:"Core",d:"3 sets: crunches + leg raises + plank"}].map(b=>(
            <div key={b.s} style={{display:"flex",gap:9,padding:"5px 0",borderBottom:"1px solid #191919"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#06b6d4",marginTop:6,flexShrink:0}}/>
              <div>
                <div style={{fontSize:"0.6rem",color:"#06b6d4",fontWeight:700}}>{b.s}</div>
                <div style={{fontSize:"0.52rem",color:"#444"}}>{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* ════ STARK·WAYNE ════ */}
      {tab==="sw"&&<div style={{padding:"16px 18px 0"}}>

        {/* Title */}
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:"0.5rem",letterSpacing:"0.35em",color:"#444",marginBottom:5}}>IDENTITY PROTOCOL</div>
          <div style={{fontSize:"1rem",fontWeight:700,letterSpacing:"0.14em"}}>
            <span style={{color:"#f59e0b"}}>STARK</span>
            <span style={{color:"#333",margin:"0 10px"}}>·</span>
            <span style={{color:"#ef4444"}}>WAYNE</span>
          </div>
          <div style={{fontSize:"0.52rem",color:"#333",marginTop:5,letterSpacing:"0.1em"}}>8 TASKS · ALL OR NOTHING · NO PARTIAL CREDIT</div>
        </div>

        {/* Circle meter */}
        <div style={{background:"#0e0e0e",border:`1px solid ${allSWDone?"#22c55e35":"#1c1c1c"}`,borderRadius:12,padding:"20px 16px 16px",marginBottom:14,display:"flex",flexDirection:"column",alignItems:"center",transition:"border-color 0.5s"}}>
          <CircleMeter pct={swPct} size={152}/>
          <div style={{marginTop:10,textAlign:"center"}}>
            <div style={{fontSize:"0.63rem",color:allSWDone?"#22c55e":"#e2e2e2",fontWeight:700,letterSpacing:"0.1em"}}>
              {allSWDone?"✦  PERFECT DAY  ✦":`${swDone} / ${ALL_SW_KEYS.length} TASKS COMPLETE`}
            </div>
            {allSWDone&&<div style={{fontSize:"0.52rem",color:"#22c55e50",marginTop:3,letterSpacing:"0.2em"}}>STREAK BUILDING</div>}
          </div>
        </div>

        {/* Streak row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:B,border:BRD,borderRadius:8,padding:"13px",textAlign:"center"}}>
            <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:4}}>🔥 CURRENT STREAK</div>
            <div style={{fontSize:"1.7rem",fontWeight:700,color:swMeta.streak>0?"#f97316":"#2a2a2a",lineHeight:1}}>{swMeta.streak||0}</div>
            <div style={{fontSize:"0.5rem",color:"#333",marginTop:3}}>consecutive days</div>
          </div>
          <div style={{background:B,border:BRD,borderRadius:8,padding:"13px",textAlign:"center"}}>
            <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:4}}>⚡ LONGEST STREAK</div>
            <div style={{fontSize:"1.7rem",fontWeight:700,color:swMeta.longestStreak>0?"#eab308":"#2a2a2a",lineHeight:1}}>{swMeta.longestStreak||0}</div>
            <div style={{fontSize:"0.5rem",color:"#333",marginTop:3}}>personal best</div>
          </div>
        </div>

        {/* STARK vs WAYNE */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[{label:"STARK",side:"Mind + Craft",tasks:starkTasks,done:starkDone,col:"#f59e0b",icon:"⚙️"},{label:"WAYNE",side:"Body + Identity",tasks:wayneTasks,done:wayneDone,col:"#ef4444",icon:"⚔️"}].map(p=>(
            <div key={p.label} style={{background:B,border:`1px solid ${p.col}20`,borderRadius:8,padding:"12px"}}>
              <div style={{fontSize:"0.52rem",color:p.col,letterSpacing:"0.2em",fontWeight:700,marginBottom:7}}>{p.icon} {p.label}</div>
              <div style={{fontSize:"1.3rem",fontWeight:700,color:p.col,marginBottom:5}}>{p.done}<span style={{fontSize:"0.7rem",color:"#444"}}>/{p.tasks.length}</span></div>
              <div style={{background:"#1a1a1a",borderRadius:2,height:3,overflow:"hidden",marginBottom:5}}>
                <div style={{width:`${(p.done/p.tasks.length)*100}%`,height:"100%",background:p.done===p.tasks.length?"#22c55e":p.col,transition:"width 0.4s"}}/>
              </div>
              <div style={{fontSize:"0.5rem",color:"#333"}}>{p.side}</div>
            </div>
          ))}
        </div>

        {/* Pillar breakdown */}
        <div style={{background:B,border:BRD,borderRadius:8,padding:"13px",marginBottom:13}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:11}}>PILLAR BREAKDOWN</div>
          {SW_PILLARS.map(p=>{
            const done=p.tasks.filter(t=>swLog[t.key]).length;
            const pct=(done/p.tasks.length)*100;
            return(
              <div key={p.id} style={{marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:"0.62rem"}}>{p.icon}</span>
                    <span style={{fontSize:"0.57rem",color:p.color,letterSpacing:"0.12em",fontWeight:700}}>{p.label}</span>
                    <span style={{fontSize:"0.5rem",color:"#444"}}>{p.side}</span>
                  </div>
                  <span style={{fontSize:"0.57rem",color:done===p.tasks.length?"#22c55e":"#555"}}>{done}/{p.tasks.length}</span>
                </div>
                <div style={{background:"#1a1a1a",borderRadius:2,height:3,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:done===p.tasks.length?"#22c55e":p.color,transition:"width 0.4s",borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task list */}
        <div style={{fontSize:"0.5rem",letterSpacing:"0.25em",color:"#3a3a3a",marginBottom:11}}>TODAY'S 8 TASKS — TAP TO COMPLETE</div>
        {SW_PILLARS.map(pillar=>(
          <div key={pillar.id} style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,paddingLeft:2}}>
              <span style={{fontSize:"0.68rem"}}>{pillar.icon}</span>
              <span style={{fontSize:"0.56rem",color:pillar.color,letterSpacing:"0.15em",fontWeight:700}}>{pillar.label}</span>
              <span style={{fontSize:"0.5rem",color:"#333",letterSpacing:"0.08em"}}>{pillar.side}</span>
            </div>
            {pillar.tasks.map(task=>(
              <div key={task.key} style={{...card(swLog[task.key]),display:"flex",alignItems:"flex-start",gap:11,marginBottom:7}}
                onClick={()=>toggleSW(task.key)}>
                <div style={{...dot(swLog[task.key],pillar.color)}}>{swLog[task.key]?"✓":""}</div>
                <div>
                  <div style={{fontSize:"0.66rem",fontWeight:700,color:swLog[task.key]?"#22c55e":"#e2e2e2"}}>{task.label}</div>
                  <div style={{fontSize:"0.52rem",color:"#444",marginTop:3,lineHeight:1.6}}>{task.sub}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Weakness detector */}
        <div style={{background:"#0e0e0e",border:`1px solid ${weakest?"#ef444428":"#1c1c1c"}`,borderRadius:8,padding:"13px",marginBottom:13}}>
          <div style={{fontSize:"0.5rem",color:"#444",letterSpacing:"0.2em",marginBottom:8}}>🎯 WEAKNESS DETECTOR</div>
          {weakest?(
            <>
              <div style={{fontSize:"0.57rem",color:"#ef4444",marginBottom:3,letterSpacing:"0.05em"}}>Most skipped task:</div>
              <div style={{fontSize:"0.72rem",fontWeight:700,color:"#e2e2e2",marginBottom:4}}>{weakest.label}</div>
              <div style={{fontSize:"0.52rem",color:"#555",lineHeight:1.7}}>Skipped {weakest.count} time{weakest.count>1?"s":""} — this is your override muscle. It's telling you exactly where your discipline breaks.</div>
            </>
          ):(
            <div style={{fontSize:"0.58rem",color:"#333",lineHeight:1.7}}>No data yet. Start completing tasks and this will track your patterns.</div>
          )}
        </div>

        {/* The challenge */}
        <div style={{background:"#09090a",border:"1px solid #1f1a0d",borderRadius:8,padding:"14px",marginBottom:20}}>
          <div style={{fontSize:"0.5rem",color:"#f59e0b40",letterSpacing:"0.25em",marginBottom:8}}>THE CHALLENGE</div>
          <div style={{fontSize:"0.6rem",color:"#4a4030",lineHeight:1.9,fontStyle:"italic",borderLeft:"2px solid #f59e0b20",paddingLeft:12}}>
            "Which of these will you cheat on first?<br/>That's the one to watch."
          </div>
          <div style={{marginTop:11,paddingTop:11,borderTop:"1px solid #1a1505"}}>
            <div style={{fontSize:"0.52rem",color:"#3a3530",lineHeight:1.9}}>
              These 8 tasks are specific for a reason. You either did it or you didn't. No vague wins. No "I was kind of productive." Binary. Every single day.
            </div>
          </div>
        </div>

      </div>}

    </div>
  );
}
