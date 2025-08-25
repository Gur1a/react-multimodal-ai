"use strict"

// 官方 SDK（按你当前使用的包）
const tencentcloud = require("tencentcloud-sdk-nodejs-hunyuan")
const HunyuanClient = tencentcloud.hunyuan.v20230901.Client

function createClient({ secretId, secretKey, region }) {
	const sdkClient = new HunyuanClient({
		credential: { secretId, secretKey },
		region,
		profile: { httpProfile: { endpoint: "hunyuan.tencentcloudapi.com" } },
	})

	return {
		/**
		 * 统一聊天调用
		 * 入参兼容两种格式：
		 * - { Model, Messages, Stream? } 直接透传给 SDK
		 * - { model, messages } 将被转换为 SDK 需要的格式
		 */
		async chatCompletions(payload) {
			const isSdkShape = payload && (payload.Model || payload.Messages)
			const req = isSdkShape
				? payload
				: {
					Model: payload.model || "hunyuan-turbos-latest",
					Messages: (payload.messages || []).map((m) => ({
						Role: m.role || "user",
						Content: m.content || "",
					})),
					Stream: true,
				}

			await sdkClient.ChatCompletions(req)
		},
	}
}

module.exports = { createClient }