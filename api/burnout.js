function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function clamp(v, min, max, fallback) {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

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
  const sleep = clamp(body.sleep, 2, 12, 6.5);
  const study = clamp(body.study, 1, 16, 8);
  const stress = clamp(body.stress, 1, 10, 6);
  const water = clamp(body.water, 1, 14, 6);

  let score = 100;
  if (sleep < 7.5) score -= (7.5 - sleep) * 9.5;
  if (sleep > 9.5) score -= (sleep - 9.5) * 4;
  if (study > 8) score -= (study - 8) * 4.2;
  score -= (stress - 1) * 4.2;
  if (water < 7) score -= (7 - water) * 2.5;

  score = Math.max(10, Math.min(99, Math.round(score)));

  let category, color, enSummary, hiSummary;
  if (score >= 75) {
    category = "optimal";
    color = "#0F766E";
    enSummary = "Balanced study and recovery schedule";
    hiSummary = "पढ़ाई और आराम का संतुलन सही है";
  } else if (score >= 50) {
    category = "moderate";
    color = "#B45309";
    enSummary = "Moderate fatigue detected: add short recovery breaks";
    hiSummary = "मध्यम थकान: छोटे आराम के अंतराल जोड़ें";
  } else {
    category = "high_risk";
    color = "#B91C1C";
    enSummary = "High sleep debt and fatigue: prioritize rest before study";
    hiSummary = "अधिक थकान और नींद की कमी: पहले पर्याप्त नींद लें";
  }

  const actions = [];
  if (sleep < 7) {
    actions.push({
      en: `Sleep duration is ${sleep} hours: schedule a 20-minute afternoon rest and aim for 7.5 hours tonight to support memory recall.`,
      hi: `नींद ${sleep} घंटे है: दोपहर में 20 मिनट आराम करें और रात में 7.5 घंटे की नींद का लक्ष्य रखें।`
    });
  }
  if (study >= 9) {
    actions.push({
      en: `Continuous study load is ${study} hours: break sessions into 50-minute intervals followed by 10 minutes away from screens.`,
      hi: `लगातार ${study} घंटे पढ़ाई: हर 50 मिनट के बाद 10 मिनट स्क्रीन से दूर टहलें।`
    });
  }
  if (water < 7) {
    actions.push({
      en: `Hydration is ${water} glasses today: add ${8 - water} more glasses of water across the afternoon and evening.`,
      hi: `आज ${water} गिलास पानी पिया है: शाम तक ${8 - water} गिलास पानी और पिएं।`
    });
  }
  if (stress >= 7) {
    actions.push({
      en: "Elevated exam stress reported: run four slow 4-4-4-4 breathing cycles before resuming problem practice.",
      hi: "तनाव अधिक है: पढ़ाई शुरू करने से पहले 1 मिनट तक धीमी 4-4-4-4 श्वास अभ्यास करें।"
    });
  }
  if (actions.length === 0) {
    actions.push({
      en: "Keep consistent wake times, 15 minutes of outdoor daylight, and regular meal hydration.",
      hi: "नियमित उठने का समय, सुबह 15 मिनट धूप और पर्याप्त पानी का क्रम बनाए रखें।"
    });
  }

  res.statusCode = 200;
  return res.end(
    JSON.stringify({
      ok: true,
      score,
      category,
      color,
      enSummary,
      hiSummary,
      inputs: { sleep, study, stress, water },
      actions
    })
  );
};
