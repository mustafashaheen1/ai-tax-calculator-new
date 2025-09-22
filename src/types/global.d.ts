declare global {
  interface Window {
    sendChatMessage?: (message: string) => void
  }
}

export {}