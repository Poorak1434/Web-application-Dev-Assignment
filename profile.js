/* ── CUSTOM CURSOR ── */
const dot = document.getElementById('dot');
let mx = 0, my = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
});

(function animateCursor() {
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
    requestAnimationFrame(animateCursor);
})();

/* ── LIVE CLOCK (STATUS BAR) ── */
function updateTime() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    const t = new Date();
    el.textContent = t.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
setInterval(updateTime, 1000);
updateTime();

/* ── TAB SWITCHING ── */
function switchTab(name, btn) {
    /* Hide all panes, deactivate all tabs */
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));

    /* Activate the selected pane */
    document.getElementById('tab-' + name).classList.add('active');

    /* Activate the correct button */
    if (btn) {
        btn.classList.add('active');
    } else {
        /* Called without a button reference (e.g. from "Edit Profile" link) */
        document.querySelectorAll('.ctab').forEach(b => {
            if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(name)) {
                b.classList.add('active');
            }
        });
    }
}

/* ── AVATAR UPLOAD ── */
let currentAvatarFile = null;

function changeAvatar(input) {
    if (!input.files[0]) return;
    currentAvatarFile = input.files[0];
    
    // Show the save button immediately
    const saveBtn = document.getElementById('saveAvatarBtn');
    if (saveBtn) saveBtn.style.display = 'block';

    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('profilePic').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
}

/* ── LIVE NAME PREVIEW ── */
function liveUpdateName(val) {
    const el = document.getElementById('profileName');
    if (val.trim()) el.textContent = val;
}

function splitSkills(skills) {
    return String(skills || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function cardTone(genre) {
    const tones = {
        horror: '#2a0808',
        romance: '#080e20',
        action: '#0a1808',
        comedy: '#181408',
        thriller: '#10080a',
        drama: '#08101a',
        'sci-fi': '#08121c'
    };

    return tones[String(genre || '').toLowerCase()] || '#141018';
}

function renderSkillBadges(skills) {
    const wrap = document.getElementById('skillBadges');
    if (!wrap) return;

    const items = splitSkills(skills);
    if (items.length === 0) {
        wrap.innerHTML = '<span class="badge">New Creator</span>';
        updateStat('skillsCount', 0);
        return;
    }

    wrap.innerHTML = items.map(skill => `<span class="badge">${skill}</span>`).join('');
    updateStat('skillsCount', items.length);
}

function setProfileGate(show) {
    const gate = document.getElementById('profileAuthGate');
    const main = document.querySelector('.profile-main');
    const logout = document.getElementById('profileLogoutBtn');

    if (gate) gate.hidden = !show;
    if (main) main.hidden = show;
    if (logout) logout.hidden = show;
}

function renderProjects(scripts) {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    const items = Array.isArray(scripts) ? scripts : [];
    const cards = items.map((script, index) => `
        <div class="project-card"
             style="background: linear-gradient(160deg, ${cardTone(script.genre)} 0%, #06080A 100%)">
          <div class="pc-num">${String(index + 1).padStart(3, '0')}</div>
          <div class="pc-genre">${script.genre || 'General'}</div>
          <div class="pc-title">${script.title || 'Untitled Script'}</div>
        </div>
    `).join('');

    grid.innerHTML = `
        ${cards || `
        <div class="project-card"
             style="background: rgba(255,77,26,0.03); border: 1px dashed rgba(255,77,26,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 12px; color: rgba(255,77,26,0.5); text-transform: uppercase; letter-spacing: 0.2em;">No scripts yet</div>
        </div>`}
        <div class="project-card"
             style="background: rgba(255,77,26,0.03);
                    border: 1px dashed rgba(255,77,26,0.2);
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    cursor: none;"
             onclick="window.location='index.html#upload'">
          <div style="font-size: 28px; color: rgba(255,77,26,0.3); margin-bottom: 8px;">+</div>
          <div style="font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase;
                      color: rgba(255,77,26,0.4);">New Script</div>
        </div>
    `;

    updateStat('projCount', items.length);
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function populateProfile(profile) {
    document.getElementById('profileName').textContent = profile.name || 'Creator Name';
    document.getElementById('profileRole').textContent =
        ['Filmmaker', profile.role || '']
            .filter(Boolean)
            .join(' · ');
    document.getElementById('profileMeta').textContent =
        [profile.city || '', profile.college || '']
            .filter(Boolean)
            .join(' · ') || 'Open to collaborations';

    document.getElementById('profileBio').textContent =
        profile.bio || `Based in ${profile.city || 'your city'} — open to collaborations.`;

    if (profile.avatar_url) {
        document.getElementById('profilePic').src = profile.avatar_url;
    }

    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editRole').value = profile.role || '';
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editSkills').value = profile.skills || '';
    document.getElementById('editCollegeCity').value = `${profile.college || ''} · ${profile.city || ''}`;
    document.getElementById('editPortfolio').value = profile.portfolio_url || '';

    renderSkillBadges(profile.skills);
    renderProjects(profile.scripts || []);

    updateStat('profileCity', profile.city || '--');
}

async function loadProfile() {
    if (typeof API === 'undefined' || !API.auth || !API.users) return;

    const authUser = API.auth.getUser();
    if (!authUser || !authUser.id) {
        setProfileGate(true);
        return;
    }

    try {
        setProfileGate(false);
        const response = await API.users.getProfile(authUser.id);
        if (response.success && response.data) {
            populateProfile(response.data);
            loadCollaborationRequests(authUser.id);
        }
    } catch (err) {
        console.error('Profile load failed:', err);
        showToast(`Could not load profile ✦`);
    }
}

document.getElementById('profileLogoutBtn')?.addEventListener('click', () => {
    API.auth.logout();
});

function requestCard(request, mode) {
    const otherName = mode === 'incoming'
        ? request.requester_name
        : request.owner_name;
    const contactEmail = mode === 'incoming'
        ? request.requester_email
        : request.owner_email;
    const roleLine = mode === 'incoming'
        ? `${request.requester_role || 'Crew'}${request.requester_city ? ' · ' + request.requester_city : ''}`
        : 'Project owner';

    return `
        <div class="request-card">
            <div>
                <div class="request-script">${request.script_title || 'Untitled Script'}</div>
                <div class="request-meta">${request.script_genre || 'General'} · ${request.status || 'pending'}</div>
                <div class="request-person">${otherName || 'Creator'} · ${roleLine}</div>
                <div class="request-message">${request.message || 'No message added.'}</div>
            </div>
            <a class="request-contact" href="mailto:${contactEmail}?subject=TAKE%20ONE%20Collaboration">Contact</a>
        </div>
    `;
}

function renderRequestList(id, requests, mode) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!Array.isArray(requests) || requests.length === 0) {
        el.innerHTML = `
            <div class="collab-empty">
                <div class="collab-reel"><span>🎬</span></div>
                <p>${mode === 'incoming' ? 'No incoming requests yet' : 'No sent requests yet'}</p>
                <em>${mode === 'incoming' ? 'Crew requests for your scripts will appear here.' : 'Requests you send to productions will appear here.'}</em>
            </div>
        `;
        return;
    }

    el.innerHTML = requests.map(request => requestCard(request, mode)).join('');
}

async function loadCollaborationRequests(userId) {
    if (typeof API === 'undefined' || !API.requests) return;

    try {
        const response = await API.requests.forUser(userId);
        const data = response.data || {};
        renderRequestList('incomingRequests', data.incoming || [], 'incoming');
        renderRequestList('outgoingRequests', data.outgoing || [], 'outgoing');
    } catch (err) {
        console.error('Request load failed:', err);
    }
}

/* ── SAVE PROFILE ── */
async function saveProfile() {
    if (!API.auth.isLoggedIn()) return;
    const user = API.auth.getUser();
    
    const updatedData = {
        name: document.getElementById('editName').value.trim(),
        role: document.getElementById('editRole').value.trim(),
        bio: document.getElementById('editBio').value.trim(),
        skills: document.getElementById('editSkills').value.trim(),
        college: document.getElementById('editCollegeCity').value.split('·')[0]?.trim() || '',
        city: document.getElementById('editCollegeCity').value.split('·')[1]?.trim() || '',
        portfolio_url: document.getElementById('editPortfolio').value.trim()
    };

    try {
        // Handle avatar upload if a new file was selected
        if (currentAvatarFile) {
            const fileName = `${user.id}-${Date.now()}.${currentAvatarFile.name.split('.').pop()}`;
            const uploadRes = await API.storage.upload('avatars', fileName, currentAvatarFile);
            if (uploadRes.success) {
                updatedData.avatar_url = uploadRes.url;
            }
        }

        const response = await API.users.update(user.id, updatedData);
        if (response.success) {
            showToast('Profile updated! ✓');
            currentAvatarFile = null;
            const saveBtn = document.getElementById('saveAvatarBtn');
            if (saveBtn) saveBtn.style.display = 'none';
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (err) {
        showToast('❌ Update failed');
        console.error(err);
    }
}

/* ── TOAST NOTIFICATION ── */
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

loadProfile();
