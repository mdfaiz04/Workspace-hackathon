/*
  analytics.js
  Updated front-end for modern AI Intelligence Dashboard
  - data remains hard-coded for demonstration; connectors to API unchanged.
  - visual upgrades: gradient fills, animated loads, sparklines, export helpers.
*/

// --- sample data used across dashboard (would normally come from backend) ---
// note: `sentimentDist` is the original (3-level) breakdown returned by the backend.
// we will map it to a 7-level distribution on the frontend for visualization.
const sample = {
  article: {
    title: "National Cybersecurity Initiative",
    source: "Newsroom Daily",
    category: "Technology",
    published: "2026-02-18 09:24",
    totalComments: 1843
  },
  kpis: [
    { title: "Total Comments", value: 1843, subtitle: "all-time", trend: +4.2, spark: [1600,1700,1750,1800,1843] },
    { title: "Positive Sentiment", value: "22%", subtitle:"vs last week", trend: -1.1, spark:[25,23,24,22,22] },
    { title: "Negative Sentiment", value: "18%", subtitle:"vs last week", trend: +2.8, spark:[15,16,17,18,18] },
    { title: "Primary Topic", value: "Data Security", subtitle:"dominant", trend: null, spark:["Data","Data","Data","Data","Data"] }
  ],
  topics: {
    labels: ["Data Security","Government Policy","Geopolitics","Internet Access","Technology Impact"],
    values: [42,28,22,18,18]
  },
  sentimentDist: { positive:22, neutral:32, negative:74, angry:5, sarcastic:3 },
  sentimentTrend: [12,18,25,20,30,28,35,40,38,45],
  heatmap: [
    /* each point: [timeIndex, sentimentIndex, intensity] */
    [0,2,0.3],[1,3,0.6],[2,4,0.9],[3,1,0.1],[4,0,0.4]
  ],
  topicEvolution: {
    labels: ["Day1","Day2","Day3","Day4","Day5"],
    datasets: [
      {label:"Data Sec", data:[5,7,6,8,9], borderColor:'#6366f1', tension:0.4},
      {label:"Policy", data:[3,4,5,4,6], borderColor:'#f59e0b', tension:0.4}
    ]
  },
  risk: [2,5,1,7,3,8,4],
  entities: [
    {name:"NSA", type:"Organization", freq:52, sentiment:"neutral", prominence:0.9},
    {name:"Encryption", type:"Concept", freq:33, sentiment:"positive", prominence:0.7}
  ],
  safety: { toxicity: "medium", hate: "low", spam: "high" },
  aiSummary: "The model detects balanced discourse with spikes of concern around data privacy; overall sentiment leans positive with cautious attention to government policy."
};

// utility for number formatting
function pct(n){return n>0?`↑ ${n}%`:`↓ ${Math.abs(n)}%`;}

// normalize sentiment distribution and configuration for chart
function normalizeSentiment(raw){
  if(Array.isArray(raw)){
    return {positive: raw[0]||0, neutral: raw[1]||0, negative: raw[2]||0};
  } else if(raw && typeof raw === 'object'){
    return raw;
  }
  return {positive:0, neutral:0, negative:0};
}

const sentimentOrder = ['positive','neutral','negative','angry','sarcastic'];
const sentimentLabels = {
  positive:'Positive', neutral:'Neutral', negative:'Negative',
  angry:'Angry', sarcastic:'Sarcastic'
};
const sentimentColors = {
  positive:'#10b981', /* green */
  neutral:'#6b7280', /* gray */
  negative:'#ef4444', /* red */
  angry:'#991b1b',   /* dark red */
  sarcastic:'#f97316' /* orange */
};

// populate header metadata
function renderHeader(){
  document.getElementById('meta-source').textContent=`Source: ${sample.article.source}`;
  document.getElementById('meta-category').textContent=`Category: ${sample.article.category}`;
  document.getElementById('meta-pubtime').textContent=`Published: ${sample.article.published}`;
  document.getElementById('meta-comments').textContent=`Comments: ${sample.article.totalComments}`;
}

// build KPI cards
function renderKPIs(){
  const container=document.getElementById('kpi-cards');
  sample.kpis.forEach(k=>{
    const div=document.createElement('div'); div.className='kpi-card';
    div.innerHTML=`
      <div class="title">${k.title}</div>
      <div class="value">${k.value}</div>
      <div class="subtitle">${k.subtitle}</div>
      <div class="trend ${k.trend>=0?'up':'down'}">${k.trend!==null?pct(k.trend):''}</div>
      <canvas class="sparkline"></canvas>`;
    container.appendChild(div);
    // render sparkline chart inside card if numeric data provided
    if (Array.isArray(k.spark) && k.spark.every(v=>typeof v=== 'number')) {
      new Chart(div.querySelector('canvas'),{
        type:'line',data:{labels:k.spark.map((_,i)=>i),datasets:[{data:k.spark, borderColor:'#fff', borderWidth:1,pointRadius:0}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},elements:{line:{tension:0.4}}}
      });
    } else {
      // remove canvas placeholder when not applicable
      div.querySelector('canvas').remove();
    }
  });
}

// create topic doughnut with hover relevance
function renderTopicChart(){
  new Chart(document.getElementById('topicChart'),{
    type:'doughnut',data:{labels:sample.topics.labels,datasets:[{data:sample.topics.values,backgroundColor:['#6366f1','#f59e0b','#ef4444','#22c55e','#2563eb'],borderWidth:2,borderColor:'#0b0e17'}]},
    options:{cutout:'70%',plugins:{legend:{position:'bottom',labels:{padding:10,boxWidth:12}}},
      onHover:function(evt,item){if(item.length){evt.native.target.style.cursor='pointer';}}
    }
  });
}

// sentiment distribution bar with gradient
function renderSentimentChart(){
  const ctx = document.getElementById('sentimentChart').getContext('2d');
  const dataMap = normalizeSentiment(sample.sentimentDist);
  const categories = sentimentOrder.filter(k=>dataMap[k] !== undefined && dataMap[k] !== null);
  const labels = categories.map(k=>sentimentLabels[k]);
  const values = categories.map(k=>dataMap[k]);
  const barColors = categories.map(k=>sentimentColors[k]);
  new Chart(ctx,{
    type:'bar',
    data:{labels:labels,datasets:[{data:values,backgroundColor:barColors}]},
    options:{
      animation:{duration:800},
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{
          label:(ctx)=>`${ctx.label}: ${ctx.parsed.y.toFixed(1)}%`
        }}
      },
      scales:{y:{beginAtZero:true}}
    }
  });
}

// trend chart smooth line
function renderTrendChart(){
  new Chart(document.getElementById('trendChart'),{
    type:'line',data:{labels:sample.sentimentTrend.map((_,i)=>`T${i}`),datasets:[{data:sample.sentimentTrend,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.3)',tension:0.4,fill:'start'}]},options:{animation:{duration:1000},plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });
}

// heatmap approximated with bubble chart (time vs sentiment intensity)
function renderHeatmap(){
  new Chart(document.getElementById('heatmapChart'),{
    type:'bubble',data:{datasets:[{label:'Intensity',data:sample.heatmap.map(p=>({x:p[0],y:p[1],r:p[2]*20})),backgroundColor:'rgba(255,99,132,0.6)'}]},options:{scales:{x:{title:{display:true,text:'time'}},y:{title:{display:true,text:'sentiment level'}}},plugins:{legend:{display:false}}}
  });
}

// topic evolution line
function renderTimeline(){
  new Chart(document.getElementById('timelineChart'),{type:'line',data:sample.topicEvolution,options:{scales:{y:{beginAtZero:true}}}});
}

// risk monitor bar
function renderRisk(){
  new Chart(document.getElementById('riskChart'),{type:'bar',data:{labels:sample.topicEvolution.labels,datasets:[{data:sample.risk,backgroundColor:'#ef4444'}]},options:{plugins:{legend:{display:false}}}});
}

// entities cards
function renderEntities(){
  const container=document.getElementById('entity-cards');
  sample.entities.forEach(e=>{
    const div=document.createElement('div');div.className='entity-card';
    div.innerHTML=`<div class="name">${e.name}</div><div class="type">${e.type}</div><div class="details">freq: ${e.freq}, sentiment: ${e.sentiment}, score: ${e.prominence}</div>`;
    container.appendChild(div);
  });
}

// safety badges
function renderSafety(){
  const box=document.getElementById('safety-status');
  ['toxicity','hate','spam'].forEach(k=>{
    const span=document.createElement('span');span.className='badge '+sample.safety[k];
    span.textContent=`${k}: ${sample.safety[k]}`;
    box.appendChild(span);
  });
  // render ai summary if present
  const summaryElem = document.getElementById('ai-summary');
  if(summaryElem && sample.aiSummary) {
    summaryElem.textContent = sample.aiSummary;
  }
}

// export utilities --------------------------------------------------
function exportJSON(){
  const copy = Object.assign({},sample,{
    sentimentNormalized: normalizeSentiment(sample.sentimentDist),
    exportedAt:new Date().toISOString()
  });
  const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'});
  saveAs(blob,'analytics-data.json');
}
function exportCSV(){
  // build CSV sections for article, KPIs, topics, sentiments, entities, safety
  const lines = [];
  const addSection = (title, rows) => {
    lines.push([title]);
    rows.forEach(r=>lines.push(r));
    lines.push([]); // empty line
  };
  // article metadata
  addSection('Article Metadata', Object.entries(sample.article));
  // KPIs
  addSection('KPIs', sample.kpis.map(k=>[k.title, k.value, k.subtitle, k.trend]));
  // topic distribution
  addSection('Topics', sample.topics.labels.map((l,i)=>[l, sample.topics.values[i]]));
  // sentiment distribution (normalized categories)
  const norm = normalizeSentiment(sample.sentimentDist);
  const cats = sentimentOrder.filter(k=>norm[k] !== undefined && norm[k] !== null);
  addSection('Sentiment Distribution', cats.map(k=>[sentimentLabels[k], norm[k]]));
  // sentiment trend
  addSection('Sentiment Trend', sample.sentimentTrend.map((v,i)=>[`T${i}`,v]));
  // entities
  addSection('Entities', sample.entities.map(e=>[e.name,e.type,e.freq,e.sentiment,e.prominence]));
  // safety
  addSection('Safety', Object.entries(sample.safety));
  // export timestamp
  addSection('Exported At', [[new Date().toISOString()]]);
  // convert to CSV text
  const csv = lines.map(row=>row.map(cell=>`"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  saveAs(blob,'analytics-data.csv');
}
function exportPDF(){
  // capture the dashboard area and convert to PDF
  const target = document.querySelector('main.dashboard');
  if (!target) return;
  html2canvas(target, {scale:2}).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF({orientation:'landscape'});
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('dashboard-report.pdf');
  }).catch(err=>{
    console.error('PDF export failed', err);
  });
}

// attach export button handlers
function connectExports(){
  document.getElementById('export-json').onclick=exportJSON;
  document.getElementById('export-csv').onclick=exportCSV;
  document.getElementById('export-pdf').onclick=exportPDF;
}

// initialize all pieces
function init(){
  renderHeader();
  renderKPIs();
  renderTopicChart();
  renderSentimentChart();
  renderTrendChart();
  renderHeatmap();
  renderTimeline();
  renderRisk();
  renderEntities();
  renderSafety();
  connectExports();
}

window.onload=init;
