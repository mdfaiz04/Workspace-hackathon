
/*
  analytics.js (Backend + ML Ready Version)
  -----------------------------------------
  ✔ Uses backend API when available
  ✔ Falls back to demo data automatically
  ✔ Keeps ALL visuals + charts + exports
*/

// ===============================
// CONFIG
// ===============================
const API_BASE = "http://127.0.0.1:8000/api/analytics";

// ===============================
// DEMO DATA (fallback only)
// ===============================
const DEMO_DATA = {
  article:{
    title:"National Cybersecurity Initiative",
    source:"Newsroom Daily",
    category:"Technology",
    published:"2026-02-18 09:24",
    totalComments:1843
  },
  kpis:[
    {title:"Total Comments",value:1843,subtitle:"all-time",trend:+4.2,spark:[1600,1700,1750,1800,1843]},
    {title:"Positive Sentiment",value:"22%",subtitle:"vs last week",trend:-1.1,spark:[25,23,24,22,22]},
    {title:"Negative Sentiment",value:"18%",subtitle:"vs last week",trend:+2.8,spark:[15,16,17,18,18]},
    {title:"Primary Topic",value:"Data Security",subtitle:"dominant",trend:null}
  ],
  topics:{
    labels:["Data Security","Government Policy","Geopolitics","Internet Access","Technology Impact"],
    values:[42,28,22,18,18]
  },
  sentimentDist:{positive:22,neutral:32,negative:74,angry:5,sarcastic:3},
  sentimentTrend:[12,18,25,20,30,28,35,40,38,45],
  heatmap:[[0,2,0.3],[1,3,0.6],[2,4,0.9],[3,1,0.1],[4,0,0.4]],
  topicEvolution:{
    labels:["Day1","Day2","Day3","Day4","Day5"],
    datasets:[
      {label:"Data Sec",data:[5,7,6,8,9],borderColor:'#6366f1',tension:0.4},
      {label:"Policy",data:[3,4,5,4,6],borderColor:'#f59e0b',tension:0.4}
    ]
  },
  risk:[2,5,1,7,3,8,4],
  entities:[
    {name:"NSA",type:"Organization",freq:52,sentiment:"neutral",prominence:0.9},
    {name:"Encryption",type:"Concept",freq:33,sentiment:"positive",prominence:0.7}
  ],
  safety:{toxicity:"medium",hate:"low",spam:"high"},
  aiSummary:"Balanced discourse detected with growing privacy concerns."
};

let analytics = null;

// ===============================
// FETCH DATA FROM BACKEND
// ===============================
async function loadAnalytics(articleId){

  try{
    const res = await fetch(`${API_BASE}/${articleId}`);
    if(!res.ok) throw new Error("API not ready");

    analytics = await res.json();
    console.log("✅ Loaded backend analytics");

  }catch(e){
    console.warn("⚠ Using demo analytics (backend not running)");
    analytics = DEMO_DATA;
  }

  initDashboard();
}

// ===============================
// HELPERS
// ===============================
function pct(n){
  if(n===null || n===undefined) return "";
  return n>0?`↑ ${n}%`:`↓ ${Math.abs(n)}%`;
}

const sentimentColors={
  positive:'#10b981',
  neutral:'#6b7280',
  negative:'#ef4444',
  angry:'#991b1b',
  sarcastic:'#f97316'
};

// ===============================
// HEADER
// ===============================
function renderHeader(){
  document.getElementById('meta-source').textContent=`Source: ${analytics.article.source}`;
  document.getElementById('meta-category').textContent=`Category: ${analytics.article.category}`;
  document.getElementById('meta-pubtime').textContent=`Published: ${analytics.article.published}`;
  document.getElementById('meta-comments').textContent=`Comments: ${analytics.article.totalComments}`;
}

// ===============================
// KPI CARDS
// ===============================
function renderKPIs(){

  const container=document.getElementById('kpi-cards');
  container.innerHTML="";

  analytics.kpis.forEach(k=>{

    const div=document.createElement('div');
    div.className='kpi-card';

    div.innerHTML=`
      <div class="title">${k.title}</div>
      <div class="value">${k.value}</div>
      <div class="subtitle">${k.subtitle||""}</div>
      <div class="trend ${k.trend>=0?'up':'down'}">${pct(k.trend)}</div>
      <canvas class="sparkline"></canvas>`;

    container.appendChild(div);

    if(Array.isArray(k.spark)){
      new Chart(div.querySelector('canvas'),{
        type:'line',
        data:{
          labels:k.spark.map((_,i)=>i),
          datasets:[{
            data:k.spark,
            borderColor:'#000',
            borderWidth:1,
            pointRadius:0
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          elements:{line:{tension:0.4}}
        }
      });
    }else{
      div.querySelector('canvas').remove();
    }
  });
}

// ===============================
// CHARTS
// ===============================
function renderTopicChart(){
  new Chart(document.getElementById('topicChart'),{
    type:'doughnut',
    data:{
      labels:analytics.topics.labels,
      datasets:[{
        data:analytics.topics.values,
        backgroundColor:['#2563eb','#22c55e','#f59e0b','#ef4444','#6366f1']
      }]
    },
    options:{cutout:'70%'}
  });
}

function renderSentimentChart(){

  const labels = Object.keys(analytics.sentimentDist);
  const values = Object.values(analytics.sentimentDist);

  new Chart(document.getElementById('sentimentChart'),{
    type:'bar',
    data:{
      labels:labels,
      datasets:[{
        data:values,
        backgroundColor:labels.map(l=>sentimentColors[l]||'#000')
      }]
    },
    options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });
}

function renderTrendChart(){
  new Chart(document.getElementById('trendChart'),{
    type:'line',
    data:{
      labels:analytics.sentimentTrend.map((_,i)=>`T${i}`),
      datasets:[{
        data:analytics.sentimentTrend,
        borderColor:'#2563eb',
        backgroundColor:'rgba(37,99,235,0.2)',
        tension:0.4,
        fill:true
      }]
    }
  });
}

function renderHeatmap(){
  new Chart(document.getElementById('heatmapChart'),{
    type:'bubble',
    data:{
      datasets:[{
        data:analytics.heatmap.map(p=>({x:p[0],y:p[1],r:p[2]*20})),
        backgroundColor:'rgba(239,68,68,0.6)'
      }]
    },
    options:{plugins:{legend:{display:false}}}
  });
}

function renderTimeline(){
  new Chart(document.getElementById('timelineChart'),{
    type:'line',
    data:analytics.topicEvolution
  });
}

// ===============================
// ENTITIES + SAFETY
// ===============================
function renderEntities(){
  const container=document.getElementById('entity-cards');
  if(!container) return;

  container.innerHTML="";
  analytics.entities.forEach(e=>{
    container.innerHTML+=`
      <div class="entity-card">
        <div class="name">${e.name}</div>
        <div class="type">${e.type}</div>
        <div class="details">
          freq:${e.freq} | sentiment:${e.sentiment}
        </div>
      </div>`;
  });
}

function renderSafety(){

  const box=document.getElementById('safety-status');
  box.innerHTML="";

  Object.entries(analytics.safety).forEach(([k,v])=>{
    box.innerHTML+=`<span class="badge ${v}">
      ${k}: ${v}
    </span>`;
  });

  document.getElementById('ai-summary').textContent =
    analytics.aiSummary;
}

// ===============================
// EXPORTS
// ===============================
function exportJSON(){
  const blob=new Blob([JSON.stringify(analytics,null,2)],{type:'application/json'});
  saveAs(blob,'analytics.json');
}

function exportCSV(){
  const rows = Object.entries(analytics.article);
  const csv = rows.map(r=>r.join(",")).join("\n");
  saveAs(new Blob([csv],{type:"text/csv"}),'analytics.csv');
}

function exportPDF(){
  const target=document.querySelector('main.dashboard');
  html2canvas(target,{scale:2}).then(canvas=>{
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF('landscape');
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,280,160);
    pdf.save("dashboard.pdf");
  });
}

function connectExports(){
  document.getElementById('export-json').onclick=exportJSON;
  document.getElementById('export-csv').onclick=exportCSV;
  document.getElementById('export-pdf').onclick=exportPDF;
}

// ===============================
// INIT DASHBOARD
// ===============================
function initDashboard(){
  renderHeader();
  renderKPIs();
  renderTopicChart();
  renderSentimentChart();
  renderTrendChart();
  renderHeatmap();
  renderTimeline();
  renderEntities();
  renderSafety();
  connectExports();
}

// ===============================
// AUTO START
// ===============================
window.onload=()=>{
  const params=new URLSearchParams(window.location.search);
  const articleId=params.get("id") || "demo";
  loadAnalytics(articleId);
};
