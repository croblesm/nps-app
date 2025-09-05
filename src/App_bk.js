import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

  const categorizeComment = (comment) => {
    if (!comment || comment.trim() === '') return 'No Comment';
    
    const lowerComment = comment.toLowerCase();
    
    // SSMS/ADS references (check first - most specific)
    if (lowerComment.includes('ssms') || lowerComment.includes('sql server management') || 
        lowerComment.includes('azure data studio') || lowerComment.includes('ads') ||
        lowerComment.includes('management studio') || lowerComment.includes('notebook') ||
        lowerComment.includes('f5') || lowerComment.includes('toad') ||
        lowerComment.includes('profiler') || lowerComment.includes('activity monitor') ||
        lowerComment.includes('sql server profiler')) {
      return 'SSMS/ADS Comparison';
    }
    
    // Missing features (check early - specific pattern)
    if (lowerComment.includes('missing') || lowerComment.includes('missing features') ||
        lowerComment.includes('need') || lowerComment.includes('would like') || 
        lowerComment.includes('wish') || lowerComment.includes('add') || 
        lowerComment.includes('feature') || lowerComment.includes('bring back') || 
        lowerComment.includes('give me back') || lowerComment.includes('shortcut') ||
        lowerComment.includes('short cut')) {
      return 'Missing Feature';
    }
    
    // Connectivity issues
    if (lowerComment.includes('reauthenticate') || lowerComment.includes('re-authenticate') ||
        lowerComment.includes('keychain') || lowerComment.includes('credential') ||
        lowerComment.includes('connection') || lowerComment.includes('connect') ||
        lowerComment.includes('authenticate') || lowerComment.includes('login') ||
        lowerComment.includes('kinit') || lowerComment.includes('kerberos')) {
      return 'Connectivity';
    }
    
    // Performance/Quality issues (including intellisense/autocomplete issues)
    if (lowerComment.includes('slow') || lowerComment.includes('performance') || 
        lowerComment.includes('hangs') || lowerComment.includes('crashes') ||
        lowerComment.includes('freezes') || lowerComment.includes('unstable') ||
        lowerComment.includes('brittle') || lowerComment.includes('reliability') ||
        lowerComment.includes('forever') || lowerComment.includes('takes a while') ||
        lowerComment.includes('timeout') || lowerComment.includes('stuck') ||
        lowerComment.includes('autocomplete') || lowerComment.includes('intellisense') ||
        lowerComment.includes('intelisnese') || lowerComment.includes('struggles') ||
        lowerComment.includes('loading') || lowerComment.includes('load time') ||
        lowerComment.includes('lag') || lowerComment.includes('speed') ||
        lowerComment.includes('fast') || lowerComment.includes('responsive')) {
      return 'Quality/Performance';
    }
    
    // UI/UX issues - expanded to catch more UI/UX related feedback
    if (lowerComment.includes('ui') || lowerComment.includes('interface') ||
        lowerComment.includes('clunky') || lowerComment.includes('user experience') ||
        lowerComment.includes('workflow') || lowerComment.includes('usability') ||
        lowerComment.includes('clumsy') || lowerComment.includes('intuitive') ||
        lowerComment.includes('cumbersome') || lowerComment.includes('scrolling') ||
        lowerComment.includes('space') || lowerComment.includes('layout') ||
        lowerComment.includes('design') || lowerComment.includes('visual') ||
        lowerComment.includes('look') || lowerComment.includes('display') ||
        lowerComment.includes('screen') || lowerComment.includes('result') ||
        lowerComment.includes('table') || lowerComment.includes('size') ||
        lowerComment.includes('view') || lowerComment.includes('navigate') ||
        lowerComment.includes('navigation') || lowerComment.includes('miss') ||
        lowerComment.includes('annoying')) {
      return 'UI/UX';
    }
    
    return 'General Feedback';
  };

  const determineArea = (comment) => {
    if (!comment || comment.trim() === '') return 'Other';
    
    const lowerComment = comment.toLowerCase();
    
    if (lowerComment.includes('connection') || lowerComment.includes('connect') ||
        lowerComment.includes('authenticate') || lowerComment.includes('login') ||
        lowerComment.includes('credential')) {
      return 'Connectivity';
    }
    
    if (lowerComment.includes('result') || lowerComment.includes('query result') ||
        lowerComment.includes('grid') || lowerComment.includes('export') ||
        lowerComment.includes('copy') || lowerComment.includes('display')) {
      return 'Query Results';
    }
    
    if (lowerComment.includes('query') || lowerComment.includes('execute') ||
        lowerComment.includes('intellisense') || lowerComment.includes('autocomplete') ||
        lowerComment.includes('syntax') || lowerComment.includes('editor')) {
      return 'Query Editor';
    }
    
    if (lowerComment.includes('copilot') || lowerComment.includes('ai')) {
      return 'GitHub Copilot';
    }
    
    return 'Other';
  };

  const determineUserType = (comment) => {
    if (!comment || comment.trim() === '') return 'Unknown';
    
    const lowerComment = comment.toLowerCase();
    
    // DBA indicators
    if (lowerComment.includes('ssms') || lowerComment.includes('management studio') ||
        lowerComment.includes('dba') || lowerComment.includes('database admin') ||
        lowerComment.includes('jobs') || lowerComment.includes('profiler') ||
        lowerComment.includes('activity monitor') || lowerComment.includes('linked server') ||
        lowerComment.includes('index management') || lowerComment.includes('backup') ||
        lowerComment.includes('azure data studio')) {
      return 'DBA';
    }
    
    // Developer indicators
    if (lowerComment.includes('development') || lowerComment.includes('coding') ||
        lowerComment.includes('copilot') || lowerComment.includes('github') ||
        lowerComment.includes('vs code') || lowerComment.includes('extension') ||
        lowerComment.includes('workflow')) {
      return 'Developer';
    }
    
    // Analyst indicators
    if (lowerComment.includes('analysis') || lowerComment.includes('data') ||
        lowerComment.includes('report') || lowerComment.includes('query')) {
      return 'Data Analyst';
    }
    
    return 'General User';
  };

  const determineCommentType = (comment) => {
    if (!comment || comment.trim() === '') return 'No Comment';
    
    const lowerComment = comment.toLowerCase();
    
    // Non-constructive patterns
    if (lowerComment.includes('just copy') || lowerComment.includes('like ssms') ||
        lowerComment.includes('bring back') || lowerComment.includes('far from') ||
        lowerComment.includes('not as good') || lowerComment === '' ||
        lowerComment.length < 10) {
      return 'Non-constructive';
    }
    
    // Constructive feedback patterns
    if (lowerComment.includes('would be') || lowerComment.includes('suggestion') ||
        lowerComment.includes('improve') || lowerComment.includes('add') ||
        lowerComment.includes('feature') || lowerComment.includes('option') ||
        lowerComment.includes('ability') || lowerComment.includes('support')) {
      return 'Constructive';
    }
    
    return 'General';
  };

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
        const processedData = parsed.data.map((row, index) => ({
          ...row,
          ID: index + 1,
          Category: categorizeComment(row.Comments),
          Area: determineArea(row.Comments),
          UserType: determineUserType(row.Comments),
          CommentType: determineCommentType(row.Comments)
        }));

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

  const filteredData = data.filter(row => {
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
    return <div style={{ padding: '32px', fontSize: '20px' }}>Loading and analyzing feedback data...</div>;
  }

  if (error) {
    return <div style={{ padding: '32px', fontSize: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: '32px', fontSize: '20px' }}>No data found</div>;
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
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold">Total Responses</h3>
          <p className="text-2xl">
            {data.filter(r => filters.version === 'All' || r.Version === filters.version).length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold">Promoters (9-10)</h3>
          <p className="text-2xl">
            {data.filter(r => (filters.version === 'All' || r.Version === filters.version) && r.NPS >= 9).length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-semibold">Passives (7-8)</h3>
          <p className="text-2xl">
            {data.filter(r => (filters.version === 'All' || r.Version === filters.version) && r.NPS >= 7 && r.NPS <= 8).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <h3 className="font-semibold">Detractors (0-6)</h3>
          <p className="text-2xl">
            {data.filter(r => (filters.version === 'All' || r.Version === filters.version) && r.NPS <= 6).length}
          </p>
        </div>
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
              <div key={category} className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium text-sm">{category}</h4>
                <p className="text-lg">{count} responses <span className="text-sm text-gray-500">({percentage}%)</span></p>
              </div>
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
              <th className="border px-4 py-2 text-left">NPS</th>
              <th className="border px-4 py-2 text-left">Version</th>
              <th className="border px-4 py-2 text-left">Category</th>
              <th className="border px-4 py-2 text-left">Area</th>
              <th className="border px-4 py-2 text-left">User Type</th>
              <th className="border px-4 py-2 text-left">Comment Type</th>
              <th className="border px-4 py-2 text-left">Comments</th>
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

export default App;