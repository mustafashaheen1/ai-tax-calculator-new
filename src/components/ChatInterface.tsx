'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, RotateCcw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  calculationResult?: any
  calculatorInputs?: any
  onReceiveMessage?: (message: string) => void
}

export function ChatInterface({ calculationResult, calculatorInputs, onReceiveMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI tax advisor. I can help you understand tax implications, donation strategies, and answer any questions about tax planning. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Function to format messages and replace disclaimer with booking link
  const formatMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // EXCLUDE welcome/intro messages
    if (lowerMessage.includes("i'm your ai") || 
        lowerMessage.includes("i am your ai") ||
        lowerMessage.includes("hello! i'm") ||
        lowerMessage.includes("hi! i'm") ||
        (lowerMessage.includes("how can i assist you") && lowerMessage.length < 150)) {
      return message;
    }
    
    // Check for ANY mention of consulting/discussing with professionals
    const hasProfessionalMention = 
      // Direct mentions of consulting
      lowerMessage.includes('consult with a tax professional') ||
      lowerMessage.includes('consult with a professional') ||
      lowerMessage.includes('consult a tax professional') ||
      lowerMessage.includes('consulting a professional') ||
      lowerMessage.includes('should always consult') ||
      lowerMessage.includes('always consult with') ||
      // Mentions of financial/tax advisors
      lowerMessage.includes('financial advisor') ||
      lowerMessage.includes('tax advisor') ||
      lowerMessage.includes('tax professional') ||
      // Discussion mentions
      lowerMessage.includes('discuss it with a financial') ||
      lowerMessage.includes('discuss with a professional') ||
      lowerMessage.includes('speak with a professional') ||
      // Recommendations
      lowerMessage.includes('advisable to consult') ||
      lowerMessage.includes('recommend consulting') ||
      lowerMessage.includes('would recommend consulting') ||
      // Finding professionals
      lowerMessage.includes('finding a financial advisor') ||
      lowerMessage.includes('find a professional') ||
      lowerMessage.includes('reach a financial advisor') ||
      // General patterns
      (lowerMessage.includes('consult') && lowerMessage.includes('professional')) ||
      (lowerMessage.includes('discuss') && lowerMessage.includes('advisor')) ||
      (lowerMessage.includes('speak') && lowerMessage.includes('professional'));
    
    if (hasProfessionalMention) {
      // Remove existing disclaimer/consultation sentences
      let cleanedMessage = message
        // Remove sentences that recommend consulting
        .replace(/[^.!?]*(?:you should always|always|should)\s+consult[^.!?]*professional[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*(?:important to|advisable to|recommend)\s+(?:consult|discuss)[^.!?]*(?:professional|advisor)[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*discuss it with[^.!?]*advisor[^.!?]*[.!?]/gi, '')
        // Remove generic disclaimers
        .replace(/[^.!?]*(?:Please note)[^.!?]*(?:financial decisions)[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*(?:This information should not)[^.!?]*[.!?]/gi, '')
        .replace(/[^.!?]*(?:Always do your own research)[^.!?]*[.!?]/gi, '')
        // Remove any existing booking links
        .replace(/To consult.*?<\/a>.*?with us\./gi, '')
        // Clean up
        .replace(/\s+/g, ' ')
        .replace(/\.+/g, '.')
        .trim();
      
      // Ensure proper ending
      if (!cleanedMessage.endsWith('.') && !cleanedMessage.endsWith('!') && !cleanedMessage.endsWith('?')) {
        cleanedMessage += '.';
      }
      
      // Add single booking link at the end
      cleanedMessage += ' To consult with our tax professionals, <a href="https://aitaxcalculator.hybridfoundation.org/68c370a4844cc2003c2092e0/page_yyrxpw/" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 font-medium">click here</a> to book a call with us.';
      
      return cleanedMessage;
    }
    
    return message;
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle external messages (from other components)
  useEffect(() => {
    if (onReceiveMessage) {
      // This creates a function that can be called to send messages
      const sendExternalMessage = (message: string) => {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])
        
        // Process the message through AI
        handleAIResponse([...messages, userMessage])
      }
      
      // Store the function reference for external use
      window.sendChatMessage = sendExternalMessage
    }
  }, [messages, onReceiveMessage])

  const resetConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI tax advisor. I can help you understand tax implications, donation strategies, and answer any questions about tax planning. How can I assist you today?',
        timestamp: new Date()
      }
    ])
  }

  const handleAIResponse = async (conversationHistory: Message[]) => {
    setIsLoading(true)

    try {
      // Prepare conversation history for the API
      const historyForAPI = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Prepare calculator context
      const calculatorContext = {
        inputs: calculatorInputs,
        result: calculationResult
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: historyForAPI,
          calculatorContext,
        }),
      })

      const data = await response.json()

      let messageContent = 'I apologize, but I encountered an error processing your request.';
      
      if (data.message) {
        messageContent = data.message;
      } else if (data.error) {
        messageContent = data.error;
      } else if (!response.ok) {
        // Handle HTTP error responses
        if (response.status === 401) {
          messageContent = 'Authentication failed. Please refresh the page and try again.';
        } else if (response.status === 429) {
          messageContent = 'Too many requests. Please wait a moment before trying again.';
        } else if (response.status === 503) {
          messageContent = 'Service temporarily unavailable. Please try again in a few moments.';
        } else {
          messageContent = `Service error (${response.status}). Please try again.`;
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      
      let errorMessage = 'I apologize, but I encountered an error. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (error instanceof Error) {
        console.error('Detailed error:', error.message);
        errorMessage = 'Unable to process your request. Please try again or refresh the page.';
      }
      
      const assistantErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantErrorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputMessage.trim() || isLoading) return

    const lowerMessage = inputMessage.toLowerCase();
    
    // Check if user is asking about consulting a professional
    if (lowerMessage.includes('talk to a professional') || 
        lowerMessage.includes('consult a professional') ||
        lowerMessage.includes('recommend a tax professional') ||
        lowerMessage.includes('find a tax professional')) {
      
      // Provide direct response with booking link
      const directResponse = 'To consult with our tax professionals, <a href="https://aitaxcalculator.hybridfoundation.org/68c370a4844cc2003c2092e0/page_yyrxpw/" target="_blank" rel="noopener noreferrer" class="text-black underline hover:text-gray-800 font-medium">click here</a> to book a call with us. Our team can provide personalized advice tailored to your specific tax situation.';
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage.trim(),
        timestamp: new Date()
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: directResponse,
        timestamp: new Date()
      }
      
      // Add both messages
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setInputMessage('');
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    
    // Process through AI
    await handleAIResponse([...messages, userMessage])
  }

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-black" />
            <h2 className="text-lg font-semibold text-black">AI Tax Advisor</h2>
          </div>
          <button
            onClick={resetConversation}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>
      </div>

      {/* 3D AI Avatar */}
      <div className="flex justify-center items-center py-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="relative flex flex-col items-center">
          {/* Main Avatar Container */}
          <div className="w-24 h-24 relative transform-gpu perspective-1000">
            {/* Avatar Base */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 shadow-2xl transform rotate-y-12 animate-float relative overflow-hidden">
              {/* Inner Glow */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 opacity-60 animate-pulse"></div>
              
              {/* AI Brain Pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 relative">
                  {/* Neural Network Lines */}
                  <div className="absolute inset-0">
                    <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full opacity-80 animate-ping"></div>
                    <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-ping" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-ping" style={{animationDelay: '1s'}}></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-white rounded-full opacity-80 animate-ping" style={{animationDelay: '1.5s'}}></div>
                    
                    {/* Connecting Lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
                      <path d="M12 12 L52 20 M20 52 L44 16 M16 32 L48 48" stroke="white" strokeWidth="1" opacity="0.3" className="animate-pulse"/>
                    </svg>
                  </div>
                  
                  {/* Central Calculator Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white bg-opacity-90 rounded-md flex items-center justify-center shadow-lg">
                      <div className="text-xs font-bold text-gray-800">$</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Reflection */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white to-transparent opacity-20"></div>
            </div>
            
            {/* Floating Particles */}
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-gray-400 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-50 animate-bounce" style={{animationDelay: '0.7s'}}></div>
            <div className="absolute -bottom-2 -right-1 w-2 h-2 bg-gray-600 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.4s'}}></div>
            <div className="absolute -bottom-1 -left-3 w-1.5 h-1.5 bg-gray-400 rounded-full opacity-50 animate-bounce" style={{animationDelay: '2.1s'}}></div>
          </div>
          
          {/* Avatar Name */}
          <div className="text-center mt-3">
            <p className="text-sm font-semibold text-gray-800">TaxBot AI</p>
            <p className="text-xs text-gray-500">Your Tax Strategy Assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black border border-gray-200'
              }`}
            >
              <div className="text-sm">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.content) 
                  }}
                />
              </div>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-black border border-gray-200 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about tax strategies, donations, or planning..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-black text-white p-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}