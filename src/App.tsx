/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Eye,
  Code,
  Layout,
  Plus,
  Download,
  Copy,
  Search,
  ChevronRight,
  Settings,
  Globe,
  Zap,
  List,
  Image as ImageIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  Strikethrough,
  Table as TableIcon,
  HelpCircle,
  X,
  Check,
  Menu,
  Sidebar,
  Type as TypeIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TEMPLATES, SNIPPETS, SNIPPET_GROUPS, CATEGORIES, Template, Snippet } from './data';
import AIPanel, { AIConfig, DEFAULT_AI_CONFIG, scoreReadme } from './AIPanel';
import { BrainCircuit } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [markdown, setMarkdown] = useState<string>('# Welcome to README Architect\n\nStart typing or choose a template to begin.');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Wizard State
  const [wizardData, setWizardData] = useState({
    name: '',
    description: '',
    username: '',
    repo: '',
    install: 'npm install',
    templateId: TEMPLATES[0].id
  });

  const [snapMessage, setSnapMessage] = useState<string | null>(null);
  const [activeSnippetGroup, setActiveSnippetGroup] = useState<string>('all');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [showAI, setShowAI] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('readme-ai-config');
    return saved ? { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) } : DEFAULT_AI_CONFIG;
  });
  const [aiScore, setAiScore] = useState(0);

  // حساب الـ score تلقائياً
  useEffect(() => {
    const s = scoreReadme(markdown);
    setAiScore(s.total);
  }, [markdown]);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const insertAtCursor = (text: string, isSuggestion = false) => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;

    let newText = markdown;
    let newCursorPos = start + text.length;

    if (isSuggestion) {
      const textBeforeCursor = markdown.substring(0, start);
      const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
      if (lastSlashIndex !== -1 && lastSlashIndex >= textBeforeCursor.lastIndexOf('\n')) {
        newText = markdown.substring(0, lastSlashIndex) + text + markdown.substring(end);
        newCursorPos = lastSlashIndex + text.length;
      } else {
        newText = markdown.substring(0, start) + text + markdown.substring(end);
      }
    } else {
      newText = markdown.substring(0, start) + text + markdown.substring(end);
    }

    setMarkdown(newText);

    // Reset focus and cursor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const getSelectedText = () => {
    if (!editorRef.current) return '';
    return markdown.substring(editorRef.current.selectionStart, editorRef.current.selectionEnd);
  };

  const handleTemplateSelect = (template: Template) => {
    const content = template.content
      .replace(/{name}/g, wizardData.name || 'My Project')
      .replace(/{slug}/g, (wizardData.name || 'my-project').toLowerCase().replace(/\s+/g, '-'));
    setMarkdown(content);
    setShowTemplates(false);
  };

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template = TEMPLATES.find(t => t.id === wizardData.templateId) || TEMPLATES[0];
    const content = template.content
      .replace(/{name}/g, wizardData.name || 'Project Name')
      .replace(/{description}/g, wizardData.description || 'Project Description')
      .replace(/{username}/g, wizardData.username || 'username')
      .replace(/{repo}/g, wizardData.repo || 'repo-name')
      .replace(/{install}/g, wizardData.install || 'npm install')
      .replace(/{slug}/g, (wizardData.repo || wizardData.name || 'project').toLowerCase().replace(/\s+/g, '-'));

    setMarkdown(content);
    setIsWizardOpen(false);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    // Could add a toast here
  };

  const [theme, setTheme] = useState<'architect' | 'github' | 'island-dark' | 'dracula' | 'island-light'>('architect');
  const [snaps, setSnaps] = useState<{ name: string, content: string }[]>(() => {
    const saved = localStorage.getItem('readme-snaps');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSnaps, setShowSnaps] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  const saveMarkdown = () => {
    localStorage.setItem('readme-current', markdown);

    // Save to physical file if open in Electron
    if (currentFilePath && window && (window as any).process && (window as any).process.type === 'renderer') {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.invoke('save-file', { path: currentFilePath, content: markdown }).then((res: any) => {
          if (res.success) {
            console.log('File saved to disk:', currentFilePath);
          } else {
            console.error('Failed to save to disk:', res.error);
          }
        });
      } catch (e) {
        console.warn('Electron IPC save-file failed', e);
      }
    }

    // Show a brief success indicator
    const btn = document.getElementById('save-indicator');
    if (btn) {
      btn.innerText = 'SAVED ✓';
      // @ts-ignore
      btn.style.color = '#22c55e';
      setTimeout(() => {
        btn.innerText = 'SAVE';
        // @ts-ignore
        btn.style.color = '';
      }, 2000);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveMarkdown();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [markdown, currentFilePath]);


  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const originalUrl = importUrl.trim();
    if (!originalUrl) return;

    setIsImportOpen(false);

    try {
      let rawUrl = originalUrl;

      // Handle standard blob URLs
      if (rawUrl.includes('github.com') && rawUrl.includes('/blob/')) {
        rawUrl = rawUrl
          .replace('https://github.com', 'https://raw.githubusercontent.com')
          .replace('/blob/', '/');

        const res = await fetch(rawUrl);
        if (!res.ok) throw new Error(`Could not fetch README from ${rawUrl}`);
        const text = await res.text();
        setMarkdown(text);
        setImportUrl('');
        setSnapMessage(lang === 'en' ? 'README imported successfully!' : 'تم استيراد الملف بنجاح!');
        setTimeout(() => setSnapMessage(null), 3000);
        return;
      }

      // Handle base repo URLs: https://github.com/user/repo
      let repoPath = '';
      if (rawUrl.includes('github.com')) {
        repoPath = rawUrl.split('github.com/')[1].split('?')[0].split('#')[0];
        if (repoPath.endsWith('/')) repoPath = repoPath.slice(0, -1);
      } else if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(rawUrl)) {
        repoPath = rawUrl;
      }

      if (repoPath) {
        const branches = ['main', 'master'];
        const filenames = ['README.md', 'readme.md', 'README', 'readme'];

        let found = false;
        for (const branch of branches) {
          for (const file of filenames) {
            const tryUrl = `https://raw.githubusercontent.com/${repoPath}/${branch}/${file}`;
            try {
              const res = await fetch(tryUrl);
              if (res.ok) {
                const text = await res.text();
                if (text.trim()) {
                  setMarkdown(text);
                  setImportUrl('');
                  setSnapMessage(lang === 'en' ? 'README imported successfully!' : 'تم استيراد الملف بنجاح!');
                  setTimeout(() => setSnapMessage(null), 3000);
                  found = true;
                  break;
                }
              }
            } catch (err) {
              // Ignore and try next
            }
          }
          if (found) break;
        }

        if (!found) {
          throw new Error("Could not find a README file in this repository. Please provide the direct link to the file.");
        }
      } else {
        const res = await fetch(rawUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        setMarkdown(text);
        setImportUrl('');
        setSnapMessage(lang === 'en' ? 'README imported successfully!' : 'تم استيراد الملف بنجاح!');
        setTimeout(() => setSnapMessage(null), 3000);
      }

      setCurrentFilePath(null);
    } catch (err: any) {
      console.error('Import error:', err);
      alert(`❌ Import failed: ${err.message}`);
      setIsImportOpen(true);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (window && (window as any).process?.type === 'renderer') {
        try {
          const fs = (window as any).require('fs');
          const path = (window as any).require('path');
          const baseDir = currentFilePath
            ? path.dirname(currentFilePath)
            : (window as any).process.cwd();

          const imagesDir = path.join(baseDir, 'images');
          if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

          const destPath = path.join(imagesDir, file.name);
          // @ts-ignore
          const buffer = Buffer.from(base64.split(',')[1], 'base64');
          fs.writeFileSync(destPath, buffer);

          insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](./images/${file.name})\n`);
          setSnapMessage(`✅ Image saved: ./images/${file.name}`);
        } catch (err) {
          insertAtCursor(`![${file.name}](${base64})\n`);
        }
      } else {
        insertAtCursor(`![${file.name}](${base64})\n`);
      }
      setTimeout(() => setSnapMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };


  const addSnap = () => {
    const name = prompt('Enter name for this snap:');
    if (name) {
      const newSnaps = [...snaps, { name, content: markdown }];
      setSnaps(newSnaps);
      localStorage.setItem('readme-snaps', JSON.stringify(newSnaps));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    }
  };


  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [suggestions, setSuggestions] = useState<{ x: number, y: number, list: Snippet[], selectedIndex: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveMarkdown();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const textarea = editorRef.current;
      if (!textarea) return;

      const selectedText = markdown.substring(textarea.selectionStart, textarea.selectionEnd);

      if (!selectedText.trim()) {
        setSnapMessage('⚠️ Select text first, then press Ctrl+F');
        setTimeout(() => setSnapMessage(null), 3000);
        return;
      }

      const name = prompt(lang === 'en' ? 'Enter name for this snippet:' : 'أدخل اسماً لهذا المقتطف:') || `Snap ${new Date().toLocaleTimeString()}`;
      const newSnaps = [...snaps, { name, content: selectedText }];
      setSnaps(newSnaps);
      localStorage.setItem('readme-snaps', JSON.stringify(newSnaps));
      setSnapMessage(`✅ Snap saved: "${name}"`);
      setTimeout(() => setSnapMessage(null), 3000);
    }

    if (suggestions) {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertAtCursor(suggestions.list[suggestions.selectedIndex].content, true);
        setSuggestions(null);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestions({
          ...suggestions,
          selectedIndex: (suggestions.selectedIndex + 1) % suggestions.list.length
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestions({
          ...suggestions,
          selectedIndex: (suggestions.selectedIndex - 1 + suggestions.list.length) % suggestions.list.length
        });
      } else if (e.key === 'Escape') {
        setSuggestions(null);
      }
    }

    if (e.key === 'Escape') {
      setContextMenu(null);
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMarkdown(value);

    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1 && lastSlashIndex >= textBeforeCursor.lastIndexOf('\n')) {
      const query = textBeforeCursor.substring(lastSlashIndex + 1).toLowerCase();
      const filtered = SNIPPETS.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.category && s.category.toLowerCase().includes(query))
      ).slice(0, 8);

      if (filtered.length > 0) {
        const rect = editorRef.current?.getBoundingClientRect();
        if (rect) {
          // Approximate cursor position for popup
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length;
          const currentCol = lines[lines.length - 1].length;

          setSuggestions({
            x: rect.left + (currentCol * 8) + 20,
            y: rect.top + (currentLine * 20) + 40,
            list: filtered,
            selectedIndex: 0
          });
        }
      } else {
        setSuggestions(null);
      }
    } else {
      setSuggestions(null);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Handle Electron File Open
  useEffect(() => {
    // Check if running in Electron
    if (window && (window as any).process && (window as any).process.type === 'renderer') {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.on('open-file', (_event: any, data: { content: string, path: string, name: string }) => {
          setMarkdown(data.content);
          const absolutePath = data.path;
          setCurrentFilePath(absolutePath);
          console.log('App set currentFilePath to:', absolutePath);
        });
      } catch (e) {
        console.warn('Electron IPC not available', e);
      }
    }
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300",
        theme === 'architect' && "theme-architect",
        theme === 'github' && "theme-github",
        theme === 'island-dark' && "theme-island-dark",
        theme === 'dracula' && "theme-dracula",
        theme === 'island-light' && "theme-island-light",
        lang === 'ar' && "rtl"
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Snap Notification */}
      <AnimatePresence>
        {snapMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[200] px-6 py-3 bg-[var(--fg)] text-[var(--bg)] rounded-sm font-bold text-xs shadow-2xl flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            {snapMessage}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-[var(--card)] border border-[var(--border)] shadow-xl py-1 w-56 rounded-sm text-[var(--fg)]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-3 py-1 text-[9px] font-bold uppercase opacity-40 border-b border-[var(--border)] mb-1">Quick Tools</div>
          <button onClick={() => insertAtCursor('# ')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <TypeIcon className="w-3 h-3" /> Heading 1
          </button>
          <button onClick={() => insertAtCursor('## ')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <TypeIcon className="w-3 h-3" /> Heading 2
          </button>
          <div className="h-[1px] bg-[var(--border)] my-1" />
          <button onClick={() => {
            const textarea = editorRef.current;
            if (!textarea) return;
            const sel = markdown.substring(textarea.selectionStart, textarea.selectionEnd);
            if (!sel.trim()) { alert('Select text first'); return; }
            const name = prompt(lang === 'en' ? 'Snap name:' : 'اسم المقتطف:') || `Snap ${Date.now()}`;
            const newSnaps = [...snaps, { name, content: sel }];
            setSnaps(newSnaps);
            localStorage.setItem('readme-snaps', JSON.stringify(newSnaps));
            setSnapMessage(lang === 'en' ? `✅ Snap saved: "${name}"` : `✅ تم حفظ المقتطف: "${name}"`);
            setTimeout(() => setSnapMessage(null), 3000);
            setContextMenu(null);
          }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> Save Selection as Snap
          </button>
          <button onClick={() => insertAtCursor('**bold**')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <Bold className="w-3 h-3" /> Bold
          </button>
          <button onClick={() => insertAtCursor('*italic*')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <Italic className="w-3 h-3" /> Italic
          </button>
          <button onClick={() => insertAtCursor('\n---\n')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <Layout className="w-3 h-3" /> Divider
          </button>
          <div className="h-[1px] bg-[var(--border)] my-1" />
          <button onClick={copyToClipboard} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <Copy className="w-3 h-3" /> Copy All
          </button>
          <button onClick={downloadMarkdown} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] flex items-center gap-2">
            <Download className="w-3 h-3" /> Download .md
          </button>
        </div>
      )}

      {/* Suggestion Popup */}
      {
        suggestions && (
          <div
            className="fixed z-[100] bg-[var(--card)] border border-[var(--border)] shadow-2xl py-1 w-72 rounded-sm overflow-hidden text-[var(--fg)]"
            style={{
              top: Math.min(suggestions.y, window.innerHeight - 300),
              left: Math.min(suggestions.x, window.innerWidth - 300)
            }}
          >
            <div className="px-3 py-1.5 text-[9px] font-bold uppercase opacity-40 border-b border-[var(--border)] mb-1 flex justify-between items-center bg-[var(--fg)]/5">
              <span>Suggestions (Tab/Enter)</span>
              <span>{suggestions.list.length} results</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {suggestions.list.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => {
                    insertAtCursor(s.content, true);
                    setSuggestions(null);
                  }}
                  onMouseEnter={() => setSuggestions({ ...suggestions, selectedIndex: i })}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors",
                    i === suggestions.selectedIndex ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)]/5"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{s.name}</span>
                    {s.category && <span className={cn("text-[9px] opacity-50", i === suggestions.selectedIndex ? "text-[var(--bg)]" : "text-[var(--fg)]")}>{s.category}</span>}
                  </div>
                  {i === suggestions.selectedIndex && <span className="text-[9px] font-bold">TAB</span>}
                </button>
              ))}
            </div>
          </div>
        )
      }

      {/* Header */}
      <header className="h-14 border-b border-[var(--border)] flex items-center justify-between px-4 bg-[var(--bg)] backdrop-blur-sm sticky top-0 z-40 text-[var(--fg)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center rounded-sm font-bold text-lg">R</div>
          <h1 className="font-serif italic text-xl tracking-tight hidden sm:block">README Architect</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--fg)]/5 p-1 rounded-sm border border-[var(--border)]">
            <button
              onClick={() => setViewMode('edit')}
              className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", viewMode === 'edit' ? "bg-[var(--card)] shadow-sm text-[var(--fg)]" : "opacity-50 text-[var(--fg)]")}
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", viewMode === 'split' ? "bg-[var(--card)] shadow-sm text-[var(--fg)]" : "opacity-50 text-[var(--fg)]")}
            >
              <Sidebar className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", viewMode === 'preview' ? "bg-[var(--card)] shadow-sm text-[var(--fg)]" : "opacity-50 text-[var(--fg)]")}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex bg-[var(--fg)]/5 p-1 rounded-sm border border-[var(--border)]">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="text-[10px] font-bold bg-transparent outline-none px-2 text-[var(--fg)]"
            >
              <option value="architect">Architect</option>
              <option value="github">GitHub Dark</option>
              <option value="island-dark">Island Dark</option>
              <option value="dracula">Dracula</option>
              <option value="island-light">Island Light</option>
            </select>
          </div>

          <div className="h-6 w-[1px] bg-[var(--border)] mx-1" />

          <button
            onClick={() => setIsImportOpen(true)}
            className="p-1.5 hover:bg-[var(--fg)]/5 rounded-sm transition-colors text-[var(--fg)]"
            title="Import from GitHub"
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            id="save-indicator"
            onClick={saveMarkdown}
            className="px-2 py-1 text-[10px] font-bold border border-[var(--border)] rounded-sm hover:bg-[var(--fg)]/5 text-[var(--fg)]"
          >
            SAVE
          </button>

          <div className="h-6 w-[1px] bg-[var(--border)] mx-1" />

          <div className="h-6 w-[1px] bg-[var(--border)] mx-1" />

          {/* AI Score Badge + Button */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-sm border transition-all",
              showAI
                ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
                : "border-[var(--border)] hover:bg-[var(--fg)]/5"
            )}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            AI
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
              aiScore >= 80 ? "bg-green-500 text-white" :
                aiScore >= 50 ? "bg-amber-500 text-white" : "bg-red-500 text-white"
            )}>
              {aiScore}
            </span>
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--fg)] text-[var(--bg)] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity"
          >
            <Zap className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Quick Setup' : 'إعداد سريع'}
          </button>

          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="px-2 py-1 text-[10px] font-bold border border-[var(--border)] rounded-sm hover:bg-[var(--fg)]/5 text-[var(--fg)]"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex h-[calc(100vh-3.5rem-1.5rem)] overflow-hidden">
        {/* Sidebar Tools */}
        <aside className="w-12 border-r border-[var(--border)] flex flex-col items-center py-4 gap-6 bg-[var(--bg)]">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={cn("p-2 rounded-sm transition-all", showTemplates ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)]/5 text-[var(--fg)]")}
            title="Templates"
          >
            <Layout className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className={cn("p-2 rounded-sm transition-all", showSnippets ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)]/5 text-[var(--fg)]")}
            title="Snippets"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSnaps(!showSnaps)}
            className={cn("p-2 rounded-sm transition-all", showSnaps ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)]/5 text-[var(--fg)]")}
            title="Snaps"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <div className="w-6 h-[1px] bg-[var(--border)]" />
          <button onClick={() => insertAtCursor('# ')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><TypeIcon className="w-5 h-5" /></button>
          <button onClick={() => insertAtCursor('**bold**')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><Bold className="w-5 h-5" /></button>
          <button onClick={() => insertAtCursor('*italic*')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><Italic className="w-5 h-5" /></button>
          <button onClick={() => insertAtCursor('~~strike~~')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><Strikethrough className="w-5 h-5" /></button>
          <button onClick={() => insertAtCursor('\n| Col 1 | Col 2 |\n|---|---|\n| val | val |\n')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><TableIcon className="w-5 h-5" /></button>
          <button onClick={() => insertAtCursor('![alt](url)')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><ImageIcon className="w-5 h-5" /></button>
          <button onClick={() => insertAtCursor('[text](url)')} className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"><LinkIcon className="w-5 h-5" /></button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 hover:bg-[var(--fg)]/5 rounded-sm text-[var(--fg)]"
            title="Upload & Insert Image"
          >
            <Plus className="w-5 h-5" />
          </button>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Templates Panel */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--bg)] border-r border-[var(--border)] z-30 flex flex-col shadow-2xl text-[var(--fg)]"
              >
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h2 className="font-serif italic font-bold">{lang === 'en' ? 'Templates' : 'القوالب'}</h2>
                  <button onClick={() => setShowTemplates(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? "Search 130+ templates..." : "بحث في 130+ قالب..."}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--fg)]/5 border border-[var(--border)] focus:border-[var(--accent)] rounded-sm outline-none transition-all text-[var(--fg)]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['All', ...CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded-sm transition-all border border-[var(--border)]",
                          selectedCategory === cat ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 text-[var(--fg)]"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1 pt-2">
                    {filteredTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleTemplateSelect(t)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] rounded-sm transition-all flex items-center justify-between group"
                      >
                        <span>{t.name}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Snippets Panel */}
          <AnimatePresence>
            {showSnippets && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--bg)] border-r border-[var(--border)] z-30 flex flex-col shadow-2xl text-[var(--fg)]"
              >
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h2 className="font-serif italic font-bold">Snippets</h2>
                  <button onClick={() => setShowSnippets(false)}><X className="w-4 h-4" /></button>
                </div>

                {/* Group tabs */}
                <div className="flex flex-wrap gap-1 p-2 border-b border-[var(--border)]">
                  <button
                    onClick={() => setActiveSnippetGroup('all')}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-sm border border-[var(--border)] transition-all",
                      activeSnippetGroup === 'all' ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)]/10 text-[var(--fg)]"
                    )}
                  >
                    All
                  </button>
                  {SNIPPET_GROUPS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setActiveSnippetGroup(g.id)}
                      className={cn("px-2 py-1 text-[10px] font-bold rounded-sm border border-[var(--border)] transition-all",
                        activeSnippetGroup === g.id ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)]/10 text-[var(--fg)]"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 space-y-1 flex-1 overflow-y-auto">
                  {SNIPPETS
                    .filter(s => activeSnippetGroup === 'all' || s.category === activeSnippetGroup)
                    .map(s => (
                      <button
                        key={s.name}
                        onClick={() => { insertAtCursor(s.content); setShowSnippets(false); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] rounded-sm transition-all flex items-center justify-between group"
                      >
                        <span>{s.name}</span>
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Snaps Panel */}
          <AnimatePresence>
            {showSnaps && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--bg)] border-r border-[var(--border)] z-30 flex flex-col shadow-2xl text-[var(--fg)]"
              >
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h2 className="font-serif italic font-bold">Snaps</h2>
                  <button onClick={() => setShowSnaps(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 border-b border-[var(--border)]">
                  <button
                    onClick={addSnap}
                    className="w-full py-2 bg-[var(--fg)] text-[var(--bg)] text-xs font-bold rounded-sm"
                  >
                    Save Current as Snap
                  </button>
                </div>
                <div className="p-3 space-y-1 flex-1 overflow-y-auto">
                  {snaps.map((s, i) => (
                    <div key={i} className="group relative">
                      <button
                        onClick={() => {
                          setMarkdown(s.content);
                          setShowSnaps(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] rounded-sm transition-all"
                      >
                        {s.name}
                      </button>
                      <button
                        onClick={() => {
                          const n = snaps.filter((_, idx) => idx !== i);
                          setSnaps(n);
                          localStorage.setItem('readme-snaps', JSON.stringify(n));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className={cn("flex-1 flex flex-col bg-[var(--bg)]", viewMode === 'split' && "border-r border-[var(--border)]")}>
              <div className="h-8 border-b border-[var(--border)] flex items-center px-3 bg-[var(--fg)]/5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-[var(--fg)]">Editor</span>
              </div>
              <textarea
                ref={editorRef}
                value={markdown}
                onChange={handleEditorChange}
                onKeyDown={handleKeyDown}
                onContextMenu={handleContextMenu}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex-1 p-6 font-mono text-sm resize-none outline-none leading-relaxed bg-transparent text-[var(--fg)]"
                placeholder="Write your markdown here... (Type '/' for suggestions)"
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="flex-1 flex flex-col bg-[var(--bg)]">
              <div className="h-8 border-b border-[var(--border)] flex items-center px-3 bg-[var(--fg)]/5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-[var(--fg)]">Preview</span>
              </div>
              <div className="flex-1 overflow-y-auto p-8 sm:p-12">
                <div className="max-w-3xl mx-auto prose">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    urlTransform={(url) => {
                      if (!url) return url;
                      if (url.startsWith('http') || url.startsWith('https') || url.startsWith('data:')) return url;

                      if (window && (window as any).process) {
                        try {
                          const nodePath = (window as any).require('path');
                          const nodeFs = (window as any).require('fs');

                          // @ts-ignore
                          const baseDir = currentFilePath
                            ? nodePath.dirname(currentFilePath)
                            : (window as any).process.cwd();

                          const absolutePath = nodePath.isAbsolute(url)
                            ? url
                            : nodePath.join(baseDir, url);

                          // Check if file exists to avoid broken image icons
                          if (!nodeFs.existsSync(absolutePath)) {
                            console.warn('Image not found:', absolutePath);
                            return url;
                          }

                          // Build correct URL for protocol
                          let normalizedPath = absolutePath.replace(/\\/g, '/');

                          // On Windows: C:/path -> /C:/path
                          if ((window as any).process.platform === 'win32' && !normalizedPath.startsWith('/')) {
                            normalizedPath = '/' + normalizedPath;
                          }

                          const finalUrl = `local-resource://${normalizedPath}`;
                          console.log('[App] Resolving:', url, '->', finalUrl);
                          return finalUrl;
                        } catch (e) {
                          console.error('Error resolving image path:', e);
                        }
                      }
                      return url;
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 border-l border-[var(--border)] flex-shrink-0 overflow-hidden"
            >
              <AIPanel
                markdown={markdown}
                selectedText={getSelectedText()}
                onInsert={(text) => insertAtCursor(text)}
                onReplace={(text) => setMarkdown(text)}
                onClose={() => setShowAI(false)}
                config={aiConfig}
                onConfigChange={(c) => {
                  setAiConfig(c);
                  localStorage.setItem('readme-ai-config', JSON.stringify(c));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportOpen(false)}
              className="absolute inset-0 bg-[var(--fg)]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] shadow-2xl rounded-sm p-6 text-[var(--fg)]"
            >
              <h2 className="font-serif italic text-xl mb-4">Import from GitHub</h2>
              <form onSubmit={handleImport} className="space-y-4">
                <input
                  type="url"
                  placeholder="https://github.com/user/repo/blob/main/README.md"
                  className="w-full px-3 py-2 border border-[var(--border)] focus:border-[var(--accent)] bg-[var(--card)] rounded-sm outline-none text-sm text-[var(--fg)]"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 bg-[var(--fg)] text-[var(--bg)] font-bold rounded-sm">Import</button>
                  <button type="button" onClick={() => setIsImportOpen(false)} className="flex-1 py-2 border border-[var(--border)] font-bold rounded-sm">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWizardOpen(false)}
              className="absolute inset-0 bg-[var(--fg)]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] shadow-2xl rounded-sm overflow-hidden text-[var(--fg)]"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--fg)] text-[var(--bg)]">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5" />
                  <h2 className="font-serif italic text-xl">{lang === 'en' ? 'Quick Setup Wizard' : 'مساعد الإعداد السريع'}</h2>
                </div>
                <button onClick={() => setIsWizardOpen(false)} className="hover:opacity-70"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleWizardSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">{lang === 'en' ? 'Select Template' : 'اختر القالب'}</label>
                  <select
                    className="w-full px-3 py-2 border border-[var(--border)] focus:border-[var(--accent)] rounded-sm outline-none transition-all text-sm bg-[var(--card)] text-[var(--fg)]"
                    value={wizardData.templateId}
                    onChange={(e) => setWizardData({ ...wizardData, templateId: e.target.value })}
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">{lang === 'en' ? 'Project Name' : 'اسم المشروع'}</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-[var(--border)] focus:border-[var(--accent)] bg-[var(--card)] rounded-sm outline-none transition-all text-sm text-[var(--fg)]"
                    placeholder="e.g. Awesome App"
                    value={wizardData.name}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">{lang === 'en' ? 'Description' : 'الوصف'}</label>
                  <textarea
                    className="w-full px-3 py-2 border border-[var(--border)] focus:border-[var(--accent)] bg-[var(--card)] rounded-sm outline-none transition-all text-sm h-20 resize-none text-[var(--fg)]"
                    placeholder="What does this project do?"
                    value={wizardData.description}
                    onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">GitHub User</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--border)] focus:border-[var(--accent)] bg-[var(--card)] rounded-sm outline-none transition-all text-sm text-[var(--fg)]"
                      placeholder="username"
                      value={wizardData.username}
                      onChange={(e) => setWizardData({ ...wizardData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Repo Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--border)] focus:border-[var(--accent)] bg-[var(--card)] rounded-sm outline-none transition-all text-sm text-[var(--fg)]"
                      placeholder="awesome-repo"
                      value={wizardData.repo}
                      onChange={(e) => setWizardData({ ...wizardData, repo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[var(--fg)] text-[var(--bg)] font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {lang === 'en' ? 'Generate README' : 'توليد README'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Status */}
      <footer className="h-6 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between px-3 text-[9px] font-bold uppercase tracking-widest opacity-40 text-[var(--fg)]">
        <div className="flex items-center gap-4">
          <span>{markdown.length} characters</span>
          <span>{markdown.split(/\s+/).length} words</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </footer>
    </div >
  );
}
