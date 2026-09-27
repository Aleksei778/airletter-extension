import { Sheet } from "lucide-react"
import React from "react"
import { toast } from "sonner";

export function SpreadsheetsButton() {
  const [hasAccess, setHasAccess] = React.useState(true)
  const [isHovered, setIsHovered] = React.useState(false)

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CHECK_SUBSCRIPTION' })

        if (!response.success) {
            toast.error('Have no access to spreadsheets')

            return null
        }

        const hasValidPlan =
            response.data.plan !== undefined &&
            response.data.plan !== "free_trial"

        setHasAccess(hasValidPlan)
      } catch (error) {
        console.error("Failed to check subscription", error)
      }
    }

    checkAccess()
  })

  if (!hasAccess) {
    return null
  }

  const handleClick = () => {
    window.postMessage(
      {
        source: "airletter",
        type: "OPEN_SHEETS_MODAL"
      },
      "*"
    )
  }

  return (
    <button
      style={{
        padding: '10px',
        backgroundColor: isHovered ? '#EFF6FF' : 'transparent',
        border: isHovered ? '1px solid #BFDBFE' : '1px solid transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Parse recipients from Google Sheets"
    >
      <Sheet 
        size={20} 
        color={isHovered ? '#2563EB' : '#4B5563'}
        strokeWidth={2}
        style={{ transition: 'color 0.2s ease-in-out' }}
      />
    </button>
  )
}