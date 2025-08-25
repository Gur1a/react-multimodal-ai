'use strict'

const { env } = require('../config/env')
const tencentcloud = require("tencentcloud-sdk-nodejs-hunyuan")
const HunyuanClient = tencentcloud.hunyuan.v20230901.Client
const secretId = env.secretId
const secretKey = env.secretKey
const region = env.region

const client = new HunyuanClient({
	credential: { secretId, secretKey  },
	region,
	profile: { httpProfile: { endpoint: "hunyuan.tencentcloudapi.com" } },
})

async function chat(req, res, next) {
    try {
        // 解析URL参数
        const { payload } = req.query;

        if (!payload) {
            return res.status(400).json({ error: 'Missing payload parameter' });
        }

        // 解析payload
        let requestData;
        try {
            requestData = JSON.parse(decodeURIComponent(payload));
        } catch (err) {
            return res.status(400).json({ error: 'Invalid payload format' });
        }

        const { text, images = [] } = requestData;

        // 设置SSE响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*'); // 根据实际情况调整CORS


        // 心跳机制防止连接超时
        const heartbeat = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 30000);

        // 调用腾讯混元API
        const apiPayload = {
            Model: 'hunyuan-turbos-latest',
            Stream: true,
            Messages: [{ Role: 'user', Content: text }],
        };

        const result = await client.ChatCompletions(apiPayload);

        if (typeof result?.on === 'function') {
            let answer = '';
            let chunks = []; // 收集所有内容块
            
            // 首先收集所有数据
            result.on('message', (msg) => {
                try {
                    const s = typeof msg === 'string' ? msg : (msg?.data || '');
                    if (!s) return;

                    const data = JSON.parse(s);
                    const choices = data?.Choices || [];

                    choices.forEach(choice => {
                        const delta = choice?.Delta?.Content ?? '';
                        const finishReason = choice?.FinishReason;
                        
                        if (delta) {
                            answer += delta;
                        }
                        
                        if (finishReason === 'stop') {
                            // 数据收集完成，开始分块发送
                            console.log('数据收集完成，开始模拟打字机发送:', answer);
                            
                            // 按照ChatSSE模式分块发送
                            const characters = answer.toString();
                            let index = 0;
                            
                            const interval = setInterval(() => {
                                if (index < characters.length) {
                                    // 生成1-5个字符的随机块
                                    const chunkSize = Math.floor(Math.random() * 5) + 1;
                                    const chunk = characters.slice(index, index + chunkSize);
                                    
                                    res.write(`data: ${JSON.stringify({
                                        delta: chunk,
                                        id: data.Id,
                                        created: data.Created
                                    })}\n\n`);
                                    
                                    console.log('发送块:', chunk);
                                    index += chunkSize;
                                } else {
                                    // 发送完成
                                    clearInterval(interval);
                                    res.write(`data: ${JSON.stringify({
                                        done: true,
                                        id: data.Id,
                                        created: data.Created,
                                        usage: data.Usage
                                    })}\n\n`);
                                    
                                    clearInterval(heartbeat);
                                    res.end();
                                }
                            }, 100); // 100ms间隔
                            
                            // 监听客户端断开连接
                            req.on('close', () => {
                                clearInterval(interval);
                                clearInterval(heartbeat);
                            });
                        }
                    });
                } catch (err) {
                    res.write(`data: ${JSON.stringify({
                        error: 'Failed to parse API response',
                        details: String(err?.message || err)
                    })}\n\n`);
                    clearInterval(heartbeat);
                    res.end();
                }
            });

            result.on('error', (err) => {
                res.write(`data: ${JSON.stringify({
                    error: 'API request failed',
                    details: String(err?.message || err)
                })}\n\n`);
                clearInterval(heartbeat);
                res.end();
            });
        } else {
            // 处理非流式响应
            const answer = result?.choices?.[0]?.message?.content || '';
            res.write(`data: ${JSON.stringify({
                delta: answer,
                done: true
            })}\n\n`);
            clearInterval(heartbeat);
            res.end();
        }

        // 处理客户端断开连接
        req.on('close', () => {
            clearInterval(heartbeat);
            if (typeof result?.destroy === 'function') {
                result.destroy();
            }
        });

    } catch (err) {
        // 错误处理
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        } else {
            res.write(`data: ${JSON.stringify({
                error: 'Chat failed',
                details: String(err?.message || err)
            })}\n\n`);
            res.end();
        }
    }
}

module.exports = { chat }


