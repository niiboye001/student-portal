const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function verify() {
    try {
        const STUDENT_CREDENTIALS = { email: 'sharp.brain@gmail.com', password: 'password123' };
        const ADMIN_CREDENTIALS = { email: 'admin@university.edu', password: 'password123' };

        console.log('--- Phase 1: Student Access ---');
        // 1. Login as Student
        const studentLogin = await axios.post(`${BASE_URL}/auth/login`, STUDENT_CREDENTIALS);
        const studentCookies = studentLogin.headers['set-cookie'];
        console.log('Student logged in. Role:', studentLogin.data.user.role);

        // 2. Try Admin endpoint with student identity
        try {
            await axios.get(`${BASE_URL}/admin/stats`, {
                headers: { Cookie: studentCookies.join('; ') }
            });
            console.error('FAIL: Student accessed admin route!');
        } catch (err) {
            console.log('SUCCESS: Student blocked from admin route (Status:', err.response.status, ')');
        }

        console.log('\n--- Phase 2: Admin Access ---');
        // 3. Login as Admin
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        const adminCookies = adminLogin.headers['set-cookie'];
        console.log('Admin logged in. Role:', adminLogin.data.user.role);

        // 4. Try Admin endpoint with admin identity
        const adminStats = await axios.get(`${BASE_URL}/admin/stats`, {
            headers: { Cookie: adminCookies.join('; ') }
        });
        console.log('SUCCESS: Admin accessed admin route. Data:', adminStats.data);

        console.log('\n--- Phase 3: Token Refresh ---');
        // 5. Try to refresh
        console.log('Waiting 1s before refresh...');
        await new Promise(r => setTimeout(r, 1000));
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
            headers: { Cookie: adminCookies.join('; ') }
        });
        console.log('SUCCESS: Token refreshed. Status:', refreshResponse.status);

    } catch (error) {
        console.error('Verification failed:', error.message);
        if (error.response) console.error('Data:', error.response.data);
    }
}

verify();
