module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, app: 'GOONIVERSITY', owner: 'Luzzi' }));
};
