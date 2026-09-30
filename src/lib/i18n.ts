// UI language follows the browser: Russian for ru/uk/be/kk, English otherwise

const ru = {
  send: "Airletter",
  sending: "Отправка",
  sendTitle: "Отправить каждому получателю отдельным письмом через Airletter",
  schedule: {
    button: "Расписание",
    title: "Расписание",
    date: "Дата",
    time: "Время",
    timezone: "Часовой пояс",
    yours: "ваш",
    now: "Без даты — отправка сразу после нажатия Airletter.",
    at: (when: string) => `Отправка начнётся ${when}.`,
    clear: "Очистить"
  },
  sheets: {
    button: "Импорт из Google Таблиц",
    title: "Получатели из Google Таблиц",
    text: "Airletter возьмёт адреса из первой колонки диапазона. Дубли и некорректные адреса отсеются.",
    link: "Ссылка на таблицу или ID",
    sheet: "Лист",
    range: "Диапазон",
    submit: "Добавить получателей",
    loading: "Загружаем…",
    added: (n: number) => `Добавлено получателей из таблицы: ${n}.`
  },
  account: {
    button: "Аккаунт Airletter",
    signInTitle: "Войдите, чтобы отправлять",
    signInText: "Войдите по email и подключите Gmail. Airletter попросит только право отправлять письма от вашего имени.",
    signIn: "Войти",
    plan: "Тариф",
    noPlan: "Нет активной подписки",
    until: "до",
    today: "Сегодня отправлено",
    of: "из",
    dashboard: "Кабинет",
    pricing: "Тарифы",
    signOut: "Выйти",
    openGmail: "Открыть Gmail",
    plans: { trial: "Пробный", standard: "Стандарт", premium: "Премиум" }
  },
  compose: {
    notFound: "Не нашли окно письма. Попробуйте ещё раз.",
    noRecipients: "Добавьте получателей в поле «Кому» или импортируйте Google Таблицу.",
    noSubject: "Добавьте тему письма.",
    halfSchedule: "Укажите и дату, и время — или очистите их, чтобы отправить сразу.",
    tooLarge: "Вложения больше 18 МБ.",
    noCompose: "Откройте новое письмо и повторите.",
    started: (n: number) => `Отправляем ${n} ${plural(n, "письмо", "письма", "писем")}. Прогресс — в кабинете.`,
    scheduled: (n: number, when: string) => `Запланировано: ${n} ${plural(n, "письмо", "письма", "писем")}, ${when}.`,
    skipped: (n: number) => ` Пропущено некорректных адресов: ${n}.`,
    progress: "Прогресс"
  },
  errors: {
    unauthorized: "Войдите в Airletter, чтобы отправлять кампании.",
    reauth_required: "Gmail не подключён или доступ отозван. Войдите и подключите Gmail.",
    no_subscription: "Нет активного тарифа.",
    missing_scopes: "При входе разрешите Airletter отправлять письма от вашего имени.",
    access_denied: "Вход отменён.",
    signin_failed: "Не удалось открыть страницу входа. Проверьте соединение и попробуйте ещё раз.",
    validation: "Проверьте письмо и попробуйте снова.",
    network: "Нет связи с Airletter. Попробуйте ещё раз.",
    unknown: "Что-то пошло не так. Попробуйте ещё раз.",
    signIn: "Войти",
    choosePlan: "Выбрать тариф"
  },
  close: "Закрыть"
}

export type Dict = typeof ru

const en: Dict = {
  send: "Airletter",
  sending: "Sending",
  sendTitle: "Send each recipient a separate email with Airletter",
  schedule: {
    button: "Schedule",
    title: "Schedule",
    date: "Date",
    time: "Time",
    timezone: "Timezone",
    yours: "yours",
    now: "No date — sending starts as soon as you press Airletter.",
    at: (when: string) => `Sending starts ${when}.`,
    clear: "Clear"
  },
  sheets: {
    button: "Import from Google Sheets",
    title: "Recipients from Google Sheets",
    text: "Airletter takes addresses from the first column of the range. Duplicates and invalid addresses are dropped.",
    link: "Spreadsheet link or ID",
    sheet: "Sheet",
    range: "Range",
    submit: "Add recipients",
    loading: "Loading…",
    added: (n: number) => `${n} recipients added from the sheet.`
  },
  account: {
    button: "Airletter account",
    signInTitle: "Sign in to send",
    signInText: "Sign in with your email and connect Gmail. Airletter only asks for permission to send email on your behalf.",
    signIn: "Sign in",
    plan: "Plan",
    noPlan: "No active subscription",
    until: "until",
    today: "Sent today",
    of: "of",
    dashboard: "Dashboard",
    pricing: "Pricing",
    signOut: "Sign out",
    openGmail: "Open Gmail",
    plans: { trial: "Trial", standard: "Standard", premium: "Premium" }
  },
  compose: {
    notFound: "Could not find the compose window. Try again.",
    noRecipients: "Add recipients to the To field or import a Google Sheet.",
    noSubject: "Add a subject.",
    halfSchedule: "Set both date and time, or clear them to send now.",
    tooLarge: "Attachments are larger than 18 MB.",
    noCompose: "Open a new email and try again.",
    started: (n: number) => `Sending ${n} ${n === 1 ? "email" : "emails"}. Track progress in the dashboard.`,
    scheduled: (n: number, when: string) => `Scheduled: ${n} ${n === 1 ? "email" : "emails"}, ${when}.`,
    skipped: (n: number) => ` ${n} invalid addresses skipped.`,
    progress: "Progress"
  },
  errors: {
    unauthorized: "Sign in to Airletter to send campaigns.",
    reauth_required: "Gmail is not connected or access was revoked. Sign in and connect Gmail.",
    no_subscription: "No active plan.",
    missing_scopes: "Allow Airletter to send email on your behalf when signing in.",
    access_denied: "Sign-in cancelled.",
    signin_failed: "Could not open the sign-in page. Check your connection and try again.",
    validation: "Check the email and try again.",
    network: "No connection to Airletter. Try again.",
    unknown: "Something went wrong. Try again.",
    signIn: "Sign in",
    choosePlan: "Choose a plan"
  },
  close: "Close"
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const uiLang = (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.()) || navigator.language
export const locale: "ru" | "en" = /^(ru|uk|be|kk)/i.test(uiLang) ? "ru" : "en"
export const t: Dict = locale === "ru" ? ru : en

export function formatDateTime(iso: string | Date) {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  )
}
