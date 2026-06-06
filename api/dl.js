const axios = require('axios');

// Fungsi untuk decode Base64
const atob = (str) => Buffer.from(str, 'base64').toString('binary');

module.exports = async (req, res) => {
    // Mengatasi masalah CORS agar bisa diakses dari web/bot mana pun
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tangani preflight request untuk CORS (jika diakses dari browser via fetch)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const encodedUrl = req.query.url;
    const cookieString = req.query.cookie;

    // 1. Jika tidak ada parameter url, tampilkan halaman utama/info
    if (!encodedUrl) {
        return res.status(200).json({
            "service": "My Custom Proxy Vercel",
            "routes": {
                "/api/dl?url=<URL_BASE64>&cookie=<COOKIE>": "Download proxy dengan penyamaran URL"
            }
        });
    }

    try {
        // Decode URL asli dari Base64 ke teks biasa
        const decodedUrl = atob(encodedUrl);

        // Siapkan header untuk menembak ke server asli
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (cookieString) {
            try {
                headers['Cookie'] = atob(cookieString);
            } catch {
                headers['Cookie'] = cookieString;
            }
        }

        // Ambil data/file dari URL asli dengan format stream
        const response = await axios({
            method: 'get',
            url: decodedUrl,
            headers: headers,
            responseType: 'stream'
        });

        // Teruskan header penting dari server asli ke user
        const targetHeaders = ['content-type', 'content-length', 'content-disposition', 'accept-ranges'];
        targetHeaders.forEach(header => {
            if (response.headers[header]) {
                res.setHeader(header, response.headers[header]);
            }
        });

        // Alirkan data file langsung ke respon Vercel
        response.data.pipe(res);

    } catch (error) {
        res.status(500).json({ "error": "Gagal melakukan proxy di Vercel: " + error.message });
    }
};
