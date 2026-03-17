// api/speech.js - 有道智云短语音识别API
import crypto from 'crypto';

export default async function handler(req, res) {
  // 设置CORS头，允许您的GitHub Pages前端访问
  res.setHeader('Access-Control-Allow-Origin', 'https://726113394-cloud.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求（OPTIONS）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const appKey = process.env.YOUDAO_APP_KEY;
    const appSecret = process.env.YOUDAO_APP_SECRET;

    if (!appKey || !appSecret) {
      return res.status(500).json({ error: '有道API密钥未配置' });
    }

    const { audioBase64 } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: '缺少音频数据' });
    }

    // 生成有道API所需参数
    const salt = crypto.randomUUID();
    const curtime = Math.round(Date.now() / 1000).toString();

    // 签名规则：sha256(appKey + truncate(q) + salt + curtime + appSecret)
    // truncate：若音频base64长度>20，取前10+长度+后10，否则直接返回
    const q = audioBase64;
    const truncate = (str) => {
      const len = str.length;
      if (len <= 20) return str;
      return str.substring(0, 10) + len + str.substring(len - 10, len);
    };
    const signStr = appKey + truncate(q) + salt + curtime + appSecret;
    const sign = crypto.createHash('sha256').update(signStr).digest('hex');

    // 构建请求参数
    const params = new URLSearchParams({
      q: q,
      appKey: appKey,
      salt: salt,
      curtime: curtime,
      sign: sign,
      signType: 'v4',
      langType: 'en',        // 识别英语
      format: 'wav',         // 音频格式，浏览器录制的是webm，需要转换（见说明）
      rate: '16000',
      channel: '1',
      type: '1'              // 1表示base64上传
    });

    // 调用有道API
    const apiUrl = 'https://openapi.youdao.com/asrapi';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();

    if (data.errorCode === '0') {
      // 成功：返回识别结果
      res.status(200).json({ result: data.result[0] });
    } else {
      res.status(500).json({ error: `有道API错误: ${data.errorCode}` });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
