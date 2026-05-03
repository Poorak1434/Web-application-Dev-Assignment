/**
 * TAKE ONE — Cinematic Interaction & Cloud Logic
 * Connects the 'Void & Neon' UI to the Supabase backend.
 */

/* ── CONFIG ── */
const ANIM_DURATION = 800;

/* ── DOM ELEMENTS ── */
const dot = document.getElementById('dot');
const cross = document.getElementById('cross');
const loader = document.getElementById('loader');
const cardRow = document.getElementById('cardRow');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const scriptModal = document.getElementById('scriptModal');
const peopleModal = document.getElementById('peopleModal');
const loginBtn = document.getElementById('loginBtn');
const heroPrimaryAction = document.getElementById('heroPrimaryAction');

/* ── CUSTOM CURSOR ── */
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
});

(function animateCursor() {
    if (dot && cross) {
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        cross.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }
    requestAnimationFrame(animateCursor);
})();

/* ── LOADER & INTRO ── */
window.addEventListener('load', () => {
    setTimeout(() => {
        if (loader) {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
        }
        document.body.classList.add('loaded');
        initializeAnimations();
    }, 1200);
});

function initializeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── LIVE DATA SYNC ── */
async function loadLiveScripts() {
    const statusEl = document.getElementById('liveScriptStatus');
    if (statusEl) statusEl.textContent = 'Syncing cloud signals...';

    try {
        const response = await API.home.get();
        if (response.success) {
            renderScriptCards(response.scripts);
            updateStats(response.stats);
            if (statusEl) statusEl.textContent = 'Production signals locked ✦';
        }
    } catch (err) {
        console.error('Data sync failed:', err);
        if (statusEl) statusEl.textContent = 'Cloud signal lost';
    }
}

function renderScriptCards(scripts) {
    if (!cardRow) return;
    
    if (scripts.length === 0) {
        cardRow.innerHTML = '<div class="live-empty-card">No stories found in the void.</div>';
        return;
    }

    cardRow.innerHTML = scripts.map((script, i) => `
        <div class="movie-card reveal" data-genre="${script.genre}" 
             style="background: linear-gradient(160deg, ${getTone(script.genre)} 0%, #06080A 100%);"
             onclick="openScriptPreview(${script.id})">
            <div class="data-num">${String(i + 1).padStart(3, '0')}</div>
            <div class="card-genre">${script.genre}</div>
            <div class="card-title">${script.title}</div>
            <div class="card-tag">Cloud Signal</div>
        </div>
    `).join('');
    
    initializeAnimations();
}

function getTone(genre) {
    const tones = {
        horror: '#2a0808',
        romance: '#080e20',
        action: '#0a1808',
        comedy: '#181408',
        thriller: '#10080a',
        drama: '#08101a',
        'sci-fi': '#08121c'
    };
    return tones[String(genre).toLowerCase()] || '#141018';
}

function updateStats(stats) {
    updateText('statCreators', stats.creators);
    updateText('statScripts', stats.scripts);
    updateText('statColleges', stats.colleges);
    updateText('statusCreators', `${stats.creators} Creators Active`);
    
    updateText('monitorScripts', stats.scripts);
    updateText('monitorCrew', stats.creators);
    updateText('monitorRoles', Object.values(stats.roleCounts).reduce((a, b) => a + b, 0));

    // Update specific role counts if they exist in UI
    Object.keys(stats.roleCounts).forEach(role => {
        const id = `count${role.charAt(0).toUpperCase() + role.slice(1)}`;
        updateText(id, stats.roleCounts[role]);
    });
}

function updateText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ── AUTH LOGIC ── */
if (loginBtn) {
    loginBtn.onclick = () => {
        if (API.auth.isLoggedIn()) {
            window.location.href = 'profile.html';
        } else {
            loginModal.style.display = 'flex';
        }
    };
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await API.users.login(email, password);
        if (response.success) {
            API.auth.saveToken(response.token, response.user);
            showToast(`Welcome back, ${response.user.name}! ✦`);
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (err) {
        showToast('❌ Invalid credentials');
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        role: document.getElementById('registerRole').value,
        college: document.getElementById('registerCollege').value,
        city: document.getElementById('registerCity').value
    };

    if (data.password.length < 6) return showToast('❌ Password too short');

    try {
        const response = await API.users.register(data);
        if (response.success) {
            showToast('Account created! Sign in now ✦');
            registerModal.style.display = 'none';
            loginModal.style.display = 'flex';
        }
    } catch (err) {
        showToast('❌ Registration failed');
    }
});

/* ── UPLOAD LOGIC ── */
async function uploadScript() {
    const title = document.getElementById('scriptTitle').value.trim();
    const genre = document.getElementById('scriptTheme').value;
    const synopsis = document.getElementById('scriptDesc').value.trim();
    const author_name = document.getElementById('authorName').value.trim();

    if (!title) return showToast('Please enter a title ✦');
    if (!API.auth.isLoggedIn()) return showToast('Please login to upload ✦');

    const user = API.auth.getUser();
    
    try {
        const response = await API.scripts.create({
            title, genre, synopsis, 
            author_name: author_name || user.name,
            user_id: user.id
        });

        if (response.success) {
            showToast('Script submitted to cloud ✦');
            document.getElementById('scriptTitle').value = '';
            document.getElementById('scriptDesc').value = '';
            loadLiveScripts();
        }
    } catch (err) {
        showToast('❌ Cloud upload failed');
    }
}

/* ── UI HELPERS ── */
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Modal closing logic
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.onclick = () => btn.closest('.modal').style.display = 'none';
});

document.getElementById('registerLink')?.addEventListener('click', () => {
    loginModal.style.display = 'none';
    registerModal.style.display = 'flex';
});

document.getElementById('backToLoginLink')?.addEventListener('click', () => {
    registerModal.style.display = 'none';
    loginModal.style.display = 'flex';
});

/* ── SEARCH ── */
const searchInput = document.getElementById('liveSearchInput');
searchInput?.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    const response = await API.scripts.search(query);
    if (response.success) renderScriptCards(response.data);
}, 300));

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/* ── STATUS BAR TIME ── */
function updateTime() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateTime, 1000);

/* ── INIT ── */
loadLiveScripts();
updateTime();
