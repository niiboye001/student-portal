
async function testLogin() {
    try {
        console.log('Testing login with Username (STF-54321)...');
        const res1 = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'STF-54321', password: 'password123' })
        });
        const data1 = await res1.json();
        console.log('Username Login Status:', res1.status);
        if (res1.ok) console.log('User:', data1.user.email);
        else console.log('Error:', data1.message);

        console.log('\nTesting login with Email (sarah.connor@university.edu)...');
        const res2 = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'sarah.connor@university.edu', password: 'password123' })
        });
        const data2 = await res2.json();
        console.log('Email Login Status:', res2.status);
        if (res2.ok) console.log('User:', data2.user.username);
        else console.log('Error:', data2.message);

    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

testLogin();
