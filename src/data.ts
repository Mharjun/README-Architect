import { Type } from "@google/genai";

export const SNIPPET_GROUPS = [
  { id: "formatting", label: "📝 Formatting" },
  { id: "code", label: "💻 Code Blocks" },
  { id: "alerts", label: "⚠️ Alerts" },
  { id: "tables", label: "📊 Tables" },
  { id: "lists", label: "📋 Lists" },
  { id: "badges", label: "🏷️ Badges" },
  { id: "github", label: "🐙 GitHub Stats" },
  { id: "sections", label: "📁 Sections" },
  { id: "media", label: "🖼️ Media" },
  { id: "advanced", label: "⚙️ Advanced" },
];

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
}

export interface Snippet {
  name: string;
  content: string;
  category?: string;
}

export const CATEGORIES = [
  "Web Development",
  "Backend & API",
  "Mobile & Desktop",
  "Data Science & ML",
  "DevOps & Cloud",
  "CLI & Tools",
  "Games & Graphics",
  "Documentation & Profiles",
  "Security & Research",
  "IoT & Hardware",
  "Other"
];

const generateTemplates = (): Template[] => {
  const templates: Template[] = [];

  const techStacks = [
    "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js", "Remix", "Astro", "SolidJS", "Qwik",
    "Django", "Flask", "FastAPI", "Express", "NestJS", "Fastify", "Spring Boot", "Laravel", "Rails", "Phoenix",
    "Go Gin", "Rust Axum", "Rust Actix", "Node.js", "Deno", "Bun", "ASP.NET Core", "Koa", "Hapi", "Fiber",
    "Flutter", "React Native", "SwiftUI", "Kotlin Multiplatform", "Ionic", "Cordova", "Xamarin", "Maui",
    "Unity", "Unreal Engine", "Godot", "Pygame", "Phaser", "Three.js", "Babylon.js", "Cocos2d",
    "Docker", "Kubernetes", "Terraform", "Ansible", "Pulumi", "Jenkins", "GitHub Actions", "GitLab CI",
    "PyTorch", "TensorFlow", "Scikit-Learn", "Keras", "JAX", "Pandas", "Spark", "Dask", "Ray",
    "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "Firebase", "Supabase",
    "GraphQL", "gRPC", "TRPC", "Web3.js", "Ethers.js", "Solidity", "Hardhat", "Foundry",
    "Chrome Extension", "VS Code Extension", "Discord Bot", "Telegram Bot", "Slack App", "Matrix Bot",
    "Arduino", "Raspberry Pi", "ESP32", "MicroPython", "Embedded C", "Rust Embedded",
    "WordPress", "Shopify", "Ghost", "Strapi", "Contentful", "Sanity", "Payload CMS",
    "Jekyll", "Hugo", "Eleventy", "Gatsby", "VitePress", "Docusaurus", "GitBook",
    "Algorithm Lab", "Data Structure Library", "Interview Prep", "LeetCode Solutions",
    "Pentest Lab", "Malware Analysis", "CTF Writeups", "Security Audit", "OSINT Tool",
    "Fintech App", "Healthtech Platform", "Edtech Portal", "Ecommerce Store", "Social Media",
    "SaaS Boilerplate", "Internal Admin Tool", "Portfolio Site", "Resume Template", "Course Material"
  ];

  techStacks.forEach((tech, i) => {
    let cat = "Other";
    if (i < 10) cat = "Web Development";
    else if (i < 20) cat = "Backend & API";
    else if (i < 28) cat = "Mobile & Desktop";
    else if (i < 35) cat = "Games & Graphics";
    else if (i < 43) cat = "DevOps & Cloud";
    else if (i < 52) cat = "Data Science & ML";
    else if (i < 60) cat = "Backend & API";
    else if (i < 68) cat = "Web Development";
    else if (i < 76) cat = "CLI & Tools";
    else if (i < 84) cat = "IoT & Hardware";
    else if (i < 92) cat = "Documentation & Profiles";
    else cat = "Security & Research";

    templates.push({
      id: `tpl-${i}`,
      name: `${tech} Professional Template`,
      category: cat,
      content: `# 🚀 ${tech} {name}\n\n[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#) \n[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](#)\n\nA high-performance ${tech} project designed for scalability and maintainability.\n\n## ✨ Features\n- ⚡ **Fast Performance:** Optimized for speed.\n- 🛡️ **Secure:** Built with security best practices.\n- 🧩 **Modular:** Easy to extend and customize.\n- 📱 **Responsive:** Works seamlessly across devices.\n\n## 🛠 Tech Stack\n- **Core:** ${tech}\n- **Language:** TypeScript / Python / Go\n- **Styling:** Tailwind CSS / CSS Modules\n- **Database:** PostgreSQL / MongoDB\n\n## 🚀 Getting Started\n\n### Prerequisites\n- Node.js / Python / Go installed\n- Package manager (npm/yarn/pip)\n\n### Installation\n\`\`\`bash\n# Clone the repository\ngit clone https://github.com/user/{slug}.git\n\n# Navigate to project directory\ncd {slug}\n\n# Install dependencies\nnpm install # or pip install -r requirements.txt\n\`\`\`\n\n### Running the App\n\`\`\`bash\nnpm run dev # or python main.py\n\`\`\`\n\n## 📸 Screenshots\n| Desktop | Mobile |\n|---------|--------|\n| ![Desktop](https://picsum.photos/seed/${tech.toLowerCase()}/800/600) | ![Mobile](https://picsum.photos/seed/${tech.toLowerCase()}-mob/300/600) |\n\n## 🤝 Contributing\nContributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).\n\n## 📋 License\nMIT © [Author](https://github.com/author)`
    });
  });

  return templates;
};

const generateSnippets = (): Snippet[] => {
  const snippets: Snippet[] = [];

  // 1. Basic Formatting (20)
  const basics: { n: string, c: string }[] = [
    { n: "H1 Header", c: "# Heading 1\n" },
    { n: "H2 Header", c: "## Heading 2\n" },
    { n: "H3 Header", c: "### Heading 3\n" },
    { n: "H4 Header", c: "#### Heading 4\n" },
    { n: "Bold Text", c: "**bold text**" },
    { n: "Italic Text", c: "*italic text*" },
    { n: "Strike Text", c: "~~strikethrough~~" },
    { n: "Underline", c: "<u>underlined</u>" },
    { n: "Superscript", c: "<sup>super</sup>" },
    { n: "Subscript", c: "<sub>sub</sub>" },
    { n: "Highlight", c: "<mark>highlight</mark>" },
    { n: "Kbd Key", c: "<kbd>Ctrl</kbd>" },
    { n: "Center Div", c: "<div align='center'>\n\nContent\n\n</div>\n" },
    { n: "Horizontal Rule", c: "\n---\n" },
    { n: "Blockquote", c: "> Quote text here.\n" },
    { n: "Link", c: "[Link Text](https://example.com)" },
    { n: "Image", c: "![Alt Text](https://example.com/image.png)" },
    { n: "Anchor Link", c: "[Go to Section](#section-id)" },
    { n: "Footnote", c: "Text[^1]\n\n[^1]: Footnote text." },
    { n: "Comment", c: "<!-- This is a comment -->" }
  ];
  basics.forEach(b => snippets.push({ name: b.n, content: b.c, category: "formatting" }));

  // 2. Code Blocks (30)
  const languages = [
    "bash", "javascript", "typescript", "python", "go", "rust", "java", "cpp", "csharp", "ruby",
    "php", "swift", "kotlin", "sql", "json", "yaml", "toml", "markdown", "css", "html",
    "dockerfile", "makefile", "diff", "graphql", "xml", "r", "julia", "scala", "dart", "solidity"
  ];
  languages.forEach(lang => {
    snippets.push({
      name: `Code: ${lang.toUpperCase()}`,
      content: `\`\`\`${lang}\n// Your ${lang} code here\n\`\`\`\n`,
      category: "code"
    });
  });

  // 3. Alerts & Callouts (10)
  const alerts: { n: string, c: string }[] = [
    { n: "Note Alert", c: "> [!NOTE]\n> Useful information that users should know.\n" },
    { n: "Tip Alert", c: "> [!TIP]\n> Helpful advice for doing things better or more easily.\n" },
    { n: "Important Alert", c: "> [!IMPORTANT]\n> Crucial information users need to know to avoid mistakes.\n" },
    { n: "Warning Alert", c: "> [!WARNING]\n> Urgent information that needs immediate user attention to avoid problems.\n" },
    { n: "Caution Alert", c: "> [!CAUTION]\n> Negative consequences of an action.\n" },
    { n: "Custom Alert (Blue)", c: ":::info\nInfo message here\n:::\n" },
    { n: "Custom Alert (Green)", c: ":::success\nSuccess message here\n:::\n" },
    { n: "Custom Alert (Yellow)", c: ":::warning\nWarning message here\n:::\n" },
    { n: "Custom Alert (Red)", c: ":::danger\nDanger message here\n:::\n" },
    { n: "Details/Summary", c: "<details>\n<summary>Click to expand</summary>\n\nDetailed content here.\n\n</details>\n" }
  ];
  alerts.forEach(a => snippets.push({ name: a.n, content: a.c, category: "alerts" }));

  // 4. Tables & Lists (20)
  const tables: { n: string, c: string, category?: string }[] = [
    { n: "Table 2x2", c: "\n| Col 1 | Col 2 |\n|---|---|\n| val 1 | val 2 |\n" },
    { n: "Table 3x3", c: "\n| Header 1 | Header 2 | Header 3 |\n|---|---|---|\n| A1 | A2 | A3 |\n| B1 | B2 | B3 |\n" },
    { n: "Aligned Table", c: "\n| Left | Center | Right |\n|:---|:---:|---:|\n| L | C | R |\n" },
    { n: "Task List", c: "- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3\n" },
    { n: "Bullet List", c: "- Item 1\n- Item 2\n  - Sub-item 2.1\n" },
    { n: "Numbered List", c: "1. First\n2. Second\n3. Third\n" },
    { n: "Definition List", c: "<dl>\n  <dt>Term</dt>\n  <dd>Definition</dd>\n</dl>\n" },
    { n: "Nested List", c: "1. Parent\n   - Child 1\n   - Child 2\n" },
    { n: "Emoji List", c: "✅ Done\n❌ Failed\n⏳ Pending\n" },
    { n: "Feature Table", c: "| Feature | Status | Description |\n|---|---|---|\n| Auth | ✅ | JWT based |\n| API | ✅ | RESTful |\n" }
  ];
  // Add 10 more variations
  for (let i = 1; i <= 10; i++) {
    tables.push({ n: `List Variation ${i}`, c: `- Option ${i}\n- Choice ${i}\n`, category: "lists" });
  }
  tables.forEach(t => snippets.push({ name: t.n, content: t.c, category: (t.category || "Tables").toLowerCase() }));

  // 5. Badges & Shields (40)
  const badgeStyles = ["flat", "flat-square", "plastic", "for-the-badge", "social"];

  badgeStyles.forEach(style => {
    snippets.push({
      name: `Badge: License (${style})`,
      content: `![License](https://img.shields.io/badge/license-MIT-blue?style=${style})\n`,
      category: "badges"
    });
    snippets.push({
      name: `Badge: Version (${style})`,
      content: `![Version](https://img.shields.io/badge/version-1.0.0-green?style=${style})\n`,
      category: "badges"
    });
  });

  const techBadges = ["React", "Vue", "Angular", "Node.js", "Python", "Go", "Rust", "Docker", "AWS", "Firebase"];
  techBadges.forEach(tech => {
    snippets.push({
      name: `Tech Badge: ${tech}`,
      content: `![${tech}](https://img.shields.io/badge/${tech}-%2320232a.svg?style=flat&logo=${tech.toLowerCase()}&logoColor=white)\n`,
      category: "badges"
    });
  });
  // Add more to reach 40
  for (let i = 1; i <= 20; i++) {
    snippets.push({ name: `Custom Badge ${i}`, content: `![Badge ${i}](https://img.shields.io/badge/Label-${i}-blue)\n`, category: "badges" });
  }

  // 6. GitHub Stats (20)
  const ghStats: { n: string, c: string, category?: string }[] = [
    { n: "GH: Stats Card", c: "![Stats](https://github-readme-stats.vercel.app/api?username={username}&show_icons=true&theme=dark)\n" },
    { n: "GH: Top Languages", c: "![Langs](https://github-readme-stats.vercel.app/api/top-langs/?username={username}&layout=compact&theme=dark)\n" },
    { n: "GH: Streak Stats", c: "![Streak](https://streak-stats.demolab.com?user={username}&theme=dark)\n" },
    { n: "GH: Profile Trophies", c: "![Trophies](https://github-profile-trophy.vercel.app/?username={username}&theme=darkhub)\n" },
    { n: "GH: Activity Graph", c: "![Activity](https://github-readme-activity-graph.vercel.app/graph?username={username}&theme=dracula)\n" },
    { n: "GH: Contribution Grid", c: "![Grid](https://github-readme-stats.vercel.app/api/pin/?username={username}&repo={repo}&theme=dark)\n" },
    { n: "GH: Followers Badge", c: "![Followers](https://img.shields.io/github/followers/{username}?style=social)\n" },
    { n: "GH: Stars Badge", c: "![Stars](https://img.shields.io/github/stars/{username}/{repo}?style=social)\n" },
    { n: "GH: Forks Badge", c: "![Forks](https://img.shields.io/github/forks/{username}/{repo}?style=social)\n" },
    { n: "GH: Issues Badge", c: "![Issues](https://img.shields.io/github/issues/{username}/{repo})\n" }
  ];
  // Add 10 more variations
  for (let i = 1; i <= 10; i++) {
    ghStats.push({ n: `GH: Variation ${i}`, c: `![Variation ${i}](https://img.shields.io/github/watchers/{username}/{repo})\n`, category: "GitHub" });
  }
  ghStats.forEach(s => snippets.push({ name: s.n, content: s.c, category: (s.category || "GitHub").toLowerCase() }));

  // 7. Sections & Layouts (40)
  const sections: { n: string, c: string, category?: string }[] = [
    { n: "Section: Features", c: "## ✨ Features\n\n- 🚀 Feature 1\n- 🛡️ Feature 2\n- 🧩 Feature 3\n" },
    { n: "Section: Installation", c: "## ⚡ Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n" },
    { n: "Section: Usage", c: "## 🚀 Usage\n\n\`\`\`javascript\nimport { app } from './app';\napp.start();\n\`\`\`\n" },
    { n: "Section: API", c: "## 📖 API Reference\n\n### \`GET /items\`\nReturns all items.\n" },
    { n: "Section: Contributing", c: "## 🤝 Contributing\n\nContributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).\n" },
    { n: "Section: License", c: "## 📋 License\n\nThis project is licensed under the MIT License.\n" },
    { n: "Section: FAQ", c: "## ❓ FAQ\n\n**Q: How do I...?**\nA: You can...\n" },
    { n: "Section: Roadmap", c: "## 🗺️ Roadmap\n\n- [x] Phase 1\n- [ ] Phase 2\n" },
    { n: "Section: Changelog", c: "## 📜 Changelog\n\n### v1.0.0\n- Initial release\n" },
    { n: "Section: Authors", c: "## ✍️ Authors\n\n- [@username](https://github.com/username)\n" }
  ];
  // Add 30 more variations
  for (let i = 1; i <= 30; i++) {
    sections.push({ n: `Section: Custom ${i}`, c: `## 📁 Section ${i}\n\nContent for section ${i}.\n`, category: "Sections" });
  }
  sections.forEach(s => snippets.push({ name: s.n, content: s.c, category: (s.category || "Sections").toLowerCase() }));

  // 8. Emojis & Symbols (20)
  const emojis = [
    "🚀", "✨", "🔥", "⚡", "🛡️", "🧩", "📱", "🌐", "🤖", "📦",
    "🛠️", "📖", "🤝", "📋", "📸", "⚡", "🚀", "📖", "🤝", "📋"
  ];
  emojis.forEach((e, i) => {
    snippets.push({ name: `Emoji: ${e}`, content: e, category: "emojis" });
  });

  return snippets;
};

export const TEMPLATES = generateTemplates();
export const SNIPPETS = generateSnippets();
