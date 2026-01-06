
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true, baseURL: 'http://localhost:5000' }));

async function testScheduleApi() {
    try {
        console.log('--- 1. Logging in as Student (Nicole Thass) ---');
        const loginRes = await client.post('/auth/login', {
            userId: 'nicole.thass', // Trying username from earlier debug
            password: 'password123'  // Assuming default password, hoping it works or I need to reset it
        });

        console.log('Login Status:', loginRes.status);
        console.log('User Role:', loginRes.data.user.role);

        console.log('\n--- 2. Fetching Student Schedule ---');
        const scheduleRes = await client.get('/student/schedule');

        console.log('Schedule Status:', scheduleRes.status);
        console.log('Schedule Data Length:', scheduleRes.data.length);
        console.log('Schedule Data:', JSON.stringify(scheduleRes.data, null, 2));

    } catch (error: any) {
        console.error('API Test Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testScheduleApi();
