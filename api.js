/**
 * TAKE ONE — Supabase API Wrapper
 * This file replaces the local backend with Supabase cloud storage.
 * Uses standard 'fetch' to communicate with Supabase REST API.
 */

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
            // We use the user object directly for simplicity in this mock-auth flow
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
            if (result.length > 0) {
                return { success: true, user_id: result[0].id };
            }
            throw new Error('Registration failed');
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
            // Update local storage too
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
                    roleCounts: { director: 12, camera: 8, writer: 15, sound: 5, editor: 6, gaffer: 4, actor: 20, spot_boy: 5 }
                }
            };
        }
    },

    // Scripts API
    scripts: {
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
    }
};
