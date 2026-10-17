
import { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  WandSparkles,
  MessageSquare,
  Target,
  Bot,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const blank = {
  brand: "",
  industry: "",
  objective: "Engagement",
  products: "",
  audience: "",
  tone: "Let AI decide",
};

const objectives = [
  "Engagement",
  "Promotion",
  "Brand Awareness",
  "Education",
  "Product Launch",
  "Lead Generation",
];

const tones = [
  "Let AI decide",
  "Witty and playful",
  "Professional and informative",
  "Bold and motivational",
  "Premium and minimal",
  "Friendly and conversational",
];

export default function App() {
  const [form, setForm] = useState(blank);

  const [activePage, setActivePage] = useState("tweets");

  const [tweets, setTweets] = useState([]);
  const [voice, setVoice] = useState([]);
  const [voiceResult, setVoiceResult] = useState([]);
  const [campaignResult, setCampaignResult] = useState([]);

  const [loading, setLoading] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(-1);
  const [status, setStatus] = useState("Django API");

  const update = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  function navigate(page) {
    setActivePage(page);
    setError("");
    setNotice("");
  }

  async function generate(event) {
    event.preventDefault();

    setError("");
    setNotice("");
    setLoading(true);
    setTweets([]);
    setVoice([]);

    try {
      const res = await axios.post(`${API}/generate/`, form, {
        timeout: 60000,
      });

      setTweets(res.data.tweets || []);
      setVoice(res.data.voice || []);

      setStatus(
        res.data.mode === "ai" ? "AI connected" : "Demo mode"
      );

      setNotice(
        res.data.mode === "ai"
          ? "AI-generated drafts are ready."
          : "Demo drafts are ready. Check your Groq API configuration for live AI generation."
      );
    } catch (e) {
      setError(
        e.response?.data?.error ||
          "Cannot connect to Django. Start the backend on port 8000 and try again."
      );

      setStatus("Backend offline");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeBrandVoice(event) {
    event.preventDefault();

    setError("");
    setNotice("");
    setFeatureLoading(true);
    setVoiceResult([]);

    try {
      const res = await axios.post(`${API}/brand-voice/`, form, {
        timeout: 60000,
      });

      setVoiceResult(res.data.voice || []);

      setStatus(
        res.data.mode === "ai" ? "AI connected" : "Demo mode"
      );

      setNotice("Brand voice analysis completed.");
    } catch (e) {
      setError(
        e.response?.data?.error ||
          "Unable to analyze brand voice. Check your Django server and try again."
      );
    } finally {
      setFeatureLoading(false);
    }
  }

  async function generateCampaignContent(event) {
    event.preventDefault();

    setError("");
    setNotice("");
    setFeatureLoading(true);
    setCampaignResult([]);

    try {
      const res = await axios.post(
        `${API}/campaign-content/`,
        form,
        { timeout: 60000 }
      );

      setCampaignResult(res.data.content || []);

      setStatus(
        res.data.mode === "ai" ? "AI connected" : "Demo mode"
      );

      setNotice("Campaign content generated successfully.");
    } catch (e) {
      setError(
        e.response?.data?.error ||
          "Unable to generate campaign content. Check your Django server and try again."
      );
    } finally {
      setFeatureLoading(false);
    }
  }

  async function copyText(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      setNotice("Content copied to clipboard.");
    } catch {
      setError(
        "Copy was blocked by your browser. Select the text and copy it manually."
      );
    }
  }

  function downloadText(filename, content) {
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function downloadTweets() {
    const text = [
      `BrandTweet AI — ${form.brand}`,
      "",
      "BRAND VOICE",
      ...voice.map((item) => `• ${item}`),
      "",
      "TWEET DRAFTS",
      ...tweets.map((tweet, index) => `${index + 1}. ${tweet}`),
    ].join("\n");

    downloadText(
      `${form.brand.trim().replace(/[^a-z0-9]+/gi, "-") || "brand"}-tweets.txt`,
      text
    );
  }

  function downloadCampaign() {
    const text = [
      `BrandTweet AI — ${form.brand}`,
      "CAMPAIGN CONTENT",
      "",
      ...campaignResult.map((item, index) => `${index + 1}. ${item}`),
    ].join("\n");

    downloadText(
      `${form.brand.trim().replace(/[^a-z0-9]+/gi, "-") || "brand"}-campaign.txt`,
      text
    );
  }

  function renderBrandForm() {
    return (
      <section className="panel form-panel">
        <div className="panel-title">
          <div className="icon">
            <MessageSquare size={19} />
          </div>
          <div>
            <h2>Tell us about your brand</h2>
            <p>Provide details to create relevant brand content.</p>
          </div>
        </div>

        <label>
          Brand name <strong>*</strong>
          <input
            required
            maxLength={80}
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="e.g. FreshBite"
          />
        </label>

        <label>
          Industry / category
          <input
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="e.g. Food, technology, fashion"
          />
        </label>

        <label>
          Campaign objective
          <select
            value={form.objective}
            onChange={(e) => update("objective", e.target.value)}
          >
            {objectives.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Products or services <strong>*</strong>
          <textarea
            required
            rows={4}
            maxLength={1500}
            value={form.products}
            onChange={(e) => update("products", e.target.value)}
            placeholder="Describe your products or services."
          />
        </label>

        <label>
          Target audience
          <input
            value={form.audience}
            onChange={(e) => update("audience", e.target.value)}
            placeholder="e.g. Students, professionals, parents"
          />
        </label>

        <label>
          Preferred brand tone
          <select
            value={form.tone}
            onChange={(e) => update("tone", e.target.value)}
          >
            {tones.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>
    );
  }

  function renderMessages() {
    return (
      <>
        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert success">{notice}</div>}
      </>
    );
  }

  function renderTweetsPage() {
    return (
      <>
        <section className="hero">
          <span className="eyebrow">
            <Sparkles size={14} /> YOUR BRAND, AMPLIFIED
          </span>

          <h1>
            Create content that
            <br />
            <em>sounds like your brand.</em>
          </h1>

          <p>
            Turn your brand details into social media ideas with
            varied content styles and a clear brand voice summary.
          </p>
        </section>

        <div className="workspace">
          <section className="panel form-panel">
            <div className="panel-title">
              <div className="icon">
                <MessageSquare size={19} />
              </div>
              <div>
                <h2>Tell us about your brand</h2>
                <p>A few details help shape your content.</p>
              </div>
            </div>

            <form onSubmit={generate}>
              {renderBrandFields()}

              <div className="hint">
                <Bot size={17} />
                Your details help shape the brand voice and tweet ideas.
              </div>

              <button className="primary" disabled={loading}>
                {loading ? (
                  <RefreshCw className="spin" size={17} />
                ) : (
                  <Sparkles size={17} />
                )}
                {loading ? "Creating drafts…" : "Generate 10 tweets"}
                <span>→</span>
              </button>
            </form>
          </section>

          <section className="right-col">
            <div className="panel preview">
              <div className="preview-top">
                <div className="icon">
                  <WandSparkles size={19} />
                </div>
                <span className="tag">
                  {tweets.length ? "DRAFTS READY" : "CONTENT WORKSPACE"}
                </span>
              </div>

              <h2>
                {tweets.length
                  ? "Your content is ready."
                  : "Your next great post starts here."}
              </h2>

              <p>
                {tweets.length
                  ? `Created ${tweets.length} tweet drafts for ${form.brand}. Copy your favourites or download them all.`
                  : "Enter your brand details to prepare a varied set of tweet ideas."}
              </p>

              <div className="features">
                <div>
                  <CheckCircle2 size={17} /> Brand voice summary
                </div>
                <div>
                  <CheckCircle2 size={17} /> 10 varied tweet drafts
                </div>
                <div>
                  <CheckCircle2 size={17} /> Copy and download options
                </div>
              </div>
            </div>

            <div className="panel tip">
              <div className="icon">
                <Sparkles size={18} />
              </div>
              <div>
                <b>Pro tip</b>
                <p>
                  Include real product benefits and a clearly defined
                  audience for more specific content.
                </p>
              </div>
            </div>
          </section>
        </div>

        {renderMessages()}

        {voice.length > 0 && (
          <section className="generated" id="voice">
            <div className="section-heading">
              <div>
                <span className="eyebrow">BRAND INSIGHTS</span>
                <h2>{form.brand} voice summary</h2>
              </div>
            </div>

            <div className="voice-grid">
              {voice.map((item, index) => (
                <div className="voice-item" key={index}>
                  <CheckCircle2 size={18} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tweets.length > 0 && (
          <section className="generated" id="tweets">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR CONTENT</span>
                <h2>{tweets.length} tweet drafts</h2>
                <p>Review, copy and adapt each draft before posting.</p>
              </div>

              <button className="download" onClick={downloadTweets}>
                <Download size={16} /> Download all
              </button>
            </div>

            <div className="tweet-grid">
              {tweets.map((tweet, index) => (
                <article className="tweet" key={index}>
                  <div className="tweet-head">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>
                      {[
                        "Conversational",
                        "Promotional",
                        "Witty",
                        "Informative",
                        "Question",
                        "Brand values",
                        "Problem & solution",
                        "Community",
                        "Call to action",
                        "Engagement",
                      ][index] || "Brand content"}
                    </small>
                    <small className="count">{tweet.length}/280</small>
                  </div>

                  <p>{tweet}</p>

                  <button
                    className="copy"
                    onClick={() => copyText(tweet, index)}
                  >
                    {copied === index ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <Copy size={15} />
                    )}
                    {copied === index ? "Copied" : "Copy draft"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  // Shared brand fields used in the Tweet Generator form.
  function renderBrandFields() {
    return (
      <>
        <label>
          Brand name <strong>*</strong>
          <input
            required
            maxLength={80}
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="e.g. FreshBite"
          />
        </label>

        <label>
          Industry / category
          <input
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="e.g. Food, technology, fashion"
          />
        </label>

        <label>
          Campaign objective
          <select
            value={form.objective}
            onChange={(e) => update("objective", e.target.value)}
          >
            {objectives.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Products or services <strong>*</strong>
          <textarea
            required
            rows={4}
            maxLength={1500}
            value={form.products}
            onChange={(e) => update("products", e.target.value)}
            placeholder="What do you offer?"
          />
        </label>

        <label>
          Target audience
          <input
            value={form.audience}
            onChange={(e) => update("audience", e.target.value)}
            placeholder="e.g. Students, professionals, parents"
          />
        </label>

        <label>
          Preferred brand tone
          <select
            value={form.tone}
            onChange={(e) => update("tone", e.target.value)}
          >
            {tones.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </>
    );
  }

  function renderVoicePage() {
    return (
      <>
        <section className="hero">
          <span className="eyebrow">
            <Target size={14} /> BRAND PERSONALITY
          </span>
          <h1>
            Discover your
            <br />
            <em>brand voice.</em>
          </h1>
          <p>
            Analyze your brand's personality, tone and communication
            style to create more consistent content.
          </p>
        </section>

        <div className="workspace">
          {renderBrandForm()}

          <section className="panel preview">
            <div className="preview-top">
              <div className="icon">
                <Target size={19} />
              </div>
              <span className="tag">VOICE ANALYSIS</span>
            </div>

            <h2>Understand how your brand should sound.</h2>
            <p>
              Submit the brand details to receive an independent
              brand voice analysis.
            </p>

            <button
              className="primary"
              disabled={featureLoading}
              onClick={analyzeBrandVoice}
            >
              {featureLoading ? "Analyzing…" : "Analyze Brand Voice"}
              <span>→</span>
            </button>
          </section>
        </div>

        {renderMessages()}

        {voiceResult.length > 0 && (
          <section className="generated">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ANALYSIS RESULTS</span>
                <h2>{form.brand} Brand Voice</h2>
              </div>
              <button
                className="download"
                onClick={() =>
                  downloadText(
                    "brand-voice.txt",
                    voiceResult.map((item) => `• ${item}`).join("\n")
                  )
                }
              >
                <Download size={16} /> Download
              </button>
            </div>

            <div className="voice-grid">
              {voiceResult.map((item, index) => (
                <article className="voice-item" key={index}>
                  <CheckCircle2 size={18} />
                  <p>{item}</p>
                  <button
                    className="copy"
                    onClick={() => copyText(item, 100 + index)}
                  >
                    <Copy size={15} /> Copy
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  function renderCampaignPage() {
    return (
      <>
        <section className="hero">
          <span className="eyebrow">
            <MessageSquare size={14} /> CAMPAIGN STUDIO
          </span>
          <h1>
            Plan your next
            <br />
            <em>brand campaign.</em>
          </h1>
          <p>
            Turn your brand details and marketing objective into a
            campaign idea, key message, content approach and call to action.
          </p>
        </section>

        <div className="workspace">
          {renderBrandForm()}

          <section className="panel preview">
            <div className="preview-top">
              <div className="icon">
                <MessageSquare size={19} />
              </div>
              <span className="tag">CAMPAIGN PLANNER</span>
            </div>

            <h2>Build a focused content campaign.</h2>
            <p>
              Your results include four campaign components based on
              the brand details you provide.
            </p>

            <button
              className="primary"
              disabled={featureLoading}
              onClick={generateCampaignContent}
            >
              {featureLoading ? "Generating…" : "Generate Campaign Content"}
              <span>→</span>
            </button>
          </section>
        </div>

        {renderMessages()}

        {campaignResult.length > 0 && (
          <section className="generated">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CAMPAIGN RESULTS</span>
                <h2>{form.brand} Campaign Plan</h2>
              </div>

              <button className="download" onClick={downloadCampaign}>
                <Download size={16} /> Download
              </button>
            </div>

            <div className="tweet-grid">
              {campaignResult.map((item, index) => (
                <article className="tweet" key={index}>
                  <div className="tweet-head">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>
                      {[
                        "Campaign idea",
                        "Key message",
                        "Content approach",
                        "Call to action",
                      ][index] || "Campaign detail"}
                    </small>
                  </div>

                  <p>{item}</p>

                  <button
                    className="copy"
                    onClick={() => copyText(item, 200 + index)}
                  >
                    <Copy size={15} /> Copy
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  const pageTitles = {
    tweets: "Tweet Generator",
    voice: "Brand Voice",
    campaign: "Campaign Content",
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            <Sparkles size={22} />
          </div>
          <div>
            <b>BrandTweet</b>
            <small>AI STUDIO</small>
          </div>
        </div>

        <p className="side-label">WORKSPACE</p>

        <button
          type="button"
          className={`nav ${activePage === "tweets" ? "active" : ""}`}
          onClick={() => navigate("tweets")}
        >
          <WandSparkles size={18} /> Tweet Generator
        </button>

        <button
          type="button"
          className={`nav ${activePage === "voice" ? "active" : ""}`}
          onClick={() => navigate("voice")}
        >
          <Target size={18} /> Brand Voice
        </button>

        <button
          type="button"
          className={`nav ${activePage === "campaign" ? "active" : ""}`}
          onClick={() => navigate("campaign")}
        >
          <MessageSquare size={18} /> Campaign Content
        </button>

        <div className="side-bottom">
          <div className="status-dot" />
          <div>
            <b>Content Studio</b>
            <small>{status}</small>
          </div>
        </div>

        <p className="copyright">BrandTweet AI · 2026</p>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>
            Workspace <i>/</i> {pageTitles[activePage]}
          </span>
          <span className="pill">
            <Sparkles size={14} /> Brand content studio
          </span>
        </header>

        {activePage === "tweets" && renderTweetsPage()}
        {activePage === "voice" && renderVoicePage()}
        {activePage === "campaign" && renderCampaignPage()}

        <footer>
          ✦ BrandTweet AI <span>·</span> Built to help brands communicate better.
        </footer>
      </main>
    </div>
  );
}
