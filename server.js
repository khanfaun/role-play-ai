const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://khanfaun-role-play-ai.netlify.app/',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10mb' }));

// Phục vụ các file tĩnh từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'dist')));

// --- Logic xử lý nhiều API key ---
const apiKeysString = process.env.API_KEYS;
const apiKeys = apiKeysString ? apiKeysString.split(',').map(key => key.trim()).filter(key => key) : [];
let currentKeyIndex = 0;

if (apiKeys.length === 0) {
    console.error("FATAL ERROR: Biến môi trường API_KEYS chưa được thiết lập hoặc không chứa key nào.");
}
// ---------------------------------

app.post('/api/generateContent', async (req, res) => {
    if (apiKeys.length === 0) {
        return res.status(500).json({ error: 'Không có API key nào được cấu hình trên máy chủ.' });
    }

    const { model, contents, config } = req.body;
    if (!model || !contents) {
        return res.status(400).json({ error: 'Thiếu các tham số bắt buộc: model và contents.' });
    }

    // Vòng lặp thử lại với các key khác nhau
    for (let i = 0; i < apiKeys.length; i++) {
        const keyIndexToTry = (currentKeyIndex + i) % apiKeys.length;
        const apiKey = apiKeys[keyIndexToTry];

        try {
            console.log(`Đang thử yêu cầu với API key index: ${keyIndexToTry}`);
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model,
                contents,
                config,
            });
            
            const text = response.text;

            // Nếu thành công, cập nhật index cho lần yêu cầu tiếp theo và trả về kết quả
            currentKeyIndex = (keyIndexToTry + 1) % apiKeys.length;
            
            return res.json({ text });

        } catch (error) {
            console.error(`Lỗi khi gọi API với key index ${keyIndexToTry}:`, error instanceof Error ? error.message : error);
            // Nếu đây là lần thử cuối cùng và vẫn lỗi, trả về lỗi 500
            if (i === apiKeys.length - 1) {
                const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
                return res.status(500).json({ error: 'Tất cả các API key đều không thành công.', details: errorMessage });
            }
            // Nếu không, vòng lặp sẽ tiếp tục với key tiếp theo
        }
    }
});

// Fallback, phục vụ index.html cho các request không khớp file tĩnh (quan trọng cho SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    if (apiKeys.length === 0) {
        console.warn('Cảnh báo: API_KEYS không được thiết lập. Các tính năng AI sẽ bị vô hiệu hóa.');
    } else {
        console.log(`Đã tải thành công ${apiKeys.length} API key. Máy chủ sẵn sàng hoạt động.`);
    }
});
