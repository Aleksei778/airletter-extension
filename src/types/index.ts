export interface AttachmentDataToParse {
    filename: string
    url: string
    filesize: string
}

export interface AttachmentDataParsed {
    filename: string
    content: string
    mimetype: string
    size: number
}

export interface ParsedEmails {
    id: string
    spreadsheetId: string
    emails: string[]
}

export interface SubscriptionData {
    plan?: string
}

export interface TimeSettings {
    date: string
    time: string
    timezone: string
}

export interface EmailData extends TimeSettings {
    recipients: string[]
    subject: string
    body: string
}

export interface CampaignData extends EmailData {
    files: AttachmentDataParsed[]
}

export interface SheetsModalWindowProps {
    onSubmit: (spreadsheetId: string, range: string) => Promise<void>
    onClose?: () => void
}

export interface CampaignDropdownProps {
    isVisible: boolean
}

export interface ProfileButtonProps {
    onClick?: () => Promise<void>
}

export interface AirletterButtonProps {
    onClick?: () => Promise<void>
}

export interface WebsiteButtonProps {
    onClick?: () => Promise<void>
}
