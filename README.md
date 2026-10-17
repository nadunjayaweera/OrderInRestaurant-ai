# MenuBridge AI

MenuBridge AI is a local AI-powered restaurant menu translation assistant built for the **Hacktoberfest 2026 Open-Source AI Challenge Week 2: Side Hustle**.

The project is designed for restaurants, cafés, hotels, villas, and other hospitality businesses that need to translate menus for international guests without losing the meaning of local dishes.

> Translate local dishes without losing their identity.

---

## Challenge Theme

This project was built for the Hacktoberfest 2026 theme:

**Side Hustle**

The challenge asks participants to build something using open-source AI that someone would actually pay for.

MenuBridge AI solves a practical hospitality problem:

- Restaurants need multilingual menus
- Local dish names are often translated poorly
- Menu descriptions must remain natural and accurate
- Ingredients should not be changed or invented
- Small businesses may not want to pay for every API request
- Restaurants may want their menu data to stay local

MenuBridge AI uses a locally running open-weight model to solve that problem.

---

# The Problem

Restaurants serving international customers often need to translate their menus into multiple languages.

A normal translation tool can translate words, but restaurant menus are more complicated.

For example:

```text
Seafood Kottu
Pol Sambol
Egg Hoppers
Lamprais
Watalappan
```

These are culturally specific food names.

A literal translation can make them confusing or remove their identity completely.

Restaurants also need to preserve:

- Ingredients
- Allergens
- Cultural dish names
- Restaurant-specific terminology
- Natural menu language

MenuBridge AI is designed specifically for this use case.

---

# The Solution

MenuBridge AI lets a restaurant enter a menu item and translate it using a locally running AI model.

The user provides:

- Restaurant name
- Source language
- Target language
- Dish name
- Description
- Category

The restaurant can also create its own terminology rules.

For example:

```text
Term:
Kottu

Rule:
Keep the word Kottu in the translated menu name.
```

Or:

```text
Term:
Pol Sambol

Rule:
Keep Pol Sambol as the original dish name and describe it as a Sri Lankan coconut relish.
```

The AI then uses those rules when generating the translation.

---

# Example

## Input

```text
Restaurant:
Ceylon Kitchen

Source Language:
English

Target Language:
French

Dish:
Seafood Kottu

Description:
Chopped roti mixed with prawns, cuttlefish,
vegetables, egg, spring onions, and house spices.

Category:
Main Course
```

## Example AI Output

```json
{
  "original_name": "Seafood Kottu",
  "translated_name": "Kottu aux fruits de mer",
  "translated_description": "Roti haché sauté avec des crevettes, de la seiche, des légumes, un œuf, des oignons nouveaux et des épices maison.",
  "cultural_note": "Kottu is a Sri Lankan dish name and has been preserved.",
  "kept_original_term": true
}
```

---

# Features

MenuBridge AI currently supports:

- AI-powered menu translation
- Multiple target languages
- Restaurant-specific terminology rules
- Cultural dish name preservation
- Local AI inference
- Structured JSON AI responses
- Translation review
- Translation approval
- Translation history
- Persistent JSON storage
- Persistent restaurant dictionary
- Delete saved translations
- CSV export for approved menu items
- No external database required
- No paid AI API required

---

# Supported Languages

The current frontend supports:

- English
- French
- German
- Spanish
- Italian
- Portuguese
- Chinese
- Japanese
- Korean

The available languages can easily be extended in the frontend.

---

# Restaurant Dictionary

One of the main features of MenuBridge AI is the **Restaurant Dictionary**.

Restaurants can define how specific terms should be handled.

Example:

```json
[
  {
    "term": "Kottu",
    "instruction": "Keep the word Kottu in the translated menu name."
  },
  {
    "term": "Pol Sambol",
    "instruction": "Keep Pol Sambol as the original dish name and describe it as a Sri Lankan coconut relish."
  },
  {
    "term": "Hoppers",
    "instruction": "Keep the original word Hoppers and explain that it is a Sri Lankan bowl-shaped pancake."
  }
]
```

These rules are stored locally and automatically included when MenuBridge asks the AI model to translate a menu item.

This makes the translation more restaurant-specific than a generic translation tool.

---

# Translation Workflow

The application follows this flow:

```text
Restaurant Setup
        ↓
Add Menu Item
        ↓
Restaurant Dictionary
        ↓
Node.js / Express API
        ↓
Ollama
        ↓
Gemma 3
        ↓
Structured Translation
        ↓
Review Result
        ↓
Approve Translation
        ↓
Save to JSON
        ↓
Export Approved Menu
```

---

# Tech Stack

## Frontend

- React
- Vite
- CSS

## Backend

- Node.js
- Express

## AI

- Ollama
- Gemma 3 1B

## Storage

- Local JSON files
- Node.js File System API

No MySQL, PostgreSQL, MongoDB, or cloud database is required for the current version.

---

# Project Structure

```text
menubridge-ai/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── package.json
│   └── ...
│
├── server/
│   ├── data/
│   │   ├── restaurant-dictionary.json
│   │   └── translations.json
│   │
│   ├── index.js
│   └── package.json
│
├── README.md
└── .gitignore
```

The `server/data` directory contains runtime data and can remain excluded from Git.

For public examples, example JSON files can be added separately.

---

# JSON Persistence

MenuBridge AI does not require a database.

It stores its data locally in JSON files.

## Restaurant Dictionary

```text
server/data/restaurant-dictionary.json
```

Example:

```json
[
  {
    "id": "rule-id",
    "term": "Kottu",
    "instruction": "Keep the word Kottu in the translated menu name.",
    "created_at": "2026-10-17T00:00:00.000Z"
  }
]
```

## Translation History

```text
server/data/translations.json
```

Example:

```json
[
  {
    "id": "translation-id",
    "restaurant_name": "Ceylon Kitchen",
    "source_language": "English",
    "target_language": "French",
    "category": "Main Course",
    "original_name": "Seafood Kottu",
    "original_description": "Chopped roti mixed with prawns, cuttlefish, vegetables, egg and house spices.",
    "translated_name": "Kottu aux fruits de mer",
    "translated_description": "Roti haché sauté avec des crevettes, de la seiche, des légumes, un œuf et des épices maison.",
    "cultural_note": "Kottu is a Sri Lankan dish name and has been preserved.",
    "kept_original_term": true,
    "status": "APPROVED",
    "created_at": "2026-10-17T00:00:00.000Z",
    "approved_at": "2026-10-17T00:05:00.000Z"
  }
]
```

Because the data is stored on disk, terminology rules and generated translations remain available after refreshing the browser or restarting the frontend.

---

# How the AI Works

The frontend sends the menu information to the Express backend.

Example:

```json
{
  "restaurantName": "Ceylon Kitchen",
  "sourceLanguage": "English",
  "targetLanguage": "French",
  "name": "Seafood Kottu",
  "description": "Chopped roti mixed with prawns, cuttlefish, vegetables, egg and house spices.",
  "category": "Main Course"
}
```

The backend then loads the restaurant terminology dictionary and constructs a prompt for Gemma.

Gemma is instructed to:

- Translate naturally
- Preserve cultural dish names when necessary
- Follow restaurant terminology rules
- Never invent ingredients
- Never remove ingredients
- Preserve allergen and dietary information
- Avoid awkward literal translation
- Return structured JSON only

---

# Structured AI Output

Gemma is expected to return:

```json
{
  "original_name": "",
  "translated_name": "",
  "translated_description": "",
  "cultural_note": "",
  "kept_original_term": false
}
```

Using structured JSON makes the AI output easier to validate and display in the frontend.

---

# Translation Approval

Every generated translation is stored with:

```text
GENERATED
```

status.

After reviewing the result, the restaurant user can approve it.

The status then becomes:

```text
APPROVED
```

Approved translations can later be exported to CSV.

This is important because AI-generated restaurant content should still be reviewed before publishing.

---

# CSV Export

MenuBridge AI can export approved translations into a CSV file.

The export includes:

```text
Restaurant
Category
Source Language
Target Language
Original Name
Original Description
Translated Name
Translated Description
Cultural Note
```

This makes it possible to move approved menu translations into:

- Restaurant POS systems
- Excel
- Google Sheets
- Printed menu workflows
- Online ordering platforms
- QR menu systems

---

# API Endpoints

## Health Check

```http
GET /api/health
```

---

## Get Restaurant Dictionary

```http
GET /api/dictionary
```

---

## Add Terminology Rule

```http
POST /api/dictionary
```

Example:

```json
{
  "term": "Lamprais",
  "instruction": "Keep the word Lamprais and describe it as a Sri Lankan Dutch Burgher rice meal baked in a banana leaf."
}
```

---

## Delete Terminology Rule

```http
DELETE /api/dictionary/:id
```

---

## Translate Menu Item

```http
POST /api/translate-menu
```

Example:

```json
{
  "restaurantName": "Ceylon Kitchen",
  "sourceLanguage": "English",
  "targetLanguage": "French",
  "name": "Seafood Kottu",
  "description": "Chopped roti mixed with prawns, cuttlefish, vegetables, egg and house spices.",
  "category": "Main Course"
}
```

---

## Get Translation History

```http
GET /api/translations
```

---

## Approve Translation

```http
PATCH /api/translations/:id/approve
```

---

## Delete Translation

```http
DELETE /api/translations/:id
```

---

# Installation

## Requirements

Install:

- Node.js 18+
- npm
- Ollama

---

# Install Ollama

Download and install Ollama from:

```text
https://ollama.com
```

Check that Ollama is installed:

```bash
ollama --version
```

---

# Install Gemma

MenuBridge currently uses:

```text
gemma3:1b
```

Download it:

```bash
ollama pull gemma3:1b
```

Check installed models:

```bash
ollama list
```

You should see:

```text
gemma3:1b
```

You can test it manually:

```bash
ollama run gemma3:1b
```

Exit with:

```text
/bye
```

---

# Run the Backend

From the project root:

```bash
cd server
npm install
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

Test:

```text
http://localhost:5000/api/health
```

Expected:

```json
{
  "success": true,
  "message": "MenuBridge AI API is running"
}
```

---

# Run the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Vite will display the frontend URL.

Usually:

```text
http://localhost:5173
```

---

# Example Test Dishes

MenuBridge AI was tested with Sri Lankan dishes including:

```text
Seafood Kottu
Pol Sambol
Egg Hoppers
String Hoppers
Lamprais
Isso Wade
Watalappan
```

These are useful test cases because translating their names literally can reduce their cultural meaning.

---

# Why Open Innovation Matters

Open innovation is important to MenuBridge AI because the project is designed around small hospitality businesses.

A restaurant may regularly update:

- Menu items
- Ingredients
- Seasonal dishes
- Prices
- Descriptions
- Language versions

Using a paid cloud AI API for every translation can introduce recurring costs.

With MenuBridge AI, the model runs locally through Ollama.

This provides several advantages.

## Lower Operating Cost

Once the model is installed, there is no per-request AI charge from MenuBridge itself.

This makes the product more practical for a low-cost restaurant translation service.

## Privacy

Menu information can remain on the restaurant's own machine.

Restaurants may not want to send internal menu descriptions, recipes, or terminology to an external AI provider.

Local inference reduces that dependency.

## Restaurant-Specific Customization

The Restaurant Dictionary allows each business to define how its terminology should be handled.

For example:

```text
Kottu
Pol Sambol
Hoppers
Lamprais
Watalappan
```

This makes MenuBridge more specialized than using only a generic translation service.

## Model Flexibility

The application is not permanently tied to one AI provider.

Because the model runs through Ollama, another compatible open-weight model could be evaluated or substituted later.

## Offline-Friendly

Once Ollama and Gemma are installed, the AI generation itself can run locally without requiring a cloud AI API.

---

# Why Someone Could Pay for It

MenuBridge AI could be useful for:

- Restaurants
- Cafés
- Hotels
- Villas
- Guest houses
- Food delivery businesses
- Tourism businesses

A restaurant serving international guests may need menus in several languages but may not have an in-house translator.

MenuBridge could be offered as:

```text
One-time menu translation service
```

or:

```text
Monthly menu translation tool
```

Potential commercial features could later include:

- Multiple restaurants
- Bulk Excel uploads
- QR menu generation
- Menu publishing
- POS integrations
- Multiple approved languages
- Translation templates
- User accounts
- Cloud synchronization

The Hacktoberfest version intentionally focuses on the smaller core problem first.

---

# Human Review Matters

AI translation should not automatically be treated as final restaurant content.

For example, an AI model may occasionally use a broader term than the restaurant expects.

MenuBridge therefore uses this workflow:

```text
Generate
   ↓
Review
   ↓
Approve
   ↓
Export
```

The restaurant stays in control of what eventually appears on its menu.

---

# What I Learned

Building MenuBridge AI helped me learn more about using open-weight AI for a practical business use case.

I practiced:

- Running Gemma locally through Ollama
- Building a React interface around local AI
- Connecting React with Express
- Creating structured prompts
- Requesting JSON responses from an AI model
- Validating model output
- Designing restaurant-specific AI instructions
- Persisting data without a database
- Using JSON as lightweight local storage
- Building translation review and approval flows
- Exporting approved data as CSV

One of the biggest lessons was that a useful AI product does not always need a large infrastructure stack.

For a focused problem, a small local model, an Express API, React, and JSON storage can already create something practical.

---

# Hacktoberfest 2026

MenuBridge AI was built for:

**Hacktoberfest 2026 Open-Source AI Challenge Week 2: Side Hustle**

The challenge was to build something with open-source AI at its core that someone could realistically pay for.

MenuBridge AI focuses on a real hospitality use case:

> helping restaurants translate menus while preserving the identity of local dishes.

---

# AI Model

Current model:

```text
Gemma 3 1B
```

Inference:

```text
Ollama
```

---

# Current Status

The current MVP supports:

- Restaurant setup
- Menu translation
- Restaurant terminology dictionary
- Local Gemma inference
- Persistent JSON storage
- Generated translation history
- Approval workflow
- Delete translation
- CSV export
- Multiple languages

---

# Future Improvements

Possible future improvements include:

- Bulk Excel menu upload
- Menu import from POS systems
- Multiple translation languages at once
- AI-assisted allergen checking
- Restaurant profiles
- Multiple saved restaurants
- User authentication
- Translation editing
- Translation version history
- Better multilingual model support
- QR menu generation
- Printable multilingual menus
- POS integration
- Cloud synchronization
- Image-based menu scanning
- Fine-tuned restaurant terminology models

---

# License

MIT
