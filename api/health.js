module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  res.statusCode = 200;
  return res.end(
    JSON.stringify({
      ok: true,
      service: "MediSetu Backend API",
      version: "2.1.0",
      node: process.version,
      timestamp: new Date().toISOString(),
      endpoints: [
        "GET /api/health",
        "POST /api/analyze",
        "POST /api/burnout",
        "GET /api/community",
        "POST /api/community"
      ]
    })
  );
};
