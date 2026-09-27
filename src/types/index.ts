export interface Schedule {
  date: string
  time: string
  timezone: string
}

export interface SheetsModalWindowProps {
  onSubmit: (spreadsheet: string, range: string) => Promise<void>
  onClose?: () => void
}

export interface CampaignDropdownProps {
  isVisible: boolean
  value: Schedule
  onChange: (value: Schedule) => void
}

export interface AirletterButtonProps {
  onClick: () => Promise<void>
}
