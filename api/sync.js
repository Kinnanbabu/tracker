// Vercel Serverless Function: Cloud State Sync via Vercel KV / Upstash Redis
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const room = (req.query.room || (req.body && req.body.room) || 'DEFAULT').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  const cacheKey = `goalquest_room_${room}`;

  if (!kvUrl || !kvToken) {
    return res.status(200).json({
      success: false,
      configured: false,
      message: 'Vercel KV is not connected yet.'
    });
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(kvUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['GET', cacheKey])
      });
      const data = await response.json();
      let state = null;
      if (data && data.result) {
        state = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
      return res.status(200).json({ success: true, configured: true, room, data: state });
    }

    if (req.method === 'POST') {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try { bodyData = JSON.parse(bodyData); } catch (e) {}
      }
      const stateToSave = bodyData.data || bodyData;
      await fetch(kvUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', cacheKey, JSON.stringify(stateToSave)])
      });
      return res.status(200).json({ success: true, configured: true, room });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
