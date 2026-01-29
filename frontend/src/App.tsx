import { useState, useMemo, useEffect } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmailTable } from './components/EmailTable';
import { EmailThreadPanel } from './components/EmailThreadPanel';
import { Chatbot } from './components/Chatbot';
import { Email } from './types';
import { fetchAllEmails, fetchColleges } from './services/api';
import { transformBackendEmails, initializeCollegeDatabase } from './utils/dataTransformer';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from backend on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Load college database first
        const colleges = await fetchColleges();
        initializeCollegeDatabase(colleges);
        console.log(`✓ Loaded ${colleges.length} colleges into database`);
        
        // Then load emails
        const backendEmails = await fetchAllEmails();
        const transformedEmails = transformBackendEmails(backendEmails);
        setEmails(transformedEmails);
        console.log(`✓ Loaded ${transformedEmails.length} emails`);
        
        // Debug: Check a few emails for content
        const sampleEmails = transformedEmails.slice(0, 5);
        console.log('Sample emails:', sampleEmails.map(e => ({
          subject: e.subject,
          contentLength: e.content?.length || 0,
          hasAttachment: e.hasAttachment,
          attachments: e.attachments
        })));
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Make sure the backend is running on http://localhost:8000');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update email function
  const handleUpdateEmail = (emailId: string, updates: Partial<Email>) => {
    setEmails(prevEmails =>
      prevEmails.map(email =>
        email.id === emailId ? { ...email, ...updates } : email
      )
    );
  };

  // Filter emails based on search query and date range
  const filteredEmails = useMemo(() => {
    let filtered = [...emails];

    // Filter by date range (only if not 'all')
    if (dateRange !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      filtered = filtered.filter(email => new Date(email.emailDate) >= daysAgo);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.sender.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.content.toLowerCase().includes(query) ||
        email.instituteName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [emails, searchQuery, dateRange]);

  // Get emails for the current category view
  const categoryEmails = useMemo(() => {
    if (activeView === 'dashboard' || activeView === 'all') {
      return filteredEmails;
    }
    return filteredEmails.filter(email => email.category === activeView);
  }, [filteredEmails, activeView]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emails from backend...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <TopNavigation
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* Content Area */}
        {activeView === 'dashboard' ? (
          <Dashboard emails={filteredEmails} />
        ) : (
          <EmailTable
            emails={categoryEmails}
            categoryId={activeView}
            onEmailClick={setSelectedEmail}
            onUpdateEmail={handleUpdateEmail}
          />
        )}
      </div>

      {/* Email Thread Panel */}
      {selectedEmail && (
        <EmailThreadPanel
          email={selectedEmail}
          allEmails={emails}
          onClose={() => setSelectedEmail(null)}
        />
      )}

      {/* Chatbot */}
      <Chatbot emails={filteredEmails} />
    </div>
  );
}