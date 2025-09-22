'use client'

import { useState } from 'react'
import { Header } from './Header'
import { TaxCalculatorPanel } from './TaxCalculatorPanel'
import { ChatInterface } from './ChatInterface'
import WelcomeVideoModal from './WelcomeVideoModal'

export function Dashboard() {
  const [calculationResult, setCalculationResult] = useState(null)
  const [calculatorInputs, setCalculatorInputs] = useState({
    annualIncome: '',
    currentTaxRate: '',
    donationAmount: '',
    filingStatus: 'single'
  })

  const handleCalculation = (result: any) => {
    setCalculationResult(result)
  }

  const handleInputsChange = (inputs: any) => {
    setCalculatorInputs(inputs)
  }

  const handleSendMessage = (message: string) => {
    // Trigger the external message function if available
    if (typeof window !== 'undefined' && window.sendChatMessage) {
      window.sendChatMessage(message)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <WelcomeVideoModal />
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tax Calculator */}
        <div className="w-1/2 border-r border-gray-200">
          <TaxCalculatorPanel 
            onCalculation={handleCalculation} 
            onInputsChange={handleInputsChange}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="w-1/2">
          <ChatInterface 
            calculationResult={calculationResult}
            calculatorInputs={calculatorInputs}
            onReceiveMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  )
}