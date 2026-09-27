import { GMAIL_SELECTORS } from "~src/utils/constants"
import type { AttachmentDataToParse, EmailData } from "~src/types";
import { storageService } from "~src/services/storage"
import { getComposeId } from "~src/utils/helpers";

class GmailService {
    async getFilesFromGmailMessageWindow(
        composeWindow: HTMLElement,
    ): Promise<AttachmentDataToParse[]> {
        const hrefs: AttachmentDataToParse[] = []
        const attachmentNodes = composeWindow.querySelectorAll(GMAIL_SELECTORS.ATTACHMENT_NODES);

        for (const node of attachmentNodes) {
            const attachmentInput = node.querySelector("input[name='attach']");

            if (attachmentInput) {
                const link = node.querySelector("a") as HTMLAnchorElement;

                if (link && link.querySelectorAll("div").length === 2) {
                    const divs = link.querySelectorAll("div");
                    const filename = divs[0].innerText
                    const filesize = divs[1].innerText

                    hrefs.push({ url: link.href, filename, filesize })
                }
            }
        }

        return hrefs
    }

    async getEmailDataFromGmailMessagesWindow(
        composeWindow: HTMLElement,
    ): Promise<EmailData> {
        const emailData = {
            recipients: [],
            subject: null,
            body: null,
            date: null,
            time: null,
            timezone: null
        }

        const recipientsNodes = composeWindow.querySelectorAll(
            '.afV[data-hovercard-id], div[peoplekit-id][data-hovercard-id]'
        );

        if (emailData.recipients.length === 0 && recipientsNodes.length > 0) {
            emailData.recipients = Array.from(recipientsNodes)
                .map(node => node.getAttribute("data-hovercard-id"))
                .filter(email =>
                    email &&
                    email.includes('@') &&
                    email.includes('.') &&
                    email !== "undefined"
                ) as string[];
        }

        for (const [index, rep] of emailData.recipients.entries()) {
            if (
                typeof rep === "string" &&
                rep.includes("recipients") &&
                rep.includes("airletter.invalid")
            ) {
                const uniqueId = rep.split("id_")[1]?.split("@")[0]

                if (!uniqueId) continue

                const data = await storageService.getParsedEmailsById(uniqueId)

                if (data?.emails) {
                    emailData.recipients.splice(index, 1)
                    emailData.recipients.push(...data.emails)
                }
            }
        }

        const subjectField = composeWindow.querySelector(
            'input[name="subject"]'
        ) as HTMLInputElement
        emailData.subject = subjectField.value

        const messageBody = composeWindow.querySelector(
            'div[role="textbox"][contenteditable="true"]'
        ) as HTMLInputElement
        emailData.body = messageBody.innerHTML

        const composeWindowId = await getComposeId()
        const timeSettings = await storageService.getTimeSettings(composeWindowId)

        if (!timeSettings) {
            emailData.date = (document.querySelector(
                "#campaign-date"
            ) as HTMLInputElement).value
            emailData.time = (document.querySelector(
                "#campaign-time"
            ) as HTMLInputElement).value
            emailData.timezone = (document.querySelector(
                "#campaign-timezone"
            ) as HTMLInputElement).value
        } else {
            emailData.date = timeSettings.date
            emailData.time = timeSettings.time
            emailData.timezone = timeSettings.timezone
        }

        console.log(`Email data: ${emailData}`)

        return emailData
    }

    async findComposeWindows(): Promise<HTMLElement[]> {
        const composeWindows = document.querySelectorAll(GMAIL_SELECTORS.COMPOSE_WINDOW);
        return Array.from(composeWindows) as HTMLInputElement[]
    }

    async openComposeWindow(): Promise<void> {
        const composeButton = document.querySelector(GMAIL_SELECTORS.COMPOSE_WINDOW_BUTTON) as HTMLButtonElement;
        if (composeButton) {
            composeButton.click();
        }
    }

    async addEmailChip(
        sheetId: string,
        count: number,
        composeWindow: HTMLElement | Document,
    ): Promise<boolean> {
        const recipientField = composeWindow.querySelector(
            GMAIL_SELECTORS.RECIPIENT_FIELD
        ) as HTMLInputElement;

        if (!recipientField) {
            console.error("Recipient field is missing");
            return false;
        }

        const activeElement = document.activeElement;
        recipientField.focus()

        const emailString = `${count}-recipients-id_${sheetId}@airletter.invalid`
        recipientField.value = emailString

        const events = [
            new InputEvent("input", { bubbles: true }),
            new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                code: "Enter",
            }),
        ]

        events.forEach(event => {
            recipientField.dispatchEvent(event)
        })

        if (activeElement) {
            ;(activeElement as HTMLInputElement).focus()
        }

        return true;
    }
}

export const gmailService = new GmailService()
