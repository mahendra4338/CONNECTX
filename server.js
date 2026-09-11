const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const publicDir = path.join(__dirname, 'public');

const users = [
  { id: 'USR-1001', fullName: 'Anjali Nair', email: 'admin@connectx.in', phone: '+91 98765 43210', role: 'admin', passwordHash: crypto.createHash('sha256').update('connectx123').digest('hex') }
];
const otpChallenges = new Map();
const resetChallenges = new Map();

const workers = [
  { id: 1, name: 'Vishnu S.', skill: 'Electrician', cooperative: 'Kerala Federation', rating: 4.9, jobs: 184, status: 'available', verified: true, lat: 8.5241, lng: 76.9366, area: 'Thiruvananthapuram', color: '#176b67' },
  { id: 2, name: 'Latha P.', skill: 'Home cleaner', cooperative: 'Kudumbashree Unit 14', rating: 4.8, jobs: 126, status: 'on-job', verified: true, lat: 9.9312, lng: 76.2673, area: 'Kochi', color: '#d9694d' },
  { id: 3, name: 'Muhammed R.', skill: 'Plumber', cooperative: 'Malabar Labour Society', rating: 4.7, jobs: 98, status: 'available', verified: true, lat: 11.2588, lng: 75.7804, area: 'Kozhikode', color: '#e1a130' },
  { id: 4, name: 'Anita K.', skill: 'Caregiver', cooperative: 'Ernakulam Federation', rating: 5.0, jobs: 76, status: 'available', verified: true, lat: 9.5916, lng: 76.5222, area: 'Kottayam', color: '#7154a4' },
  { id: 5, name: 'Suresh B.', skill: 'Carpenter', cooperative: 'Kollam Labour Society', rating: 4.6, jobs: 113, status: 'off-duty', verified: true, lat: 8.8932, lng: 76.6141, area: 'Kollam', color: '#3d6f9e' }
];

const bookings = [
  { id: 'CX-1048', customer: 'Radhika Menon', service: 'AC repair', worker: 'Vishnu S.', date: 'Today, 11:30 AM', status: 'Confirmed', amount: 850, lat: 8.5074, lng: 76.9570 },
  { id: 'CX-1047', customer: 'Arun Kumar', service: 'Home cleaning', worker: 'Latha P.', date: 'Today, 2:00 PM', status: 'Assigned', amount: 650, lat: 9.9560, lng: 76.2860 },
  { id: 'CX-1046', customer: 'Safiya Gafoor', service: 'Plumbing', worker: null, date: 'Tomorrow, 9:00 AM', status: 'Matching', amount: 500, lat: 11.2588, lng: 75.7804 }
];

const services = [
  { id: 'electrical', name: 'Electrical & appliance', icon: 'ϟ', description: 'Repairs, wiring and installation', price: 'From ₹350', tone: 'teal' },
  { id: 'plumbing', name: 'Plumbing', icon: '⌁', description: 'Leaks, fittings and maintenance', price: 'From ₹300', tone: 'gold' },
  { id: 'cleaning', name: 'Home cleaning', icon: '✧', description: 'Reliable care for every room', price: 'From ₹450', tone: 'coral' },
  { id: 'care', name: 'Care & companionship', icon: '♡', description: 'Trained support at home', price: 'From ₹700', tone: 'violet' },
  { id: 'carpentry', name: 'Carpentry', icon: '⌘', description: 'Furniture, doors and repairs', price: 'From ₹400', tone: 'blue' },
  { id: 'garden', name: 'Garden maintenance', icon: '✿', description: 'Keep your spaces thriving', price: 'From ₹300', tone: 'green' },
  { id: 'doctor', name: 'Doctor visit', icon: '+', description: 'Verified doctors at home', price: 'From ₹900', tone: 'blue' },
  { id: 'nursing', name: 'Nursing support', icon: '✚', description: 'Trained nurses and attendants', price: 'From ₹700', tone: 'coral' },
  { id: 'cook', name: 'Cook & meal prep', icon: '♨', description: 'Daily cooking and events', price: 'From ₹500', tone: 'gold' },
  { id: 'moving', name: 'Luggage shifting', icon: '▣', description: 'Careful packing and moving', price: 'From ₹1,200', tone: 'violet' },
  { id: 'pest-control', name: 'Pest control', icon: '◎', description: 'Safe home treatment', price: 'From ₹650', tone: 'green' },
  { id: 'vehicle', name: 'Driver on demand', icon: '➜', description: 'Trusted local drivers', price: 'From ₹450', tone: 'teal' },
  { id: 'ac-repair', name: 'AC repair', icon: '◉', description: 'Cooling service and maintenance', price: 'From ₹500', tone: 'blue' },
  { id: 'refrigerator', name: 'Refrigerator repair', icon: '▯', description: 'Appliance diagnosis and repair', price: 'From ₹400', tone: 'teal' },
  { id: 'painting', name: 'Painting', icon: '◒', description: 'Interior and exterior painting', price: 'From ₹900', tone: 'coral' },
  { id: 'masonry', name: 'Masonry', icon: '▤', description: 'Walls, tiles and construction', price: 'From ₹600', tone: 'gold' },
  { id: 'laundry', name: 'Laundry service', icon: '◌', description: 'Pickup, wash and delivery', price: 'From ₹250', tone: 'violet' },
  { id: 'beauty', name: 'Beauty at home', icon: '✦', description: 'Salon and grooming services', price: 'From ₹450', tone: 'coral' },
  { id: 'physio', name: 'Physiotherapy', icon: '+', description: 'Recovery support at home', price: 'From ₹800', tone: 'green' },
  { id: 'elder-care', name: 'Elder care', icon: '♡', description: 'Companionship and daily support', price: 'From ₹650', tone: 'violet' },
  { id: 'packers', name: 'Packers & movers', icon: '□', description: 'Organised home relocation', price: 'From ₹1,500', tone: 'blue' },
  { id: 'vehicle-service', name: 'Vehicle service', icon: '⚙', description: 'Local vehicle care', price: 'From ₹350', tone: 'teal' },
  { id: 'computer', name: 'Computer repair', icon: '▣', description: 'Home and office tech support', price: 'From ₹400', tone: 'gold' },
  { id: 'security', name: 'Security guard', icon: '⬡', description: 'Verified event and home security', price: 'From ₹900', tone: 'green' }
];

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(payload));
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function passwordHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function validPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(String(phone || ''));
}

function normalizePhone(countryCode, phone) {
  const code = String(countryCode || '+91').replace(/\s/g, '');
  const digits = String(phone || '').replace(/\D/g, '');
  if (code === '+91' && digits.length === 10) return `${code}${digits}`;
  const normalized = `${code}${digits.replace(/^0+/, '')}`;
  return validPhone(normalized) ? normalized : null;
}

function sendSms(phone, message) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) return Promise.resolve(false);
  const payload = new URLSearchParams({ To: phone, From: TWILIO_FROM_NUMBER, Body: message }).toString();
  return new Promise((resolve, reject) => {
    const request = https.request({ hostname: 'api.twilio.com', path: `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, method: 'POST', auth: `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(payload) } }, response => { let result = ''; response.on('data', chunk => { result += chunk; }); response.on('end', () => response.statusCode >= 200 && response.statusCode < 300 ? resolve(true) : reject(new Error(`SMS provider returned ${response.statusCode}: ${result}`))); });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.resolve(publicDir, `.${requested}`);
  const relative = path.relative(publicDir, safePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return json(res, 403, { error: 'Forbidden' });
  fs.readFile(safePath, (error, data) => {
    if (error) return json(res, 404, { error: 'Page not found' });
    const ext = path.extname(safePath);
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon'
    };
    res.writeHead(200, { 'Content-Type': `${types[ext] || 'application/octet-stream'}; charset=utf-8` });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }

  try {
    if (pathname === '/api/health') return json(res, 200, { service: 'CONNECTX', status: 'online', timestamp: new Date().toISOString() });
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const request = await body(req);
      const user = users.find(candidate => candidate.email.toLowerCase() === String(request.email || '').toLowerCase());
      if (!user || user.passwordHash !== passwordHash(String(request.password || ''))) return json(res, 401, { error: 'Email or password is incorrect' });
      return json(res, 200, { token: `cx-demo-${user.id}`, user: publicUser(user) });
    }
    if (pathname === '/api/auth/request-otp' && req.method === 'POST') {
      const request = await body(req);
      const phone = normalizePhone(request.countryCode, request.phone);
      if (!phone) return json(res, 400, { error: 'Enter a valid phone number. For India, enter exactly 10 digits.' });
      const user = users.find(candidate => candidate.phone.replace(/\s/g, '') === phone);
      const code = String(crypto.randomInt(100000, 1000000));
      otpChallenges.set(phone, { code, userId: user?.id || null, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });
      const sentBySms = await sendSms(phone, `Your CONNECTX login code is ${code}. It expires in 5 minutes.`);
      const response = { phone, message: sentBySms ? 'OTP sent to your phone' : 'OTP generated in demo mode. Add Twilio credentials to send real SMS.' };
      if (!sentBySms) response.demoOtp = code;
      return json(res, 200, response);
    }
    if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
      const request = await body(req);
      const phone = normalizePhone(request.countryCode, request.phone) || request.phone;
      const challenge = otpChallenges.get(phone);
      if (!challenge || challenge.expiresAt < Date.now()) return json(res, 401, { error: 'This OTP has expired. Request a new code.' });
      challenge.attempts += 1;
      if (challenge.attempts > 5) { otpChallenges.delete(phone); return json(res, 429, { error: 'Too many attempts. Request a new OTP.' }); }
      if (challenge.code !== String(request.otp || '')) return json(res, 401, { error: 'The OTP is incorrect' });
      otpChallenges.delete(phone);
      let user = users.find(candidate => candidate.id === challenge.userId);
      if (!user) {
        user = { id: `USR-${1001 + users.length}`, fullName: 'New CONNECTX member', email: `${phone.slice(1)}@phone.connectx.local`, phone, role: 'customer', passwordHash: passwordHash(crypto.randomUUID()) };
        users.push(user);
      }
      return json(res, 200, { token: `cx-demo-${user.id}`, user: publicUser(user) });
    }
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const request = await body(req);
      const required = ['fullName', 'email', 'phone', 'password', 'role'];
      if (required.some(field => !request[field])) return json(res, 400, { error: 'Full name, email, phone, password and role are required' });
      const role = String(request.role);
      if (!['customer', 'worker'].includes(role)) return json(res, 400, { error: 'Choose Customer or Offer services' });
      const email = String(request.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: 'Enter a valid email address' });
      if (users.some(user => user.email.toLowerCase() === email)) return json(res, 409, { error: 'An account with this email already exists' });
      const phoneText = String(request.phone).trim();
      const normalizedPhone = phoneText.startsWith('+') ? phoneText.replace(/\s/g, '') : normalizePhone('+91', phoneText);
      if (!validPhone(normalizedPhone)) return json(res, 400, { error: 'Enter a valid phone number, for example +919876543210' });
      if (users.some(user => user.phone.replace(/\s/g, '') === normalizedPhone)) return json(res, 409, { error: 'An account with this phone number already exists' });
      if (String(request.password).length < 8) return json(res, 400, { error: 'Password must be at least 8 characters' });
      if (role === 'worker' && (!request.upiId || !request.bankAccount || !request.ifsc)) return json(res, 400, { error: 'Workers must provide UPI ID, bank account and IFSC code' });
      const user = { id: `USR-${1001 + users.length}`, fullName: String(request.fullName).trim(), email, phone: normalizedPhone, role, passwordHash: passwordHash(request.password), skills: Array.isArray(request.skills) ? request.skills : [], upiId: request.upiId || null, bankAccount: request.bankAccount || null, ifsc: request.ifsc || null, verificationStatus: role === 'worker' ? 'pending' : 'verified' };
      users.push(user);
      return json(res, 201, { token: `cx-demo-${user.id}`, user: publicUser(user), message: role === 'worker' ? 'Worker profile created and sent for verification' : 'Account created successfully' });
    }
    if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
      const request = await body(req);
      const email = String(request.email || '').trim().toLowerCase();
      const user = users.find(candidate => candidate.email.toLowerCase() === email);
      if (!user) return json(res, 404, { error: 'No account was found with that email address' });
      const code = String(crypto.randomInt(100000, 1000000));
      resetChallenges.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
      return json(res, 200, { message: 'Password reset code generated. In demo mode it is shown below.', demoCode: code });
    }
    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const request = await body(req);
      const email = String(request.email || '').trim().toLowerCase();
      const challenge = resetChallenges.get(email);
      if (!challenge || challenge.expiresAt < Date.now()) return json(res, 401, { error: 'Reset code expired. Request a new code.' });
      challenge.attempts += 1;
      if (challenge.attempts > 5) { resetChallenges.delete(email); return json(res, 429, { error: 'Too many attempts. Request a new reset code.' }); }
      if (challenge.code !== String(request.resetCode || '')) return json(res, 401, { error: 'The reset code is incorrect' });
      if (String(request.newPassword || '').length < 8) return json(res, 400, { error: 'New password must be at least 8 characters' });
      if (String(request.newPassword) !== String(request.confirmPassword)) return json(res, 400, { error: 'New password and confirmation do not match' });
      const user = users.find(candidate => candidate.email.toLowerCase() === email);
      if (!user) return json(res, 404, { error: 'Account not found' });
      user.passwordHash = passwordHash(String(request.newPassword));
      resetChallenges.delete(email);
      return json(res, 200, { reset: true, message: 'Password reset successfully. You can now log in with your new password.' });
    }
    if (pathname === '/api/dashboard') return json(res, 200, { metrics: { workers: 248, bookings: 1284, earnings: 1860000, rating: 4.8 }, demand: [145, 158, 170, 166, 204, 218, 242, 266, 288, 314], forecastGrowth: 18.6, welfare: { covered: 213, total: 248, health: 192, accident: 176, pending: 35 } });
    if (pathname === '/api/workers' && req.method === 'GET') {
      const skill = url.searchParams.get('skill');
      const area = url.searchParams.get('area');
      const result = workers.filter(worker => (!skill || worker.skill.toLowerCase().includes(skill.toLowerCase())) && (!area || worker.area.toLowerCase().includes(area.toLowerCase())));
      return json(res, 200, { workers: result, total: result.length });
    }
    if (pathname === '/api/services' && req.method === 'GET') return json(res, 200, { services });
    if (pathname === '/api/bookings' && req.method === 'GET') return json(res, 200, { bookings });
    if (pathname === '/api/bookings' && req.method === 'POST') {
      const request = await body(req);
      if (!request.service || !request.location || !request.date) return json(res, 400, { error: 'service, location and date are required' });
      const created = { id: `CX-${1049 + bookings.length}`, customer: request.customer || 'New customer', service: request.service, worker: null, date: request.date, status: 'Matching', amount: 0, location: request.location };
      bookings.unshift(created);
      return json(res, 201, { booking: created, message: 'Booking created. Matching nearby cooperative workers.' });
    }
    if (pathname === '/api/map' && req.method === 'GET') return json(res, 200, { workers: workers.map(({ id, name, skill, status, lat, lng, area, rating }) => ({ id, name, skill, status, lat, lng, area, rating })) });
    return serveStatic(req, res, pathname);
  } catch (error) { return json(res, 500, { error: error.message }); }
});

server.listen(PORT, HOST, () => console.log(`CONNECTX running on http://${HOST}:${PORT}`));
