// aiImageRecognition.js
import axios from "axios";
import { convertBufferToBase64, isValidBase64Image } from './imageToBase64.js';

/**
 * Generates listing content based on property info and images
 * @param {Object} propertyInfo - Property details
 * @param {Array} imageBuffers - Array of image buffers
 * @returns {Promise<Object>} - Generated title and description
 */
async function generateListingContent(propertyInfo, imageBuffers = []) {
  const OPENAI_API_KEY = process.env.OPEN_AI_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  console.log(propertyInfo);
  
  const messages = [
    {
      "role": "system",
      "content": "You are a professional real estate copywriter. Create compelling, accurate, and attractive listing content based on property details and images."
    }
  ];

  const content = [
    {
      "type": "text",
      "text": `Create an attractive rental listing for this property:
      ${JSON.stringify(propertyInfo)}
      
      Generate:
      1. A compelling title (max 60 characters)
      2. A detailed description highlighting key features
      
      Return in this format, dont add any other text:
      {
        "title": "Compelling title here",
        "description": "Detailed description here",
      }`
    }
  ];

  // Add images if provided
  if (imageBuffers && imageBuffers.length > 0) {
    for (let i = 0; i < Math.min(imageBuffers.length, 4); i++) {
      const buffer = imageBuffers[i];
      if (Buffer.isBuffer(buffer)) {
        const base64String = convertBufferToBase64(buffer);
        if (isValidBase64Image(base64String)) {
          content.push({
            "type": "image_url",
            "image_url": {
              "url": `data:image/jpeg;base64,${base64String}`
            }
          });
        }
      }
    }
  }

  messages.push({
    "role": "user",
    "content": content
  });

  console.log(messages);

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      "model": "gpt-4o",
      "messages": messages,
      "temperature": Math.random() < 0.5 ? 0.7 : 1,
      "max_tokens": 1000
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = response.data.choices[0].message.content;
  try {
    // Handle responses that might be wrapped in markdown code blocks
    let cleanResult = result.trim();
    
    // Remove markdown code block wrappers if present
    if (cleanResult.startsWith('```json')) {
      cleanResult = cleanResult.replace(/^```json\s*/, '');
    }
    if (cleanResult.startsWith('```')) {
      cleanResult = cleanResult.replace(/^```\s*/, '');
    }
    if (cleanResult.endsWith('```')) {
      cleanResult = cleanResult.replace(/\s*```$/, '');
    }
    
    return JSON.parse(cleanResult);
  } catch (e) {
    return { error: "Could not parse GPT response", raw: result };
  }
}

export { generateListingContent };
