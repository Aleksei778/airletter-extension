import React, { useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import type { SheetsModalWindowProps } from "~src/types";

export const SheetsModalWindow = ({
  onSubmit,
  onClose
}: SheetsModalWindowProps) => {
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [sheetName, setSheetName] = useState("Sheet1")
  const [range, setRange] = useState("A2:A")
  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [isSubmitHovered, setIsSubmitHovered] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fullRange = `${sheetName}!${range}`
    await onSubmit(spreadsheetId.trim(), fullRange)
  }

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.()
        }
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideDown {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      
      <div 
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "16px",
          maxWidth: "500px",
          width: "90%",
          position: "relative",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          animation: 'slideDown 0.3s ease-out'
        }}
      >
        {/* Крестик закрытия */}
        <button
          onClick={onClose}
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => setIsCloseHovered(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '4px',
            backgroundColor: isCloseHovered ? '#F3F4F6' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close"
        >
          <X 
            size={24} 
            color={isCloseHovered ? '#1F2937' : '#6B7280'} 
            strokeWidth={2}
            style={{ transition: 'color 0.2s ease-in-out' }}
          />
        </button>

        <h3 style={{ 
          marginBottom: "24px", 
          fontSize: "24px", 
          fontWeight: "600",
          color: '#1F2937'
        }}>
          Enter Google Sheets Details
        </h3>

        <form 
          onSubmit={handleSubmit} 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px" 
          }}
        >
          <input
            type="text"
            placeholder="Spreadsheet link or ID"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            required
            style={{
              padding: "12px",
              border: "2px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "16px",
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563EB'
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.boxShadow = 'none'
            }}
          />

          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              placeholder="Sheet name (e.g., Sheet1)"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              required
              style={{
                padding: "12px",
                border: "2px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "16px",
                flex: 1,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB'
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />

            <input
              type="text"
              placeholder="Column range (e.g., A2:A)"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              required
              style={{
                padding: "12px",
                border: "2px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "16px",
                flex: 1,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB'
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button 
            type="submit"
            onMouseEnter={() => setIsSubmitHovered(true)}
            onMouseLeave={() => setIsSubmitHovered(false)}
            style={{
              padding: "12px 24px",
              backgroundColor: isSubmitHovered ? '#1D4ED8' : '#2563EB',
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "500",
              transition: "all 0.2s ease-in-out",
              boxShadow: isSubmitHovered ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Submit
          </button>

          <p style={{ 
            fontSize: "14px", 
            color: "#6B7280", 
            marginTop: "8px",
            lineHeight: '1.5'
          }}>
            ** A spreadsheet ID can be extracted from its URL. For example, the
            spreadsheet ID in the URL
            https://docs.google.com/spreadsheets/d/abc1234567/edit#gid=0 is
            <br />
            <strong style={{ color: '#1F2937' }}>abc1234567</strong>.
          </p>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}