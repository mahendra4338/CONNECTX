(function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const modal = $('#bookingModal');
  const toast = $('#toast');
  const bookingRows = $('#bookingRows');
  const authGate = $('#authGate');
  const authMessage = $('#authMessage');
  const yoyoChat = $('#yoyoChat');
  const chatMessages = $('#chatMessages');

  const serviceCatalog = [
    'Electrical & appliance', 'Plumbing', 'Home cleaning', 'Care & companionship',
    'Carpentry', 'Garden maintenance', 'Doctor visit', 'Nursing support',
    'Cook & meal prep', 'Luggage shifting', 'Pest control', 'Driver on demand',
    'AC repair', 'Refrigerator repair', 'Painting', 'Masonry', 'Laundry service',
    'Beauty at home', 'Physiotherapy', 'Elder care', 'Packers & movers',
    'Vehicle service', 'Computer repair', 'Security guard'
  ];

  const serviceIcons = ['⌁', 'ϟ', '✧', '+', '✚', '♨', '▣', '➜', '⌘', '✿', '◎', '◉'];

  function showMessage(text, type) {
    if (!authMessage) return;
    authMessage.textContent = text || '';
    authMessage.className = 'auth-message' + (type ? ' ' + type : '');
  }

  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/);
    return parts.map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  function avatarTone(name) {
    return ({ 'Radhika Menon': 'blue', 'Arun Kumar': 'yellow', 'Safiya Gafoor': 'pink' })[name] || 'green';
  }

  function statusClass(status) {
    return String(status || '').toLowerCase().replace(/\s+/g, '-');
  }

  async function api(url, options) {
    const response = await fetch(url, options || {});
    let data = {};
    try { data = await response.json(); } catch (error) { data = {}; }
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function setProfile(user) {
    if (!user) return;
    const name = user.fullName || user.name || 'CONNECTX member';
    const profileName = $('#profileName');
    const profileAvatar = $('.profile-avatar');
    if (profileName) profileName.textContent = name;
    if (profileAvatar) profileAvatar.textContent = initials(name);
    const roleText = user.role === 'worker' ? 'Cooperative worker' : user.role === 'admin' ? 'Federation admin' : 'Customer';
    const profileRole = $('.profile-button small');
    if (profileRole) profileRole.textContent = roleText;
  }

  function logout() {
    localStorage.removeItem('connectxUser');
    if (authGate) {
      authGate.classList.remove('hidden');
      authGate.setAttribute('aria-hidden', 'false');
    }
    showAuthView('login');
    const loginForm = $('#loginForm');
    if (loginForm) loginForm.reset();
    setLoginMethod('email');
    showMessage('You have been logged out.', 'success');
  }

  function openBookingFor(service) {
    const button = $('#newBooking');
    if (!button || !modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const select = $('#bookingForm select[name="service"]');
    if (select) {
      let option = Array.from(select.options).find(item => item.value === service);
      if (!option) {
        option = document.createElement('option');
        option.value = service;
        option.textContent = service;
        select.appendChild(option);
      }
      select.value = service;
    }
  }

  // ---------- Authentication ----------
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');
  const forgotForm = $('#forgotForm');
  const loginSubmit = loginForm ? $('button[type="submit"]', loginForm) : null;
  const emailField = loginForm ? $('input[name="email"]', loginForm) : null;
  const passwordField = loginForm ? $('input[name="password"]', loginForm) : null;

  let phoneFields = null;
  let phoneInput = null;
  let otpInput = null;

  if (loginForm) {
    const subtitle = $('.auth-subtitle', loginForm);
    if (subtitle) {
      subtitle.insertAdjacentHTML('afterend',
        '<div class="phone-login-fields"><label>Country<select name="countryCode"><option value="+91">India (+91)</option><option value="+1">United States (+1)</option><option value="+44">United Kingdom (+44)</option><option value="+971">UAE (+971)</option><option value="+61">Australia (+61)</option></select></label><label>Phone number<input type="tel" name="phone" placeholder="9876543210" inputmode="tel"><small class="field-hint">India: enter your 10-digit mobile number</small></label><div class="otp-row"><input type="text" name="otp" placeholder="6-digit OTP" inputmode="numeric" maxlength="6"><button type="button" class="outline-button" id="sendOtp">Send OTP</button></div></div>'
      );
    }
    phoneFields = $('.phone-login-fields', loginForm);
    phoneInput = phoneFields ? $('input[name="phone"]', phoneFields) : null;
    otpInput = phoneFields ? $('input[name="otp"]', phoneFields) : null;
  }

  function setLoginMethod(method) {
    if (!loginForm || !phoneFields) return;
    const phoneMode = method === 'phone';
    $$('.method-button').forEach(button => button.classList.toggle('active', button.dataset.loginMethod === method));
    phoneFields.classList.toggle('visible', phoneMode);
    const emailLabel = emailField ? emailField.closest('label') : null;
    const passwordLabel = passwordField ? passwordField.closest('label') : null;
    if (emailLabel) emailLabel.classList.toggle('hidden-field', phoneMode);
    if (passwordLabel) passwordLabel.classList.toggle('hidden-field', phoneMode);
    if (emailField) emailField.required = !phoneMode;
    if (passwordField) passwordField.required = !phoneMode;
    if (phoneInput) phoneInput.required = phoneMode;
    if (otpInput) otpInput.required = phoneMode;
    if (loginSubmit) loginSubmit.innerHTML = phoneMode ? 'Verify OTP <span>→</span>' : 'Log in <span>→</span>';
  }

  function showAuthView(view) {
    $$('.auth-form').forEach(form => form.classList.toggle('active', form.id === view + 'Form'));
    $$('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.authView === view));
    showMessage('');
    if (view === 'forgot') resetForgotFormToRequest();
  }

  $$('.auth-tab').forEach(button => button.addEventListener('click', () => showAuthView(button.dataset.authView)));
  $$('.method-button').forEach(button => button.addEventListener('click', () => setLoginMethod(button.dataset.loginMethod)));
  $$('[data-auth-view]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    showAuthView(button.dataset.authView);
  }));

  $$('.toggle-password').forEach(button => button.addEventListener('click', () => {
    const input = button.previousElementSibling;
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    button.textContent = input.type === 'password' ? 'Show' : 'Hide';
  }));

  const sendOtp = $('#sendOtp');
  if (sendOtp) {
    sendOtp.addEventListener('click', async function () {
      if (!phoneInput || !phoneInput.value.trim()) {
        showMessage('Enter your phone number first.', 'error');
        return;
      }
      sendOtp.disabled = true;
      try {
        const data = await api('/api/auth/request-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryCode: $('[name="countryCode"]', phoneFields).value, phone: phoneInput.value.trim() })
        });
        showMessage(data.demoOtp ? data.message + ' Demo code: ' + data.demoOtp : data.message, 'success');
        if (data.demoOtp && otpInput) otpInput.value = data.demoOtp;
      } catch (error) {
        showMessage(error.message, 'error');
      } finally {
        sendOtp.disabled = false;
      }
    });
  }

  if (loginForm) loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const phoneMode = phoneFields && phoneFields.classList.contains('visible');
      const formData = new FormData(loginForm);
      const payload = Object.fromEntries(formData.entries());
      const endpoint = phoneMode ? '/api/auth/verify-otp' : '/api/auth/login';
      const data = await api(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      localStorage.setItem('connectxUser', JSON.stringify(data.user));
      setProfile(data.user);
      authGate.classList.add('hidden');
      authGate.setAttribute('aria-hidden', 'true');
      showMessage('');
      toastMessage('Welcome to CONNECTX, ' + (data.user.fullName || 'member') + '.');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });

  // Registration
  if (registerForm) registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(registerForm).entries());
      payload.skills = $$('[name="skills"] option:checked', registerForm).map(option => option.value);
      const data = await api('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      localStorage.setItem('connectxUser', JSON.stringify(data.user));
      setProfile(data.user);
      authGate.classList.add('hidden');
      authGate.setAttribute('aria-hidden', 'true');
      toastMessage(data.message || 'Account created successfully.');
      registerForm.reset();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });

  $$('input[name="role"]', registerForm || document).forEach(input => input.addEventListener('change', event => {
    const fields = $('.worker-fields', registerForm);
    if (!fields) return;
    const worker = event.target.value === 'worker';
    fields.classList.toggle('visible', worker);
    $$('.worker-fields input, .worker-fields select', registerForm).forEach(field => {
      field.required = worker && field.name !== 'skills';
    });
  }));

  // Forgot password has two real steps using the same form.
  let resetCodeSent = false;
  function resetForgotFormToRequest() {
    if (!forgotForm) return;
    resetCodeSent = false;
    const code = $('[name="resetCode"]', forgotForm);
    const resetFields = $('.reset-fields', forgotForm);
    const submit = $('button[type="submit"]', forgotForm);
    if (code) { code.value = ''; code.required = false; }
    if (resetFields) resetFields.classList.remove('visible');
    if (submit) submit.innerHTML = 'Send reset code <span>→</span>';
  }

  if (forgotForm) forgotForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('[name="email"]', forgotForm).value.trim();
    if (!email) { showMessage('Enter your email address.', 'error'); return; }

    try {
      if (!resetCodeSent) {
        const data = await api('/api/auth/forgot-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
        });
        resetCodeSent = true;
        const code = $('[name="resetCode"]', forgotForm);
        const resetFields = $('.reset-fields', forgotForm);
        const submit = $('button[type="submit"]', forgotForm);
        code.required = true;
        resetFields.classList.add('visible');
        $('[name="newPassword"]', forgotForm).required = true;
        $('[name="confirmPassword"]', forgotForm).required = true;
        if (data.demoCode) code.value = data.demoCode;
        if (submit) submit.innerHTML = 'Reset password <span>→</span>';
        showMessage(data.demoCode ? data.message + ' Demo code: ' + data.demoCode : data.message, 'success');
      } else {
        const payload = Object.fromEntries(new FormData(forgotForm).entries());
        const data = await api('/api/auth/reset-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        showMessage(data.message || 'Password reset successfully.', 'success');
        setTimeout(() => {
          showAuthView('login');
          if (emailField) emailField.value = email;
        }, 700);
      }
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });

  // ---------- Dashboard ----------
  document.querySelector('.yoyo-bar')?.remove();
  document.querySelector('.demand-panel')?.remove();
  $('.dashboard-grid')?.classList.add('single-panel-grid');

  const contentWrap = $('.content-wrap');
  let detailWorkspace = null;
  if (contentWrap) {
    const searchBar = document.createElement('section');
    searchBar.className = 'connectx-search-bar';
    searchBar.innerHTML = '<span class="search-icon">⌕</span><input id="serviceSearch" placeholder="Search any service, worker, or area..." autocomplete="off"><button class="voice-search" id="voiceSearch" aria-label="Search by voice">◉<small>Speak</small></button><button class="search-submit" aria-label="Search">→</button><div class="search-results" id="searchResults"></div>';
    contentWrap.prepend(searchBar);

    detailWorkspace = document.createElement('section');
    detailWorkspace.className = 'detail-workspace';
    contentWrap.appendChild(detailWorkspace);
  }

  const serviceChips = $('#serviceChips');
  if (serviceChips) {
    serviceChips.innerHTML = serviceCatalog.map((service, index) => '<button class="' + (index >= 10 ? 'extra-service' : '') + '" data-service="' + service + '">' + serviceIcons[index % serviceIcons.length] + ' ' + service + '</button>').join('') + '<button class="more-services-button" id="moreServices">More services <span>＋</span></button>';
    const more = $('#moreServices');
    if (more) more.addEventListener('click', event => {
      const expanded = serviceChips.classList.toggle('expanded');
      event.currentTarget.innerHTML = expanded ? 'Show fewer <span>−</span>' : 'More services <span>＋</span>';
    });
    serviceChips.addEventListener('click', event => {
      const button = event.target.closest('[data-service]');
      if (button) openBookingFor(button.dataset.service);
    });
  }

  const searchInput = $('#serviceSearch');
  const searchResults = $('#searchResults');
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      const matches = serviceCatalog.filter(service => service.toLowerCase().includes(query)).slice(0, 7);
      searchResults.innerHTML = query ? matches.map(service => '<button data-search-service="' + service + '">' + service + '<span>→</span></button>').join('') : '';
      searchResults.classList.toggle('visible', Boolean(query));
    });
    searchResults.addEventListener('click', event => {
      const button = event.target.closest('[data-search-service]');
      if (!button) return;
      openBookingFor(button.dataset.searchService);
      searchResults.classList.remove('visible');
    });
  }

  const searchSubmit = $('.search-submit');
  if (searchSubmit) searchSubmit.addEventListener('click', async () => {
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    if (!query) { if (searchInput) searchInput.focus(); return; }
    const service = serviceCatalog.find(item => item.toLowerCase().includes(query));
    if (service) { openBookingFor(service); return; }
    await showWorkspace('workers', 'Workers');
    if (detailWorkspace) {
      $$('.worker-detail-card', detailWorkspace).forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    }
  });

  const voiceSearch = $('#voiceSearch');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (voiceSearch && SpeechRecognition) {
    voiceSearch.addEventListener('click', () => {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      voiceSearch.classList.add('listening');
      recognition.onresult = event => {
        searchInput.value = event.results[0][0].transcript;
        searchInput.dispatchEvent(new Event('input'));
      };
      recognition.onend = () => voiceSearch.classList.remove('listening');
      recognition.onerror = () => voiceSearch.classList.remove('listening');
      recognition.start();
    });
  } else if (voiceSearch) {
    voiceSearch.title = 'Voice search is not supported in this browser';
  }

  // ---------- YOYO ----------
  if (yoyoChat) {
    const yoyoBee = document.createElement('button');
    yoyoBee.className = 'yoyo-bee';
    yoyoBee.innerHTML = '<span class="bee-wing left-wing"></span><span class="bee-body"><b>YO</b><i></i><i></i></span><span class="bee-wing right-wing"></span><small>YOYO</small>';
    document.body.appendChild(yoyoBee);

    function addChatMessage(text, author) {
      if (!chatMessages) return;
      const message = document.createElement('div');
      message.className = 'chat-bubble ' + (author === 'yoyo' ? 'yoyo-message' : 'user-message');
      message.textContent = text;
      chatMessages.appendChild(message);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function yoyoReply(question) {
      const text = String(question || '').toLowerCase();
      if (/\b(hi|hello|hey|good morning|good evening)\b/.test(text)) return 'Hello! I am YOYO. I can help you find a worker, choose a service, check workers near you, or make a booking.';
      if (text.includes('thank')) return 'You are welcome. I am happy to help you.';
      if (text.includes('service') || text.includes('available')) return 'CONNECTX has 24 services. Use the service list or search box to choose one.';
      if (text.includes('book') || text.includes('hire')) return 'Choose a service, press New booking, enter your location and date, then send the request.';
      if (text.includes('price') || text.includes('cost')) return 'Each service has a starting price. Choose a service to begin a booking and confirm the final price with the cooperative.';
      if (text.includes('worker') || text.includes('earn') || text.includes('join')) return 'Create an account and choose Offer services. Worker profiles require skills and payout details.';
      if (text.includes('location') || text.includes('near')) return 'Press Live location and allow browser location access. The map will show cooperative workers.';
      if (text.includes('login') || text.includes('password') || text.includes('otp')) return 'You can log in with email/password or Phone OTP. Forgot password is available on the login screen.';
      return 'I can help with services, bookings, workers, prices, location, login, and registration.';
    }

    function openYoyo() {
      yoyoChat.classList.add('open');
      yoyoChat.setAttribute('aria-hidden', 'false');
      yoyoBee.classList.add('hidden');
      const input = $('#chatInput');
      if (input) input.focus();
    }

    $('#yoyoOpen')?.addEventListener('click', openYoyo);
    yoyoBee.addEventListener('click', openYoyo);
    $('#yoyoClose')?.addEventListener('click', () => {
      yoyoChat.classList.remove('open');
      yoyoChat.setAttribute('aria-hidden', 'true');
      yoyoBee.classList.remove('hidden');
    });
    $$('[data-yoyo]').forEach(button => button.addEventListener('click', () => {
      openYoyo(); addChatMessage(button.dataset.yoyo); setTimeout(() => addChatMessage(yoyoReply(button.dataset.yoyo), 'yoyo'), 180);
    }));
    $('#chatForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const input = $('#chatInput');
      const question = input ? input.value.trim() : '';
      if (!question) return;
      addChatMessage(question);
      input.value = '';
      setTimeout(() => addChatMessage(yoyoReply(question), 'yoyo'), 180);
    });
  }

  // ---------- Location ----------
  let userLocation = null;
  $('#locationButton')?.addEventListener('click', () => {
    const status = $('#locationStatus');
    if (!navigator.geolocation) { if (status) status.textContent = 'Unavailable'; return; }
    if (status) status.textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      if (status) status.textContent = 'Active now';
      $('#locationButton')?.classList.add('location-active');
      if (window.connectxMap && window.L) {
        window.connectxMap.setView(userLocation, 13);
        window.L.circleMarker(userLocation, { radius: 8, fillColor: '#d9694d', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(window.connectxMap).bindPopup('<strong>You are here</strong>').openPopup();
      }
    }, () => { if (status) status.textContent = 'Permission needed'; });
  });

  // ---------- Bookings ----------
  function toastMessage(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function renderBookings(bookings) {
    if (!bookingRows) return;
    if (!bookings.length) {
      bookingRows.innerHTML = '<tr><td colspan="5">No bookings yet.</td></tr>';
      return;
    }
    bookingRows.innerHTML = bookings.slice(0, 6).map(booking =>
      '<tr><td><div class="customer"><span class="customer-avatar ' + avatarTone(booking.customer) + '">' + initials(booking.customer) + '</span><strong>' + booking.customer + '</strong></div></td><td>' + booking.service + '</td><td><div class="worker-cell ' + (booking.worker ? '' : 'unassigned') + '">' + (booking.worker ? '<span class="worker-avatar">' + initials(booking.worker) + '</span>' + booking.worker : 'Finding nearby worker') + '</div></td><td>' + booking.date + '</td><td><span class="status ' + statusClass(booking.status) + '">' + booking.status + '</span></td></tr>'
    ).join('');
  }

  async function loadBookings() {
    try {
      const data = await api('/api/bookings');
      renderBookings(data.bookings || []);
    } catch (error) {
      if (bookingRows) bookingRows.innerHTML = '<tr><td colspan="5">Unable to load bookings. Is the server running?</td></tr>';
    }
  }

  $('#newBooking')?.addEventListener('click', () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  });
  $('#closeModal')?.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });
  modal?.addEventListener('click', event => {
    if (event.target === modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  });

  $('#bookingForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.target).entries());
      const storedUser = JSON.parse(localStorage.getItem('connectxUser') || 'null');
      if (!payload.customer && storedUser) payload.customer = storedUser.fullName || '';
      const data = await api('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      event.target.reset();
      toastMessage(data.message || 'Booking request created successfully.');
      await loadBookings();
    } catch (error) {
      toastMessage(error.message);
    }
  });

  // ---------- Workspace pages ----------
  const overviewSections = contentWrap ? Array.from(contentWrap.children).filter(element => !element.classList.contains('detail-workspace')) : [];

  function detailHeader(label, title, description, action) {
    return '<div class="detail-heading"><div><p class="eyebrow">' + label + '</p><h1>' + title + '</h1><p>' + description + '</p></div>' + (action || '') + '</div>';
  }
  function detailCard(title, value, note, tone) {
    return '<article class="detail-stat ' + (tone || 'teal') + '"><small>' + title + '</small><strong>' + value + '</strong><span>' + note + '</span></article>';
  }

  async function showWorkspace(view, label) {
    if (!detailWorkspace) return;
    overviewSections.forEach(section => section.style.display = 'none');
    detailWorkspace.style.display = 'block';
    detailWorkspace.innerHTML = '<div class="loading-detail">Loading CONNECTX data...</div>';

    try {
      if (view === 'overview') {
        overviewSections.forEach(section => section.style.display = '');
        detailWorkspace.style.display = 'none';
        return;
      }
      if (view === 'bookings') {
        const data = await api('/api/bookings');
        detailWorkspace.innerHTML = detailHeader('BOOKING OPERATIONS', 'Bookings', 'Track every service request from matching to completion.', '<button class="primary-button detail-action" id="detailNewBooking">＋ New booking</button>') +
          '<div class="detail-stats">' + detailCard('All requests', String((data.bookings || []).length), 'Current queue', 'teal') + detailCard('Awaiting match', String((data.bookings || []).filter(item => item.status === 'Matching').length), 'Need assignment', 'gold') + detailCard('Confirmed', String((data.bookings || []).filter(item => item.status === 'Confirmed').length), 'Ready to start', 'green') + detailCard('Completion rate', '94.2%', 'Last 30 days', 'violet') + '</div>' +
          '<div class="detail-panel"><div class="detail-panel-title"><h2>Booking queue</h2><span>Live data</span></div><div class="booking-detail-list">' + (data.bookings || []).map(item => '<div class="booking-detail-row"><div class="customer"><span class="customer-avatar">' + initials(item.customer) + '</span><strong>' + item.customer + '</strong></div><span>' + item.service + '</span><span>' + (item.worker || 'Finding nearby worker') + '</span><span>' + item.date + '</span><b class="status ' + statusClass(item.status) + '">' + item.status + '</b></div>').join('') + '</div></div>';
        $('#detailNewBooking')?.addEventListener('click', () => $('#newBooking')?.click());
      } else if (view === 'workers') {
        const data = await api('/api/workers');
        detailWorkspace.innerHTML = detailHeader('COOPERATIVE PEOPLE', 'Workers', 'Verified workers, skills, availability, and cooperative profiles.', '<button class="outline-button detail-action" id="registerWorkerDetail">＋ Register worker</button>') +
          '<div class="detail-stats">' + detailCard('Total workers', String(data.total), 'Profiles shown', 'teal') + detailCard('Available now', String((data.workers || []).filter(item => item.status === 'available').length), 'Ready for bookings', 'green') + detailCard('Verified', String((data.workers || []).filter(item => item.verified).length), 'Profiles checked', 'gold') + detailCard('Average rating', '4.8 / 5', 'Network rating', 'violet') + '</div>' +
          '<div class="detail-panel"><div class="detail-panel-title"><h2>Worker directory</h2><span>' + data.total + ' profiles</span></div><div class="worker-detail-grid">' + (data.workers || []).map(worker => '<article class="worker-detail-card"><div class="worker-detail-avatar" style="background:' + worker.color + '">' + initials(worker.name) + '</div><div><h3>' + worker.name + ' <span class="verified-mark">✓</span></h3><p>' + worker.skill + ' · ' + worker.area + '</p><span class="worker-status ' + worker.status + '">' + (worker.status === 'available' ? 'Available now' : worker.status.replace('-', ' ')) + '</span></div><strong>★ ' + worker.rating + '</strong></article>').join('') + '</div></div>';
        $('#registerWorkerDetail')?.addEventListener('click', () => { showAuthView('register'); authGate.classList.remove('hidden'); authGate.setAttribute('aria-hidden', 'false'); });
      } else if (view === 'services') {
        detailWorkspace.innerHTML = detailHeader('SERVICE DIRECTORY', 'Services', 'Browse every service offered by verified cooperative workers.', '<button class="primary-button detail-action" id="detailServiceSearch">⌕ Search services</button>') + '<div class="service-detail-grid">' + serviceCatalog.map((service, index) => '<button class="service-detail-card" data-detail-service="' + service + '"><span class="service-detail-icon">' + serviceIcons[index % serviceIcons.length] + '</span><span><strong>' + service + '</strong><small>Verified cooperative providers</small></span><b>→</b></button>').join('') + '</div>';
        $$('[data-detail-service]', detailWorkspace).forEach(button => button.addEventListener('click', () => openBookingFor(button.dataset.detailService)));
        $('#detailServiceSearch')?.addEventListener('click', () => { showWorkspace('overview', 'Overview'); searchInput?.focus(); });
      } else if (view === 'payments') {
        detailWorkspace.innerHTML = detailHeader('FINANCE & PAYOUTS', 'Payments', 'Follow customer collections, cooperative earnings, and worker payouts.', '<button class="outline-button detail-action" id="downloadReport">↓ Download report</button>') + '<div class="detail-stats">' + detailCard('Collected this month', '₹24.8L', 'Customer collections', 'teal') + detailCard('Worker payouts', '₹18.6L', 'Paid on schedule', 'green') + detailCard('Pending settlement', '₹2.4L', 'Processing', 'gold') + detailCard('Platform fees', '₹3.8L', 'Operations', 'violet') + '</div><div class="detail-panel payment-panel"><div class="detail-panel-title"><h2>Settlement activity</h2><span>September 2026</span></div><div class="payment-row"><span><b>Worker payout batch</b><small>248 workers</small></span><strong class="paid">Paid · ₹8.4L</strong></div><div class="payment-row"><span><b>Customer collections</b><small>412 bookings</small></span><strong class="paid">Settled · ₹7.2L</strong></div><div class="payment-row"><span><b>Current settlement</b><small>63 bookings</small></span><strong class="pending">Processing · ₹2.4L</strong></div></div>';
        $('#downloadReport')?.addEventListener('click', downloadReport);
      }
    } catch (error) {
      detailWorkspace.innerHTML = '<div class="loading-detail">Unable to load this section. Please check that the CONNECTX server is running.</div>';
    }
  }

  function downloadReport() {
    const csv = 'Report,Value,Status\nCollected this month,₹24.8L,Settled\nWorker payouts,₹18.6L,Paid\nPending settlement,₹2.4L,Processing\nPlatform fees,₹3.8L,Operations\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'connectx-payment-report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  $$('.nav-item[data-view]').forEach(item => item.addEventListener('click', () => {
    $$('.nav-item').forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    const label = item.textContent.trim().replace(/\d+$/, '');
    const breadcrumb = $('.breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span>Federation</span><b>/</b> ' + label;
    showWorkspace(item.dataset.view, label);
  }));

  $$('[data-view="overview"]').forEach(item => item.addEventListener('click', event => {
    event.preventDefault();
    $$('.nav-item').forEach(nav => nav.classList.remove('active'));
    $('.nav-item[data-view="overview"]')?.classList.add('active');
    const breadcrumb = $('.breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span>Federation</span><b>/</b> Overview';
    showWorkspace('overview', 'Overview');
  }));

  // Profile button opens a tiny action menu with a working logout.
  const profileButton = $('.profile-button');
  if (profileButton) profileButton.addEventListener('click', () => {
    let menu = $('#profileMenu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'profileMenu';
      menu.className = 'profile-menu';
      menu.innerHTML = '<button type="button" id="profileLogout">Log out</button>';
      document.body.appendChild(menu);
      const rect = profileButton.getBoundingClientRect();
      menu.style.top = rect.bottom + 8 + 'px';
      menu.style.right = Math.max(10, window.innerWidth - rect.right) + 'px';
      $('#profileLogout').addEventListener('click', event => { event.stopPropagation(); menu.remove(); logout(); });
    } else menu.remove();
  });

  // ---------- Map ----------
  function initialiseMap() {
    const mapElement = $('#workerMap');
    if (!mapElement || !window.L) {
      if (mapElement) mapElement.innerHTML = '<div style="padding:30px;text-align:center;color:#71817d">Map is unavailable. Other CONNECTX features still work.</div>';
      return;
    }
    const map = window.L.map(mapElement, { zoomControl: false }).setView([9.65, 76.35], 7);
    window.connectxMap = map;
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    api('/api/map').then(data => {
      (data.workers || []).forEach(worker => {
        const marker = window.L.circleMarker([worker.lat, worker.lng], { radius: worker.status === 'available' ? 9 : 7, fillColor: worker.status === 'available' ? '#176b67' : '#d9694d', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(map);
        marker.bindPopup('<strong>' + worker.name + '</strong><br>' + worker.skill + ' · ' + worker.area + '<br>' + (worker.status === 'available' ? 'Available now' : 'Currently on a job'));
      });
    }).catch(() => {});
  }

  // Restore session after refresh.
  try {
    const storedUser = JSON.parse(localStorage.getItem('connectxUser') || 'null');
    if (storedUser) {
      setProfile(storedUser);
      authGate?.classList.add('hidden');
      authGate?.setAttribute('aria-hidden', 'true');
    }
  } catch (error) {
    localStorage.removeItem('connectxUser');
  }

  setLoginMethod('email');
  loadBookings();
  if (window.L) initialiseMap(); else setTimeout(() => { if (window.L) initialiseMap(); }, 500);
})();
