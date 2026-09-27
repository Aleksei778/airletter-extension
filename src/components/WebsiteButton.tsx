import React from "react"
import { ExternalLink } from "lucide-react"

import { siteLink } from "~src/lib/config"

export function WebsiteButton() {
    const [isHovered, setIsHovered] = React.useState(false)

    const handleClick = async () => {
        window.open(siteLink("/"), "_blank")
    }

    return (
        <button
            style={{
                padding: '10px',
                backgroundColor: isHovered ? '#FAF5FF' : 'transparent',
                border: isHovered ? '1px solid #E9D5FF' : '1px solid transparent',
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
            title="Link to our website"
        >
            <ExternalLink 
                size={20} 
                color={isHovered ? '#9333EA' : '#4B5563'}
                strokeWidth={2}
                style={{ transition: 'color 0.2s ease-in-out' }}
            />
        </button>
    )
}