import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.tsx'

// Polyfill Buffer for browser bundle (solana/web3.js expects it)
if (!globalThis.Buffer) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Buffer = Buffer
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
