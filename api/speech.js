export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 这里收到前端传来的音频数据
    const audioData = req.body;
    // 用你的密钥调用第三方 API（比如 Google）
    // 返回识别结果
    res.status(200).json({ result: '识别出的文本' });
  } else {
    res.status(405).end();
  }
}
