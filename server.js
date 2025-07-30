const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://khanfaun-role-play-ai.netlify.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10mb' }));

// Phục vụ các file tĩnh từ thư mục 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// ------ Xử lý yêu cầu AI, nhận key từ client gửi lên ------
app.post('/api/generateContent', async (req, res) => {
    const { model, contents, config, apiKey } = req.body;

    if (!model || !contents) {
        return res.status(400).json({ error: 'Thiếu các tham số bắt buộc: model và contents.' });
    }
    if (!apiKey) {
        return res.status(400).json({ error: 'Bạn phải nhập API key của chính bạn.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model,
            contents,
            config,
        });

        const text = response.text;
        return res.json({ text });
    } catch (error) {
        console.error(`Lỗi khi gọi Gemini API bằng API key user:`, error instanceof Error ? error.message : error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Lỗi không xác định' });
    }
});
// ----------------------------------------------------------

// Fallback, phục vụ index.html cho các request không khớp file tĩnh (quan trọng cho SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
<<<<<<< HEAD
    if (apiKeys.length === 0) {
        console.warn('Cảnh báo: API_KEYS không được thiết lập. Các tính năng AI sẽ bị vô hiệu hóa.');
    } else {
        console.log(`Đã tải thành công ${apiKeys.length} API key. Máy chủ sẵn sàng hoạt động.`);
    }
=======
>>>>>>> a9d0bed (Nội dung update (ví dụ: sửa lỗi, thêm chức năng, ...))
});
