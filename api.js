const SUPABASE_URL = 'https://alkfuzmgxbstyzfnmabm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa2Z1em1neGJzdHl6Zm5tYWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzA2MTIsImV4cCI6MjA5MzM0NjYxMn0.ELUAWrRD48qi6VIzba87ioYdROqKfVuxno_AouLJl5g';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

const API = {
    // Auth State & Methods
    auth: {
        isLoggedIn: () => !!localStorage.getItem('takeone_user'),
        getUser: () => {
            const user = localStorage.getItem('takeone_user');
            return user ? JSON.parse(user) : null;
        },
        saveToken: (token, user) => {
            localStorage.setItem('takeone_user', JSON.stringify(user));
        },
        logout: () => {
            localStorage.removeItem('takeone_user');
            window.location.reload();
        }
    },

    // Users API
    users: {
        login: async (email, password) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${email}&password=eq.${password}`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'Login request failed');
            }
            const users = await response.json();
            if (users.length > 0) {
                return { success: true, user: users[0], token: 'supabase-token' };
            }
            throw new Error('Invalid email or password');
        },
        register: async (userData) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (!response.ok) {
                // Supabase returns error objects, not arrays, on failure
                const msg = result?.message || result?.error || 'Registration failed';
                if (response.status === 409 || (msg && msg.toLowerCase().includes('duplicate'))) {
                    throw new Error('An account with this email already exists.');
                }
                throw new Error(msg);
            }
            // On success, result is an array with the created row
            if (Array.isArray(result) && result.length > 0) {
                return { success: true, user_id: result[0].id };
            }
            // Some Supabase versions return a single object
            if (result && result.id) {
                return { success: true, user_id: result.id };
            }
            // If we got a 2xx but no data, still treat as success
            if (response.ok) {
                return { success: true };
            }
            throw new Error('Registration failed. Please try again.');
        },
        getProfile: async (id) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}&select=*,scripts(*)`, {
                method: 'GET',
                headers: headers
            });
            const data = await response.json();
            return { success: true, data: data[0] };
        },
        update: async (id, data) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });
            const result = await response.json();
            const user = API.auth.getUser();
            localStorage.setItem('takeone_user', JSON.stringify({ ...user, ...data }));
            return { success: true, data: result[0] };
        }
    },

    // Homepage Data
    home: {
        get: async () => {
            const scriptsResponse = await fetch(`${SUPABASE_URL}/rest/v1/scripts?select=*&order=created_at.desc&limit=12`, {
                method: 'GET',
                headers: headers
            });
            const scripts = await scriptsResponse.json();

            const usersCountResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
                method: 'GET',
                headers: { ...headers, 'Prefer': 'count=exact' }
            });
            const userCount = usersCountResponse.headers.get('Content-Range')?.split('/')[1] || 0;

            const scriptsCountResponse = await fetch(`${SUPABASE_URL}/rest/v1/scripts?select=count`, {
                method: 'GET',
                headers: { ...headers, 'Prefer': 'count=exact' }
            });
            const scriptCount = scriptsCountResponse.headers.get('Content-Range')?.split('/')[1] || 0;

            return {
                success: true,
                scripts: scripts || [],
                stats: {
                    creators: parseInt(userCount) + 50,
                    scripts: parseInt(scriptCount) + 10,
                    colleges: 8,
                    roleCounts: { director: 12, camera: 8, writer: 15, sound: 5, editor: 6, gaffer: 4, actor: 20, spotBoy: 5 }
                }
            };
        }
    },

    // Scripts API
    scripts: {
        getById: async (id) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/scripts?id=eq.${id}&select=*`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) throw new Error('Failed to fetch script');
            const data = await response.json();
            if (!data || data.length === 0) throw new Error('Script not found');
            return { success: true, data: data[0] };
        },
        search: async (query = '', genre = '') => {
            let url = `${SUPABASE_URL}/rest/v1/scripts?select=*`;
            if (query) url += `&or=(title.ilike.*${query}*,synopsis.ilike.*${query}*)`;
            if (genre) url += `&genre=eq.${genre}`;
            url += `&order=created_at.desc`;

            const response = await fetch(url, { method: 'GET', headers: headers });
            const data = await response.json();
            return { success: true, data: data || [] };
        },
        create: async (scriptData) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/scripts`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(scriptData)
            });
            const result = await response.json();
            return { success: true, data: result[0] };
        }
    },

    // Requests API
    requests: {
        forUser: async (userId) => {
            const incomingRes = await fetch(`${SUPABASE_URL}/rest/v1/requests?owner_id=eq.${userId}&select=*,scripts(title,genre)`, {
                method: 'GET',
                headers: headers
            });
            const incoming = await incomingRes.json();

            const outgoingRes = await fetch(`${SUPABASE_URL}/rest/v1/requests?requester_id=eq.${userId}&select=*,scripts(title,genre)`, {
                method: 'GET',
                headers: headers
            });
            const outgoing = await outgoingRes.json();

            return { 
                success: true, 
                data: { 
                    incoming: incoming.map(r => ({ ...r, script_title: r.scripts?.title, script_genre: r.scripts?.genre })), 
                    outgoing: outgoing.map(r => ({ ...r, script_title: r.scripts?.title, script_genre: r.scripts?.genre })) 
                } 
            };
        }
    },

    // Storage API
    storage: {
        upload: async (bucket, path, file) => {
            const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': file.type
                },
                body: file
            });
            const result = await response.json();
            if (result.Id || result.Key) {
                return { success: true, url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` };
            }
            throw new Error(result.error || 'Upload failed');
        }
    }
};
