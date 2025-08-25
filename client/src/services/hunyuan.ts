export interface ChatRequest {
	text: string
	images?: string[]
}

export interface ChatStreamHandlers {
	onDelta: (delta: string) => void
	onDone?: () => void
	signal?: AbortSignal
}

const { env } = require('../config/env')
const tencentcloud = require("tencentcloud-sdk-nodejs-hunyuan")
const HunyuanClient = tencentcloud.hunyuan.v20230901.Client
const secretId = env.secretId
const secretKey = env.secretKey
const region = env.region

const client = new HunyuanClient({
	credential: { secretId, secretKey },
	region,
	profile: { httpProfile: { endpoint: "hunyuan.tencentcloudapi.com" } },
})

const useAI = async (payload : ChatRequest, handlers : ChatStreamHandlers) => {
    const result = await client.ChatCompletions(payload)

    for await (const chunk of result) {
        handlers.onDelta(chunk)
    }
    handlers.onDone
}


module.exports = { useAI }


