"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Check, X, Shield, ArrowLeft, Plug, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  DEFAULT_MODELS,
  type LlmProvider,
} from "@/lib/ai/models";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        toast.success("Configuration saved");
        setApiKey("");
        await fetchConfigs();
        window.dispatchEvent(new Event("llm-config-changed"));
      } else {
        try {
          const err = await res.json();
          toast.error(`Error: ${err.error}`);
        } catch {
          toast.error(`Error: Server returned ${res.status}`);
        }
      }
    } catch {
      toast.error("Could not connect to the server. Is the database running?");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
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
        toast.error(`Server returned ${res.status} — is the database running?`);
        return;
      }
      if (data.success) {
        toast.success(`Connected! Response: "${data.response}"`);
      } else {
        toast.error(`Connection failed: ${data.error}`);
      }
    } catch {
      toast.error("Connection failed");
    } finally {
      setTesting(false);
    }
  }

  const models = PROVIDER_MODELS[provider];
  const needsEndpoint = provider === "azure-openai" || provider === "ollama";
  const needsApiKey = provider !== "ollama";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="size-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">
              LLM Settings
            </h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
              Back to Projects
            </Button>
          </Link>
        </div>

        {/* Configured Providers */}
        {configs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-4" />
                Configured Providers
              </CardTitle>
              <CardDescription>
                Your saved LLM provider configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {configs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {c.isDefault && (
                      <Badge variant="default">
                        <Check className="size-3" />
                        Active
                      </Badge>
                    )}
                    <span className="font-medium text-foreground">
                      {c.provider}
                    </span>
                    <span className="text-muted-foreground">
                      {c.modelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <KeyRound className="size-3" />
                    {c.hasApiKey ? "Key configured" : "No key"}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Provider</CardTitle>
            <CardDescription>
              Set up a new LLM provider or update an existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Provider */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={provider}
                onValueChange={(val) => handleProviderChange(val as LlmProvider)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            {needsApiKey && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
              </div>
            )}

            {/* Endpoint URL */}
            {needsEndpoint && (
              <div className="space-y-2">
                <Label>
                  {provider === "azure-openai"
                    ? "Endpoint URL"
                    : "Ollama Server URL"}
                </Label>
                <Input
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
                />
              </div>
            )}

            {/* Model */}
            <div className="space-y-2">
              <Label>Model</Label>
              {provider === "ollama" && ollamaModels.length > 0 ? (
                <Select
                  value={modelName}
                  onValueChange={(val) => setModelName(val as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ollamaModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : provider === "ollama" && loadingOllamaModels ? (
                <div className="text-sm text-muted-foreground p-2">
                  <Spinner size="sm" label="Detecting installed models..." />
                </div>
              ) : provider === "ollama" ? (
                <div className="space-y-1">
                  <Input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g., llama3, mistral"
                  />
                  <p className="text-xs text-muted-foreground">
                    No models detected. Make sure Ollama is running, or type the model name manually.
                  </p>
                </div>
              ) : models.length > 0 ? (
                <Select
                  value={modelName}
                  onValueChange={(val) => setModelName(val as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Deployment name"
                />
              )}
            </div>

            {/* Set as active */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked)}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as active provider
              </Label>
            </div>

            {/* Loading indicators */}
            {testing && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <Spinner size="sm" label="Testing connection... This may take a few seconds with local models." />
              </div>
            )}

            {saving && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <Spinner size="sm" label="Saving configuration..." />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleTest}
                disabled={testing || saving || (!apiKey && needsApiKey)}
              >
                {testing ? (
                  <Spinner size="sm" label="Testing..." />
                ) : (
                  <>
                    <Plug className="size-4" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                size="lg"
                onClick={handleSave}
                disabled={saving || testing || !modelName}
              >
                {saving ? (
                  <Spinner size="sm" label="Saving..." />
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
