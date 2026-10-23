let currentLang = "en";
let latestAnalysis = null;
let latestBurnout = null;
let breathInterval = null;
let activeAidIdx = 0;

const SAMPLES = {
  anemia:
    "Hemoglobin (Hb): 9.6 g/dL\nVitamin D3 (25-OH): 12.2 ng/mL\nPlatelets: 2,35,000 /uL\nRx:\n1. Tab Ferrous Ascorbate + Folic Acid OD PC\n2. Sachet Cholecalciferol 60K with milk weekly",
  fever:
    "Platelets: 1,18,000 /uL\nHemoglobin: 13.4 g/dL\nRx:\n1. Tab Paracetamol 500mg SOS\n2. Tab Pantoprazole 40mg OD BBF\n3. Tab Cetirizine 10mg HS x 3 days",
  diabetes:
    "Fasting Blood Sugar (FBS): 146 mg/dL\nHbA1c: 7.2%\nRx:\n1. Tab Metformin 500mg BD PC\n2. 30 min daily walk",
  antibiotic:
    "Rx:\n1. Tab Azithromycin 500mg OD AC x 5 days\n2. Tab Paracetamol 500mg SOS\nWarm saline gargles TDS"
};

const FIRST_AID = [
  {
    label: "Fainting / Heat Exhaustion",
    en: [
      "Lay the person flat on their back in a shaded, ventilated area.",
      "Elevate both legs about 12 inches above heart level to support blood return to the brain.",
      "Loosen tight collars, ties, or belts. Never pour water into an unconscious person's mouth.",
      "Once fully alert and able to swallow safely, give slow sips of oral rehydration solution (ORS)."
    ],
    hi: [
      "व्यक्ति को तुरंत छायादार और हवादार स्थान पर पीठ के बल सीधा लिटाएं।",
      "मस्तिष्क तक रक्त प्रवाह बढ़ाने के लिए दोनों पैरों को लगभग 1 फुट ऊपर उठाएं।",
      "कॉलर, टाई या बेल्ट ढीला करें। बेहोशी की अवस्था में मुंह में पानी कभी न डालें।",
      "पूरी तरह होश आने पर धीरे-धीरे ORS का घोल पिलाएं।"
    ]
  },
  {
    label: "Thermal / Kitchen Burn",
    en: [
      "Hold the burned skin under cool gentle running tap water for 15 to 20 minutes immediately.",
      "Do not apply toothpaste, ice, butter, oil, or turmeric powder, as these trap heat and increase infection risk.",
      "Remove rings, watches, or bracelets gently before swelling develops.",
      "Cover loosely with sterile non-stick gauze and seek medical care for blisters or deep burns."
    ],
    hi: [
      "जले हुए भाग को तुरंत 15 से 20 मिनट तक ठंडे बहते नल के पानी के नीचे रखें।",
      "टूथपेस्ट, बर्फ, मक्खन, तेल या हल्दी न लगाएं क्योंकि इनसे संक्रमण का खतरा बढ़ता है।",
      "सूजन आने से पहले अंगूठी या घड़ी धीरे से उतार दें।",
      "साफ जालीदार पट्टी से हल्का ढकें और छाले पड़ने पर डॉक्टर को दिखाएं।"
    ]
  },
  {
    label: "Airway Choking",
    en: [
      "If the person can cough forcefully or speak, encourage continued coughing without interfering.",
      "If unable to breathe or speak: stand behind, lean them forward, and give 5 firm back blows between shoulder blades.",
      "Deliver 5 upward abdominal thrusts just above the navel.",
      "Alternate 5 back blows and 5 thrusts until cleared; dial 112 immediately if the person loses consciousness."
    ],
    hi: [
      "यदि व्यक्ति ज़ोर से खांस पा रहा है, तो उसे खांसते रहने दें।",
      "सांस बंद होने पर पीछे खड़े होकर कंधों के बीच हथेली से 5 बार तेज़ थपकी दें।",
      "नाभि के ठीक ऊपर मुट्ठी रखकर अंदर और ऊपर की ओर 5 झटके दें।",
      "अवरोध हटने तक यह क्रम दोहराएं और तुरंत 112 पर कॉल करें।"
    ]
  },
  {
    label: "Snakebite Response",
    en: [
      "Keep the patient calm and completely still; physical movement accelerates venom spread.",
      "Immobilize the affected limb loosely below heart level.",
      "Never cut the wound, attempt suction, apply ice, or tie a tight arterial tourniquet.",
      "Call 108 immediately and transport directly to a hospital equipped with Anti-Snake Venom (ASV)."
    ],
    hi: [
      "मरीज़ को शांत और स्थिर लिटाएं; चलने-फिरने से विष तेज़ी से फैलता है।",
      "प्रभावित अंग को स्थिर रखें। घाव पर चीरा न लगाएं और न ही कसकर रस्सी बांधें।",
      "झाड़-फूंक में समय न गंवाएं; तुरंत 108 कॉल कर नजदीकी सरकारी अस्पताल ले जाएं।"
    ]
  }
];

async function callBackend(endpoint, options = {}) {
  const t0 = performance.now();
  const res = await fetch(endpoint, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const ms = Math.max(1, Math.round(performance.now() - t0));
  const data = await res.json();

  document.getElementById("api-telemetry").textContent =
    `${options.method || "GET"} ${endpoint} (${res.status} in ${ms}ms)`;
  document.getElementById("api-json-preview").textContent =
    JSON.stringify(data, null, 2);

  return data;
}

function toggleApiDrawer() {
  document.getElementById("api-drawer").classList.toggle("open");
}

function switchTab(id, btn) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + id).classList.add("active");
  btn.classList.add("active");
}

function toggleLang() {
  currentLang = currentLang === "en" ? "hi" : "en";
  document.getElementById("lang-btn").textContent =
    currentLang === "en" ? "Hindi / English" : "Switch to English";
  renderAnalysis();
  renderBurnout();
  renderFirstAid(activeAidIdx);
}

function loadSample(key) {
  document.getElementById("rx-input").value = SAMPLES[key];
  runAnalyzeApi();
}

async function runAnalyzeApi() {
  const text = document.getElementById("rx-input").value.trim();
  if (!text) return;
  try {
    latestAnalysis = await callBackend("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ text })
    });
    renderAnalysis();
  } catch (err) {
    document.getElementById("rx-output").innerHTML =
      `<div class="result-card danger"><p>Request failed: ${err.message}</p></div>`;
  }
}

function renderAnalysis() {
  if (!latestAnalysis || !latestAnalysis.cards) return;
  const prio = latestAnalysis.priority;
  document.getElementById("rx-priority").innerHTML = `
    <div class="priority-bar">
      <span>${currentLang === "en" ? prio.en : prio.hi}</span>
      <span>${latestAnalysis.itemCount} items matched</span>
    </div>
  `;

  document.getElementById("rx-output").innerHTML = latestAnalysis.cards
    .map(c => {
      const cls = c.severity === "normal" ? "" : c.severity;
      const title = currentLang === "en" ? c.enTitle : c.hiTitle;
      const body = currentLang === "en" ? c.enBody : c.hiBody;
      return `
        <div class="result-card ${cls}">
          <div class="card-head">
            <h4>${title}</h4>
            <span class="tag-label">${c.badge}</span>
          </div>
          <p>${body}</p>
        </div>
      `;
    })
    .join("");
}

function speakSummary() {
  if (!("speechSynthesis" in window)) {
    alert("Audio synthesis is not supported in this browser.");
    return;
  }
  if (!latestAnalysis || !latestAnalysis.cards) return;
  window.speechSynthesis.cancel();
  const fullText = latestAnalysis.cards
    .map(c => {
      const t = currentLang === "en" ? c.enTitle : c.hiTitle;
      const b = currentLang === "en" ? c.enBody : c.hiBody;
      return `${t}. ${b}`;
    })
    .join(" ");
  const utter = new SpeechSynthesisUtterance(fullText);
  utter.lang = currentLang === "hi" ? "hi-IN" : "en-IN";
  utter.rate = 0.96;
  window.speechSynthesis.speak(utter);
}

function previewSliders() {
  document.getElementById("lbl-sleep").textContent = `${document.getElementById("in-sleep").value} hrs`;
  document.getElementById("lbl-study").textContent = `${document.getElementById("in-study").value} hrs`;
  document.getElementById("lbl-stress").textContent = `${document.getElementById("in-stress").value} / 10`;
  document.getElementById("lbl-water").textContent = `${document.getElementById("in-water").value} glasses`;
}

async function runBurnoutApi() {
  previewSliders();
  const payload = {
    sleep: Number(document.getElementById("in-sleep").value),
    study: Number(document.getElementById("in-study").value),
    stress: Number(document.getElementById("in-stress").value),
    water: Number(document.getElementById("in-water").value)
  };
  latestBurnout = await callBackend("/api/burnout", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  renderBurnout();
}

function renderBurnout() {
  if (!latestBurnout) return;
  const sEl = document.getElementById("burnout-score");
  sEl.textContent = `${latestBurnout.score} / 100`;
  sEl.style.color = latestBurnout.color;
  document.getElementById("burnout-summary").textContent =
    currentLang === "en" ? latestBurnout.enSummary : latestBurnout.hiSummary;

  document.getElementById("burnout-actions").innerHTML = latestBurnout.actions
    .map((a, i) => `
      <div class="result-card">
        <div class="card-head"><h4>Action Step ${i + 1}</h4></div>
        <p>${currentLang === "en" ? a.en : a.hi}</p>
      </div>
    `)
    .join("");
}

function toggleBreathing() {
  const orb = document.getElementById("breath-orb");
  const stepEl = document.getElementById("breath-step");
  const btn = document.getElementById("breath-btn");

  if (breathInterval) {
    clearInterval(breathInterval);
    breathInterval = null;
    orb.classList.remove("active-phase");
    orb.textContent = "Ready";
    stepEl.textContent = "Timer stopped";
    btn.textContent = "Start 4-Second Pacer";
    return;
  }

  const phases = [
    { text: "Inhale (4s)", active: true },
    { text: "Hold (4s)", active: true },
    { text: "Exhale (4s)", active: false },
    { text: "Rest (4s)", active: false }
  ];
  let step = 0;
  btn.textContent = "Stop Pacer";
  const tick = () => {
    const p = phases[step % 4];
    orb.textContent = p.text;
    stepEl.textContent = `Interval ${(step % 4) + 1} of 4`;
    orb.classList.toggle("active-phase", p.active);
    step++;
  };
  tick();
  breathInterval = setInterval(tick, 4000);
}

async function loadCommunityFeed() {
  const data = await callBackend("/api/community", { method: "GET" });
  renderCommunityPosts(data.posts || []);
}

function renderCommunityPosts(posts) {
  const box = document.getElementById("community-feed");
  if (!posts.length) {
    box.innerHTML = `<div class="result-card"><p>No active notices posted in this session yet. Use the form on the left to publish the first notice.</p></div>`;
    return;
  }
  box.innerHTML = posts
    .map(p => `
      <div class="post-card">
        <div class="post-meta">
          <strong>[${p.tag}] ${p.author}</strong>
          <span>${new Date(p.createdAt).toLocaleTimeString()}</span>
        </div>
        <h4 style="font-size:14px; margin-bottom:4px;">${p.title}</h4>
        <p style="font-size:13px; color:#27272a; margin-bottom:8px;">${p.body}</p>
        <button class="btn btn-outline" style="padding:4px 9px; font-size:12px;" onclick="upvotePost('${p.id}')">
          Confirm Helpful (${p.upvotes})
        </button>
      </div>
    `)
    .join("");
}

async function submitCommunityPost() {
  const author = document.getElementById("post-author").value.trim();
  const tag = document.getElementById("post-tag").value;
  const title = document.getElementById("post-title").value.trim();
  const body = document.getElementById("post-body").value.trim();
  if (!title || !body) {
    alert("Enter both a title and details before posting.");
    return;
  }
  const data = await callBackend("/api/community", {
    method: "POST",
    body: JSON.stringify({ author, tag, title, body })
  });
  if (data.ok) {
    document.getElementById("post-title").value = "";
    document.getElementById("post-body").value = "";
    renderCommunityPosts(data.posts);
  }
}

async function upvotePost(id) {
  const data = await callBackend("/api/community", {
    method: "POST",
    body: JSON.stringify({ action: "upvote", id })
  });
  if (data.ok) renderCommunityPosts(data.posts);
}

function renderFirstAid(i) {
  activeAidIdx = i;
  document.getElementById("aid-buttons").innerHTML = FIRST_AID.map(
    (item, idx) => `<button class="aid-btn ${idx === i ? "active" : ""}" onclick="renderFirstAid(${idx})">${item.label}</button>`
  ).join("");

  const list = currentLang === "en" ? FIRST_AID[i].en : FIRST_AID[i].hi;
  document.getElementById("aid-steps").innerHTML = list
    .map((line, idx) => `
      <div class="result-card">
        <div class="card-head"><h4>Step ${idx + 1}</h4></div>
        <p>${line}</p>
      </div>
    `)
    .join("");
}

let meds = JSON.parse(localStorage.getItem("medisetu_pulse_meds") || "null") || [
  { name: "Iron + Folic Acid Tablet (after lunch with water)", slot: "Afternoon (After Lunch)", done: false },
  { name: "Weekly Cholecalciferol 60K Sachet (with milk)", slot: "Night (After Dinner)", done: false }
];

function renderMeds() {
  localStorage.setItem("medisetu_pulse_meds", JSON.stringify(meds));
  const done = meds.filter(m => m.done).length;
  document.getElementById("med-counter").textContent = `${done}/${meds.length}`;
  if (!meds.length) {
    document.getElementById("med-list").innerHTML = `<div class="result-card"><p>No items in checklist. Add a supplement or water reminder on the left.</p></div>`;
    return;
  }
  document.getElementById("med-list").innerHTML = meds
    .map((m, idx) => `
      <div class="med-item ${m.done ? "done" : ""}" onclick="toggleMed(${idx})">
        <div>
          <span class="med-check"></span><strong>${m.name}</strong>
          <div style="font-size:12px; color:#52525b; padding-left:22px;">${m.slot}</div>
        </div>
        <button class="btn btn-outline" style="padding:3px 8px; font-size:12px;" onclick="event.stopPropagation(); removeMed(${idx})">Remove</button>
      </div>
    `)
    .join("");
}

function addMedItem() {
  const input = document.getElementById("med-name");
  const slot = document.getElementById("med-slot").value;
  if (!input.value.trim()) return;
  meds.push({ name: input.value.trim(), slot, done: false });
  input.value = "";
  renderMeds();
}

function toggleMed(i) {
  meds[i].done = !meds[i].done;
  renderMeds();
}

function removeMed(i) {
  meds.splice(i, 1);
  renderMeds();
}

(async function init() {
  await callBackend("/api/health", { method: "GET" });
  loadSample("anemia");
  await runBurnoutApi();
  await loadCommunityFeed();
  renderFirstAid(0);
  renderMeds();
})();
