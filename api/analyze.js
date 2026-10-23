function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

const BIOMARKERS = [
  {
    id: "hb",
    regex: /(?:hemoglobin|haemoglobin|\bhb\b)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
    unit: "g/dL",
    normalMin: 12.0,
    normalMax: 16.5,
    enName: "Hemoglobin (Hb)",
    hiName: "हीमोग्लोबिन (Hb)",
    lowEn: "Below reference range (12.0 to 16.5 g/dL). Low levels can cause fatigue, dizziness, and reduced concentration. Include iron-rich foods (spinach, dates, jaggery, roasted chana, pomegranate) paired with Vitamin C.",
    lowHi: "सामान्य सीमा (12.0 से 16.5 g/dL) से कम है। इससे थकान, चक्कर और ध्यान लगाने में कठिनाई हो सकती है। पालक, खजूर, गुड़, भुना चना और नींबू आहार में लें।",
    highEn: "Above reference range (> 16.5 g/dL), sometimes linked to dehydration. Drink adequate water and consult a physician.",
    highHi: "सामान्य से अधिक (> 16.5 g/dL) है। पर्याप्त पानी पिएं और डॉक्टर से परामर्श लें।",
    okEn: "Within normal reference range (12.0 to 16.5 g/dL).",
    okHi: "सामान्य संदर्भ सीमा (12.0 से 16.5 g/dL) में है।"
  },
  {
    id: "vitd",
    regex: /(?:vitamin\s*d3?|vit\s*d3?|25-oh)\s*(?:\([^)]*\))?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
    unit: "ng/mL",
    normalMin: 30.0,
    normalMax: 100.0,
    enName: "Vitamin D3 (25-OH)",
    hiName: "विटामिन D3 (25-OH)",
    lowEn: "Below sufficient range (< 30 ng/mL), common in students spending long hours indoors. Associated with muscle ache and fatigue. Get 15 minutes of morning sunlight and take prescribed weekly Vitamin D3 with milk.",
    lowHi: "पर्याप्त स्तर (< 30 ng/mL) से कम है। सुबह 15 मिनट धूप लें और डॉक्टर द्वारा दी गई साप्ताहिक खुराक दूध के साथ लें।",
    highEn: "Above upper reference limit (> 100 ng/mL). Pause unprescribed supplements and review with a doctor.",
    highHi: "अधिकतम सीमा (> 100 ng/mL) से ऊपर है। अतिरिक्त सप्लीमेंट रोककर डॉक्टर को दिखाएं।",
    okEn: "Within sufficient reference range (30 to 100 ng/mL).",
    okHi: "विटामिन D3 पर्याप्त सीमा (30 से 100 ng/mL) में है।"
  },
  {
    id: "fbs",
    regex: /(?:fasting\s*(?:blood\s*)?(?:glucose|sugar)|\bfbs\b)\s*(?:\([^)]*\))?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
    unit: "mg/dL",
    normalMin: 70,
    normalMax: 99,
    enName: "Fasting Blood Glucose (FBS)",
    hiName: "फास्टिंग ब्लड शुगर (FBS)",
    lowEn: "Below 70 mg/dL (hypoglycemia warning). Take fast-acting carbohydrates or fruit juice if experiencing shakiness or sweating.",
    lowHi: "70 mg/dL से कम है। घबराहट या पसीना आने पर तुरंत ग्लूकोज या फलों का रस लें।",
    highEn: "Above normal fasting range (> 99 mg/dL). Limit refined sugar, add a 30-minute daily walk, and follow your doctor's plan.",
    highHi: "सामान्य फास्टिंग सीमा (> 99 mg/dL) से अधिक है। मीठा कम करें, रोज़ 30 मिनट टहलें और डॉक्टर की सलाह लें।",
    okEn: "Within normal fasting range (70 to 99 mg/dL).",
    okHi: "सामान्य फास्टिंग सीमा (70 से 99 mg/dL) में है।"
  },
  {
    id: "hba1c",
    regex: /(?:hba1c|a1c)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
    unit: "%",
    normalMin: 4.0,
    normalMax: 5.6,
    enName: "HbA1c (3-Month Glucose Average)",
    hiName: "HbA1c (3 महीने का औसत शुगर)",
    lowEn: "Below typical reference range (< 4.0%). Verify with a physician.",
    lowHi: "सामान्य सीमा (< 4.0%) से कम है। डॉक्टर से जांच कराएं।",
    highEn: "Above 5.6% (5.7% to 6.4% indicates prediabetes; 6.5% or above indicates diabetes range). Maintain regular meals, physical activity, and prescribed therapy.",
    highHi: "5.6% से अधिक है। नियमित संतुलित भोजन, व्यायाम और डॉक्टर द्वारा दी गई दवा समय पर लें।",
    okEn: "Within normal 3-month reference range (4.0% to 5.6%).",
    okHi: "पिछले 3 महीने का शुगर स्तर सामान्य (4.0% से 5.6%) है।"
  },
  {
    id: "platelets",
    regex: /platelets?\s*[:=-]?\s*([\d,]+)/i,
    unit: "/uL",
    normalMin: 150000,
    normalMax: 450000,
    enName: "Platelet Count",
    hiName: "प्लेटलेट काउंट",
    lowEn: "Below 150,000 /uL. Avoid self-medicating with Ibuprofen or Aspirin during fever, stay hydrated, and consult a physician promptly.",
    lowHi: "1,50,000 /uL से कम है। बुखार में बिना डॉक्टर की सलाह के दर्द निवारक दवा (Ibuprofen/Aspirin) न लें और डॉक्टर को दिखाएं।",
    highEn: "Above 450,000 /uL. Share report with a physician to check hydration or infection markers.",
    highHi: "4,50,000 /uL से अधिक है। डॉक्टर से रिपोर्ट की जांच कराएं।",
    okEn: "Within standard reference range (150,000 to 450,000 /uL).",
    okHi: "सामान्य सीमा (1,50,000 से 4,50,000 /uL) में है।"
  }
];

const MED_RULES = [
  {
    match: /paracetamol|acetaminophen|dolo|crocin/i,
    enTitle: "Paracetamol (Antipyretic / Analgesic)",
    hiTitle: "पैरासिटामोल (बुखार और दर्द के लिए)",
    enBody: "Use when fever exceeds 100 F or for body ache. Keep at least a 6-hour interval between consecutive doses.",
    hiBody: "बुखार या दर्द होने पर लें। दो खुराक के बीच कम से कम 6 घंटे का अंतर रखें।"
  },
  {
    match: /pantoprazole|omeprazole|rabeprazole|pan[\s-]?40/i,
    enTitle: "Pantoprazole / Omeprazole (Gastric Protection)",
    hiTitle: "पैंटोप्राज़ोल / ओमेप्राज़ोल (एसिडिटी से बचाव)",
    enBody: "Swallow whole with water 30 minutes before breakfast on an empty stomach.",
    hiBody: "सुबह नाश्ते से 30 मिनट पहले खाली पेट सादे पानी के साथ निगलें।"
  },
  {
    match: /iron|ferrous|folic\s*acid/i,
    enTitle: "Iron + Folic Acid Supplement",
    hiTitle: "आयरन और फोलिक एसिड सप्लीमेंट",
    enBody: "Pair with Vitamin C or lemon water for higher absorption. Keep a 1.5-hour gap from tea, coffee, or milk.",
    hiBody: "बेहतर अवशोषण के लिए नींबू पानी के साथ लें। चाय, कॉफी या दूध से 1.5 घंटे का अंतर रखें।",
    interactionFlag: true
  },
  {
    match: /cholecalciferol|60\s*k/i,
    enTitle: "Cholecalciferol 60K (Weekly Vitamin D3)",
    hiTitle: "कोलेकैल्सिफेरॉल 60K (साप्ताहिक विटामिन D3)",
    enBody: "Fat-soluble supplement: take once per week right after food or with milk.",
    hiBody: "हफ्ते में एक बार भोजन के तुरंत बाद या दूध के साथ लें।"
  },
  {
    match: /cetirizine|levocetirizine|montelukast/i,
    enTitle: "Cetirizine / Levocetirizine (Antihistamine)",
    hiTitle: "सेटिरिज़िन / लेवोसेटिरिज़िन (एलर्जी और जुकाम)",
    enBody: "Take at bedtime as it can cause mild daytime drowsiness during classes.",
    hiBody: "रात को सोते समय लें क्योंकि इससे दिन में हल्की सुस्ती आ सकती है।"
  },
  {
    match: /metformin|glimepiride/i,
    enTitle: "Metformin (Oral Antidiabetic)",
    hiTitle: "मेटफॉर्मिन (शुगर नियंत्रण)",
    enBody: "Take right after meals to minimize gastric discomfort.",
    hiBody: "पेट की असुविधा से बचने के लिए भोजन के तुरंत बाद लें।"
  },
  {
    match: /azithromycin|amoxicillin|augmentin|cefixime/i,
    enTitle: "Antibiotic Course",
    hiTitle: "एंटीबायोटिक कोर्स",
    enBody: "Complete every scheduled dose for the full number of prescribed days even if symptoms improve early.",
    hiBody: "आराम मिलने पर भी डॉक्टर द्वारा लिखे गए पूरे दिनों का कोर्स अवश्य पूरा करें।",
    interactionFlag: true
  }
];

const SHORTHAND = [
  { code: "OD", en: "Once daily", hi: "दिन में 1 बार" },
  { code: "BD", en: "Twice daily", hi: "दिन में 2 बार" },
  { code: "TDS", en: "Three times daily", hi: "दिन में 3 बार" },
  { code: "BBF", en: "30 mins before breakfast (empty stomach)", hi: "नाश्ते से 30 मिनट पहले खाली पेट" },
  { code: "PC", en: "After meals", hi: "भोजन के बाद" },
  { code: "AC", en: "Before meals", hi: "भोजन से पहले" },
  { code: "HS", en: "At bedtime", hi: "रात को सोते समय" },
  { code: "SOS", en: "Only when needed", hi: "केवल ज़रूरत पड़ने पर" },
  { code: "STAT", en: "Immediately", hi: "तुरंत पहली खुराक" }
];

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: "Method Not Allowed. Use POST." }));
  }

  const body = parseBody(req);
  const rawText = String(body.text || "").trim().slice(0, 4000);
  if (!rawText) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: "Prescription or lab text is required." }));
  }

  const cards = [];
  let attentionPoints = 0;

  for (const b of BIOMARKERS) {
    const m = rawText.match(b.regex);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (!Number.isNaN(val)) {
        if (val < b.normalMin) {
          attentionPoints += 25;
          cards.push({
            severity: "warn",
            badge: `LOW: ${val} ${b.unit}`,
            enTitle: b.enName,
            hiTitle: b.hiName,
            enBody: b.lowEn,
            hiBody: b.lowHi
          });
        } else if (val > b.normalMax) {
          attentionPoints += 25;
          cards.push({
            severity: "warn",
            badge: `HIGH: ${val} ${b.unit}`,
            enTitle: b.enName,
            hiTitle: b.hiName,
            enBody: b.highEn,
            hiBody: b.highHi
          });
        } else {
          cards.push({
            severity: "normal",
            badge: `NORMAL: ${val} ${b.unit}`,
            enTitle: b.enName,
            hiTitle: b.hiName,
            enBody: b.okEn,
            hiBody: b.okHi
          });
        }
      }
    }
  }

  for (const med of MED_RULES) {
    if (med.match.test(rawText)) {
      if (med.interactionFlag) attentionPoints += 10;
      cards.push({
        severity: med.interactionFlag ? "warn" : "normal",
        badge: med.interactionFlag ? "DOSING RULE" : "MEDICATION",
        enTitle: med.enTitle,
        hiTitle: med.hiTitle,
        enBody: med.enBody,
        hiBody: med.hiBody
      });
    }
  }

  const decoded = [];
  for (const s of SHORTHAND) {
    const rx = new RegExp(`\\b${s.code}\\b`, "i");
    if (rx.test(rawText)) {
      decoded.push({ code: s.code, en: s.en, hi: s.hi });
    }
  }
  if (decoded.length > 0) {
    cards.push({
      severity: "info",
      badge: `${decoded.length} TERMS DECODED`,
      enTitle: "Prescription Shorthand Reference",
      hiTitle: "डॉक्टर के संक्षिप्त शब्दों का अर्थ",
      enBody: decoded.map(d => `${d.code} = ${d.en}`).join(" | "),
      hiBody: decoded.map(d => `${d.code} = ${d.hi}`).join(" | ")
    });
  }

  if (/iron|ferrous/i.test(rawText) && /cholecalciferol|calcium|milk/i.test(rawText)) {
    attentionPoints += 15;
    cards.push({
      severity: "danger",
      badge: "TIMING SEPARATION ALERT",
      enTitle: "Separate Iron and Milk/Calcium Timing",
      hiTitle: "आयरन और दूध लेने के समय में अंतर रखें",
      enBody: "Calcium in milk reduces iron absorption significantly. Take your iron tablet after lunch with water, and take Vitamin D3 with milk at night.",
      hiBody: "दूध का कैल्शियम आयरन के अवशोषण को कम करता है। आयरन दोपहर के भोजन के बाद पानी से लें और विटामिन D3 रात को दूध के साथ लें।"
    });
  }

  if (cards.length === 0) {
    cards.push({
      severity: "info",
      badge: "NOTE PARSED",
      enTitle: "General Prescription Guidance",
      hiTitle: "सामान्य दवा निर्देश",
      enBody: "No standard lab biomarkers or abbreviations matched automatically. Verify exact dose timing directly with your doctor or pharmacist.",
      hiBody: "सटीक खुराक और समय के लिए अपने डॉक्टर या फार्मासिस्ट की सलाह का पालन करें।"
    });
  }

  const priority =
    attentionPoints >= 35
      ? { level: "high", en: "Review Flagged Values and Timing Rules", hi: "चिह्नित मान और दवा के समय पर विशेष ध्यान दें" }
      : attentionPoints >= 15
      ? { level: "medium", en: "Check Medication Timing Instructions", hi: "दवा लेने के निर्देशों की जांच करें" }
      : { level: "low", en: "Standard Reference Output", hi: "सामान्य संदर्भ विवरण" };

  res.statusCode = 200;
  return res.end(
    JSON.stringify({
      ok: true,
      analyzedAt: new Date().toISOString(),
      itemCount: cards.length,
      priority,
      cards
    })
  );
};
