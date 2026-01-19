
// Native fetch used
// import fetch from 'node-fetch';

const STAFF_USER_ID = 'STF-86690'; // Use actual ID if needed, but endpoint uses cookie/jwt.
// Actually my debug scripts used login flow. I need to replicate that.

async function verify() {
    try {
        console.log("1. Logging in...");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'STF-86690', password: 'Staff123!' })
        });

        if (!loginRes.ok) throw new Error("Login failed");

        const cookie = loginRes.headers.get('set-cookie');
        const courseId = '75befe0c-cf19-47a9-baec-caff47c953b8'; // Calculus I

        console.log("2. Testing VALID assignment...");
        const validRes = await fetch(`http://localhost:3000/api/staff/courses/${courseId}/assignments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie || ''
            },
            body: JSON.stringify({
                title: "API Verification Valid",
                description: "Should succeed",
                dueDate: "2026-05-20T10:00:00",
                fileUrl: "" // Empty string test
            })
        });

        if (validRes.status === 201) {
            console.log("✅ Valid Assignment: Created successfully.");
        } else {
            console.log(`❌ Valid Assignment Failed: ${validRes.status} ${await validRes.text()}`);
        }

        console.log("3. Testing INVALID DATE...");
        const invalidRes = await fetch(`http://localhost:3000/api/staff/courses/${courseId}/assignments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie || ''
            },
            body: JSON.stringify({
                title: "API Verification Invalid",
                description: "Should fail 400",
                dueDate: "InvalidDateString",
                fileUrl: ""
            })
        });

        if (invalidRes.status === 400) {
            console.log("✅ Invalid Date: Rejected with 400 (Correct).");
        } else {
            console.log(`❌ Invalid Date Failed check: Got ${invalidRes.status} (Expected 400). Body: ${await invalidRes.text()}`);
        }

    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verify();
