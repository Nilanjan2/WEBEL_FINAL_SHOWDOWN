import { useState } from 'react';
import { 
  Paperclip, 
  ArrowUpDown, 
  Filter,
  X,
  ChevronRight
} from 'lucide-react';
import { Email, EmailCategory } from '../types';
import { getCategoryInfo } from '../data/categories';
import { ReplyModal, ReplyStatus } from './ReplyModal';

interface EmailTableProps {
  emails: Email[];
  categoryId: string;
  onEmailClick: (email: Email) => void;
  onUpdateEmail: (emailId: string, updates: Partial<Email>) => void;
}

type SortField = 'emailDate' | 'followUpCount' | 'sender';
type SortDirection = 'asc' | 'desc';

interface Filters {
  hasAttachment: boolean | null;
  mailType: 'fresh' | 'follow-up' | null;
  showOnlySuspension: boolean;
  showOnlyFIR: boolean;
}

export function EmailTable({ emails, categoryId, onEmailClick, onUpdateEmail }: EmailTableProps) {
  const [sortField, setSortField] = useState<SortField>('emailDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    hasAttachment: null,
    mailType: null,
    showOnlySuspension: false,
    showOnlyFIR: false
  });

  // Filter emails
  let filteredEmails = [...emails];

  if (filters.hasAttachment !== null) {
    filteredEmails = filteredEmails.filter(e => e.hasAttachment === filters.hasAttachment);
  }

  if (filters.mailType !== null) {
    filteredEmails = filteredEmails.filter(e => e.mailType === filters.mailType);
  }

  if (filters.showOnlySuspension) {
    filteredEmails = filteredEmails.filter(e => e.category === 'suspension');
  }

  if (filters.showOnlyFIR) {
    filteredEmails = filteredEmails.filter(e => e.category === 'fir');
  }

  // Sort emails
  const sortedEmails = filteredEmails.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'emailDate':
        aValue = new Date(a.emailDate).getTime();
        bValue = new Date(b.emailDate).getTime();
        break;
      case 'followUpCount':
        aValue = a.followUpCount;
        bValue = b.followUpCount;
        break;
      case 'sender':
        aValue = a.sender.toLowerCase();
        bValue = b.sender.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleFilter = (filterKey: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? null : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      hasAttachment: null,
      mailType: null,
      showOnlySuspension: false,
      showOnlyFIR: false
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== null && v !== false).length;

  const categoryInfo = getCategoryInfo(categoryId);

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{categoryInfo.label}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {sortedEmails.length} email{sortedEmails.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Attachment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="space-y-2">
                <FilterChip
                  label="With attachments"
                  active={filters.hasAttachment === true}
                  onClick={() => toggleFilter('hasAttachment', true)}
                />
                <FilterChip
                  label="No attachments"
                  active={filters.hasAttachment === false}
                  onClick={() => toggleFilter('hasAttachment', false)}
                />
              </div>
            </div>

            {/* Mail Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mail Type
              </label>
              <div className="space-y-2">
                <FilterChip
                  label="Fresh"
                  active={filters.mailType === 'fresh'}
                  onClick={() => toggleFilter('mailType', 'fresh')}
                />
                <FilterChip
                  label="Follow-up"
                  active={filters.mailType === 'follow-up'}
                  onClick={() => toggleFilter('mailType', 'follow-up')}
                />
              </div>
            </div>

            {/* Category Specific Filters */}
            {categoryId === 'all' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disciplinary
                  </label>
                  <FilterChip
                    label="Suspension cases"
                    active={filters.showOnlySuspension}
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      showOnlySuspension: !prev.showOnlySuspension 
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Legal
                  </label>
                  <FilterChip
                    label="FIR cases"
                    active={filters.showOnlyFIR}
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      showOnlyFIR: !prev.showOnlyFIR 
                    }))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('sender')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Sender
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Institute
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Content Preview
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Attachment
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mail Type
                </th>
                <th className="px-6 py-3 text-center">
                  <button
                    onClick={() => handleSort('followUpCount')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Follow-ups
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('emailDate')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pending Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Reply
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedEmails.map((email) => (
                <EmailRow 
                  key={email.id} 
                  email={email} 
                  onClick={() => onEmailClick(email)}
                  onUpdateEmail={onUpdateEmail}
                />
              ))}
            </tbody>
          </table>

          {sortedEmails.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No emails found matching the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmailRowProps {
  email: Email;
  onClick: () => void;
  onUpdateEmail: (emailId: string, updates: Partial<Email>) => void;
}

function EmailRow({ email, onClick, onUpdateEmail }: EmailRowProps) {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const categoryInfo = getCategoryInfo(email.category);

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setShowReplyModal(true);
  };

  const handleSendReply = (replyText: string) => {
    onUpdateEmail(email.id, { replied: true, replyText });
  };

  // Calculate days pending for unreplied emails
  const getDaysPending = () => {
    if (email.replied) return null;
    
    const now = new Date();
    const emailDate = new Date(email.emailDate);
    const diffTime = Math.abs(now.getTime() - emailDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysPending = getDaysPending();

  return (
    <>
      <tr 
        onClick={onClick}
        className="hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-gray-900">{email.sender}</div>
            <div className="text-sm text-gray-500">{email.senderEmail}</div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">
          {email.instituteName}
        </td>
        <td className="px-6 py-4">
          <div className="font-medium text-gray-900 max-w-xs truncate">
            {email.subject}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-600 max-w-md line-clamp-2">
            {email.content}
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          {email.hasAttachment && (
            <Paperclip className="w-4 h-4 text-gray-500 mx-auto" />
          )}
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            email.mailType === 'fresh' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {email.mailType === 'fresh' ? 'Fresh' : 'Follow-up'}
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          {email.followUpCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
              {email.followUpCount}
            </span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {new Date(email.emailDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </td>
        <td className="px-6 py-4">
          {daysPending !== null && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                daysPending <= 2 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : daysPending <= 5
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {daysPending === 0 ? 'Today' : daysPending === 1 ? '1 day' : `${daysPending} days`}
              </span>
            </div>
          )}
        </td>
        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <ReplyStatus replied={email.replied} onReply={handleReplyClick} />
        </td>
        <td className="px-6 py-4">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </td>
      </tr>

      {showReplyModal && (
        <ReplyModal
          email={email}
          onClose={() => setShowReplyModal(false)}
          onSendReply={handleSendReply}
        />
      )}
    </>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 border border-blue-300'
          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}