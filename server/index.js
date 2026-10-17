const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

/* =========================================================
   JSON DATA STORAGE
========================================================= */

const DATA_DIR = path.join(__dirname, "data");

const DICTIONARY_FILE = path.join(DATA_DIR, "restaurant-dictionary.json");

const TRANSLATIONS_FILE = path.join(DATA_DIR, "translations.json");

const DEFAULT_DICTIONARY = [
  {
    id: crypto.randomUUID(),
    term: "Kottu",
    instruction: "Keep the word Kottu in the translated menu name.",
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    term: "Pol Sambol",
    instruction:
      "Keep Pol Sambol as the original dish name and describe it as a Sri Lankan coconut relish.",
    created_at: new Date().toISOString(),
  },
];

/* =========================================================
   FILE HELPERS
========================================================= */

function ensureDataStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true,
    });
  }

  if (!fs.existsSync(DICTIONARY_FILE)) {
    fs.writeFileSync(
      DICTIONARY_FILE,
      JSON.stringify(DEFAULT_DICTIONARY, null, 2),
    );
  }

  if (!fs.existsSync(TRANSLATIONS_FILE)) {
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify([], null, 2));
  }
}

function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const content = fs.readFileSync(filePath, "utf8");

    if (!content.trim()) {
      return fallback;
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error.message);

    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

ensureDataStorage();

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MenuBridge AI API is running",
  });
});

/* =========================================================
   RESTAURANT DICTIONARY
========================================================= */

/**
 * GET ALL DICTIONARY RULES
 */
app.get("/api/dictionary", (req, res) => {
  try {
    const dictionary = readJson(DICTIONARY_FILE, []);

    return res.json({
      success: true,
      count: dictionary.length,
      dictionary,
    });
  } catch (error) {
    console.error("Get dictionary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load restaurant dictionary",
    });
  }
});

/**
 * ADD DICTIONARY RULE
 */
app.post("/api/dictionary", (req, res) => {
  try {
    const { term, instruction } = req.body;

    if (!term?.trim() || !instruction?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Term and instruction are required",
      });
    }

    const dictionary = readJson(DICTIONARY_FILE, []);

    const duplicate = dictionary.find(
      (item) => item.term.toLowerCase() === term.trim().toLowerCase(),
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This terminology rule already exists",
      });
    }

    const rule = {
      id: crypto.randomUUID(),
      term: term.trim(),
      instruction: instruction.trim(),
      created_at: new Date().toISOString(),
    };

    dictionary.push(rule);

    writeJson(DICTIONARY_FILE, dictionary);

    return res.status(201).json({
      success: true,
      message: "Terminology rule saved",
      rule,
    });
  } catch (error) {
    console.error("Add dictionary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save terminology rule",
    });
  }
});

/**
 * DELETE DICTIONARY RULE
 */
app.delete("/api/dictionary/:id", (req, res) => {
  try {
    const { id } = req.params;

    const dictionary = readJson(DICTIONARY_FILE, []);

    const exists = dictionary.some((item) => item.id === id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Terminology rule not found",
      });
    }

    const updatedDictionary = dictionary.filter((item) => item.id !== id);

    writeJson(DICTIONARY_FILE, updatedDictionary);

    return res.json({
      success: true,
      message: "Terminology rule removed",
    });
  } catch (error) {
    console.error("Delete dictionary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete terminology rule",
    });
  }
});

/* =========================================================
   TRANSLATE MENU
========================================================= */

app.post("/api/translate-menu", async (req, res) => {
  try {
    const {
      restaurantName,
      sourceLanguage,
      targetLanguage,
      name,
      description,
      category,
    } = req.body;

    if (!targetLanguage || !name) {
      return res.status(400).json({
        success: false,
        message: "Target language and menu item name are required",
      });
    }

    /*
     * Always load the latest dictionary
     * from JSON instead of trusting
     * frontend memory.
     */
    const dictionary = readJson(DICTIONARY_FILE, []);

    const prompt = `
You are MenuBridge AI, a restaurant menu translation assistant.

Your job is to translate restaurant menu content while preserving cultural meaning and restaurant-specific terminology.

Restaurant:
${restaurantName || "Restaurant"}

Original language:
${sourceLanguage || "English"}

Target language:
${targetLanguage}

Restaurant terminology rules:
${JSON.stringify(
  dictionary.map((item) => ({
    term: item.term,
    instruction: item.instruction,
  })),
)}

Menu item:

Name:
${name}

Description:
${description || "No description provided"}

Category:
${category || "Not specified"}

IMPORTANT RULES:

- Translate the menu item into ${targetLanguage}.
- Preserve culturally important dish names when translating them would reduce their meaning.
- Follow every restaurant terminology rule supplied above.
- Never invent ingredients.
- Never remove ingredients.
- Never change allergens or dietary information.
- Do not add claims that were not present in the original menu.
- Use natural restaurant language instead of awkward literal translation.
- Make descriptions understandable to international restaurant guests.
- Keep descriptions concise.
- Do not exaggerate the food.
- Preserve names such as Kottu, Pol Sambol, Hoppers, or other local names when appropriate.
- If a cultural term is preserved, briefly explain why in cultural_note.
- Return ONLY JSON.
- Do not include Markdown.
- Do not include text before or after the JSON.

Return exactly:

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

    /*
     * SAVE EVERY GENERATED RESULT
     */

    const translations = readJson(TRANSLATIONS_FILE, []);

    const record = {
      id: crypto.randomUUID(),

      restaurant_name: restaurantName || "Restaurant",

      source_language: sourceLanguage || "English",

      target_language: targetLanguage,

      category: category || "",

      original_name: name,

      original_description: description || "",

      translated_name: translation.translated_name,

      translated_description: translation.translated_description,

      cultural_note: translation.cultural_note,

      kept_original_term: translation.kept_original_term,

      status: "GENERATED",

      created_at: new Date().toISOString(),

      approved_at: null,
    };

    /*
     * Put newest first
     */
    translations.unshift(record);

    writeJson(TRANSLATIONS_FILE, translations);

    return res.json({
      success: true,
      translation,
      record,
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

/* =========================================================
   TRANSLATION HISTORY
========================================================= */

/**
 * GET ALL GENERATED TRANSLATIONS
 */
app.get("/api/translations", (req, res) => {
  try {
    const translations = readJson(TRANSLATIONS_FILE, []);

    return res.json({
      success: true,
      count: translations.length,
      translations,
    });
  } catch (error) {
    console.error("Get translations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load translations",
    });
  }
});

/**
 * APPROVE TRANSLATION
 */
app.patch("/api/translations/:id/approve", (req, res) => {
  try {
    const { id } = req.params;

    const translations = readJson(TRANSLATIONS_FILE, []);

    const index = translations.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    translations[index] = {
      ...translations[index],
      status: "APPROVED",
      approved_at: new Date().toISOString(),
    };

    writeJson(TRANSLATIONS_FILE, translations);

    return res.json({
      success: true,
      message: "Translation approved",
      translation: translations[index],
    });
  } catch (error) {
    console.error("Approve translation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve translation",
    });
  }
});

/**
 * DELETE TRANSLATION
 */
app.delete("/api/translations/:id", (req, res) => {
  try {
    const { id } = req.params;

    const translations = readJson(TRANSLATIONS_FILE, []);

    const exists = translations.some((item) => item.id === id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    const updated = translations.filter((item) => item.id !== id);

    writeJson(TRANSLATIONS_FILE, updated);

    return res.json({
      success: true,
      message: "Translation deleted",
    });
  } catch (error) {
    console.error("Delete translation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete translation",
    });
  }
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(`MenuBridge AI server running on port ${PORT}`);

  console.log(`JSON data: ${DATA_DIR}`);
});
