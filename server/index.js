const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MenuBridge AI API is running",
  });
});

app.post("/api/translate-menu", async (req, res) => {
  try {
    const {
      restaurantName,
      sourceLanguage,
      targetLanguage,
      name,
      description,
      category,
      dictionary = [],
    } = req.body;

    if (!targetLanguage || !name) {
      return res.status(400).json({
        success: false,
        message: "Target language and menu item name are required",
      });
    }

    const prompt = `
You are MenuBridge AI, a restaurant menu translation assistant.

Your task is to translate restaurant menu content into ${targetLanguage}.

Restaurant:
${restaurantName || "Restaurant"}

Original language:
${sourceLanguage || "English"}

Target language:
${targetLanguage}

Restaurant terminology rules:
${JSON.stringify(dictionary)}

Menu item:
Name: ${name}
Description: ${description || "No description provided"}
Category: ${category || "Not specified"}

Rules:
- Preserve culturally important dish names if translating them would reduce their meaning.
- Follow all restaurant terminology rules.
- Never invent ingredients.
- Never remove ingredients that are present.
- Do not change allergen or dietary information.
- Make the translation natural for restaurant customers.
- Avoid awkward literal translations.
- Keep descriptions concise and clear.
- Do not exaggerate the dish.
- Keep original dish names such as Kottu or Pol Sambol when appropriate.
- Return valid JSON only.
- Do not include markdown.
- Do not include explanation outside the JSON.

Return exactly this JSON structure:

{
  "original_name": "",
  "translated_name": "",
  "translated_description": "",
  "cultural_note": "",
  "kept_original_term": false
}
`;

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:1b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.3,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();

      console.error("Ollama error:", errorText);

      return res.status(500).json({
        success: false,
        message: "Failed to communicate with Ollama",
      });
    }

    const ollamaData = await ollamaResponse.json();

    const content = ollamaData.message?.content;

    console.log("Gemma raw response:");
    console.log(content);

    if (!content) {
      return res.status(500).json({
        success: false,
        message: "Gemma returned an empty response",
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("JSON parse error:", error);

      return res.status(500).json({
        success: false,
        message: "AI returned invalid JSON",
        raw: content,
      });
    }

    const translation = {
      original_name: parsed.original_name || name,
      translated_name: parsed.translated_name || "",
      translated_description: parsed.translated_description || "",
      cultural_note: parsed.cultural_note || "",
      kept_original_term: parsed.kept_original_term === true,
    };

    if (!translation.translated_name) {
      return res.status(500).json({
        success: false,
        message: "AI translation is missing translated_name",
      });
    }

    return res.json({
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Translate menu error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to translate menu item",
      error: error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`MenuBridge AI server running on port ${PORT}`);
});
