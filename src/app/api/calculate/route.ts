import { NextRequest, NextResponse } from 'next/server'
import prisma, { safeDbOperation } from '../../../lib/database'

// Tax brackets for 2024 (simplified)
const TAX_BRACKETS = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191050, rate: 0.24 },
    { min: 191050, max: 365600, rate: 0.32 },
    { min: 365600, max: 462750, rate: 0.35 },
    { min: 462750, max: Infinity, rate: 0.37 }
  ],
  'married-filing-jointly': [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ],
  'married-filing-separately': [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  'head-of-household': [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191050, rate: 0.24 },
    { min: 191050, max: 365600, rate: 0.32 },
    { min: 365600, max: 462750, rate: 0.35 },
    { min: 462750, max: Infinity, rate: 0.37 }
  ]
}

function calculateTax(income: number, filingStatus: keyof typeof TAX_BRACKETS): number {
  const brackets = TAX_BRACKETS[filingStatus]
  let tax = 0

  for (const bracket of brackets) {
    if (income > bracket.min) {
      const taxableInThisBracket = Math.min(income - bracket.min, bracket.max - bracket.min)
      tax += taxableInThisBracket * bracket.rate
    }
  }

  return tax
}

interface EstimateTaxSavingsData {
  annualIncome: string
  currentTaxRate: string
  donationAmount: string
  filingStatus: keyof typeof TAX_BRACKETS
}

function estimateTaxSavings(data: EstimateTaxSavingsData) {
  const { annualIncome, currentTaxRate, donationAmount, filingStatus } = data

  const income = parseFloat(annualIncome)
  const donation = parseFloat(donationAmount)
  const rate = parseFloat(currentTaxRate) / 100

  // Calculate tax with and without donation
  const taxWithoutDonation = calculateTax(income, filingStatus)
  const taxWithDonation = calculateTax(income - donation, filingStatus)

  const taxSavings = taxWithoutDonation - taxWithDonation
  const effectiveRate = (taxSavings / donation) * 100

  return {
    donationAmount: donation,
    estimatedTaxSavings: Math.round(taxSavings),
    effectiveDeductionRate: Math.round(effectiveRate * 100) / 100,
    netCostOfDonation: Math.round(donation - taxSavings),
    marginalTaxRate: rate * 100,
    recommendation: taxSavings > 0
      ? `Your donation of $${donation.toLocaleString()} could save you approximately $${Math.round(taxSavings).toLocaleString()} in taxes.`
      : 'Consider consulting with a tax professional to optimize your donation strategy.'
  }
}

interface EvaluateDonationData {
  targetTaxSavings: string
  annualIncome: string
  filingStatus: keyof typeof TAX_BRACKETS
  currentDeductions: string
}

function evaluateDonationAmount(data: EvaluateDonationData) {
  const { targetTaxSavings, annualIncome, filingStatus, currentDeductions } = data

  const income = parseFloat(annualIncome)
  const targetSavings = parseFloat(targetTaxSavings)
  const currentDed = parseFloat(currentDeductions) || 0

  // Calculate current tax
  const currentTax = calculateTax(income - currentDed, filingStatus)

  // Estimate required donation amount (this is simplified)
  // In reality, this would require more complex calculations
  const estimatedMarginalRate = income > 100000 ? 0.24 : income > 50000 ? 0.22 : 0.12
  const estimatedRequiredDonation = targetSavings / estimatedMarginalRate

  // Calculate what the tax would be with this donation
  const newTaxableIncome = income - currentDed - estimatedRequiredDonation
  const newTax = calculateTax(newTaxableIncome, filingStatus)
  const actualSavings = currentTax - newTax

  return {
    targetTaxSavings: targetSavings,
    recommendedDonationAmount: Math.round(estimatedRequiredDonation),
    projectedTaxSavings: Math.round(actualSavings),
    netCostToYou: Math.round(estimatedRequiredDonation - actualSavings),
    currentTaxLiability: Math.round(currentTax),
    newTaxLiability: Math.round(newTax),
    recommendation: actualSavings >= targetSavings * 0.9
      ? `To achieve approximately $${targetSavings.toLocaleString()} in tax savings, consider donating around $${Math.round(estimatedRequiredDonation).toLocaleString()}.`
      : 'Your target tax savings may require a larger donation than expected. Consider spreading donations across multiple years.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json(
        { error: "Type and data are required" },
        { status: 400 }
      )
    }

    let result: Record<string, unknown>

    if (type === "estimate_savings") {
      result = estimateTaxSavings(data)
    } else if (type === "evaluate_donation") {
      result = evaluateDonationAmount(data)
    } else {
      return NextResponse.json(
        { error: "Invalid calculation type" },
        { status: 400 }
      )
    }


    return NextResponse.json(result)
  } catch (error) {
    console.error("Calculation error:", error)
    return NextResponse.json(
      { error: "Failed to process calculation" },
      { status: 500 }
    )
  }
}
