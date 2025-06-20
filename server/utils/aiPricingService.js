// gptRentEstimator.js
import axios from "axios";

async function generatePriceSuggestion(propertyInfo, location, comparableListings = []) {
  const OPENAI_API_KEY = process.env.OPEN_AI_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const prompt = `You are a real estate pricing assistant. Based on the following property details and location, estimate the fair market monthly rent in CAD. Give a range of 10% above and below the estimated rent. Be conservative unless the property has premium features.

Subject property:
${JSON.stringify(propertyInfo)}

Location:
${JSON.stringify(location)}

Return the answer strictly in this format, dont add any other text:
{"suggestedPrice": 2300, "priceRange": {"min": 2070,"max": 2530},"comment": "This is a comment","justification": "This is a justification"}`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You help price rental listings accurately." },
        { role: "user", content: prompt },
      ],
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
    return JSON.parse(result);
  } catch (e) {
    return { error: "Could not parse GPT response", raw: result };
  }
}

export { generatePriceSuggestion };
