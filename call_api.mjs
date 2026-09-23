import http from 'http';

const postData = JSON.stringify({
    reportType: 'incentive',
    period: '2026-08',
    revenueType: 'bpjs',
    unitId: null,
    employeeId: null,
    detailLevel: 'summary'
});

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/reports/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            const sakdiyah = result.data.find(r => r.employee_code === 'PEG004');
            const rudi = result.data.find(r => r.employee_code === 'PEG002');
            console.log('Sakdiyah potongan:', sakdiyah?.potongan);
            console.log('Sakdiyah distribusi_potongan:', sakdiyah?.distribusi_potongan);
            console.log('Sakdiyah gross_incentive:', sakdiyah?.gross_incentive);

            console.log('Rudi potongan:', rudi?.potongan);
            console.log('Rudi distribusi_potongan:', rudi?.distribusi_potongan);
            console.log('Rudi gross_incentive:', rudi?.gross_incentive);
        } catch (e) {
            console.error('Error parsing:', e.message);
            console.log('Raw output:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
