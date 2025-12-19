// AI Avatar Generation Service
// This service handles the generation of snowman avatars using AI

const AI_API_URL = import.meta.env.VITE_AI_API_URL || '/api/generate-avatar';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_AI === 'true';
const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const CUSTOM_IMAGE_API = import.meta.env.VITE_IMAGEGEN_API_URL;
const CUSTOM_IMAGE_API_KEY = import.meta.env.VITE_IMAGEGEN_API_KEY;

/**
 * Generates a snowman avatar based on user input
 * @param image - Base64 encoded image or image URL
 * @param textDescription - Text description of desired snowman
 * @param style - Style of Snowy (default, elf, mafia, reindeer, rich, degenerate)
 * @returns Base64 encoded image or image URL of generated avatar
 */
export const generateSnowmanAvatar = async (
  image: string | null,
  textDescription: string,
  style: string = 'default'
): Promise<string> => {
  console.log('🎨 Starting snowman avatar generation...', { hasImage: !!image, description: textDescription, style });
  
  // Build style-specific description
  const styleDescriptions: { [key: string]: string } = {
    elf: 'playful elf snowman with pointy ears, festive green and red colors, mischievous smile',
    mafia: 'cool mafia snowman with fedora hat, dark suit, sunglasses, confident expression',
    reindeer: 'strong reindeer snowman with antlers, brown and white colors, loyal and determined look',
    rich: 'sophisticated rich snowman with top hat, gold accessories, elegant suit, successful appearance',
    degenerate: 'wild degenerate snowman with crazy expression, colorful accessories, adventurous and bold style',
    default: 'classic friendly snowman',
  };
  
  const stylePrompt = styleDescriptions[style] || styleDescriptions.default;
  const enhancedDescription = textDescription 
    ? `${stylePrompt}, ${textDescription}`
    : stylePrompt;

  // If a custom hosted generator is provided, use it first for higher fidelity
  if (CUSTOM_IMAGE_API) {
    try {
      const resp = await fetch(CUSTOM_IMAGE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(CUSTOM_IMAGE_API_KEY && { Authorization: `Bearer ${CUSTOM_IMAGE_API_KEY}` }),
        },
        body: JSON.stringify({
          prompt: enhancedDescription,
          image,
          style,
        }),
      });
      const data = await resp.json();
      const output = data.image || data.imageUrl || data.url;
      if (output) {
        console.log('✅ Custom image API succeeded');
        return output;
      }
      console.warn('Custom image API returned no image payload');
    } catch (error) {
      console.error('Custom image API failed, falling back:', error);
    }
  }
  
  // If explicitly using mock mode, use mock
  if (USE_MOCK) {
    console.log('🎭 Using mock mode');
    return generateMockAvatar(image, enhancedDescription);
  }

  // Try Replicate API first (easiest option)
  if (REPLICATE_API_TOKEN) {
    console.log('🔄 Trying Replicate API...');
    console.log('🔑 Token present:', REPLICATE_API_TOKEN.substring(0, 10) + '...');
    try {
      const result = await generateWithReplicate(image, enhancedDescription);
      console.log('✅ Replicate API succeeded! Result:', result.substring(0, 50) + '...');
      return result;
    } catch (error) {
      console.error('❌ Replicate generation failed, trying fallback:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  } else {
    console.warn('⚠️ Replicate API token not found!');
  }

  // Try Hugging Face with token
  if (HUGGINGFACE_API_TOKEN) {
    console.log('🔄 Trying Hugging Face API (with token)...');
    try {
      const result = await generateWithHuggingFace(image, enhancedDescription);
      console.log('✅ Hugging Face API succeeded!');
      return result;
    } catch (error) {
      console.error('❌ Hugging Face generation failed, trying fallback:', error);
    }
  }

  // Try OpenAI DALL-E
  if (OPENAI_API_KEY) {
    console.log('🔄 Trying OpenAI DALL-E...');
    try {
      const result = await generateWithOpenAI(textDescription);
      console.log('✅ OpenAI DALL-E succeeded!');
      return result;
    } catch (error) {
      console.error('❌ OpenAI generation failed, trying fallback:', error);
    }
  }

  // Try free Hugging Face Inference API (no token required for some models)
  console.log('🔄 Trying free Hugging Face API...');
  try {
    // Create truly unique seed based on inputs for unique snowman
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const uniqueSeed = image 
      ? image.substring(0, 30) + timestamp.toString() + random.toString()
      : (textDescription || 'snowy').substring(0, 30) + timestamp.toString() + random.toString();
    const seedHash = uniqueSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + random;
    
    // Enhanced prompt for high-quality 3D cartoon style (like elf quality) with landscape background
    const baseFreePrompt = `A charming 3D cartoon snowman character, close-up portrait, ${enhancedDescription || 'winter theme, festive, Christmas'}, smooth porcelain-like texture, rosy cheeks, friendly smile, high quality 3D render, Pixar animation quality, Disney style, professional character design, soft volumetric lighting, cinematic quality, detailed textures, three-dimensional depth, bokeh background, winter landscape, snowy mountains in background, pine trees, beautiful scenery, natural environment, premium quality, character portrait`;
    const freePrompt = image 
      ? `${baseFreePrompt}, inspired by uploaded photo, transform into high-quality 3D cartoon snowman with beautiful bokeh landscape background`
      : baseFreePrompt;
    
    console.log('📝 Prompt:', freePrompt);
    console.log('🎲 Unique seed:', seedHash);
    
    // Try multiple free models (prioritize 3D cartoon models)
    const models = [
      'playgroundai/playground-v2-1024px-aesthetic', // Better for 3D and cartoon style
      'stabilityai/stable-diffusion-2-1',
      'runwayml/stable-diffusion-v1-5',
      'CompVis/stable-diffusion-v1-4',
    ];

    for (const model of models) {
      try {
        // Retry logic for model loading
        let retries = 3;
        
        while (retries > 0) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            // Use proxy to avoid CORS
            const freeResponse = await fetch(
              `/api/huggingface/${model}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(HUGGINGFACE_API_TOKEN && { 'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}` }),
                },
                body: JSON.stringify({
                  inputs: freePrompt,
                  parameters: {
                    num_inference_steps: 50, // More steps for better 3D quality
                    guidance_scale: 9.0, // Higher guidance for better prompt following
                    seed: Math.abs(seedHash % 2147483647), // Unique seed for unique snowman (ensure positive)
                    negative_prompt: '2D, flat, illustration, drawing, sketch, white background, plain background, isolated on white',
                  },
                  options: {
                    wait_for_model: true,
                  },
                }),
                signal: controller.signal,
              }
            );

            clearTimeout(timeoutId);

            if (freeResponse.ok) {
              const contentType = freeResponse.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                const blob = await freeResponse.blob();
                console.log(`✅ Model ${model} generated image successfully!`);
                return URL.createObjectURL(blob);
              } else {
                // Might be JSON error
                const text = await freeResponse.text();
                try {
                  const json = JSON.parse(text);
                  if (json.error) {
                    // Check if model is loading
                    if (json.error.includes('loading') || json.error.includes('Model') && json.estimated_time) {
                      console.log(`Model ${model} is loading, waiting ${json.estimated_time}s...`);
                      await new Promise(resolve => setTimeout(resolve, (json.estimated_time || 20) * 1000));
                      retries--;
                      continue;
                    }
                    console.log(`Model ${model} error:`, json.error);
                    break; // Try next model
                  }
                } catch {
                  // Not JSON, might be base64 image
                  console.log(`Model ${model} returned unexpected format`);
                  break; // Try next model
                }
              }
            } else {
              const errorText = await freeResponse.text();
              try {
                const json = JSON.parse(errorText);
                if (json.error && (json.error.includes('loading') || json.estimated_time)) {
                  console.log(`Model ${model} is loading, waiting...`);
                  await new Promise(resolve => setTimeout(resolve, (json.estimated_time || 20) * 1000));
                  retries--;
                  continue;
                }
              } catch {}
              console.log(`Model ${model} failed:`, errorText);
              break; // Try next model
            }
          } catch (error: any) {
            if (error.name === 'AbortError') {
              console.log(`Model ${model} timeout`);
              break; // Try next model
            }
            retries--;
            if (retries > 0) {
              console.log(`Model ${model} error, retrying... (${retries} left)`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      } catch (error) {
        console.log(`Model ${model} error:`, error);
        continue; // Try next model
      }
    }
  } catch (freeError) {
    console.error('❌ Free Hugging Face API failed:', freeError);
  }

  // Try custom API endpoint
  console.log('🔄 Trying custom API endpoint...');
  try {
    const formData = new FormData();
    
    if (image) {
      // Convert base64 to blob if needed
      if (image.startsWith('data:image')) {
        const response = await fetch(image);
        const blob = await response.blob();
        formData.append('image', blob, 'upload.jpg');
      } else {
        formData.append('image', image);
      }
    }
    
    formData.append('description', textDescription || 'A friendly snowman avatar');
    formData.append('style', 'snowman');
    formData.append('unique', 'true');

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl || data.image;
  } catch (error) {
    console.error('❌ Custom API error:', error);
  }

  // Fallback to mock if all APIs fail
  console.warn('⚠️ All AI APIs failed, using fallback snowman generator');
  const fallbackSnowman = await generateMockAvatar(image, textDescription);
  console.log('✅ Fallback snowman generated:', fallbackSnowman.substring(0, 50) + '...');
  return fallbackSnowman;
};

/**
 * Generate mock avatar - creates a snowman-themed placeholder
 * Always returns a snowman image using Canvas API
 */
const generateMockAvatar = (
  _image: string | null,
  textDescription: string
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      // Create a simple canvas-based snowman image
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        // If canvas is not available, use a pre-generated snowman SVG as data URL
        const svgSnowman = createSnowmanSVG();
        resolve(svgSnowman);
        return;
      }
      
      // Draw pure white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      
      // Draw snowman body (3 circles with shadow)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(256, 400, 80, 0, Math.PI * 2); // Bottom
      ctx.fill();
      ctx.beginPath();
      ctx.arc(256, 300, 60, 0, Math.PI * 2); // Middle
      ctx.fill();
      ctx.beginPath();
      ctx.arc(256, 220, 45, 0, Math.PI * 2); // Head
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(240, 210, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(272, 210, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw smile
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, 230, 15, 0.2, Math.PI - 0.2);
      ctx.stroke();
      
      // Draw nose (carrot) - triangle
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.moveTo(256, 220);
      ctx.lineTo(275, 230);
      ctx.lineTo(256, 230);
      ctx.closePath();
      ctx.fill();
      
      // Draw buttons
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(256, 300, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(256, 320, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(256, 340, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw hat
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(220, 160, 72, 20);
      ctx.fillRect(230, 140, 52, 30);
      
      // Draw hat band
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(220, 160, 72, 5);
      
      // Draw arms (sticks)
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(200, 300);
      ctx.lineTo(170, 280);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(312, 300);
      ctx.lineTo(342, 280);
      ctx.stroke();
      
      // Add text if description provided
      if (textDescription) {
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛄ Snowman Avatar', 256, 480);
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      console.log('✅ Canvas snowman created, size:', dataUrl.length);
      resolve(dataUrl);
    } catch (error) {
      console.error('❌ Error creating canvas snowman:', error);
      // Fallback to SVG
      const svgSnowman = createSnowmanSVG();
      resolve(svgSnowman);
    }
  });
};

/**
 * Create a snowman SVG as fallback
 */
const createSnowmanSVG = (): string => {
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#E3F2FD;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#BBDEFB;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="#FFFFFF"/>
      <!-- Bottom circle -->
      <circle cx="256" cy="400" r="80" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
      <!-- Middle circle -->
      <circle cx="256" cy="300" r="60" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
      <!-- Head -->
      <circle cx="256" cy="220" r="45" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
      <!-- Eyes -->
      <circle cx="240" cy="210" r="6" fill="#000000"/>
      <circle cx="272" cy="210" r="6" fill="#000000"/>
      <!-- Smile -->
      <path d="M 240 230 Q 256 240 272 230" stroke="#000000" stroke-width="3" fill="none"/>
      <!-- Nose -->
      <polygon points="256,220 275,230 256,230" fill="#FF8C00"/>
      <!-- Buttons -->
      <circle cx="256" cy="300" r="5" fill="#000000"/>
      <circle cx="256" cy="320" r="5" fill="#000000"/>
      <circle cx="256" cy="340" r="5" fill="#000000"/>
      <!-- Hat -->
      <rect x="220" y="160" width="72" height="20" fill="#1a1a1a"/>
      <rect x="230" y="140" width="52" height="30" fill="#1a1a1a"/>
      <rect x="220" y="160" width="72" height="5" fill="#FF0000"/>
      <!-- Arms -->
      <line x1="200" y1="300" x2="170" y2="280" stroke="#8B4513" stroke-width="8" stroke-linecap="round"/>
      <line x1="312" y1="300" x2="342" y2="280" stroke="#8B4513" stroke-width="8" stroke-linecap="round"/>
    </svg>
  `.trim();
  
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(svgBlob);
};

/**
 * Upload image to Replicate and get URL (via proxy to avoid CORS)
 */
const uploadImageToReplicate = async (imageData: string): Promise<string> => {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Replicate API token not configured');
  }

  // Convert base64 to blob
  const response = await fetch(imageData);
  const blob = await response.blob();
  
  // Upload to Replicate via proxy
  const formData = new FormData();
  formData.append('file', blob, 'image.png');
  
  const uploadResponse = await fetch('/api/replicate/files', {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to Replicate');
  }

  const uploadData = await uploadResponse.json();
  return uploadData.urls.get;
};

/**
 * Generate using Replicate API
 */
export const generateWithReplicate = async (
  image: string | null,
  textDescription: string
): Promise<string> => {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Replicate API token not configured');
  }

  try {
    // Create unique seed for unique snowman
    const uniqueSeed = image 
      ? image.substring(0, 20) + Date.now().toString()
      : (textDescription || 'snowy').substring(0, 20) + Date.now().toString();
    const seedHash = uniqueSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Build optimized prompt for high-quality 3D cartoon snowman (like elf quality) with landscape background
    const basePrompt = 'A charming 3D cartoon snowman character, close-up portrait, smooth porcelain-like texture, rosy cheeks, friendly smile, high quality 3D render, Pixar animation quality, Disney style, professional character design, soft volumetric lighting, cinematic quality, detailed textures, three-dimensional depth, bokeh background, winter landscape, snowy mountains in background, pine trees, beautiful scenery, natural environment, premium quality, character portrait';
    const enhancedDescription = textDescription ? `, ${textDescription}` : '';
    const prompt = `${basePrompt}${enhancedDescription}`;
    
    const input: any = {
      prompt: prompt,
      num_outputs: 1,
      aspect_ratio: '1:1',
      output_format: 'url',
      seed: Math.abs(seedHash % 2147483647), // Unique seed for unique snowman (ensure positive)
      negative_prompt: '2D, flat, illustration, drawing, sketch, white background, plain background, isolated on white',
    };

    // If image provided, try image-to-image model first
    if (image) {
      try {
        // Upload image to Replicate and get URL
        const imageUrl = await uploadImageToReplicate(image);
        
        // Use image-to-image model (via proxy to avoid CORS)
        const response = await fetch('/api/replicate/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL better for character design
            input: {
              image: imageUrl,
              prompt: `${prompt}, transform this image into a high-quality 3D cartoon snowman character, Pixar quality, professional character design, winter landscape background`,
              num_outputs: 1,
              output_format: 'url',
              seed: Math.abs(seedHash % 2147483647),
              num_inference_steps: 50,
              guidance_scale: 7.5,
            },
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

      // Poll for result (via proxy)
      let result = data;
      let attempts = 0;
      while ((result.status === 'starting' || result.status === 'processing') && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetch(`/api/replicate/predictions/${data.id}`);
        result = await statusResponse.json();
        attempts++;
      }

        if (result.status === 'succeeded' && result.output && result.output.length > 0) {
          return result.output[0];
        } else {
          throw new Error(result.error || 'Generation failed');
        }
      } catch (imageError) {
        console.warn('Image-to-image failed, falling back to text-to-image:', imageError);
        // Fallback to text-to-image with enhanced prompt
        input.prompt = `${prompt}, inspired by the uploaded photo`;
      }
    }
    
    // Text-to-image generation (always executed, either as primary or fallback) - via proxy
    const response = await fetch('http://localhost:3001/api/replicate/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL better for character design
        input: {
          ...input,
          num_inference_steps: 50, // More steps for better quality
          guidance_scale: 7.5,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

      // Poll for result (via proxy)
      let result = data;
      let attempts = 0;
      while ((result.status === 'starting' || result.status === 'processing') && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetch(`/api/replicate/predictions/${data.id}`);
        result = await statusResponse.json();
        attempts++;
      }

    if (result.status === 'succeeded' && result.output && result.output.length > 0) {
      return result.output[0];
    } else {
      throw new Error(result.error || 'Generation failed');
    }
  } catch (error) {
    console.error('Replicate API error:', error);
    throw error;
  }
};

/**
 * Generate using Hugging Face Inference API
 */
export const generateWithHuggingFace = async (
  image: string | null,
  textDescription: string
): Promise<string> => {
  if (!HUGGINGFACE_API_TOKEN) {
    throw new Error('Hugging Face API token not configured');
  }

  try {
    // Create unique seed for unique snowman
    const uniqueSeed = image 
      ? image.substring(0, 20) + Date.now().toString()
      : (textDescription || 'snowy').substring(0, 20) + Date.now().toString();
    const seedHash = uniqueSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const prompt = `A charming 3D cartoon snowman character, close-up head and shoulders, ${textDescription || 'winter theme'}, smooth porcelain-like texture, rosy cheeks, friendly smile, high quality 3D render, Pixar animation quality, Disney style, professional character design, soft volumetric lighting, cinematic quality, detailed textures, three-dimensional depth, winter landscape background, snowy mountains, pine trees, beautiful scenery, natural environment, premium quality`;
    
    // If image provided, try image-to-image model
    if (image) {
      try {
        // Convert base64 to blob
        const response = await fetch(image);
        const blob = await response.blob();
        
        // Convert blob to base64 for API
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64Image = await base64Promise;
        
        // Try image-to-image model (img2img)
        const img2imgResponse = await fetch(
          'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: {
                image: base64Image.split(',')[1], // Remove data:image/... prefix
                prompt: `transform this into a snowman avatar, ${prompt}`,
              },
              parameters: {
                num_inference_steps: 20,
                image_guidance_scale: 1.5,
              },
            }),
          }
        );

        if (img2imgResponse.ok) {
          const imgBlob = await img2imgResponse.blob();
          if (imgBlob.type.startsWith('image/')) {
            return URL.createObjectURL(imgBlob);
          }
        }
      } catch (imgError) {
        console.warn('Image-to-image failed, using text-to-image:', imgError);
      }
    }
    
    // Fallback to text-to-image
    const response = await fetch(
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: image ? `${prompt}, inspired by the uploaded photo` : prompt,
          parameters: {
            seed: Math.abs(seedHash % 2147483647), // Unique seed for unique snowman (ensure positive)
            negative_prompt: '2D, flat, illustration, drawing, sketch, white background, plain background, isolated on white',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw error;
  }
};

/**
 * Generate using OpenAI DALL-E
 */
export const generateWithOpenAI = async (
  textDescription: string
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const prompt = `A charming 3D cartoon snowman character, close-up head and shoulders, ${textDescription || 'winter theme'}, smooth porcelain-like texture, rosy cheeks, friendly smile, high quality 3D render, Pixar animation quality, Disney style, professional character design, soft volumetric lighting, cinematic quality, detailed textures, three-dimensional depth, winter landscape background, snowy mountains, pine trees, beautiful scenery, natural environment, premium quality`;
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Generation failed');
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};
