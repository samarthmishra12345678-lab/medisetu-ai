let currentLang = "en";
let lastSpokenSummary = "";
let breathTimer = null;

const SAMPLES = {
  anemia: "Student Name: Aarav (Age 16)\nHemoglobin (Hb): 9.8 g/dL\nVitamin D3 (25-OH): 11.4 ng/mL\nPlatelets: 2,40,000 /uL\nRx: Tab Iron + Folic Acid OD PC, Sachet Cholecalciferol 60K once weekly.",
  rx: "Rx:\n1. Tab Paracetamol 500mg SOS (if temp > 100.4 F)\n2. Tab Pantoprazole 40mg OD BBF x 5 days\n3. Tab Cetirizine 10mg HS x 3 days\nPlenty of ORS & warm fluids.",
  sugar: "Fasting Blood Glucose (FBS): 148 mg/dL\nHbA1c: 7.1%\nTotal Cholesterol: 228 mg/dL\nRx: Tab Metformin 500mg BD PC, 30 mins brisk walk daily."
};

const RULES = [
  {
    match: /hb\b|hemoglobin/i,
    checkLow: /(\b[5-9]\.\d|\b1[01]\.\d)/,
    enTitle: "🩸 Hemoglobin (Hb) — Oxygen Carrier",
    hiTitle: "🩸 हीमोग्लोबिन (Hb) — खून की मात्रा",
    enLow: "Slightly low (< 12 g/dL). Causes tiredness & poor study focus. Eat spinach, dates, jaggery (gud), chana & vitamin-C rich fruits.",
    hiLow: "सामान्य से कम है — इससे थकान और पढ़ाई में सुस्ती हो सकती है। पालक, खजूर, गुड़, चना और नींबू/आंवला आहार में शामिल करें।",
    enOk: "Hemoglobin mentioned — supports oxygen delivery across the body.",
    hiOk: "हीमोग्लोबिन शरीर में ऑक्सीजन पहुँचाने का काम करता है।"
  },
  {
    match: /vitamin\s*d|cholecalciferol/i,
    checkLow: /(\b\d\.\d|\b1\d(\.\d)?)\s*ng/i,
    enTitle: "☀️ Vitamin D3 Status",
    hiTitle: "☀️ विटामिन D3 स्तर",
    enLow: "Deficient (< 20 ng/mL) — very common in students studying indoors! Causes bone/back ache & low energy. Take prescribed weekly 60K dose with milk + 15 min morning sunlight.",
    hiLow: "काफी कम (< 20 ng/mL) है — दिनभर कमरे में पढ़ाई करने वाले छात्रों में आम है। सुबह 15 मिनट धूप लें और डॉक्टर की साप्ताहिक दवा दूध के साथ लें।",
    enOk: "Vitamin D3 supplement detected — take with milk/food for better absorption.",
    hiOk: "विटामिन D3 सप्लीमेंट — बेहतर असर के लिए दूध या भोजन के साथ लें।"
  },
  {
    match: /paracetamol|dolo|crocin/i,
    enTitle: "🌡️ Paracetamol 500mg (Fever & Pain Relief)",
    hiTitle: "🌡️ पैरासिटामोल 500mg (बुखार और दर्द के लिए)",
    enOk: "Take ONLY when fever > 100°F or headache ('SOS' = as needed). Keep at least a 6-hour gap between two doses.",
    hiOk: "केवल बुखार या दर्द होने पर ही लें ('SOS' = ज़रूरत पड़ने पर)। दो खुराक के बीच कम से कम 6 घंटे का अंतर रखें।"
  },
  {
    match: /pantoprazole|pan\s*40|omeprazole/i,
    enTitle: "🛡️ Pantoprazole 40mg (Stomach Protector)",
    hiTitle: "🛡️ पैंटोप्राज़ोल 40mg (एसिडिटी से बचाव)",
    enOk: "'OD BBF' means Once Daily, 30 minutes BEFORE Breakfast on an empty stomach.",
    hiOk: "'OD BBF' का मतलब है दिन में एक बार, सुबह नाश्ते से 30 मिनट पहले खाली पेट लें।"
  },
  {
    match: /cetirizine|levocetirizine/i,
    enTitle: "🤧 Cetirizine 10mg (Cold / Allergy Relief)",
    hiTitle: "🤧 सेटिरिज़िन 10mg (सर्दी-ज़ुकाम / एलर्जी)",
    enOk: "'HS' means take at Bedtime — may cause mild drowsiness (avoid studying late right after taking).",
    hiOk: "'HS' का मतलब रात को सोते समय लें — इससे हल्की नींद आ सकती है।"
  },
  {
    match: /hba1c|fasting blood|fbs|metformin/i,
    enTitle: "🩸 Blood Sugar & Metabolic Marker (FBS / HbA1c)",
    hiTitle: "🩸 ब्लड शुगर जांच (FBS / HbA1c)",
    enOk: "'BD PC' means Twice Daily AFTER meals. Reduce refined sugar/juices and include a 30-minute daily walk.",
    hiOk: "'BD PC' का मतलब दिन में दो बार खाने के बाद। मीठा कम करें और रोज़ 30 मिनट तेज़ पैदल चलें।",
    warn: true
  }
];

const FIRST_AID = [
  {
    id: "faint",
    label: "😵 Fainting / Heatstroke",
    enSteps: [
      "Lay the person flat on their back in a cool, ventilated shade.",
      "Elevate both legs 12 inches above heart level to restore brain blood flow.",
      "Loosen tight school collar/tie/belt. Do NOT pour water into an unconscious mouth.",
      "Once fully awake, give sips of ORS / lemon-salt-sugar water."
    ],
    hiSteps: [
      "व्यक्ति को तुरंत ठंडी और हवादार जगह पर पीठ के बल लिटा दें।",
      "दोनों पैरों को दिल के स्तर से लगभग 1 फुट ऊपर उठाएं ताकि दिमाग तक रक्त पहुंचे।",
      "कॉलर, टाई या बेल्ट ढीला करें। बेहोशी की हालत में मुंह में पानी बिल्कुल न डालें।",
      "होश आने के बाद धीरे-धीरे ORS घोल पिलाएं।"
    ]
  },
  {
    id: "burn",
    label: "🔥 Minor / Kitchen Burn",
    enSteps: [
      "Hold burned area under cool running tap water for 15–20 minutes immediately.",
      "NEVER apply toothpaste, butter, ice, or turmeric — they trap heat and cause infection!",
      "Remove rings/watches gently before swelling begins.",
      "Cover loosely with sterile non-stick gauze; visit clinic if blisters are large."
    ],
    hiSteps: [
      "जले हुए हिस्से को तुरंत 15–20 मिनट तक ठंडे बहते नल के पानी के नीचे रखें।",
      "टूथपेस्ट, बर्फ, मक्खन या हल्दी बिल्कुल न लगाएं — इससे इंफेक्शन बढ़ता है!",
      "सूजन आने से पहले अंगूठी या घड़ी धीरे से उतार दें।",
      "साफ सूती पट्टी से हल्का ढकें और छाले बड़े हों तो डॉक्टर को दिखाएं।"
    ]
  },
  {
    id: "choke",
    label: "🫁 Choking Emergency",
    enSteps: [
      "Ask 'Are you choking?' If they can cough forcefully, encourage coughing.",
      "If unable to breathe/speak: stand behind, lean them forward, give 5 sharp back blows between shoulder blades.",
      "Give 5 upward abdominal thrusts (Heimlich maneuver) just above the navel.",
      "Repeat 5 blows + 5 thrusts until object clears; call 112 immediately if unresponsive."
    ],
    hiSteps: [
      "पूछें 'क्या गले में कुछ फंसा है?' यदि व्यक्ति खांस पा रहा है, तो ज़ोर से खांसने दें।",
      "सांस न ले पाने पर पीछे खड़े होकर कंधों के बीच हथेली से 5 बार तेज़ थपकी दें।",
      "नाभि के ठीक ऊपर मुट्ठी रखकर अंदर और ऊपर की ओर 5 झटके (Heimlich) दें।",
      "तुरंत 112 / 108 पर कॉल करें।"
    ]
  }
];

function switchTab(id, btn) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + id).classList.add("active");
  btn.classList.add("active");
}

function toggleLang() {
  currentLang = currentLang === "en" ? "hi" : "en";
  document.getElementById("lang-btn").textContent =
    currentLang === "en" ? "🌐 हिन्दी / Hinglish" : "🌐 Switch to English";
  analyzeReport();
  updateWellness();
  renderFirstAid(activeAidIndex);
}

function loadSample(key) {
  document.getElementById("rx-input").value = SAMPLES[key];
  analyzeReport();
}

function analyzeReport() {
  const raw = document.getElementById("rx-input").value.trim();
  const out = document.getElementById("rx-output");
  if (!raw) {
    out.innerHTML = `<div class="result-item"><p>Select a sample chip on the left or paste any prescription text to see instant simplification.</p></div>`;
    return;
  }

  let items = [];
  RULES.forEach(r => {
    if (r.match.test(raw)) {
      const isLow = r.checkLow && r.checkLow.test(raw);
      items.push({
        title: currentLang === "en" ? r.enTitle : r.hiTitle,
        body: isLow
          ? (currentLang === "en" ? r.enLow : r.hiLow)
          : (currentLang === "en" ? r.enOk : r.hiOk),
        cls: isLow || r.warn ? "warn" : ""
      });
    }
  });

  // Decode shorthand codes automatically
  const codes = [];
  if (/\bOD\b/i.test(raw)) codes.push("OD = Once a day");
  if (/\bBD\b/i.test(raw)) codes.push("BD = Twice a day");
  if (/\bTDS\b/i.test(raw)) codes.push("TDS = 3 times a day");
  if (/\bBBF\b/i.test(raw)) codes.push("BBF = Before breakfast (empty stomach)");
  if (/\bPC\b/i.test(raw)) codes.push("PC = After meals");
  if (/\bSOS\b/i.test(raw)) codes.push("SOS = Only when needed");
  if (/\bHS\b/i.test(raw)) codes.push("HS = At bedtime");

  if (codes.length > 0) {
    items.push({
      title: currentLang === "en" ? "📋 Doctor Shorthand Decoded" : "📋 डॉक्टर के शॉर्ट-कोड का मतलब",
      body: codes.join("  •  "),
      cls: ""
    });
  }

  if (items.length === 0) {
    items.push({
      title: "📄 Custom Note Detected",
      body: "Follow exact dosage timing prescribed by your physician and complete the full course.",
      cls: ""
    });
  }

  lastSpokenSummary = items.map(i => `${i.title.replace(/[^\w\s\u0900-\u097F]/g, "")}: ${i.body}`).join(". ");
  out.innerHTML = items
    .map(i => `<div class="result-item ${i.cls}"><h4>${i.title}</h4><p>${i.body}</p></div>`)
    .join("");
}

function speakSummary() {
  if (!("speechSynthesis" in window)) return alert("Speech synthesis not supported in this browser.");
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(lastSpokenSummary || "Please analyze a report first.");
  u.lang = currentLang === "hi" ? "hi-IN" : "en-IN";
  u.rate = 0.96;
  window.speechSynthesis.speak(u);
}

function updateWellness() {
  const sleep = parseFloat(document.getElementById("in-sleep").value);
  const study = parseInt(document.getElementById("in-study").value, 10);
  const stress = parseInt(document.getElementById("in-stress").value, 10);

  document.getElementById("val-sleep").textContent = `${sleep} hrs`;
  document.getElementById("val-study").textContent = `${study} hrs`;
  document.getElementById("val-stress").textContent = `${stress} / 10`;

  let score = 100;
  if (sleep < 7) score -= (7 - sleep) * 9;
  if (study > 8) score -= (study - 8) * 4;
  score -= (stress - 2) * 4.5;
  score = Math.max(12, Math.min(98, Math.round(score)));

  const scoreEl = document.getElementById("wellness-score");
  const statusEl = document.getElementById("wellness-status");
  scoreEl.textContent = `${score} / 100`;

  let tip = "";
  if (score >= 75) {
    scoreEl.style.color = "#0f766e";
    statusEl.textContent = currentLang === "en" ? "✅ Healthy Study Rhythm!" : "✅ बेहतरीन संतुलन!";
    tip = currentLang === "en"
      ? "Keep using 50-minute Pomodoro blocks with 10-minute eye breaks and 2.5L hydration."
      : "हर 50 मिनट की पढ़ाई के बाद 10 मिनट आँखों को आराम दें और पर्याप्त पानी पिएं।";
  } else if (score >= 50) {
    scoreEl.style.color = "#d97706";
    statusEl.textContent = currentLang === "en" ? "⚠️ Moderate Exam Fatigue" : "⚠️ मध्यम थकान — ब्रेक ज़रूरी";
    tip = currentLang === "en"
      ? "Memory consolidation drops sharply under 6.5h sleep! Take a 20-min power nap & run 1 minute of Box Breathing."
      : "कम नींद से याददाश्त कमज़ोर होती है! 20 मिनट आराम करें और बगल में दिया गया ब्रीदिंग व्यायाम करें।";
  } else {
    scoreEl.style.color = "#dc2626";
    statusEl.textContent = currentLang === "en" ? "🚨 High Burnout Risk!" : "🚨 हाई बर्नआउट रिस्क — तुरंत आराम करें!";
    tip = currentLang === "en"
      ? "Stop screen study right now, hydrate, sleep at least 7.5 hours tonight, and talk to a parent/friend or call 14416."
      : "अभी स्क्रीन बंद करें, पानी पिएं और पूरी नींद लें। किसी भी तनाव में निःशुल्क हेल्पलाइन 14416 पर बात करें।";
  }
  document.getElementById("wellness-tips").innerHTML = `<div class="result-item"><h4>Action Plan</h4><p>${tip}</p></div>`;
}

function toggleBreathing() {
  const box = document.getElementById("breath-box");
  const inst = document.getElementById("breath-instruction");
  const btn = document.getElementById("breath-btn");

  if (breathTimer) {
    clearInterval(breathTimer);
    breathTimer = null;
    box.classList.remove("expand");
    box.textContent = "Tap Start";
    inst.textContent = "Session paused";
    btn.textContent = "▶ Start 60s Calm Session";
    return;
  }

  const phases = [
    { label: "Inhale (4s)", expand: true },
    { label: "Hold (4s)", expand: true },
    { label: "Exhale (4s)", expand: false },
    { label: "Hold (4s)", expand: false }
  ];
  let idx = 0;
  btn.textContent = "⏹ Stop Session";
  const step = () => {
    const p = phases[idx % 4];
    box.textContent = p.label;
    inst.textContent = `Step ${(idx % 4) + 1} of 4 — Breathe slowly`;
    box.classList.toggle("expand", p.expand);
    idx++;
  };
  step();
  breathTimer = setInterval(step, 4000);
}

let activeAidIndex = 0;
function renderFirstAid(i) {
  activeAidIndex = i;
  document.getElementById("aid-buttons").innerHTML = FIRST_AID.map(
    (item, idx) => `<button class="aid-btn ${idx === i ? "active" : ""}" onclick="renderFirstAid(${idx})">${item.label}</button>`
  ).join("");

  const steps = currentLang === "en" ? FIRST_AID[i].enSteps : FIRST_AID[i].hiSteps;
  document.getElementById("aid-details").innerHTML = steps
    .map((s, n) => `<div class="result-item"><h4>Step ${n + 1}</h4><p>${s}</p></div>`)
    .join("");
}

let meds = JSON.parse(localStorage.getItem("medisetu_meds") || "null") || [
  { name: "Vitamin D3 Sachet (with Milk)", time: "🌅 Morning (Before Breakfast)", done: true },
  { name: "Iron + Folic Acid Tablet", time: "☀️ Afternoon (After Lunch)", done: false },
  { name: "2 Glasses ORS / Lemon Water", time: "🌙 Night (After Dinner)", done: false }
];

function renderMeds() {
  localStorage.setItem("medisetu_meds", JSON.stringify(meds));
  const doneCount = meds.filter(m => m.done).length;
  document.getElementById("med-progress").textContent = `${doneCount}/${meds.length}`;
  document.getElementById("med-list").innerHTML = meds
    .map(
      (m, idx) => `
      <div class="med-row ${m.done ? "done" : ""}" onclick="toggleMed(${idx})" style="cursor:pointer;">
        <div>
          <strong>${m.done ? "✅" : "⬜"} ${m.name}</strong>
          <div style="font-size:12px; color:#64748b;">${m.time}</div>
        </div>
        <button class="btn btn-outline" style="padding:4px 9px; font-size:12px;" onclick="event.stopPropagation(); deleteMed(${idx})">✕</button>
      </div>`
    )
    .join("");
}

function addMed() {
  const nameInput = document.getElementById("med-name");
  const timeInput = document.getElementById("med-time");
  if (!nameInput.value.trim()) return;
  meds.push({ name: nameInput.value.trim(), time: timeInput.value, done: false });
  nameInput.value = "";
  renderMeds();
}

function toggleMed(i) {
  meds[i].done = !meds[i].done;
  renderMeds();
}

function deleteMed(i) {
  meds.splice(i, 1);
  renderMeds();
}

// Init defaults immediately on load
loadSample("anemia");
updateWellness();
renderFirstAid(0);
renderMeds();
