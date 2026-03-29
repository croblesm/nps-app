"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  DEFAULT_MODELS,
  type LlmProvider,
} from "@/lib/ai/models";
import { Spinner } from "@/components/ui/Spinner";

interface LlmConfigResponse {
  id: string;
  provider: string;
  modelName: string;
  endpointUrl: string | null;
  isDefault: boolean;
  hasApiKey: boolean;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<LlmConfigResponse[]>([]);
  const [provider, setProvider] = useState<LlmProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [modelName, setModelName] = useState(DEFAULT_MODELS["anthropic"]);
  const [isDefault, setIsDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loadingOllamaModels, setLoadingOllamaModels] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        setConfigs(await res.json());
      }
    } catch {
      // DB may not be ready yet
    }
  }

  function handleProviderChange(p: LlmProvider) {
    setProvider(p);
    setModelName(DEFAULT_MODELS[p]);
    setEndpointUrl(p === "ollama" ? "http://localhost:11434/v1" : "");
    setApiKey("");
    setTestResult(null);
    setSaveMessage("");
    setOllamaModels([]);
    if (p === "ollama") {
      fetchOllamaModels("http://localhost:11434");
    }
  }

  async function fetchOllamaModels(url: string) {
    setLoadingOllamaModels(true);
    try {
      const res = await fetch(`/api/settings/ollama-models?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setOllamaModels(data.models || []);
        if (data.models?.length > 0 && !modelName) {
          setModelName(data.models[0]);
        }
      }
    } catch {
      setOllamaModels([]);
    } finally {
      setLoadingOllamaModels(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          endpointUrl: endpointUrl || undefined,
          modelName,
          isDefault,
        }),
      });
      if (res.ok) {
        setSaveMessage("Configuration saved");
        setApiKey("");
        await fetchConfigs();
        window.dispatchEvent(new Event("llm-config-changed"));
      } else {
        try {
          const err = await res.json();
          setSaveMessage(`Error: ${err.error}`);
        } catch {
          setSaveMessage(`Error: Server returned ${res.status}`);
        }
      }
    } catch {
      setSaveMessage("Error: Could not connect to the server. Is the database running?");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          endpointUrl: endpointUrl || undefined,
          modelName,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setTestResult({ success: false, message: `Server returned ${res.status} — is the database running?` });
        return;
      }
      setTestResult({
        success: data.success,
        message: data.success
          ? `Connected! Response: "${data.response}"`
          : `Failed: ${data.error}`,
      });
    } catch {
      setTestResult({ success: false, message: "Connection failed" });
    } finally {
      setTesting(false);
    }
  }

  const models = PROVIDER_MODELS[provider];
  const needsEndpoint = provider === "azure-openai" || provider === "ollama";
  const needsApiKey = provider !== "ollama";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            LLM Settings
          </h1>
          <Link
            href="/"
            className="text-sm text-blue-500 hover:text-blue-400"
          >
            Back to Projects
          </Link>
        </div>

        {/* Active configurations */}
        {configs.length > 0 && (
          <div className="mb-8 space-y-2">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Configured Providers
            </h2>
            {configs.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  {c.isDefault && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {c.provider}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {c.modelName}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {c.hasApiKey ? "Key configured" : "No key"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Configuration form */}
        <div className="space-y-6 p-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) =>
                handleProviderChange(e.target.value as LlmProvider)
              }
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {needsApiKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {needsEndpoint && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {provider === "azure-openai"
                  ? "Endpoint URL"
                  : "Ollama Server URL"}
              </label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => {
                  setEndpointUrl(e.target.value);
                  if (provider === "ollama" && e.target.value) {
                    const baseUrl = e.target.value.replace(/\/v1\/?$/, "");
                    fetchOllamaModels(baseUrl);
                  }
                }}
                placeholder={
                  provider === "azure-openai"
                    ? "https://your-resource.openai.azure.com/openai/deployments/your-deployment"
                    : "http://localhost:11434/v1"
                }
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            {provider === "ollama" && ollamaModels.length > 0 ? (
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a model...</option>
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : provider === "ollama" && loadingOllamaModels ? (
              <div className="text-sm text-gray-400 p-2">
                Detecting installed models...
              </div>
            ) : provider === "ollama" ? (
              <div>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g., llama3, mistral"
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  No models detected. Make sure Ollama is running, or type the model name manually.
                </p>
              </div>
            ) : models.length > 0 ? (
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Deployment name"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="isDefault"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Set as active provider
            </label>
          </div>

          {/* Loading indicator during test/save */}
          {testing && (
            <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Spinner size="sm" label="Testing connection... This may take a few seconds with local models." />
            </div>
          )}

          {saving && (
            <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Spinner size="sm" label="Saving configuration..." />
            </div>
          )}

          {/* Test result */}
          {testResult && !testing && (
            <div
              className={`p-3 rounded text-sm ${
                testResult.success
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {testResult.message}
            </div>
          )}

          {saveMessage && !saving && (
            <div className="p-3 rounded text-sm bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {saveMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing || saving || (!apiKey && needsApiKey)}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
            >
              {testing ? <Spinner size="sm" label="Testing..." /> : "Test Connection"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || testing || !modelName}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {saving ? <Spinner size="sm" label="Saving..." /> : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
