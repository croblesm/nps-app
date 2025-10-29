import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

// --- Text utils & rule engine (added by ChatGPT) ---
const normalize = (s = "") =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/\s+/g, " ")
    .trim();

const withinNWords = (text, a, b, n = 3) => {
  const rx = new RegExp(`\\b${a}\\b(?:\\W+\\w+){0,${n}}\\W+\\b${b}\\b|\\b${b}\\b(?:\\W+\\w+){0,${n}}\\W+\\b${a}\\b`, "i");
  return rx.test(text);
};

const makeRe = (s) => new RegExp(s, "i");
const w = (s) => new RegExp(`\\b${s}\\b`, "i"); // word boundary

// Helper function to check if text is requesting a feature (not thanking for one)
const isFeatureRequest = (t) => {
  // If it starts with positive words like "thanks", "love", "great", it's NOT a request
  if (/^(thanks|thank you|love|great|good|perfect|excellent|amazing|awesome|wonderful|glad)\b/i.test(t)) {
    return false;
  }
  // If it contains "thanks for adding" or similar, it's NOT a request
  if (/\bthanks for (adding|implementing|including|including|having)\b/i.test(t)) {
    return false;
  }
  // Otherwise, it's a feature request if it has "add" or "adding"
  return /\badd(ing)?\b/i.test(t);
};

// Category rules with weights and contextual checks
const CATEGORY_RULES = [
  {
    name: "ADS/SSMS Comparison",
    weight: 4,
    tests: [
      w("ssms"),
      makeRe("\\bsql server management studio\\b"),
      makeRe("\\bazure data studio\\b"),
      makeRe("\\bdata studio\\b"),
      // Contextual ADS: exact ADS in caps or 'ads' near azure/data/studio
      (t) => /\bADS\b/.test(t) || (/\bads\b/i.test(t) && withinNWords(t, "ads", "(azure|data|studio)")),
      w("management studio"),
      w("notebook"),
      w("profiler"),
      makeRe("\\bsql server profiler\\b"),
      makeRe("\\bsql profiler\\b"),
      makeRe("\\bactivity monitor\\b"),
      w("toad"),
      makeRe("\\bdb(?:-)?visualizer\\b"),
      makeRe("\\bdbeaver\\b"),
      // common shortcut often mentioned in comparisons
      w("f5"),
      // common typos and variations
      makeRe("\\bmicrosoft azure\\b"),
      makeRe("\\bmsms\\b"),
      makeRe("\\bstudio\\b"),
      makeRe("\\bsms\\b"),
      makeRe("\\ssmss\\b"),
      makeRe("\\ssmss'\\b"),
      makeRe("\\bazyure data studio\\b")
    ]
  },
  {
    name: "Missing Feature",
    weight: 3,
    tests: [
      w("missing"), makeRe("\\bmissing (feature|features)\\b"),
      makeRe("\\bwould like\\b"), w("wish"),
      isFeatureRequest, w("feature"), makeRe("\\bbring back\\b"),
      makeRe("\\bgive me back\\b"), w("shortcut"), makeRe("\\bshort ?cut\\b"),
      // common MSSQL extension features
      w("export"), w("import"), makeRe("\\bresult(s)? grid\\b"),
      makeRe("\\bschema compare\\b"), makeRe("\\bschema designer?\\b"),
      w("table designer"), makeRe("\\bobject explorer\\b"),
      // edit data related features
      makeRe("\\bedit(ing)? (table|data|inline)\\b"),
      makeRe("\\bdata editor\\b"),
      makeRe("\\bedit mode\\b"),
      makeRe("\\ballow.{0,30}edit\\b"),
      makeRe("\\binline.{0,15}edit\\b"),
      makeRe("\\bno edit\\b"),
      makeRe("\\bcannot edit\\b"),
      makeRe("\\bcan't edit\\b"),
      makeRe("\\bedición de tabla\\b"),
      makeRe("\\bviewed and edited\\b"),
      makeRe("\\bview.*edit\\b"),
      w("edited"),
      // other common missing features
      w("backup"), w("restore"), w("profiler"), w("maintenance"),
      makeRe("\\bscript (as|data)\\b"), makeRe("\\bscript table\\b"),
      makeRe("\\bimport (data|flat file)\\b"), makeRe("\\bfrom file\\b"),
      makeRe("\\bcsv importer\\b"), makeRe("\\bdata importer\\b")
    ]
  },
  {
    name: "Connectivity",
    weight: 3,
    tests: [
      w("connection"), w("connect"), w("authenticate"), w("reauthenticate"),
      makeRe("\\bre-authenticate\\b"), w("credential"), w("login"),
      w("kinit"), w("kerberos"), w("timeout"), makeRe("\\btoken\\b"), w("keychain")
    ]
  },
  {
    name: "Quality/Performance",
    weight: 3,
    tests: [
      w("slow"), w("performance"), w("hangs"), w("crashes"), w("freezes"),
      w("unstable"), w("brittle"), w("reliability"), makeRe("\\btakes a while\\b"),
      w("forever"), w("lag"), w("speed"), w("responsive"), makeRe("\\berror(ing)?\\b"),
      makeRe("\\bdoesn't work\\b"), makeRe("\\bbugs?\\b"), w("buggy"),
      // IntelliSense / autocomplete with common typos
      w("autocomplete"), w("auto-complete"), makeRe("\\bauto complete\\b"),
      w("intellisense"), makeRe("\\bintelisnese\\b"), makeRe("\\bintel+isense\\b"),
      w("loading"), makeRe("\\bload time\\b"), makeRe("\\brender issue\\b"),
      makeRe("\\bexecution (failed|issue|problem)\\b"), w("timeout"),
      makeRe("\\bcrashing\\b"), w("drop"), w("restart")
    ]
  },
  {
    name: "UI/UX",
    weight: 2,
    tests: [
      w("ui"), w("interface"), w("clunky"), makeRe("\\buser experience\\b"),
      w("workflow"), w("usability"), w("clumsy"), w("intuitive"), w("cumbersome"),
      w("scrolling"), w("space"), w("layout"), w("design"), w("visual"),
      w("look"), w("display"), w("screen"), w("size"), w("view"),
      w("navigate"), w("navigation"), w("annoying"), w("messy"),
      makeRe("\\btoo (many|much) clicks?\\b"), makeRe("\\bui (is|seems|looks)\\b"),
      makeRe("\\bseparate (window|app|panel)\\b"), makeRe("\\btab.{0,20}color(ing)?\\b"),
      makeRe("\\bvisibility\\b"), makeRe("\\boff.*screen\\b")
    ]
  },
  {
    name: "AI/GitHub Copilot",
    weight: 2,
    tests: [ w("copilot"), makeRe("\\bco-pilot\\b"), makeRe("\\bai\\b"), w("mcp"), makeRe("\\bmcp\\b") ]
  },
  {
    name: "No comment",
    weight: 0,
    tests: [] // will be handled specially in scoreCategory
  },
  {
    name: "General Feedback",
    weight: 1,
    tests: [] // fallback
  }
];

// Areas
// Helper function to check if text contains "edit" or related keywords near data/table/row context
const isEditDataContext = (t) => {
  // English: "edit" + (table/data/register/row/record/inline)
  if (/\bedit(ing)?\b/i.test(t) && /\b(table|data|register|row|record|inline|rows|values)\b/i.test(t)) {
    return true;
  }
  // Spanish: "edición/editar" + (tabla/datos/registro/fila/registro)
  if (/\b(edici[oó]n|editar|edit[ao]|edit[ao]r)\b/i.test(t) && /\b(tabla|datos|registro|fila|registros|filas)\b/i.test(t)) {
    return true;
  }
  // Check for "update" + (data/table/row/record) - English
  if (/\bupdate\b/i.test(t) && /\b(data|table|row|record|rows|values)\b/i.test(t)) {
    return true;
  }
  // Spanish: "actualizar" (update) + related keywords
  if (/\bactualizar\b/i.test(t) && /\b(datos|tabla|fila|registro|filas|registros)\b/i.test(t)) {
    return true;
  }
  // Check for CRUD operations (create/insert + update + delete) - English
  const hasCRUD = (/\b(create|insert|add)\b/i.test(t) && /\bupdate\b/i.test(t) && /\bdelete\b/i.test(t));
  if (hasCRUD) {
    return true;
  }
  // Spanish CRUD: (crear/insertar + actualizar + eliminar/borrar)
  const hasCRUDSpanish = (/\b(crear|insertar|a[ñn]adir|agregar)\b/i.test(t) && /\bactualizar\b/i.test(t) && /\b(eliminar|borrar)\b/i.test(t));
  if (hasCRUDSpanish) {
    return true;
  }
  // Check for "data editor", "edit inline", "edit mode"
  if (/\bdata editor\b/i.test(t) || /\bedit (inline|mode|data|table)\b/i.test(t)) {
    return true;
  }
  // Spanish: "editor de datos"
  if (/\beditor (de )?(datos|tabla)\b/i.test(t)) {
    return true;
  }
  // Check for "viewed and edited" or "view.*edit"
  if (/\b(viewed|view).+(edited|edit)\b/i.test(t)) {
    return true;
  }
  // Spanish: "ver.*editad" or similar
  if (/\b(ver|vista).+(editad|editar)\b/i.test(t)) {
    return true;
  }
  // Check for "inline" + result/table editing context
  if (/\binline\b/i.test(t) && (/\b(result|table|data|edit)\b/i.test(t))) {
    return true;
  }
  return false;
};

const AREA_RULES = [
  { name: "Connectivity", tests: [w("connection"), w("connect"), w("authenticate"), w("login"), w("credential"), w("kerberos"), w("kinit"), w("token"), w("timeout"), w("keychain"), w("reauthenticate"), makeRe("\\bre-?auth\\b")] },
  { name: "Edit data", tests: [isEditDataContext, makeRe("\\bno edit\\b"), makeRe("\\bcannot edit\\b"), makeRe("\\bcan't edit\\b"), w("edited")] },
  { name: "Query Results", tests: [w("result"), makeRe("\\bquery result(s)?\\b"), w("grid"), w("export"), w("copy"), w("display"), w("transpose"), makeRe("\\bresult(s)? (grid|pane|panel|window)\\b")] },
  { name: "Query Editor", tests: [w("query"), w("execute"), w("editor"), w("syntax"), w("intellisense"), makeRe("\\b(auto[- ]?)?complete\\b"), w("formatting"), w("f5")] },
  { name: "Object Explorer", tests: [makeRe("\\bobject explorer\\b"), makeRe("\\bserver browser\\b"), makeRe("\\btree.*view\\b"), w("schema"), w("database"), w("table"), w("view"), w("procedure"), w("function")] },
  { name: "Database Management", tests: [w("backup"), w("restore"), w("maintenance"), w("profiler"), makeRe("\\bactivity monitor\\b"), w("jobs"), w("agent"), makeRe("\\bdrop.*database\\b"), makeRe("\\bcreate.*database\\b")] },
  { name: "GitHub Copilot", tests: [w("copilot"), makeRe("\\bco-pilot\\b")] },
  { name: "MCP", tests: [w("mcp"), makeRe("\\bmcp\\b")] },
  { name: "Other", tests: [] }
];

// User types
const USER_TYPE_RULES = [
  { name: "DBA", tests: [w("ssms"), makeRe("\\bmanagement studio\\b"), w("dba"), makeRe("\\bdatabase admin\\b"), w("jobs"), w("profiler"), makeRe("\\bactivity monitor\\b"), makeRe("\\blinked server\\b"), makeRe("\\bindex( management)?\\b"), w("backup"), w("restore"), makeRe("\\bazure data studio\\b"), w("maintenance"), w("agent"), w("dacpac"), w("bacpac")] },
  { name: "Developer", tests: [w("development"), w("coding"), w("copilot"), w("github"), makeRe("\\bvs code\\b"), w("extension"), w("workflow"), w("orm"), w("prisma"), w("tedious"), w("script"), w("debug"), w("notebook")] },
  { name: "Data Analyst", tests: [w("analysis"), w("analytics"), w("report"), makeRe("\\bpower bi\\b"), w("query"), w("result"), w("export"), w("data")] },
  { name: "General User", tests: [] }
];

const CONSTRUCTIVE_RULES = {
  constructive: [
    makeRe("\\bwould be\\b"), w("suggestion"), w("improve"), w("add"), w("feature"),
    w("option"), w("ability"), w("support"), makeRe("\\bplease\\b"), makeRe("\\bshould\\b"),
    makeRe("\\bcould\\b"), w("recommend"), w("implement"), makeRe("\\bwould like\\b"),
    w("wish"), w("enhancement"), w("capability"), w("allow"), w("possibility")
  ],
  nonConstructive: [
    makeRe("\\bjust copy\\b"), makeRe("\\blike ssms\\b"), makeRe("\\bbring back\\b"),
    makeRe("\\bfar from\\b"), makeRe("\\bnot as good\\b"), makeRe("\\bsucks\\b"),
    makeRe("\\bawful\\b"), makeRe("\\bterrible\\b"), makeRe("\\bdisgusting\\b"),
    makeRe("\\bstop requiring\\b"), w("hate")
  ]
};

function scoreCategory(text) {
  const t = normalize(text || "");
  const hits = [];
  let best = { name: "General Feedback", score: 0, matches: [] };

  // Check if text is empty or only whitespace
  if (!t || t.trim().length === 0) {
    return { category: "No comment", explain: [] };
  }

  // Check for comparison language FIRST (highest priority)
  // More specific: look for actual comparison patterns, not just "like"
  const hasComparisonLanguage = /\b(ssms|comparison|parity|replacement|similar to|like ssms|azure data studio|azyure data studio|azure datat studio|ads|management studio|data studio)\b/i.test(t);
  
  // If comparison language is found, immediately return ADS/SSMS Comparison
  if (hasComparisonLanguage) {
    return { category: "ADS/SSMS Comparison", explain: [] };
  }
  
  // Boost score for "Missing Feature" if explicitly mentioned with "add", "feature", or "would like"
  const hasMissingFeatureLanguage = /\b(add|would like|feature|missing|please|allow|edit|data editor)\b/i.test(t);
  
  for (const rule of CATEGORY_RULES) {
    let localMatches = [];
    for (const test of rule.tests) {
      const matched = typeof test === "function" ? test(t) : test.test(t);
      if (matched) localMatches.push(test.toString ? test.toString() : "fn");
    }
    let score = (localMatches.length > 0 ? rule.weight : 0) * localMatches.length;
    
    // Context-aware boost: if this is "Missing Feature" and has feature-related language, boost it
    if (rule.name === "Missing Feature" && hasMissingFeatureLanguage && localMatches.length > 0) {
      score = score * 1.5; // 50% boost for explicit feature language
    }
    
    if (score > best.score) best = { name: rule.name, score, matches: localMatches };
    if (localMatches.length) hits.push({ category: rule.name, matches: localMatches });
  }
  if (best.score === 0) best = { name: "General Feedback", score: 0, matches: [] };
  return { category: best.name, explain: hits };
}

function pickRule(text, rules, fallback = "Other") {
  const t = normalize(text || "");
  for (const r of rules) {
    if (r.tests.length === 0) continue;
    for (const test of r.tests) {
      const ok = typeof test === "function" ? test(t) : test.test(t);
      if (ok) return r.name;
    }
  }
  const last = rules.find(r => r.tests.length === 0)?.name;
  return last || fallback;
}

function commentType(comment) {
  const t = normalize(comment || "");
  if (!t) return "No comment";
  
  // Redacted content is non-actionable
  if (t.includes("REDACTED") || /^<REDACTED[^>]*>$/.test(t)) return "Non-actionable";
  
  // Single word or very short feedback is non-actionable
  const wordCount = t.trim().split(/\s+/).length;
  if (wordCount === 1 || t.length < 10) return "Non-actionable";
  
  if (CONSTRUCTIVE_RULES.nonConstructive.some(rx => rx.test(t))) return "Non-actionable";
  if (CONSTRUCTIVE_RULES.constructive.some(rx => rx.test(t))) return "";
  return "";
}
// --- End of rule engine additions ---

const NPSAnalysis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [hideSSMSComparison, setHideSSMSComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [filters, setFilters] = useState({
    category: 'All',
    area: 'All',
    userType: 'All',
    commentType: 'All',
    feedbackType: 'All',
    version: 'All'
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);



  const determineArea = (comment) => {
    if (!comment || !comment.trim()) return "Other";
    return pickRule(comment, AREA_RULES, "Other");
  };

  const determineUserType = (comment) => {
    if (!comment || !comment.trim()) return "Unknown";
    return pickRule(comment, USER_TYPE_RULES, "General User");
  };

  const determineCommentType = (comment) => commentType(comment);

  useEffect(() => {
    const processData = async () => {
      try {
        console.log('Loading CSV data...');

        // Load CSV from public folder (public/data.csv)
        const response = await fetch('/data.csv');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvData = await response.text();
        console.log('CSV data length:', csvData.length);

        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        console.log('Parsed rows:', parsed.data.length);

        // Process all data without version filtering
        const processedData = parsed.data.map((row, index) => {
          const cat = scoreCategory(row.Comments || "");
          return {
            ...row,
            ID: index + 1,
            Category: cat.category,
            CategoryExplain: cat.explain, // optional: useful for tooltips/debug
            Area: determineArea(row.Comments),
            UserType: determineUserType(row.Comments),
            CommentType: determineCommentType(row.Comments)
          };
        });

        setData(processedData);
        setLoading(false);

      } catch (error) {
        console.error('Error in processData:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    processData();
  }, []);

  // Sorting function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = () => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      
      let valueA = a[sortConfig.key];
      let valueB = b[sortConfig.key];
      
      // Handle string values
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  const filteredData = sortedData().filter(row => {
    // Handle NPS feedback type filtering (Promoters, Passives, Detractors)
    const matchesFeedbackType = filters.feedbackType === 'All' || 
      (filters.feedbackType === 'Promoter' && row.NPS >= 9) ||
      (filters.feedbackType === 'Passive' && row.NPS >= 7 && row.NPS <= 8) ||
      (filters.feedbackType === 'Detractor' && row.NPS <= 6);
    
    // Add hideSSMSComparison filter
    const matchesSSMSToggle = !hideSSMSComparison || row.Category !== 'ADS/SSMS Comparison';
    
    // Add search filter for comments
    const matchesSearch = searchQuery === '' || 
      (row.Comments && row.Comments.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFeedbackType &&
           matchesSSMSToggle &&
           matchesSearch &&
           (filters.version === 'All' || row.Version === filters.version) &&
           (filters.category === 'All' || row.Category === filters.category) &&
           (filters.area === 'All' || row.Area === filters.area) &&
           (filters.userType === 'All' || row.UserType === filters.userType) &&
           (filters.commentType === 'All' || row.CommentType === filters.commentType);
  });

  const getUniqueValues = (field) => {
    const uniqueValues = new Set(data.map(row => row[field]));
    
    // Special handling for Area: put "Other" at the end
    if (field === 'Area') {
      const values = [...uniqueValues].sort();
      const other = values.find(v => v === 'Other');
      if (other) {
        values.splice(values.indexOf(other), 1);
        return ['All', ...values, 'Other'];
      }
      return ['All', ...values];
    }
    
    // Default: sort alphabetically with "All" first
    return ['All', ...uniqueValues].sort();
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'enhanced_nps_feedback_filtered.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-xl">Loading and analyzing NPS feedback data...</div>;
  }

  if (error) {
    return <div className="p-8 text-xl text-red-600">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-xl">No data found</div>;
  }

  return (
    <div>
      <div className="bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">MSSQL VS Code - NPS Analysis Tool</h1>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-48">
              <label className={`block text-sm font-medium mb-1`}>Version</label>
              <select
                className={`border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600`}
                value={filters.version}
                onChange={(e) => {
                  setFilters({...filters, version: e.target.value});
                  setCurrentPage(1);
                }}
              >
                {['All', ...new Set(data.map(row => row.Version))].sort().map(ver => (
                  <option key={ver} value={ver}>{ver}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="ads-toggle"
                onClick={() => setHideSSMSComparison(!hideSSMSComparison)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  hideSSMSComparison
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={hideSSMSComparison}
                aria-label="Toggle ADS/SSMS Comparison filter"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    hideSSMSComparison ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <label htmlFor="ads-toggle" className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                ADS/SSMS
              </label>
            </div>
          </div>
        </div>
      {/* Summary Stats - only filtered by version, not other filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button 
          className={`${filters.feedbackType === 'All' && filters.category === 'All' && filters.area === 'All' && 
                        filters.userType === 'All' && filters.commentType === 'All' 
                        ? 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-500'
                        : 'bg-blue-50 dark:bg-blue-950'} 
                        p-4 rounded text-left transition hover:shadow-md hover:bg-blue-100 dark:hover:bg-blue-900`}
          onClick={() => setFilters({
            ...filters, 
            feedbackType: 'All',
            category: 'All',
            area: 'All',
            userType: 'All',
            commentType: 'All'
          })}
        >
          <h3 className="font-semibold">Total Responses</h3>
          <p className="text-2xl">
            {(() => {
              const filteredTotal = data.filter(r => {
                const passesVersion = filters.version === 'All' || r.Version === filters.version;
                const passesToggle = !hideSSMSComparison || r.Category !== 'ADS/SSMS Comparison';
                return passesVersion && passesToggle;
              }).length;
              return filteredTotal;
            })()}
          </p>
        </button>
        <button 
          className={`${filters.feedbackType === 'Promoter' ? 'bg-green-200 dark:bg-green-900 border-2 border-green-400 dark:border-green-500' : 'bg-green-50 dark:bg-green-950'} 
                      p-4 rounded text-left transition hover:shadow-md hover:bg-green-100 dark:hover:bg-green-900`}
          onClick={() => setFilters({
            ...filters, 
            feedbackType: 'Promoter', 
            category: 'All',
            area: 'All',
            userType: 'All',
            commentType: 'All'
          })}
        >
          <h3 className="font-semibold">Promoters (9-10)</h3>
          <p className="text-2xl">
            {data.filter(r => {
              const passesVersion = filters.version === 'All' || r.Version === filters.version;
              const passesToggle = !hideSSMSComparison || r.Category !== 'ADS/SSMS Comparison';
              return passesVersion && passesToggle && r.NPS >= 9;
            }).length}
          </p>
        </button>
        <button 
          className={`${filters.feedbackType === 'Passive' ? 'bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-500' : 'bg-yellow-50 dark:bg-yellow-950'} 
                      p-4 rounded text-left transition hover:shadow-md hover:bg-yellow-100 dark:hover:bg-yellow-900`}
          onClick={() => setFilters({
            ...filters, 
            feedbackType: 'Passive',
            category: 'All',
            area: 'All',
            userType: 'All',
            commentType: 'All'
          })}
        >
          <h3 className="font-semibold">Passives (7-8)</h3>
          <p className="text-2xl">
            {data.filter(r => {
              const passesVersion = filters.version === 'All' || r.Version === filters.version;
              const passesToggle = !hideSSMSComparison || r.Category !== 'ADS/SSMS Comparison';
              return passesVersion && passesToggle && r.NPS >= 7 && r.NPS <= 8;
            }).length}
          </p>
        </button>
        <button 
          className={`${filters.feedbackType === 'Detractor' ? 'bg-red-200 dark:bg-red-900 border-2 border-red-400 dark:border-red-500' : 'bg-red-50 dark:bg-red-950'} 
                      p-4 rounded text-left transition hover:shadow-md hover:bg-red-100 dark:hover:bg-red-900`}
          onClick={() => setFilters({
            ...filters, 
            feedbackType: 'Detractor',
            category: 'All',
            area: 'All',
            userType: 'All',
            commentType: 'All'
          })}
        >
          <h3 className="font-semibold">Detractors (0-6)</h3>
          <p className="text-2xl">
            {data.filter(r => {
              const passesVersion = filters.version === 'All' || r.Version === filters.version;
              const passesToggle = !hideSSMSComparison || r.Category !== 'ADS/SSMS Comparison';
              return passesVersion && passesToggle && r.NPS <= 6;
            }).length}
          </p>
        </button>
        <div className={`bg-purple-50 dark:bg-purple-950 p-4 rounded`}>
          <h3 className="font-semibold">NPS Score</h3>
          <p className="text-xl">
            {(() => {
              let versionFilteredData = data.filter(r => filters.version === 'All' || r.Version === filters.version);
              if (hideSSMSComparison) {
                versionFilteredData = versionFilteredData.filter(r => r.Category !== 'ADS/SSMS Comparison');
              }
              const promoters = versionFilteredData.filter(r => r.NPS >= 9).length;
              const detractors = versionFilteredData.filter(r => r.NPS <= 6).length;
              const total = versionFilteredData.length;
              const score = total > 0 ? Math.round((promoters / total * 100) - (detractors / total * 100)) : 0;
              
              // Add emoji and description based on NPS score
              let emojiAndText = "";
              if (score >= 50) emojiAndText = "🤩 Excellent"; 
              else if (score >= 30) emojiAndText = "😀 Very Good"; 
              else if (score >= 0) emojiAndText = "🙂 Good"; 
              else if (score >= -30) emojiAndText = "😐 Needs Work"; 
              else emojiAndText = "😞 Critical"; 
              
              return score + " - " + emojiAndText;
            })()}
          </p>
        </div>
      </div>

      {/* Category Breakdown - only filtered by version and hideSSMSComparison toggle */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {(() => {
          // Get data filtered by version and hideSSMSComparison toggle
          let versionFilteredData = data.filter(r => filters.version === 'All' || r.Version === filters.version);
          if (hideSSMSComparison) {
            versionFilteredData = versionFilteredData.filter(r => r.Category !== 'ADS/SSMS Comparison');
          }
          
          // Calculate category counts
          const categoryCounts = versionFilteredData.reduce((acc, row) => {
            acc[row.Category] = (acc[row.Category] || 0) + 1;
            return acc;
          }, {});
          
          // Separate "No comment" from other categories
          const noCommentCount = categoryCounts['No comment'];
          const otherCategories = Object.entries(categoryCounts).filter(([category]) => category !== 'No comment');
          
          // Sort other categories by percentage (descending)
          const sortedCategories = otherCategories.sort((a, b) => {
            const percentA = (a[1] / versionFilteredData.length) * 100;
            const percentB = (b[1] / versionFilteredData.length) * 100;
            return percentB - percentA; // Descending order
          });
          
          // Add "No comment" at the end if it exists
          if (noCommentCount !== undefined) {
            sortedCategories.push(['No comment', noCommentCount]);
          }
          
          // Create category breakdown cards
          return sortedCategories.map(([category, count]) => {
            const percentage = ((count / versionFilteredData.length) * 100).toFixed(1);
            const isNoComment = category === 'No comment';
            return (
              <button
                key={category}
                className={`${filters.category === category ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-500' : isNoComment ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} 
                            p-3 rounded text-left transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md`}
                onClick={() => setFilters({
                  ...filters, 
                  category: category,
                  area: 'All',
                  userType: 'All',
                  commentType: 'All',
                  feedbackType: 'All'
                })}
              >
                <h4 className="font-medium text-sm">{ category}</h4>
                <p className="text-lg">{count} responses <span className="text-sm text-gray-500 dark:text-gray-400">({percentage}%)</span></p>
              </button>
            );
          });
        })()}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Comments</label>
        <input
          type="text"
          placeholder="Search in comments... (e.g., edit, feature, slow)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="w-full border rounded p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback Type</label>
          <select
            className="border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={filters.feedbackType}
            onChange={(e) => setFilters({...filters, feedbackType: e.target.value})}
          >
            <option value="All">All</option>
            <option value="Promoter">Promoters (9-10)</option>
            <option value="Passive">Passives (7-8)</option>
            <option value="Detractor">Detractors (0-6)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            className="border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="All">All</option>
            {getUniqueValues('Category').filter(val => val !== 'All').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area</label>
          <select
            className="border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={filters.area}
            onChange={(e) => setFilters({...filters, area: e.target.value})}
          >
            {getUniqueValues('Area').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
          <select
            className="border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={filters.userType}
            onChange={(e) => setFilters({...filters, userType: e.target.value})}
          >
            {getUniqueValues('UserType').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment Type</label>
          <select
            className="border rounded p-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={filters.commentType}
            onChange={(e) => setFilters({...filters, commentType: e.target.value})}
          >
            {getUniqueValues('CommentType').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min(filteredData.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center">
            <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Rows per page:</label>
            <select
              className="border rounded p-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Download Filtered CSV
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('NPS')}
                >
                  NPS
                  {sortConfig.key === 'NPS' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('Version')}
                >
                  Version
                  {sortConfig.key === 'Version' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('Category')}
                >
                  Category
                  {sortConfig.key === 'Category' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('Area')}
                >
                  Area
                  {sortConfig.key === 'Area' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('UserType')}
                >
                  User Type
                  {sortConfig.key === 'UserType' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('CommentType')}
                >
                  Comment Type
                  {sortConfig.key === 'CommentType' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => requestSort('Comments')}
                >
                  Comments
                  {sortConfig.key === 'Comments' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((row) => (
                <tr key={row.ID} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.NPS >= 9 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      row.NPS >= 7 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {row.NPS}
                    </span>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">{row.Version}</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">{row.Category}</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">{row.Area}</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">{row.UserType}</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">
                    {row.CommentType && (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.CommentType === 'Non-actionable' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {row.CommentType}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm max-w-md">
                    <div className="truncate" title={row.Comments}>
                      {row.Comments || 'No comment'}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-end mt-4">
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-700 disabled:dark:text-gray-600 enabled:bg-gray-300 enabled:hover:bg-gray-400 enabled:text-gray-700 enabled:dark:bg-gray-700 enabled:dark:hover:bg-gray-600 enabled:dark:text-white"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-700 disabled:dark:text-gray-600 enabled:bg-gray-300 enabled:hover:bg-gray-400 enabled:text-gray-700 enabled:dark:bg-gray-700 enabled:dark:hover:bg-gray-600 enabled:dark:text-white"
            >
              Previous
            </button>
            
            <div className="flex items-center px-2 text-gray-700 dark:text-gray-300">
              Page {currentPage} of {Math.ceil(filteredData.length / rowsPerPage) || 1}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / rowsPerPage) || 1, prev + 1))}
              disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)}
              className="px-3 py-1 rounded disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-700 disabled:dark:text-gray-600 enabled:bg-gray-300 enabled:hover:bg-gray-400 enabled:text-gray-700 enabled:dark:bg-gray-700 enabled:dark:hover:bg-gray-600 enabled:dark:text-white"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(Math.ceil(filteredData.length / rowsPerPage) || 1)}
              disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)}
              className="px-3 py-1 rounded disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-700 disabled:dark:text-gray-600 enabled:bg-gray-300 enabled:hover:bg-gray-400 enabled:text-gray-700 enabled:dark:bg-gray-700 enabled:dark:hover:bg-gray-600 enabled:dark:text-white"
            >
              Last
            </button>
          </div>
        </div>
      )}
      </div>
      
      {/* Dark Mode Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-8 right-8 p-3 rounded-full transition text-2xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-lg hover:shadow-xl z-50"
        title={darkMode ? 'Light Mode' : 'Dark Mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

export default NPSAnalysis;