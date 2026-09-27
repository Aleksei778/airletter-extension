import { API_CONF } from "~src/utils/constants"
import { storageService } from "~src/services/storage"
import type { CampaignData, SubscriptionData } from "~src/types"

class AuthManager {
    private baseUrl = API_CONF.API_URL
    private apiEndpoints = API_CONF.API_ENDPOINTS
    private storageService = storageService

    async login(interactive: boolean = true): Promise<string> {
        return new Promise((resolve, reject) => {
            const authUrl = this.baseUrl + this.apiEndpoints.LOGIN

            console.log('[Airletter] Starting OAuth flow:', authUrl)

            chrome.identity.launchWebAuthFlow(
                {
                    url: authUrl,
                    interactive: interactive
                },
                async (redirectUrl) => {
                    console.log('[Airletter] RAW redirectUrl:', redirectUrl)

                    if (chrome.runtime.lastError) {
                        console.error('[Airletter] OAuth error:', chrome.runtime.lastError.message)
                        reject(chrome.runtime.lastError)
                        return
                    }

                    if (!redirectUrl) {
                        reject(new Error('[Airletter] No redirect URL'))
                        return
                    }

                    console.log('[Airletter] Got redirect URL:', redirectUrl)

                    try {
                        const url = new URL(redirectUrl)
                        const accessToken = url.searchParams.get("access_jwt_token")
                        const refreshToken = url.searchParams.get("refresh_jwt_token")

                        if (!accessToken || !refreshToken) {
                            console.error('[Airletter] No tokens in redirect URL')
                            reject(new Error('[Airletter] No JWT tokens'))
                            return
                        }

                        await this.storageService.setAccessToken(accessToken)
                        await this.storageService.setRefreshToken(refreshToken)

                        console.log(`Tokens: ${accessToken} ${refreshToken}`)

                        console.log('[Airletter] Logged in successfully')
                        resolve(accessToken)
                    } catch (error) {
                        console.error('[Airletter] Error parsing redirect URL:', error)
                        reject(error)
                    }
                }
            )
        })
    }

    private async refreshToken(): Promise<string> {
        const refreshToken = await this.storageService.getRefreshToken()

        if (!refreshToken) {
            throw new Error('[Airletter] No refresh token')
        }

        try {
            const response = await fetch(this.baseUrl + this.apiEndpoints.REFRESH_TOKEN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`,
                }
            })

            if (!response.ok) {
                throw new Error('[Airletter] Failed to refresh token')
            }

            const data = await response.json()
            const newAccessToken = data.access_jwt_token
            const newRefreshToken = data.refresh_jwt_token

            await this.storageService.setAccessToken(newAccessToken)
            await this.storageService.setRefreshToken(newRefreshToken)

            console.log('[Airletter] Token refreshed')

            return newAccessToken
        } catch (error) {
            console.error('[Airletter] Failed to refresh token:', error)
            throw new Error(error.message)
        }
    }

    async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const accessToken = await this.storageService.getAccessToken()

        console.log()

        if (!accessToken) {
            throw new Error('No access token')
        }

        let response = await fetch(this.baseUrl + endpoint, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            }
        })

        if (response.status === 401) {
            console.log('[Airletter] Got 401, refreshing token...')

            try {
                const newAccessToken = await this.refreshToken()

                response = await fetch(this.baseUrl + endpoint, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${newAccessToken}`,
                    }
                })
            } catch (refreshTokenError) {
                console.log('[Airletter] Refresh failed, need re-login')

                await this.login(true)

                const token = await this.storageService.getAccessToken()

                response = await fetch(this.baseUrl + endpoint, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                })
            }
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        return await response.json()
    }

    async getEmailsFromSpreadsheet(
        spreadsheetId: string,
        range: string
    ): Promise<Array<string>> {
        return await this.apiRequest<Array<string>>(
            API_CONF.API_ENDPOINTS.PARSE_EMAILS_FROM_SPREADSHEET,
            {
                method: 'POST',
                body: JSON.stringify({
                    spreadsheet_id: spreadsheetId,
                    range: range,
                })
            }
        )
    }

    async startCampaign(
        campaignData: CampaignData
    ): Promise<string> {
        const accessToken = await this.storageService.getAccessToken()

        let response = await fetch(this.baseUrl + API_CONF.API_ENDPOINTS.START_CAMPAIGN, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignData)
        })

        if (response.status === 401) {
            const newAccessToken = await this.refreshToken()

            response = await fetch(this.baseUrl + API_CONF.API_ENDPOINTS.START_CAMPAIGN, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${newAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(campaignData)
            })
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        return await response.json()
    }

    async fetchAttachment(attachmentUrl: string): Promise<Blob> {
        const response = await fetch(attachmentUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Origin': 'chrome-extension://' + chrome.runtime.id
            },
            mode: 'cors'
        })

        if (!response.ok) {
            console.log("Failed to fetch attachment")

            throw new Error("Failed to fetch attachment")
        }

        return await response.blob()
    }

    async checkSubscription(): Promise<SubscriptionData> {
        return await this.apiRequest<SubscriptionData>(
            API_CONF.API_ENDPOINTS.CHECK_SUBSCRIPTION,
            { method: 'GET' }
        )
    }
}

const authManager = new AuthManager()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === 'GET_EMAILS') {
        authManager.getEmailsFromSpreadsheet(message.spreadsheetId, message.range)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }))
        return true
    }

    if (message.type === 'START_CAMPAIGN') {
        authManager.startCampaign(message.campaignData)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }))
        return true
    }

    if (message.type === 'FETCH_ATTACHMENT') {
        (async() => {
            try {
                const blob = await authManager.fetchAttachment(message.attachmentUrl)

                const reader = new FileReader()

                reader.onloadend = async () => {
                    const base64data = reader.result?.toString().split(',')[1];

                    sendResponse({ success: true, data: base64data, mimetype: blob.type })
                }

                reader.onerror = (e) => {
                    sendResponse({ success: false, error: e })
                }

                reader.readAsDataURL(blob)
            } catch (error) {
                sendResponse({ success: false, error: error.message })
            }
        })();

        return true;
    }

    if (message.type === 'CHECK_SUBSCRIPTION') {
        authManager.checkSubscription()
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }))
        return true
    }
})

chrome.webNavigation.onCompleted.addListener(
    async (details) => {
        if (details.frameId !== 0) return

        console.log('[Airletter] Gmail opened')

        const accessToken = await storageService.getAccessToken()
        const refreshToken = await storageService.getRefreshToken()

        if (!accessToken || !refreshToken) {
            console.log('[Airletter] No tokens, starting login...')

            try {
                await authManager.login(true)

                setTimeout(() => {
                    chrome.tabs.sendMessage(details.tabId, {
                        type: 'AUTH_SUCCESS',
                    }).catch((err) => {
                        console.log('[Airletter] Content script not ready:', err)
                    })
                }, 2000)
            } catch (error) {
                console.error('[Airletter] Login failed:', error.error)
            }
        } else {
            console.log('[Airletter] Has tokens')

            chrome.tabs.sendMessage(details.tabId, {
                type: 'ALREADY_AUTHENTICATED'
            }).catch(() => {})
        }
    },
    {
        url: [{ hostContains: 'mail.google.com' }]
    }
)

console.log('[Airletter] Background script loaded!')

export {}
