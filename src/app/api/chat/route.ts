import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { APIConnectionError } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI tax strategy advisor for a tax calculator application. 

IMPORTANT INSTRUCTIONS:
1. Always use the user's actual input values from the calculator when providing examples and calculations
2. If the user has entered specific values (income, tax rate, donation amount, filing status), reference these exact numbers in your responses
3. If calculation results are available, use those exact figures rather than doing your own calculations
4. Remember previous parts of the conversation and build upon them - don't start fresh each time
5. If the user mentions specific numbers (like "my tax bracket is 35%"), remember and use those numbers in all subsequent responses
6. Be consistent with calculations and references throughout the conversation
7. When calculator inputs or results are provided, prioritize using those over generic examples

Provide accurate, helpful information about tax planning, charitable giving, and investment strategies. Only include educational disclaimers when providing specific tax or financial advice that could impact someone's financial decisions.`;
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationHistory, calculatorContext } = body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Conversation history is required' },
        { status: 400 }
      );
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Additional validation for API key format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error('OpenAI API key appears to be invalid format');
      return NextResponse.json(
        { error: 'OpenAI API key is invalid format' },
        { status: 500 }
      );
    }

    // Prepare messages for OpenAI
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    // Add calculator context if available
    if (calculatorContext && (calculatorContext.inputs || calculatorContext.result)) {
      let contextMessage = "Current calculator context:\n";
      
      if (calculatorContext.inputs) {
        const inputs = calculatorContext.inputs;
        contextMessage += `- Annual Income: ${inputs.annualIncome ? '$' + parseFloat(inputs.annualIncome).toLocaleString() : 'Not entered'}\n`;
        contextMessage += `- Filing Status: ${inputs.filingStatus || 'Not selected'}\n`;
        contextMessage += `- Tax Rate: ${inputs.currentTaxRate ? inputs.currentTaxRate + '%' : 'Not entered'}\n`;
        contextMessage += `- Donation Amount: ${inputs.donationAmount ? '$' + parseFloat(inputs.donationAmount).toLocaleString() : 'Not entered'}\n`;
      }
      
      if (calculatorContext.result) {
        const result = calculatorContext.result;
        contextMessage += `\nCalculation Results:\n`;
        contextMessage += `- Estimated Tax Savings: $${result.estimatedTaxSavings?.toLocaleString() || 'N/A'}\n`;
        contextMessage += `- Net Cost of Donation: $${result.netCostOfDonation?.toLocaleString() || 'N/A'}\n`;
        contextMessage += `- Effective Deduction Rate: ${result.effectiveDeductionRate || 'N/A'}%\n`;
      }
      
      contextMessage += "\nUse these exact values when answering questions. Don't recalculate - use the provided results.";
      
      messages.push({ role: 'system', content: contextMessage });
    }

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });
    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return NextResponse.json({
      message: aiResponse
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle different types of errors with specific messages
    let errorMessage = 'I apologize, but I encountered an error. Please try again.';
    let statusCode = 500;

    if (error instanceof APIConnectionError) {
      errorMessage = 'Unable to connect to AI service. Please check your connection and try again.';
      statusCode = 503;
    } else if (error instanceof Error) {
      // Check for specific error patterns
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('api key') || errorMsg.includes('unauthorized')) {
        errorMessage = 'AI service authentication failed. Please contact support.';
        statusCode = 401;
      } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
        errorMessage = 'AI service is temporarily unavailable due to high demand. Please try again in a moment.';
        statusCode = 429;
      } else if (errorMsg.includes('timeout')) {
        errorMessage = 'Request timed out. Please try asking a shorter question.';
        statusCode = 408;
      } else if (errorMsg.includes('model') || errorMsg.includes('invalid')) {
        errorMessage = 'There was an issue processing your request. Please try rephrasing your question.';
        statusCode = 400;
      }
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: statusCode }
    );
  }
}