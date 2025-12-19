# SNOWY - The Coolest Meme Coin Web Application

A modern, festive web application for the SNOWY meme coin, featuring AI-powered avatar generation, real-time token statistics, and seamless wallet integration.

## 🌟 Features

- **Hero Section**: Eye-catching landing page with SNOWY branding and call-to-action buttons
- **Token Contract Address**: Easy-to-copy contract address with block explorer links
- **Christmas Countdown Timer**: Real-time countdown to Christmas
- **Live Token Statistics**: Real-time price, volume, and market data from DexScreener
- **AI Avatar Generation (Snowy-ify)**: Transform profile pictures into unique snowman avatars - 100% FREE
- **Social Links**: Quick access to community platforms (Twitter, Telegram, DexScreener)
- **Wallet Integration**: Connect with Phantom (Solana) or MetaMask (Ethereum)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A code editor (VS Code recommended)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd SNOWY
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_CONTRACT_ADDRESS=your_contract_address_here
VITE_NETWORK=mainnet-beta
VITE_AI_API_URL=
VITE_USE_MOCK_AI=true
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Icons** - Icon library
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **Solana Web3.js** - Blockchain integration

## 📁 Project Structure

```
SNOWY/
├── src/
│   ├── components/       # React components
│   │   ├── Hero.tsx
│   │   ├── ContractAddress.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── LiveStats.tsx
│   │   ├── Snowyify.tsx
│   │   └── SocialLinks.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useWallet.ts
│   ├── services/        # API and external services
│   │   ├── api.ts
│   │   └── aiGeneration.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
└── package.json         # Dependencies
```

## 🎨 Customization

### Contract Address
Update the contract address in `.env`:
```env
VITE_CONTRACT_ADDRESS=your_contract_address
```

### AI Generation
The app uses mock AI generation by default. To use a real AI service, see **[AI_SETUP.md](./AI_SETUP.md)** for detailed instructions.

**Quick Start with Replicate (Recommended):**
1. Get API token from [Replicate](https://replicate.com)
2. Add to `.env`:
   ```env
   VITE_REPLICATE_API_TOKEN=your_token_here
   VITE_USE_MOCK_AI=false
   ```
3. Restart dev server

The code automatically detects and uses Replicate if the token is set. See `AI_SETUP.md` for other options (Hugging Face, OpenAI, Custom API).

### Styling
- Colors are defined in Tailwind classes throughout components
- Main color scheme: Blue (#3B82F6) for winter theme
- Update colors in component files to match your brand

## 📦 Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## 🌐 Deployment

### Vercel
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify
1. Push your code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_CONTRACT_ADDRESS` | Token contract address | Yes | - |
| `VITE_NETWORK` | Blockchain network | No | `mainnet-beta` |
| `VITE_PUMPFUN_URL` | Pump.fun URL for buying tokens | No | `https://pump.fun` |
| `VITE_AI_API_URL` | AI generation API endpoint | No | - |
| `VITE_USE_MOCK_AI` | Use mock AI generation | No | `true` |
| `VITE_REPLICATE_API_TOKEN` | Replicate API token | No | - |
| `VITE_HUGGINGFACE_API_TOKEN` | Hugging Face API token | No | - |
| `VITE_OPENAI_API_KEY` | OpenAI API key | No | - |

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure Phantom/MetaMask is installed
- Check browser console for errors
- Verify network matches your contract

### API Errors
- Check DexScreener API status
- Verify contract address is correct
- Check network connectivity

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❄️ for the SNOWY community**
