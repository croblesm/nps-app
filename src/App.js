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

// Category rules with weights and contextual checks
const CATEGORY_RULES = [
  {
    name: "SSMS/ADS Comparison",
    weight: 4,
    tests: [
      w("ssms"),
      makeRe("\\bsql server management studio\\b"),
      makeRe("\\bazure data studio\\b"),
      // Contextual ADS: exact ADS in caps or 'ads' near azure/data/studio
      (t) => /\bADS\b/.test(t) || (/\bads\b/i.test(t) && withinNWords(t, "ads", "(azure|data|studio)")),
      w("management studio"),
      w("notebook"),
      w("profiler"),
      makeRe("\\bsql server profiler\\b"),
      makeRe("\\bactivity monitor\\b"),
      w("toad"),
      makeRe("\\bdb(?:-)?visualizer\\b"),
      makeRe("\\bdbeaver\\b"),
      // common shortcut often mentioned in comparisons
      w("f5")
    ]
  },
  {
    name: "Missing Feature",
    weight: 3,
    tests: [
      w("missing"), makeRe("\\bmissing (feature|features)\\b"),
      makeRe("\\bwould like\\b"), w("wish"),
      makeRe("\\badd(ing)?\\b"), w("feature"), makeRe("\\bbring back\\b"),
      makeRe("\\bgive me back\\b"), w("shortcut"), makeRe("\\bshort ?cut\\b"),
      // common MSSQL extension features
      w("export"), w("import"), makeRe("\\bresult(s)? grid\\b"),
      makeRe("\\bschema compare\\b"), makeRe("\\bschema designer?\\b"),
      w("table designer"), makeRe("\\bobject explorer\\b")
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
      w("forever"), w("timeout"), w("stuck"), w("lag"), w("speed"), w("responsive"),
      // IntelliSense / autocomplete with common typos
      w("autocomplete"), w("auto-complete"), makeRe("\\bauto complete\\b"),
      w("intellisense"), makeRe("\\bintelisnese\\b"), makeRe("\\bintel+isense\\b"),
      w("loading"), makeRe("\\bload time\\b")
    ]
  },
  {
    name: "UI/UX",
    weight: 2,
    tests: [
      w("ui"), w("interface"), w("clunky"), makeRe("\\buser experience\\b"),
      w("workflow"), w("usability"), w("clumsy"), w("intuitive"), w("cumbersome"),
      w("scrolling"), w("space"), w("layout"), w("design"), w("visual"),
      w("look"), w("display"), w("screen"), w("result"), w("table"),
      w("size"), w("view"), w("navigate"), w("navigation"), w("annoying"),
      makeRe("\\btoo (many|much) clicks?\\b")
    ]
  },
  {
    name: "AI/Copilot",
    weight: 2,
    tests: [ w("copilot"), makeRe("\\bco-pilot\\b"), makeRe("\\bai\\b") ]
  },
  {
    name: "General Feedback",
    weight: 1,
    tests: [] // fallback
  }
];

// Areas
const AREA_RULES = [
  { name: "Connectivity", tests: [w("connection"), w("connect"), w("authenticate"), w("login"), w("credential"), w("kerberos"), w("kinit"), w("token"), w("timeout"), w("keychain")] },
  { name: "Query Results", tests: [w("result"), makeRe("\\bquery result(s)?\\b"), w("grid"), w("export"), w("copy"), w("display")] },
  { name: "Query Editor", tests: [w("query"), w("execute"), w("editor"), w("syntax"), w("intellisense"), makeRe("\\b(auto[- ]?)?complete\\b")] },
  { name: "GitHub Copilot", tests: [w("copilot"), makeRe("\\bco-pilot\\b"), makeRe("\\bai\\b")] },
  { name: "Other", tests: [] }
];

// User types
const USER_TYPE_RULES = [
  { name: "DBA", tests: [w("ssms"), makeRe("\\bmanagement studio\\b"), w("dba"), makeRe("\\bdatabase admin\\b"), w("jobs"), w("profiler"), makeRe("\\bactivity monitor\\b"), makeRe("\\blinked server\\b"), makeRe("\\bindex( management)?\\b"), w("backup"), makeRe("\\bazure data studio\\b")] },
  { name: "Developer", tests: [w("development"), w("coding"), w("copilot"), w("github"), makeRe("\\bvs code\\b"), w("extension"), w("workflow"), w("orm"), w("prisma"), w("tedious")] },
  { name: "Data Analyst", tests: [w("analysis"), w("analytics"), w("report"), makeRe("\\bpower bi\\b"), w("query")] },
  { name: "General User", tests: [] }
];

const CONSTRUCTIVE_RULES = {
  constructive: [
    makeRe("\\bwould be\\b"), w("suggestion"), w("improve"), w("add"), w("feature"),
    w("option"), w("ability"), w("support"), makeRe("\\bplease\\b"), makeRe("\\bshould\\b"),
    makeRe("\\bcould\\b")
  ],
  nonConstructive: [
    makeRe("\\bjust copy\\b"), makeRe("\\blike ssms\\b"), makeRe("\\bbring back\\b"),
    makeRe("\\bfar from\\b"), makeRe("\\bnot as good\\b")
  ]
};

function scoreCategory(text) {
  const t = normalize(text || "");
  const hits = [];
  let best = { name: "General Feedback", score: 0, matches: [] };

  for (const rule of CATEGORY_RULES) {
    let localMatches = [];
    for (const test of rule.tests) {
      const matched = typeof test === "function" ? test(t) : test.test(t);
      if (matched) localMatches.push(test.toString ? test.toString() : "fn");
    }
    const score = (localMatches.length > 0 ? rule.weight : 0) * localMatches.length;
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
  if (!t) return "No Comment";
  if (t.length < 10) return "Non-constructive";
  if (CONSTRUCTIVE_RULES.nonConstructive.some(rx => rx.test(t))) return "Non-constructive";
  if (CONSTRUCTIVE_RULES.constructive.some(rx => rx.test(t))) return "Constructive";
  return "General";
}
// --- End of rule engine additions ---

const NPSAnalysis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({
    category: 'All',
    area: 'All',
    userType: 'All',
    commentType: 'All',
    feedbackType: 'All',
    version: 'All'
  });

  // Debug: verify component renders
  console.log('NPSAnalysis render - loading:', loading, 'data length:', data.length, 'error:', error);

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
    
    return matchesFeedbackType &&
           (filters.version === 'All' || row.Version === filters.version) &&
           (filters.category === 'All' || row.Category === filters.category) &&
           (filters.area === 'All' || row.Area === filters.area) &&
           (filters.userType === 'All' || row.UserType === filters.userType) &&
           (filters.commentType === 'All' || row.CommentType === filters.commentType);
  });

  const getUniqueValues = (field) => {
    return ['All', ...new Set(data.map(row => row[field]))].sort();
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
    return <div className="p-8 text-xl">Loading and analyzing feedback data...</div>;
  }

  if (error) {
    return <div className="p-8 text-xl text-red-600">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-xl">No data found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">MSSQL Extension - NPS Analysis</h1>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
          <select
            className="border rounded p-2 w-full"
            value={filters.version}
            onChange={(e) => {
              setFilters({...filters, version: e.target.value});
              setCurrentPage(1); // Reset to first page when changing version
            }}
          >
            {['All', ...new Set(data.map(row => row.Version))].sort().map(ver => (
              <option key={ver} value={ver}>{ver}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Summary Stats - only filtered by version, not other filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button 
          className={`${filters.feedbackType === 'All' && filters.category === 'All' && filters.area === 'All' && 
                        filters.userType === 'All' && filters.commentType === 'All' 
                        ? 'bg-blue-200 border-2 border-blue-400' : 'bg-blue-50'} 
                        p-4 rounded text-left transition hover:bg-blue-100 hover:shadow-md`}
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
            {data.filter(r => filters.version === 'All' || r.Version === filters.version).length}
          </p>
        </button>
        <button 
          className={`${filters.feedbackType === 'Promoter' ? 'bg-green-200 border-2 border-green-400' : 'bg-green-50'} 
                      p-4 rounded text-left transition hover:bg-green-100 hover:shadow-md`}
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
            {data.filter(r => (filters.version === 'All' || r.Version === filters.version) && r.NPS >= 9).length}
          </p>
        </button>
        <button 
          className={`${filters.feedbackType === 'Passive' ? 'bg-yellow-200 border-2 border-yellow-400' : 'bg-yellow-50'} 
                      p-4 rounded text-left transition hover:bg-yellow-100 hover:shadow-md`}
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
            {data.filter(r => (filters.version === 'All' || r.Version === filters.version) && r.NPS >= 7 && r.NPS <= 8).length}
          </p>
        </button>
        <button 
          className={`${filters.feedbackType === 'Detractor' ? 'bg-red-200 border-2 border-red-400' : 'bg-red-50'} 
                      p-4 rounded text-left transition hover:bg-red-100 hover:shadow-md`}
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
            {data.filter(r => (filters.version === 'All' || r.Version === filters.version) && r.NPS <= 6).length}
          </p>
        </button>
        <div className="bg-purple-50 p-4 rounded">
          <h3 className="font-semibold">NPS Score</h3>
          <p className="text-xl">
            {(() => {
              const versionFilteredData = data.filter(r => filters.version === 'All' || r.Version === filters.version);
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

      {/* Category Breakdown - only filtered by version */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {(() => {
          // Get data filtered only by version
          const versionFilteredData = data.filter(r => filters.version === 'All' || r.Version === filters.version);
          
          // Calculate category counts
          const categoryCounts = versionFilteredData.reduce((acc, row) => {
            acc[row.Category] = (acc[row.Category] || 0) + 1;
            return acc;
          }, {});
          
          // Create category breakdown cards
          return Object.entries(categoryCounts).map(([category, count]) => {
            const percentage = ((count / versionFilteredData.length) * 100).toFixed(1);
            return (
              <button
                key={category}
                className={`${filters.category === category ? 'bg-blue-100 border-2 border-blue-400' : 'bg-gray-50'} 
                            p-3 rounded text-left transition hover:bg-gray-100 hover:shadow-md`}
                onClick={() => setFilters({
                  ...filters, 
                  category: category,
                  area: 'All',
                  userType: 'All',
                  commentType: 'All',
                  feedbackType: 'All'
                })}
              >
                <h4 className="font-medium text-sm">{category}</h4>
                <p className="text-lg">{count} responses <span className="text-sm text-gray-500">({percentage}%)</span></p>
              </button>
            );
          });
        })()}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Type</label>
          <select
            className="border rounded p-2 w-full"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="border rounded p-2 w-full"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            {getUniqueValues('Category').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
          <select
            className="border rounded p-2 w-full"
            value={filters.area}
            onChange={(e) => setFilters({...filters, area: e.target.value})}
          >
            {getUniqueValues('Area').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
          <select
            className="border rounded p-2 w-full"
            value={filters.userType}
            onChange={(e) => setFilters({...filters, userType: e.target.value})}
          >
            {getUniqueValues('UserType').map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment Type</label>
          <select
            className="border rounded p-2 w-full"
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
          <p className="text-sm text-gray-600">
            Showing {Math.min(filteredData.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center">
            <label className="text-sm text-gray-600 mr-2">Rows per page:</label>
            <select
              className="border rounded p-1 text-sm"
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download Filtered CSV
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-4 py-2 text-left">
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
              <th className="border px-4 py-2 text-left">
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
              <th className="border px-4 py-2 text-left">
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
              <th className="border px-4 py-2 text-left">
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
              <th className="border px-4 py-2 text-left">
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
              <th className="border px-4 py-2 text-left">
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
              <th className="border px-4 py-2 text-left">
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
                <tr key={row.ID} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.NPS >= 9 ? 'bg-green-100 text-green-800' :
                      row.NPS >= 7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {row.NPS}
                    </span>
                  </td>
                  <td className="border px-4 py-2 text-sm">{row.Version}</td>
                  <td className="border px-4 py-2 text-sm">{row.Category}</td>
                  <td className="border px-4 py-2 text-sm">{row.Area}</td>
                  <td className="border px-4 py-2 text-sm">{row.UserType}</td>
                  <td className="border px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.CommentType === 'Constructive' ? 'bg-green-100 text-green-800' :
                      row.CommentType === 'Non-constructive' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.CommentType}
                    </span>
                  </td>
                  <td className="border px-4 py-2 text-sm max-w-md">
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
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
            >
              Previous
            </button>
            
            <div className="flex items-center px-2">
              Page {currentPage} of {Math.ceil(filteredData.length / rowsPerPage) || 1}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / rowsPerPage) || 1, prev + 1))}
              disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)}
              className={`px-3 py-1 rounded ${currentPage >= Math.ceil(filteredData.length / rowsPerPage) ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(Math.ceil(filteredData.length / rowsPerPage) || 1)}
              disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)}
              className={`px-3 py-1 rounded ${currentPage >= Math.ceil(filteredData.length / rowsPerPage) ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NPSAnalysis;