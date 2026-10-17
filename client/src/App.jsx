import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [restaurantName, setRestaurantName] = useState("Ceylon Kitchen");
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("French");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Main Course");

  const [dictionary, setDictionary] = useState([]);

  const [translations, setTranslations] = useState([]);

  const [currentRecord, setCurrentRecord] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);

  const [dictionaryTerm, setDictionaryTerm] = useState("");
  const [dictionaryInstruction, setDictionaryInstruction] = useState("");

  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);

  const languages = [
    "English",
    "French",
    "German",
    "Spanish",
    "Italian",
    "Portuguese",
    "Chinese",
    "Japanese",
    "Korean",
  ];

  const categories = [
    "Starter",
    "Main Course",
    "Rice & Curry",
    "Seafood",
    "Dessert",
    "Beverage",
    "Snack",
    "Other",
  ];

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      setDataLoading(true);

      const [dictionaryResponse, translationsResponse] = await Promise.all([
        fetch("http://localhost:5000/api/dictionary"),
        fetch("http://localhost:5000/api/translations"),
      ]);

      const dictionaryData = await dictionaryResponse.json();

      const translationsData = await translationsResponse.json();

      if (dictionaryData.success) {
        setDictionary(dictionaryData.dictionary || []);
      }

      if (translationsData.success) {
        setTranslations(translationsData.translations || []);
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);

      setError("Could not load saved MenuBridge data.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddDictionaryItem = async () => {
    if (!dictionaryTerm.trim() || !dictionaryInstruction.trim()) {
      return;
    }

    try {
      setError("");

      const response = await fetch("http://localhost:5000/api/dictionary", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          term: dictionaryTerm,
          instruction: dictionaryInstruction,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save terminology rule");
      }

      setDictionary((previous) => [...previous, data.rule]);

      setDictionaryTerm("");
      setDictionaryInstruction("");
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  const handleRemoveDictionaryItem = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/dictionary/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to remove rule");
      }

      setDictionary((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  const handleTranslate = async () => {
    setError("");
    setApproved(false);

    if (!name.trim()) {
      setError("Please enter a menu item name.");

      return;
    }

    if (!targetLanguage) {
      setError("Please select a target language.");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/translate-menu", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          restaurantName,
          sourceLanguage,
          targetLanguage,
          name,
          description,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Translation failed.");
      }

      setTranslation(data.translation);

      setCurrentRecord(data.record);

      /*
       * Put new generated result
       * immediately into history.
       */
      setTranslations((previous) => [data.record, ...previous]);
    } catch (error) {
      console.error(error);

      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!currentRecord?.id) {
      setError("No generated translation is available to approve.");

      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/translations/${currentRecord.id}/approve`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to approve translation");
      }

      setApproved(true);

      setCurrentRecord(data.translation);

      setTranslations((previous) =>
        previous.map((item) =>
          item.id === data.translation.id ? data.translation : item,
        ),
      );
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  const handleDeleteTranslation = async (id) => {
    const confirmed = window.confirm("Delete this translation?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/translations/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }

      setTranslations((previous) => previous.filter((item) => item.id !== id));

      if (currentRecord?.id === id) {
        setTranslation(null);
        setCurrentRecord(null);
        setApproved(false);
      }
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  const escapeCSV = (value) => {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const approvedItems = translations.filter(
      (item) => item.status === "APPROVED",
    );

    if (approvedItems.length === 0) {
      setError("Approve at least one translation before exporting.");

      return;
    }

    const headers = [
      "Restaurant",
      "Category",
      "Source Language",
      "Target Language",
      "Original Name",
      "Original Description",
      "Translated Name",
      "Translated Description",
      "Cultural Note",
    ];

    const rows = approvedItems.map((item) => [
      item.restaurant_name,
      item.category,
      item.source_language,
      item.target_language,
      item.original_name,
      item.original_description,
      item.translated_name,
      item.translated_description,
      item.cultural_note,
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),

      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "menubridge-approved-menu.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setName("");
    setDescription("");
    setCategory("Main Course");
    setTranslation(null);
    setApproved(false);
    setError("");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">M</div>

          <div>
            <h1>MenuBridge AI</h1>
            <p>Translate local dishes without losing their identity.</p>
          </div>
        </div>

        <div className="local-ai-badge">
          <span className="status-dot"></span>
          Local AI
        </div>
      </header>

      <main className="page-content">
        <section className="hero">
          <div>
            <span className="eyebrow">Restaurant Translation Workspace</span>

            <h2>
              Make your menu understandable
              <br />
              without making it generic.
            </h2>

            <p>
              Translate restaurant dishes with local AI while preserving
              cultural names, ingredients, and restaurant terminology.
            </p>
          </div>

          <div className="hero-card">
            <span>Powered locally by</span>
            <strong>Gemma 3 + Ollama</strong>
            <small>Menu information can stay on your own machine.</small>
          </div>
        </section>

        <div className="workspace-grid">
          <div className="left-column">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-number">01</span>
                  <h3>Restaurant Setup</h3>
                </div>

                <p>
                  Define where this translation belongs and which language you
                  need.
                </p>
              </div>

              <div className="form-grid">
                <div className="field field-full">
                  <label>Restaurant Name</label>

                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Example: Ceylon Kitchen"
                  />
                </div>

                <div className="field">
                  <label>Source Language</label>

                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                  >
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Target Language</label>

                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                  >
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-number">02</span>
                  <h3>Menu Item</h3>
                </div>

                <p>Add the dish exactly as it currently appears on the menu.</p>
              </div>

              <div className="form-grid">
                <div className="field field-full">
                  <label>Dish Name</label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Example: Seafood Kottu"
                  />
                </div>

                <div className="field field-full">
                  <label>Description</label>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: Chopped roti mixed with prawns, cuttlefish, vegetables, egg and house spices."
                    rows={5}
                  />
                </div>

                <div className="field field-full">
                  <label>Category</label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </button>

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleTranslate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Translating...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">✦</span>
                      Translate with AI
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          <aside className="right-column">
            <section className="panel dictionary-panel">
              <div className="panel-heading compact">
                <div>
                  <span className="section-number">03</span>
                  <h3>Restaurant Dictionary</h3>
                </div>
              </div>

              <p className="dictionary-intro">
                Teach MenuBridge how your restaurant wants specific local words
                and dish names handled.
              </p>

              <div className="dictionary-inputs">
                <div className="field">
                  <label>Term</label>

                  <input
                    type="text"
                    value={dictionaryTerm}
                    onChange={(e) => setDictionaryTerm(e.target.value)}
                    placeholder="Example: Hoppers"
                  />
                </div>

                <div className="field">
                  <label>Translation Rule</label>

                  <textarea
                    rows={3}
                    value={dictionaryInstruction}
                    onChange={(e) => setDictionaryInstruction(e.target.value)}
                    placeholder="Example: Keep the original word and explain that it is a Sri Lankan bowl-shaped pancake."
                  />
                </div>

                <button
                  className="add-rule-button"
                  type="button"
                  onClick={handleAddDictionaryItem}
                >
                  + Add terminology rule
                </button>
              </div>

              <div className="dictionary-list">
                {dictionary.map((item) => (
                  <div className="dictionary-item" key={item.id}>
                    <div>
                      <strong>{item.term}</strong>

                      <p>{item.instruction}</p>
                    </div>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => handleRemoveDictionaryItem(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {translation && (
          <section className="translation-section">
            <div className="translation-heading">
              <div>
                <span className="eyebrow">AI Translation Result</span>
                <h3>
                  {approved
                    ? "Translation approved"
                    : "Review before publishing"}
                </h3>
              </div>

              {approved && (
                <div className="approved-badge">
                  <span>✓</span>
                  Approved
                </div>
              )}
            </div>

            <div className="translation-grid">
              <article className="translation-card original-card">
                <div className="card-topline">
                  <span>Original</span>
                  <small>{sourceLanguage}</small>
                </div>

                <h4>{translation.original_name || name}</h4>

                <p className="dish-description">
                  {description || "No description provided."}
                </p>

                <div className="category-chip">{category}</div>
              </article>

              <div className="translation-arrow">→</div>

              <article className="translation-card translated-card">
                <div className="card-topline">
                  <span>Translated</span>
                  <small>{targetLanguage}</small>
                </div>

                <h4>{translation.translated_name}</h4>

                <p className="dish-description">
                  {translation.translated_description ||
                    "No translated description returned."}
                </p>

                {translation.kept_original_term && (
                  <div className="preserved-badge">
                    ✓ Original cultural term preserved
                  </div>
                )}
              </article>
            </div>

            {translation.cultural_note && (
              <div className="cultural-note">
                <div className="note-icon">i</div>

                <div>
                  <strong>Cultural note</strong>
                  <p>{translation.cultural_note}</p>
                </div>
              </div>
            )}

            <div className="translation-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleTranslate}
                disabled={loading}
              >
                ↻ Regenerate
              </button>

              <button
                type="button"
                className="approve-button"
                onClick={handleApprove}
                disabled={approved}
              >
                {approved ? "✓ Approved" : "✓ Approve Translation"}
              </button>
            </div>
          </section>
        )}

        <section className="history-section">
          <div className="history-header">
            <div>
              <span className="eyebrow">Saved Locally</span>

              <h3>Translation History</h3>

              <p>
                Every AI-generated translation is automatically stored in your
                local JSON file.
              </p>
            </div>

            <button
              type="button"
              className="export-button"
              onClick={handleExportCSV}
            >
              ↓ Export Approved CSV
            </button>
          </div>

          {dataLoading ? (
            <div className="history-empty">Loading saved translations...</div>
          ) : translations.length === 0 ? (
            <div className="history-empty">No translations generated yet.</div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Original</th>
                    <th>Translation</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {translations.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.original_name}</strong>

                        {item.original_description && (
                          <small>{item.original_description}</small>
                        )}
                      </td>

                      <td>
                        <strong>{item.translated_name}</strong>

                        {item.translated_description && (
                          <small>{item.translated_description}</small>
                        )}
                      </td>

                      <td>{item.target_language}</td>

                      <td>{item.category || "—"}</td>

                      <td>
                        <span
                          className={`history-status ${
                            item.status === "APPROVED"
                              ? "history-status-approved"
                              : ""
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="history-delete"
                          onClick={() => handleDeleteTranslation(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>MenuBridge AI</p>

        <span>Local restaurant translation powered by open-weight AI.</span>
      </footer>
    </div>
  );
}

export default App;
