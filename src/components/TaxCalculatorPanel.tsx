'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, Target, BookOpen, PieChart } from 'lucide-react'

interface TaxResult {
  donationAmount: number
  estimatedTaxSavings: number
  effectiveDeductionRate: number
  netCostOfDonation: number
  marginalTaxRate: number
  recommendation: string
}

interface EvaluationResult {
  targetTaxSavings: number
  optimalDonationAmount: number
  expectedTaxSavings: number
  recommendation: string
}

interface TaxCalculatorPanelProps {
  onCalculation: (result: TaxResult) => void
  onInputsChange: (inputs: any) => void
  onSendMessage?: (message: string) => void
}

type TabType = 'calculator' | 'evaluate' | 'section351' | 'pri-returns'

export function TaxCalculatorPanel({ onCalculation, onInputsChange, onSendMessage }: TaxCalculatorPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('calculator')
  
  // Tax Calculator state
  const [calculatorData, setCalculatorData] = useState({
    annualIncome: '',
    currentTaxRate: '',
    donationAmount: '',
    filingStatus: 'single'
  })
  
  // Evaluate Tax Savings state
  const [evaluateData, setEvaluateData] = useState({
    targetTaxSavings: '',
    annualIncome: '',
    filingStatus: 'single',
    currentDeductions: ''
  })
  
  const [calculatorResult, setCalculatorResult] = useState<TaxResult | null>(null)
  const [evaluateResult, setEvaluateResult] = useState<EvaluationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const tabs = [
    { id: 'calculator', label: 'Tax Calculator', icon: Calculator },
    { id: 'evaluate', label: 'Evaluate Donation Amount', icon: Target },
    { id: 'section351', label: 'Explain Section 351', icon: BookOpen },
    { id: 'pri-returns', label: 'Show PRI Returns', icon: PieChart }
  ]

  // Tax Calculator functions
  const handleCalculatorInputChange = (field: string, value: string) => {
    const newFormData = { ...calculatorData, [field]: value }
    setCalculatorData(newFormData)
    onInputsChange(newFormData)
  }

  const calculateTaxSavings = () => {
    setIsCalculating(true)
    
    setTimeout(() => {
      const income = parseFloat(calculatorData.annualIncome)
      const donation = parseFloat(calculatorData.donationAmount)
      const rate = parseFloat(calculatorData.currentTaxRate) / 100

      const taxSavings = donation * rate
      const effectiveRate = (taxSavings / donation) * 100
      const netCost = donation - taxSavings

      const calculationResult: TaxResult = {
        donationAmount: donation,
        estimatedTaxSavings: Math.round(taxSavings),
        effectiveDeductionRate: Math.round(effectiveRate * 100) / 100,
        netCostOfDonation: Math.round(netCost),
        marginalTaxRate: rate * 100,
        recommendation: taxSavings > 0
          ? `Your donation of $${donation.toLocaleString()} could save you approximately $${Math.round(taxSavings).toLocaleString()} in taxes.`
          : 'Consider consulting with a tax professional to optimize your donation strategy.'
      }

      setCalculatorResult(calculationResult)
      setIsCalculating(false)
      onCalculation(calculationResult)
    }, 1000)
  }

  const handleCalculatorSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculateTaxSavings()
  }

  // Evaluate Tax Savings functions
  const handleEvaluateInputChange = (field: string, value: string) => {
    setEvaluateData({ ...evaluateData, [field]: value })
  }

  const calculateOptimalDonation = () => {
    setIsEvaluating(true)
    
    setTimeout(() => {
      const targetSavings = parseFloat(evaluateData.targetTaxSavings)
      const income = parseFloat(evaluateData.annualIncome)
      
      // Simplified tax bracket estimation
      let estimatedMarginalRate = 0.12
      if (income > 462750) estimatedMarginalRate = 0.37
      else if (income > 365600) estimatedMarginalRate = 0.35
      else if (income > 191050) estimatedMarginalRate = 0.32
      else if (income > 100525) estimatedMarginalRate = 0.24
      else if (income > 47150) estimatedMarginalRate = 0.22
      else if (income > 11600) estimatedMarginalRate = 0.12
      else estimatedMarginalRate = 0.10

      const optimalDonation = targetSavings / estimatedMarginalRate
      const expectedSavings = optimalDonation * estimatedMarginalRate

      const result: EvaluationResult = {
        targetTaxSavings: targetSavings,
        optimalDonationAmount: Math.round(optimalDonation),
        expectedTaxSavings: Math.round(expectedSavings),
        recommendation: `To achieve approximately $${targetSavings.toLocaleString()} in tax savings, consider donating around $${Math.round(optimalDonation).toLocaleString()}.`
      }

      setEvaluateResult(result)
      setIsEvaluating(false)
    }, 1000)
  }

  const handleEvaluateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculateOptimalDonation()
  }

  // AI interaction functions
  const handleSection351Click = () => {
    if (onSendMessage) {
      onSendMessage("Please explain Section 351 of the tax code and how it can benefit me with tax savings through charitable donations.")
    }
  }

  const handlePRIReturnsClick = () => {
    if (onSendMessage) {
      onSendMessage("What are Program-Related Investments (PRIs) and what kind of returns can I expect from them?")
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calculator':
        return (
          <div className="space-y-4">
            <form onSubmit={handleCalculatorSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Annual Income
                </label>
                <input
                  type="number"
                  value={calculatorData.annualIncome}
                  onChange={(e) => handleCalculatorInputChange('annualIncome', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your annual income"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Filing Status
                </label>
                <select
                  value={calculatorData.filingStatus}
                  onChange={(e) => handleCalculatorInputChange('filingStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="single">Single</option>
                  <option value="married-filing-jointly">Married Filing Jointly</option>
                  <option value="married-filing-separately">Married Filing Separately</option>
                  <option value="head-of-household">Head of Household</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Current Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calculatorData.currentTaxRate}
                  onChange={(e) => handleCalculatorInputChange('currentTaxRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your current tax rate"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Donation Amount
                </label>
                <input
                  type="number"
                  value={calculatorData.donationAmount}
                  onChange={(e) => handleCalculatorInputChange('donationAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter planned donation amount"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
              >
                {isCalculating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>Calculate Tax Savings</span>
                  </>
                )}
              </button>
            </form>

            {calculatorResult && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black mb-4">Results</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm font-medium text-gray-600">Donation Amount</div>
                    <div className="text-2xl font-bold text-black">
                      ${calculatorResult.donationAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm font-medium text-gray-600">Tax Savings</div>
                    <div className="text-2xl font-bold text-black">
                      ${calculatorResult.estimatedTaxSavings.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm font-medium text-gray-600">Effective Rate</div>
                    <div className="text-xl font-bold text-black">
                      {calculatorResult.effectiveDeductionRate}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm font-medium text-gray-600">Net Cost</div>
                    <div className="text-xl font-bold text-black">
                      ${calculatorResult.netCostOfDonation.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="text-sm font-medium text-gray-600 mb-2">Analysis</div>
                  <p className="text-black text-sm">{calculatorResult.recommendation}</p>
                </div>

                <div className="text-xs text-gray-500 italic">
                  *This is an estimate for planning purposes. Please consult with a qualified tax professional before making any financial decisions.
                </div>
              </div>
            )}
          </div>
        )

      case 'evaluate':
        return (
          <div className="space-y-4">
            <form onSubmit={handleEvaluateSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Target Tax Savings ($)
                </label>
                <input
                  type="number"
                  value={evaluateData.targetTaxSavings}
                  onChange={(e) => handleEvaluateInputChange('targetTaxSavings', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter desired tax savings amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Annual Income ($)
                </label>
                <input
                  type="number"
                  value={evaluateData.annualIncome}
                  onChange={(e) => handleEvaluateInputChange('annualIncome', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your annual income"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Filing Status
                </label>
                <select
                  value={evaluateData.filingStatus}
                  onChange={(e) => handleEvaluateInputChange('filingStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="single">Single</option>
                  <option value="married-filing-jointly">Married Filing Jointly</option>
                  <option value="married-filing-separately">Married Filing Separately</option>
                  <option value="head-of-household">Head of Household</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Current Deductions ($)
                </label>
                <input
                  type="number"
                  value={evaluateData.currentDeductions}
                  onChange={(e) => handleEvaluateInputChange('currentDeductions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter current deductions amount"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Find Optimal Donation Amount</span>
                  </>
                )}
              </button>
            </form>

            {evaluateResult && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black mb-4">Donation Evaluation Results</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm font-medium text-gray-600">Optimal Donation Amount</div>
                    <div className="text-2xl font-bold text-black">
                      ${evaluateResult.optimalDonationAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm font-medium text-gray-600">Expected Tax Savings</div>
                    <div className="text-2xl font-bold text-black">
                      ${evaluateResult.expectedTaxSavings.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="text-sm font-medium text-gray-600 mb-2">Recommendation</div>
                  <p className="text-black text-sm">{evaluateResult.recommendation}</p>
                </div>

                <div className="text-xs text-gray-500 italic">
                  *This is an estimate for planning purposes. Please consult with a qualified tax professional before making any financial decisions.
                </div>
              </div>
            )}
          </div>
        )

      case 'section351':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">Click below to learn about Section 351 tax benefits</p>
              <button
                onClick={handleSection351Click}
                className="bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors flex items-center space-x-2 mx-auto"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ask AI About Section 351</span>
              </button>
            </div>
          </div>
        )

      case 'pri-returns':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">Click below to understand PRI investment returns</p>
              <button
                onClick={handlePRIReturnsClick}
                className="bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors flex items-center space-x-2 mx-auto"
              >
                <PieChart className="w-4 h-4" />
                <span>Ask AI About PRI Returns</span>
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black bg-gray-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {(() => {
            const activeTabData = tabs.find(tab => tab.id === activeTab)
            const Icon = activeTabData?.icon || Calculator
            return (
              <>
                <Icon className="w-5 h-5 text-black" />
                <h2 className="text-lg font-semibold text-black">{activeTabData?.label}</h2>
              </>
            )
          })()}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}