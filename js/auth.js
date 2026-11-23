/* NOVA MART – login / register. FRONTEND DEMONSTRATION ONLY: accounts live in this browser's
   localStorage, so this is NOT secure authentication. A real site must verify users on a server. */
const USERS_KEY = 'novamart_users', SESSION_KEY = 'novamart_session';
const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };

/* SHA-256 so the demo never stores a plain password (still not real security) */
async function hashPassword(pw) {
  if (!window.crypto?.subtle) return 'x' + btoa(pw);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const authBox = $('#auth-box');
if (authBox) {
  const loginForm = $('#login-form'), registerForm = $('#register-form');

  function showTab(name) {
    $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    loginForm.hidden = name !== 'login';
    registerForm.hidden = name !== 'register';
  }
  function showState() {
    const user = getSession();
    $('#signed-in').hidden = !user;
    authBox.hidden = !!user;
    if (user) $('#signed-name').textContent = user.name;
  }
  $$('.tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  if (location.hash === '#register') showTab('register');
  showState();

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const f = registerForm.elements, msg = $('.form-msg', registerForm);
    const ok = validate(registerForm, {
      name: v => v.length >= 2 ? '' : 'Enter your name.',
      email: v => emailRe.test(v) ? '' : 'Enter a valid email address.',
      password: v => v.length >= 8 && /\d/.test(v) ? '' : 'Use at least 8 characters including a number.',
      confirm: v => v === f.password.value ? '' : 'Passwords do not match.'
    });
    if (!ok) return setMsg(msg, 'Please fix the errors above.', false);
    const email = f.email.value.trim().toLowerCase(), users = getUsers();
    if (users.some(u => u.email === email)) return setMsg(msg, 'An account with this email already exists. Please log in.', false);
    users.push({ name: f.name.value.trim(), email, hash: await hashPassword(f.password.value) });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    registerForm.reset();
    setMsg(msg, 'Account created! You can log in now.', true);
    showTab('login');
    setMsg($('.form-msg', loginForm), 'Registration successful. Please log in.', true);
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const f = loginForm.elements, msg = $('.form-msg', loginForm);
    const ok = validate(loginForm, {
      email: v => emailRe.test(v) ? '' : 'Enter a valid email address.',
      password: v => v ? '' : 'Enter your password.'
    });
    if (!ok) return setMsg(msg, 'Please fix the errors above.', false);
    const user = getUsers().find(u => u.email === f.email.value.trim().toLowerCase());
    if (!user || user.hash !== await hashPassword(f.password.value)) return setMsg(msg, 'Incorrect email or password.', false);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
    setMsg(msg, `Welcome back, ${user.name}! Redirecting to the shop…`, true);
    setTimeout(() => { location.href = 'products.html'; }, 1200);
  });

  $('#logout').addEventListener('click', () => { localStorage.removeItem(SESSION_KEY); location.reload(); });
}
