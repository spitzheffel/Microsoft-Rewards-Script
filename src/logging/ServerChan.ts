import { httpRequest } from '../util/Http'
import type { HttpRequestConfig } from '../util/Http'
import PQueue from 'p-queue'
import type { WebhookServerChanConfig } from '../interface/Config'
import { flushQueue } from './Queue'

const serverChanQueue = new PQueue({
    interval: 1000,
    intervalCap: 2,
    carryoverConcurrencyCount: true
})

export async function sendServerChan(config: WebhookServerChanConfig, content: string): Promise<void> {
    if (!config?.sendKey) return

    // 与官方 serverchan-sdk 一致：Server酱³ 的 sctp{uid}t... 走 {uid}.push.ft07.com，Turbo 版 SCT... 走 sctapi.ftqq.com
    const sc3Uid = /^sctp(\d+)t/.exec(config.sendKey)?.[1]
    const url = sc3Uid
        ? `https://${sc3Uid}.push.ft07.com/send/${config.sendKey}.send`
        : `https://sctapi.ftqq.com/${config.sendKey}.send`

    const request: HttpRequestConfig = {
        method: 'POST',
        url,
        headers: { 'Content-Type': 'application/json' },
        data: {
            title: config.title ?? 'Microsoft-Rewards-Script',
            desp: content
        },
        timeout: 10000
    }

    await serverChanQueue.add(async () => {
        try {
            await httpRequest(request)
        } catch (err) {
            const status = (err as { response?: { status?: number } })?.response?.status
            if (status === 429) return
        }
    })
}

export function flushServerChanQueue(timeoutMs = 5000): Promise<void> {
    return flushQueue(serverChanQueue, timeoutMs)
}
