const period = '2026-08';
const empId = '9b44aa8b-6012-4ba7-b9cc-018563d28668'; // Durrotul

async function run() {
    try {
        const res = await fetch('http://localhost:3002/api/reports/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                period,
                revenueType: 'umum',
                employeeId: empId,
                reportType: 'incentive',
                unitId: null,
                detailLevel: 'summary'
            })
        });
        const d = await res.json();
        console.log(JSON.stringify(d, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
