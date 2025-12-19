# AI Image Generation Setup Guide

The Snowy-ify feature currently uses mock mode. Here are several options to enable real AI image generation:

## Option 1: Replicate API (Recommended - Easiest)

Replicate provides easy-to-use AI models including Stable Diffusion and image-to-image transformations.

### Steps:

1. **Get Replicate API Token:**
   - Go to https://replicate.com
   - Sign up for an account
   - Go to Account Settings → API Tokens
   - Create a new token

2. **Install Replicate SDK (optional, for better integration):**
   ```bash
   npm install replicate
   ```

3. **Update .env file:**
   ```env
   VITE_REPLICATE_API_TOKEN=your_token_here
   VITE_USE_MOCK_AI=false
   ```

4. **Update the code** to use Replicate (see below)

## Option 2: Hugging Face Inference API

Hugging Face offers free tier for image generation.

### Steps:

1. **Get Hugging Face Token:**
   - Go to https://huggingface.co
   - Sign up and go to Settings → Access Tokens
   - Create a new token with "read" permissions

2. **Update .env:**
   ```env
   VITE_HUGGINGFACE_API_TOKEN=your_token_here
   VITE_USE_MOCK_AI=false
   ```

## Option 3: Custom Backend API

Create your own backend endpoint that handles image generation.

### Steps:

1. **Create a backend endpoint** (Node.js example):
   ```javascript
   // Example: /api/generate-avatar
   app.post('/api/generate-avatar', async (req, res) => {
     // Process image and description
     // Use AI model (Stable Diffusion, etc.)
     // Return generated image
   });
   ```

2. **Update .env:**
   ```env
   VITE_AI_API_URL=http://localhost:3000/api/generate-avatar
   VITE_USE_MOCK_AI=false
   ```

## Option 4: OpenAI DALL-E (Paid)

OpenAI's DALL-E can generate high-quality images.

### Steps:

1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com
   - Create an account and get API key

2. **Update .env:**
   ```env
   VITE_OPENAI_API_KEY=your_key_here
   VITE_USE_MOCK_AI=false
   ```

## Quick Start with Replicate

The easiest option is to use Replicate. Here's how to update the code:

1. Add your token to `.env`:
   ```env
   VITE_REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx
   VITE_USE_MOCK_AI=false
   ```

2. The code will automatically use Replicate if the token is set.

## Cost Considerations

- **Replicate**: Pay per generation (~$0.002-0.01 per image)
- **Hugging Face**: Free tier available, then pay-as-you-go
- **OpenAI DALL-E**: ~$0.04-0.12 per image
- **Custom Backend**: Depends on your infrastructure

## Testing

After setup, test the generation:
1. Go to the Snowy-ify section
2. Upload an image or enter a description
3. Click "Transform to Snowman!"
4. Wait for generation (30-50 seconds)

## Troubleshooting

- **"Failed to generate"**: Check API token is correct
- **Slow generation**: Normal for AI, can take 30-60 seconds
- **Rate limits**: Some APIs have rate limits, implement retry logic
- **CORS errors**: If using external API, may need proxy server




