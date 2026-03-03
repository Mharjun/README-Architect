/**
 * AI Panel — readme ai
 * Supports: Gemini, OpenAI, Ollama
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  X, Wand2, Languages, Settings, Send,
  Loader2, Copy, Check, Trash2, BrainCircuit, RefreshCw, AlertCircle, Square
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export type AIProvider = 'gemini' | 'openai' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  openaiModel: string;
  geminiModel: string;
  enabled: boolean;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3',
  openaiModel: 'gpt-4o-mini',
  geminiModel: 'gemini-2.0-flash',
  enabled: true,
};

interface AIPanelProps {
  markdown: string;
  selectedText: string;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
  onClose: () => void;
  config: AIConfig;
  onConfigChange: (c: AIConfig) => void;
  lang?: 'en' | 'ar';
}

type AIAction = 'generate' | 'improve' | 'translate' | 'score' | 'fix' | 'shorten' | 'expand' | 'custom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
}

export interface ReadmeScore {
  total: number;
  checks: { label: string; passed: boolean; tip?: string }[];
}

const T = {
  en: {
    title: 'readme ai',
    tab_actions: 'Actions',
    tab_score: 'Score',
    tab_chat: 'Chat',
    generate_title: 'Generate from Scratch',
    generate_subtitle: 'Fill in your project details to create a full README',
    project_name: 'Project name *',
    description_hint: 'Description — what does this project do?',
    tech_stack: 'Tech stack',
    github_user: 'GitHub user',
    generate_btn: 'Generate README',
    fields_filled: 'fields filled',
    name_required: 'Project name is required',
    quick_actions: 'Quick Actions',
    on_selection: 'on selection',
    on_full: 'on full README',
    improve: 'Improve',
    fix_polish: 'Fix & Polish',
    shorten: 'Shorten',
    expand: 'Expand',
    translate: 'Translate',
    custom_prompt: 'Custom Prompt',
    ask_anything: 'Ask anything... (Enter to send)',
    shift_enter: 'Shift+Enter for new line',
    results: 'Results',
    clear: 'Clear',
    stop: 'Stop',
    generating: 'Generating...',
    analyzing: 'Analyzing...',
    thinking: 'Thinking...',
    ai_suggestions: 'AI suggestions',
    fix_with_ai: 'Fix with AI',
    apply: 'Apply',
    insert: 'Insert',
    replace: 'Replace',
    copy: 'Copy',
    settings: 'Settings',
    save_settings: 'Save Settings',
    provider: 'Provider',
    enable_ai: 'Enable AI Features',
    no_api_key: 'No API key configured',
    configure: 'Configure',
    ai_result: 'AI Result',
    excellent: 'Excellent!',
    needs_work: 'Needs improvement',
    poor: 'Weak README',
    run: 'Run',
    gen_label: (name: string) => `Generate "${name}"`,
    translate_to: (lang: string) => `Translate to ${lang}`,
  },
  ar: {
    title: 'readme ai',
    tab_actions: 'الإجراءات',
    tab_score: 'التقييم',
    tab_chat: 'المحادثة',
    generate_title: 'توليد من الصفر',
    generate_subtitle: 'أدخل تفاصيل مشروعك لإنشاء README كامل',
    project_name: 'اسم المشروع *',
    description_hint: 'الوصف — ماذا يفعل هذا المشروع؟',
    tech_stack: 'التقنيات',
    github_user: 'مستخدم GitHub',
    generate_btn: 'توليد README',
    fields_filled: 'حقول مملوءة',
    name_required: 'اسم المشروع مطلوب',
    quick_actions: 'الإجراءات السريعة',
    on_selection: 'على التحديد',
    on_full: 'على كامل الملف',
    improve: 'تحسين',
    fix_polish: 'إصلاح وتلميع',
    shorten: 'تقصير',
    expand: 'توسيع',
    translate: 'ترجمة',
    custom_prompt: 'طلب مخصص',
    ask_anything: 'اسأل أي شيء... (Enter للإرسال)',
    shift_enter: 'Shift+Enter لسطر جديد',
    results: 'النتائج',
    clear: 'مسح',
    stop: 'إيقاف',
    generating: 'جار التوليد...',
    analyzing: 'جار التحليل...',
    thinking: 'جار التفكير...',
    ai_suggestions: 'اقتراحات الذكاء الاصطناعي',
    fix_with_ai: 'إصلاح بالذكاء الاصطناعي',
    apply: 'تطبيق',
    insert: 'إدراج',
    replace: 'استبدال',
    copy: 'نسخ',
    settings: 'الإعدادات',
    save_settings: 'حفظ الإعدادات',
    provider: 'المزود',
    enable_ai: 'تفعيل الذكاء الاصطناعي',
    no_api_key: 'لم يتم تكوين مفتاح API',
    configure: 'تكوين',
    ai_result: 'نتيجة الذكاء الاصطناعي',
    excellent: 'ممتاز!',
    needs_work: 'يحتاج تحسين',
    poor: 'README ضعيف',
    run: 'تشغيل',
    gen_label: (name: string) => `توليد "${name}"`,
    translate_to: (lang: string) => `ترجمة الى ${lang}`,
  },
};

export function scoreReadme(md: string): ReadmeScore {
  const checks = [
    { label: '# Title (H1)', passed: /^#\s.+/m.test(md), tip: 'Add a main title with #' },
    { label: 'Description', passed: md.split('\n').filter(l => l.trim() && !l.startsWith('#')).length >= 2, tip: 'Add a project description' },
    { label: 'Badges / Shields', passed: /shields\.io|img\.shields/.test(md), tip: 'Add status badges' },
    { label: 'Installation section', passed: /install|setup|getting started/i.test(md), tip: 'Add installation instructions' },
    { label: 'Usage / Examples', passed: /usage|example|how to use/i.test(md), tip: 'Show how to use the project' },
    { label: 'Code block', passed: /```/.test(md), tip: 'Add at least one code block' },
    { label: 'Screenshots / Images', passed: /!\[.+\]\(.+\)/.test(md), tip: 'Add a screenshot or demo' },
    { label: 'Contributing section', passed: /contribut/i.test(md), tip: 'Add contributing guidelines' },
    { label: 'License section', passed: /license/i.test(md), tip: 'Add a license section' },
    { label: 'External Links', passed: /\[.+\]\(https?:\/\/.+\)/.test(md), tip: 'Add at least one external link' },
  ];
  const passed = checks.filter(c => c.passed).length;
  return { total: Math.round((passed / checks.length) * 100), checks };
}

async function callAI(prompt: string, config: AIConfig, onChunk?: (t: string) => void, signal?: AbortSignal): Promise<string> {
  if (config.provider === 'gemini') {
    const model = config.geminiModel || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096 } }),
      signal,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Gemini ${res.status}`); }
    const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (line.startsWith('data: ')) { try { const j = JSON.parse(line.slice(6)); const c = j?.candidates?.[0]?.content?.parts?.[0]?.text || ''; if (c) { full += c; onChunk?.(full); } } catch { } }
      }
    }
    return full;
  }
  if (config.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.openaiModel || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], stream: true, max_tokens: 4096 }),
      signal,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `OpenAI ${res.status}`); }
    const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) { try { const j = JSON.parse(line.slice(6)); const c = j?.choices?.[0]?.delta?.content || ''; if (c) { full += c; onChunk?.(full); } } catch { } }
      }
    }
    return full;
  }
  if (config.provider === 'ollama') {
    const url = `${config.ollamaUrl.replace(/\/$/, '')}/api/generate`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.ollamaModel || 'llama3', prompt, stream: true }),
        signal,
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error(`Model "${config.ollamaModel}" not found. Run "ollama pull ${config.ollamaModel}".`);
        throw new Error(`Ollama Error ${res.status}`);
      }
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(Boolean)) {
          try { const j = JSON.parse(line); if (j.response) { full += j.response; onChunk?.(full); } } catch { }
        }
      }
      return full;
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('Generation stopped');
      if (err.message.includes('Failed to fetch')) throw new Error(`Ollama not responding at ${config.ollamaUrl}.`);
      throw err;
    }
  }
  throw new Error('Unknown provider');
}

function buildPrompt(action: AIAction, context: string, extra?: string): string {
  const base = `You are a README expert. Output ONLY clean Markdown. No explanations, no wrapping code fences.`;
  const map: Record<AIAction, string> = {
    generate: `${base}\n\nGenerate a complete professional README.md:\n${context}\n\nInclude: title, badges, description, features, installation, usage, screenshots placeholder, contributing, license.`,
    improve: `${base}\n\nImprove this README section to be more professional and engaging:\n\n${context}`,
    translate: `${base}\n\nTranslate to ${extra || 'Arabic'}. Keep ALL markdown formatting, code blocks, and badges. Only translate human text:\n\n${context}`,
    score: `${base}\n\nAnalyze this README and give the top 5 most impactful improvements as bullet points:\n\n${context}`,
    fix: `${base}\n\nCompletely rewrite this README to be comprehensive and professional:\n\n${context}`,
    shorten: `${base}\n\nMake this README 50% shorter. Remove redundancy, keep essentials:\n\n${context}`,
    expand: `${base}\n\nExpand this README with more detail, examples, and missing sections:\n\n${context}`,
    custom: `${base}\n\n${extra}\n\nContext:\n${context}`,
  };
  return map[action];
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 28; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="opacity-10" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}>{score}</text>
    </svg>
  );
}

function AISettings({ config, onChange, onClose, lang }: {
  config: AIConfig; onChange: (c: AIConfig) => void; onClose: () => void; lang: 'en' | 'ar';
}) {
  const t = T[lang];
  const [local, setLocal] = useState(config);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => { if (local.provider === 'ollama') fetchOllamaModels(); }, [local.provider, local.ollamaUrl]);

  const fetchOllamaModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch(`${local.ollamaUrl.replace(/\/$/, '')}/api/tags`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const models = data.models?.map((m: any) => m.name) || [];
      setOllamaModels(models);
      if (models.length > 0 && !models.includes(local.ollamaModel)) setLocal(prev => ({ ...prev, ollamaModel: models[0] }));
    } catch { setOllamaModels([]); }
    setLoadingModels(false);
  };

  const save = () => { onChange(local); localStorage.setItem('readme-ai-config', JSON.stringify(local)); onClose(); };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
        <h3 className="font-bold text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> {t.settings}</h3>
        <button onClick={onClose} className="p-1 hover:bg-[var(--fg)]/5 rounded-sm"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <label className="flex items-center justify-between">
          <span className="text-xs font-bold">{t.enable_ai}</span>
          <button onClick={() => setLocal({ ...local, enabled: !local.enabled })}
            className={cn("w-10 h-5 rounded-full transition-colors relative", local.enabled ? "bg-green-500" : "bg-[var(--border)]")}>
            <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow", local.enabled ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </label>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t.provider}</label>
          <div className="grid grid-cols-3 gap-1">
            {(['gemini', 'openai', 'ollama'] as AIProvider[]).map(p => (
              <button key={p} onClick={() => setLocal({ ...local, provider: p })}
                className={cn("py-2 text-xs font-bold rounded-sm border transition-all",
                  local.provider === p ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]" : "border-[var(--border)] hover:bg-[var(--fg)]/5")}>
                {p === 'gemini' ? 'Gemini' : p === 'openai' ? 'OpenAI' : 'Ollama'}
              </button>
            ))}
          </div>
        </div>
        {local.provider === 'gemini' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Gemini API Key</label>
              <input type="password" value={local.apiKey} onChange={e => setLocal({ ...local, apiKey: e.target.value })}
                placeholder="AIza..." className="w-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--card)] rounded-sm outline-none" />
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-[var(--accent)] hover:underline">Get free API key</a>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Model</label>
              <select value={local.geminiModel} onChange={e => setLocal({ ...local, geminiModel: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--card)] rounded-sm outline-none">
                <option value="gemini-2.0-flash">gemini-2.0-flash (fast)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (smart)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
            </div>
          </div>
        )}
        {local.provider === 'openai' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">OpenAI API Key</label>
              <input type="password" value={local.apiKey} onChange={e => setLocal({ ...local, apiKey: e.target.value })}
                placeholder="sk-..." className="w-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--card)] rounded-sm outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Model</label>
              <select value={local.openaiModel} onChange={e => setLocal({ ...local, openaiModel: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--card)] rounded-sm outline-none">
                <option value="gpt-4o-mini">gpt-4o-mini (fast)</option>
                <option value="gpt-4o">gpt-4o (smart)</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>
          </div>
        )}
        {local.provider === 'ollama' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Ollama URL</label>
              <input type="text" value={local.ollamaUrl} onChange={e => setLocal({ ...local, ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434" className="w-full px-3 py-2 text-xs border border-[var(--border)] bg-[var(--card)] rounded-sm outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Model</label>
              <div className="flex gap-2">
                <input type="text" value={local.ollamaModel} onChange={e => setLocal({ ...local, ollamaModel: e.target.value })}
                  placeholder="llama3" className="flex-1 px-3 py-2 text-xs border border-[var(--border)] bg-[var(--card)] rounded-sm outline-none" />
                <button onClick={fetchOllamaModels} className="px-3 py-2 text-xs border border-[var(--border)] rounded-sm hover:bg-[var(--fg)]/5">
                  {loadingModels ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </button>
              </div>
              {ollamaModels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ollamaModels.map(m => (
                    <button key={m} onClick={() => setLocal({ ...local, ollamaModel: m })}
                      className={cn("px-2 py-0.5 text-[10px] rounded-sm border transition-all",
                        local.ollamaModel === m ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]" : "border-[var(--border)] hover:bg-[var(--fg)]/5")}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] opacity-40">Ollama must be running locally. Click refresh to detect models.</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
        <button onClick={save} className="w-full py-2 bg-[var(--fg)] text-[var(--bg)] text-xs font-bold rounded-sm hover:opacity-90">{t.save_settings}</button>
      </div>
    </div>
  );
}

export default function AIPanel({ markdown, selectedText, onInsert, onReplace, onClose, config, onConfigChange, lang = 'en' }: AIPanelProps) {
  const t = T[lang];
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [activeTab, setActiveTab] = useState<'actions' | 'score' | 'chat'>('actions');
  const [generateForm, setGenerateForm] = useState({ name: '', description: '', tech: '', username: '' });
  const [generateErrors, setGenerateErrors] = useState<{ name?: string }>({});
  const [translateLang, setTranslateLang] = useState('Arabic');
  const [score, setScore] = useState<ReadmeScore | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);

  // Scroll only after generation ends (not during streaming)
  useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => { if (activeTab === 'score') setScore(scoreReadme(markdown)); }, [activeTab, markdown]);

  const filledCount = [generateForm.name, generateForm.description, generateForm.tech, generateForm.username].filter(Boolean).length;

  const validateGenerate = (): boolean => {
    const errors: { name?: string } = {};
    if (!generateForm.name.trim()) errors.name = t.name_required;
    setGenerateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const runAction = async (action: AIAction, extra?: string) => {
    if (!config.apiKey && config.provider !== 'ollama') { setShowSettings(true); return; }
    if (action === 'generate' && !validateGenerate()) return;

    const context = action === 'generate'
      ? `Name: ${generateForm.name}\nDescription: ${generateForm.description}\nTech: ${generateForm.tech}\nGitHub: ${generateForm.username}`
      : selectedText || markdown;

    const labelMap: Record<AIAction, string> = {
      generate: t.gen_label(generateForm.name),
      improve: t.improve,
      translate: t.translate_to(translateLang),
      score: t.ai_suggestions,
      fix: t.fix_polish,
      shorten: t.shorten,
      expand: t.expand,
      custom: extra || t.run,
    };

    setMessages(p => [...p, { role: 'user', content: labelMap[action], action }]);
    setIsLoading(true);
    setStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await callAI(
        buildPrompt(action, context, action === 'translate' ? translateLang : extra),
        config, setStreamingText, controller.signal
      );
      setStreamingText('');
      setMessages(p => [...p, { role: 'assistant', content: result, action }]);
    } catch (err: any) {
      const partial = streamingText;
      setStreamingText('');
      if (err.message === 'Generation stopped') {
        if (partial) setMessages(p => [...p, { role: 'assistant', content: partial, action }]);
      } else {
        setMessages(p => [...p, { role: 'assistant', content: `Error: ${err.message}`, action }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => { abortControllerRef.current?.abort(); };
  const copyMsg = (text: string, idx: number) => { navigator.clipboard.writeText(text); setCopied(idx); setTimeout(() => setCopied(null), 2000); };
  const lastAIMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0];

  if (showSettings) {
    return (
      <div className="h-full flex flex-col bg-[var(--bg)] text-[var(--fg)]">
        <AISettings config={config} onChange={onConfigChange} onClose={() => setShowSettings(false)} lang={lang} />
      </div>
    );
  }

  // Shared loading bar component
  const LoadingBar = ({ label }: { label: string }) => (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-[var(--bg)] border-b border-[var(--border)] flex-shrink-0">
      <div className="flex items-center gap-2 text-[10px] opacity-70">
        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
        {label}
      </div>
      <button onClick={stopGeneration}
        className="px-2 py-1 text-[9px] font-bold border border-red-400/40 text-red-500 rounded-sm hover:bg-red-500/10 flex items-center gap-1 flex-shrink-0">
        <Square className="w-2.5 h-2.5" /> {t.stop}
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] text-[var(--fg)] text-xs">

      {/* Header */}
      <div className="h-10 border-b border-[var(--border)] flex items-center justify-between px-3 flex-shrink-0">
        <span className="font-bold tracking-tight">{t.title}</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] opacity-30 mr-1">
            {{ gemini: 'Gemini', openai: 'OpenAI', ollama: 'Ollama' }[config.provider]}
          </span>
          <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-[var(--fg)]/5 rounded-sm">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--fg)]/5 rounded-sm">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* API key warning */}
      {!config.apiKey && config.provider !== 'ollama' && (
        <div className="mx-3 mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-start gap-2 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-amber-600">{t.no_api_key}</p>
            <button onClick={() => setShowSettings(true)} className="text-[10px] text-amber-500 underline">{t.configure}</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] flex-shrink-0">
        {(['actions', 'score', 'chat'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === tab ? "border-b-2 border-[var(--fg)]" : "opacity-40 hover:opacity-70")}>
            {tab === 'actions' ? t.tab_actions : tab === 'score' ? t.tab_score : t.tab_chat}
          </button>
        ))}
      </div>

      {/* ACTIONS TAB */}
      {activeTab === 'actions' && (
        <div className="flex-1 overflow-y-auto">
          {isLoading && <LoadingBar label={t.generating} />}

          {/* Generate from Scratch — prominent highlighted box */}
          <div className="p-3 border-b border-[var(--border)]">
            <div className="border-2 border-[var(--fg)]/20 rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest">{t.generate_title}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={cn("w-3 h-1 rounded-full transition-colors",
                        i < filledCount ? "bg-[var(--fg)]" : "bg-[var(--border)]")} />
                    ))}
                  </div>
                  <span className="text-[9px] opacity-40">{filledCount}/4 {t.fields_filled}</span>
                </div>
              </div>
              <p className="text-[9px] opacity-40">{t.generate_subtitle}</p>

              <div>
                <input
                  type="text"
                  placeholder={t.project_name}
                  value={generateForm.name}
                  onChange={e => { setGenerateForm({ ...generateForm, name: e.target.value }); if (generateErrors.name) setGenerateErrors({}); }}
                  className={cn("w-full px-2 py-1.5 text-xs bg-[var(--card)] border rounded-sm outline-none focus:border-[var(--accent)] transition-colors",
                    generateErrors.name ? "border-red-500" : "border-[var(--border)]")}
                />
                {generateErrors.name && (
                  <p className="text-[9px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> {generateErrors.name}
                  </p>
                )}
              </div>

              <textarea
                placeholder={t.description_hint}
                value={generateForm.description}
                onChange={e => setGenerateForm({ ...generateForm, description: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-sm outline-none resize-none focus:border-[var(--accent)]"
              />

              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder={t.tech_stack} value={generateForm.tech}
                  onChange={e => setGenerateForm({ ...generateForm, tech: e.target.value })}
                  className="px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" />
                <input type="text" placeholder={t.github_user} value={generateForm.username}
                  onChange={e => setGenerateForm({ ...generateForm, username: e.target.value })}
                  className="px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" />
              </div>

              <button onClick={() => runAction('generate')} disabled={isLoading}
                className="w-full py-2 bg-[var(--fg)] text-[var(--bg)] font-bold rounded-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {t.generate_btn}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              {t.quick_actions} — {selectedText ? t.on_selection : t.on_full}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {([['improve', t.improve], ['fix', t.fix_polish], ['shorten', t.shorten], ['expand', t.expand]] as [AIAction, string][]).map(([a, l]) => (
                <button key={a} onClick={() => runAction(a)} disabled={isLoading}
                  className="py-2 px-3 border border-[var(--border)] rounded-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all disabled:opacity-40 text-xs font-bold">
                  {l}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <select value={translateLang} onChange={e => setTranslateLang(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-sm outline-none">
                {['Arabic', 'French', 'Spanish', 'German', 'Chinese', 'Japanese', 'Portuguese', 'Russian', 'Korean', 'Italian'].map(l => <option key={l}>{l}</option>)}
              </select>
              <button onClick={() => runAction('translate')} disabled={isLoading}
                className="px-3 border border-[var(--border)] rounded-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all disabled:opacity-40 font-bold flex items-center gap-1">
                <Languages className="w-3 h-3" /> {t.translate}
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{t.custom_prompt}</p>
              <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                placeholder={t.ask_anything} rows={3}
                className="w-full px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-sm outline-none resize-none focus:border-[var(--accent)]" />
              <button onClick={() => { runAction('custom', customPrompt); setCustomPrompt(''); }}
                disabled={isLoading || !customPrompt.trim()}
                className="w-full py-1.5 border border-[var(--border)] rounded-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all disabled:opacity-40 flex items-center justify-center gap-1 font-bold">
                <Send className="w-3 h-3" /> {t.run}
              </button>
            </div>
          </div>

          {/* Results */}
          {(messages.length > 0 || (isLoading && streamingText)) && (
            <div className="border-t border-[var(--border)] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{t.results}</p>
                <button onClick={() => setMessages([])} className="text-[9px] opacity-40 hover:opacity-80 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> {t.clear}
                </button>
              </div>
              {messages.map((msg, i) => msg.role === 'user' ? (
                <p key={i} className="text-[10px] font-bold opacity-50 truncate">— {msg.content}</p>
              ) : (
                <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-sm">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
                    <span className="text-[9px] opacity-40">{t.ai_result}</span>
                    <div className="flex gap-1">
                      <button onClick={() => copyMsg(msg.content, i)} className="p-1 hover:bg-[var(--fg)]/5 rounded-sm">
                        {copied === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={() => onInsert(msg.content)} className="px-2 py-0.5 text-[9px] font-bold bg-[var(--fg)] text-[var(--bg)] rounded-sm hover:opacity-80">{t.insert}</button>
                      <button onClick={() => onReplace(msg.content)} className="px-2 py-0.5 text-[9px] font-bold border border-[var(--border)] rounded-sm hover:bg-[var(--fg)]/5">{t.replace}</button>
                    </div>
                  </div>
                  <pre className="p-3 text-[10px] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{msg.content}</pre>
                </div>
              ))}
              {isLoading && streamingText && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm">
                  <div className="px-3 py-1.5 border-b border-[var(--border)]">
                    <span className="text-[9px] opacity-40">{t.generating}</span>
                  </div>
                  <pre className="p-3 text-[10px] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{streamingText}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SCORE TAB */}
      {activeTab === 'score' && (
        <div className="flex-1 overflow-y-auto">
          {isLoading && <LoadingBar label={t.analyzing} />}
          <div className="p-3 space-y-3">
            {score && (
              <>
                <div className="flex items-center justify-center gap-4 py-3">
                  <ScoreRing score={score.total} />
                  <div>
                    <p className="text-2xl font-bold">{score.total}<span className="text-sm opacity-40">/100</span></p>
                    <p className="text-[10px] opacity-50">{score.total >= 80 ? t.excellent : score.total >= 50 ? t.needs_work : t.poor}</p>
                    <button onClick={() => runAction('score')} disabled={isLoading}
                      className="mt-1 text-[9px] font-bold text-[var(--accent)] hover:underline disabled:opacity-40 flex items-center gap-1">
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                      {t.ai_suggestions}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {score.checks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                      {c.passed
                        ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        : <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className={cn("text-xs font-bold", !c.passed && "opacity-60")}>{c.label}</p>
                        {!c.passed && c.tip && <p className="text-[10px] opacity-40 mt-0.5">{c.tip}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {score.total < 80 && (
                  <button onClick={() => runAction('fix')} disabled={isLoading}
                    className="w-full py-2 bg-[var(--fg)] text-[var(--bg)] font-bold rounded-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {t.fix_with_ai} — {Math.min(score.total + 35, 100)}/100
                  </button>
                )}
                {(lastAIMsg || (isLoading && streamingText)) && (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
                      <span className="text-[9px] opacity-40">{t.ai_result}</span>
                      {lastAIMsg && !isLoading && (
                        <div className="flex gap-1">
                          <button onClick={() => copyMsg(lastAIMsg.content, 999)} className="p-1 hover:bg-[var(--fg)]/5 rounded-sm">
                            {copied === 999 ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button onClick={() => onReplace(lastAIMsg.content)} className="px-2 py-0.5 text-[9px] font-bold bg-[var(--fg)] text-[var(--bg)] rounded-sm">{t.apply}</button>
                        </div>
                      )}
                    </div>
                    <pre className="p-3 text-[10px] whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                      {isLoading && streamingText ? streamingText : lastAIMsg?.content}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages — scroll independently, stop button NOT inside here */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8 opacity-30 select-none">
                <BrainCircuit className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">Ask anything about your README</p>
                <p className="text-[10px] mt-1">{t.shift_enter}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("rounded-sm p-2.5 leading-relaxed",
                msg.role === 'user' ? "bg-[var(--fg)] text-[var(--bg)] ml-6 text-xs" : "bg-[var(--card)] border border-[var(--border)] mr-6")}>
                {msg.role === 'assistant' ? (
                  <>
                    <pre className="text-[11px] whitespace-pre-wrap font-mono">{msg.content}</pre>
                    <div className="flex gap-2 mt-2 justify-end">
                      <button onClick={() => copyMsg(msg.content, i)} className="text-[9px] opacity-50 hover:opacity-100 flex items-center gap-1">
                        {copied === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {t.copy}
                      </button>
                      <button onClick={() => onInsert(msg.content)} className="text-[9px] opacity-50 hover:opacity-100">{t.insert}</button>
                      <button onClick={() => onReplace(msg.content)} className="text-[9px] opacity-50 hover:opacity-100">{t.replace}</button>
                    </div>
                  </>
                ) : <span className="text-xs">{msg.content}</span>}
              </div>
            ))}
            {/* Streaming — no stop button inside, it's at the input bar */}
            {isLoading && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm p-2.5 mr-6">
                <pre className="text-[11px] whitespace-pre-wrap font-mono">
                  {streamingText || '   '}
                </pre>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar — fixed at bottom, stop replaces send when loading */}
          <div className="p-3 border-t border-[var(--border)] flex gap-2 flex-shrink-0">
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (customPrompt.trim() && !isLoading) { runAction('custom', customPrompt); setCustomPrompt(''); }
                }
              }}
              placeholder={isLoading ? t.generating : t.ask_anything}
              rows={2}
              disabled={isLoading}
              className="flex-1 px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-sm outline-none resize-none focus:border-[var(--accent)] disabled:opacity-50"
            />
            {isLoading ? (
              <button onClick={stopGeneration}
                className="px-3 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors flex items-center justify-center"
                title={t.stop}>
                <Square className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => { if (customPrompt.trim()) { runAction('custom', customPrompt); setCustomPrompt(''); } }}
                disabled={!customPrompt.trim()}
                className="px-3 bg-[var(--fg)] text-[var(--bg)] rounded-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center">
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}