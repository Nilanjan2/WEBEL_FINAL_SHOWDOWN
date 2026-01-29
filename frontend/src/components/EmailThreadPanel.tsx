import { X, Paperclip, User, Mail, Calendar } from 'lucide-react';
import { Email } from '../types';
import { getCategoryInfo } from '../data/categories';

interface EmailThreadPanelProps {
  email: Email;
  allEmails: Email[];
  onClose: () => void;
}

export function EmailThreadPanel({ email, allEmails, onClose }: EmailThreadPanelProps) {
  // Log email data for debugging
  console.log('EmailThreadPanel - Full email object:', email);
  console.log('EmailThreadPanel - Content value:', email.content);
  console.log('EmailThreadPanel - Content type:', typeof email.content);
  console.log('EmailThreadPanel - Content is empty?:', !email.content || email.content.trim() === '');

  // Find all emails in the thread
  const getEmailThread = (email: Email): Email[] => {
    const thread: Email[] = [];
    
    // If this is a follow-up, find the parent email
    if (email.parentEmailId) {
      const parent = allEmails.find(e => e.id === email.parentEmailId);
      if (parent) {
        thread.push(parent);
        // Find all follow-ups to the parent
        const followUps = allEmails.filter(e => e.parentEmailId === parent.id);
        thread.push(...followUps);
      } else {
        // Parent not found, just show this email
        thread.push(email);
      }
    } else {
      // This is a parent email, add it and all its follow-ups
      thread.push(email);
      const followUps = allEmails.filter(e => e.parentEmailId === email.id);
      thread.push(...followUps);
    }
    
    // Sort by date
    return thread.sort((a, b) => 
      new Date(a.emailDate).getTime() - new Date(b.emailDate).getTime()
    );
  };

  const thread = getEmailThread(email);
  const categoryInfo = getCategoryInfo(email.category);
  
  console.log('Thread length:', thread.length);
  console.log('Thread emails:', thread.map(e => ({ sender: e.sender, contentLength: e.content?.length })));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
      <div className="bg-white w-full max-w-3xl h-full shadow-2xl overflow-hidden flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
              {thread.length > 1 && (
                <span className="text-sm text-gray-600">
                  {thread.length} email{thread.length !== 1 ? 's' : ''} in thread
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{email.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Email Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {thread.map((threadEmail, index) => (
            <EmailCard 
              key={threadEmail.id} 
              email={threadEmail} 
              isParent={index === 0}
              isCurrentEmail={threadEmail.id === email.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface EmailCardProps {
  email: Email;
  isParent: boolean;
  isCurrentEmail: boolean;
}

function EmailCard({ email, isParent, isCurrentEmail }: EmailCardProps) {
  // Debug logging for this specific card
  console.log('EmailCard rendering:', {
    sender: email.sender,
    isParent,
    isCurrentEmail,
    contentLength: email.content?.length || 0,
    hasContent: !!email.content
  });
  
  return (
    <div 
      className={`border rounded-lg p-5 ${
        isCurrentEmail 
          ? 'border-blue-300 bg-blue-50' 
          : isParent 
            ? 'border-gray-300 bg-white shadow-sm' 
            : 'border-gray-200 bg-gray-50 ml-8'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{email.sender}</span>
              {isParent && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Parent Email
                </span>
              )}
              {!isParent && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  Follow-up
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{email.senderEmail}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(email.emailDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institute */}
      <div className="mb-3 text-sm">
        <span className="font-medium text-gray-700">Institute: </span>
        <span className="text-gray-900">{email.instituteName}</span>
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '12px'
        }}>
          📧 Email Content:
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '6px',
          padding: '16px',
          minHeight: '150px',
          maxHeight: '600px',
          overflowY: 'auto',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#1f2937',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          display: 'block',
          visibility: 'visible',
          opacity: '1'
        }}>
          {email.content ? email.content : '(No content available - email.content is empty)'}
        </div>
      </div>

      {/* Attachments */}
      {email.hasAttachment && (
        <div className="space-y-2">
          <div className="font-medium text-gray-700 text-sm mb-2">Attachments:</div>
          {email.attachments && email.attachments.length > 0 ? (
            email.attachments.map((filename, index) => {
              // Extract original filename (remove hash prefix)
              const displayName = filename.includes('_') ? filename.split('_').slice(1).join('_') : filename;
              
              return (
                <a
                  key={index}
                  href={`http://localhost:8000/download/attachment/${encodeURIComponent(filename)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 w-fit transition-colors cursor-pointer group"
                >
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 group-hover:text-blue-800">{displayName}</span>
                </a>
              );
            })
          ) : (
            <a
              href={`http://localhost:8000/download/email/${email.emlFile}`}
              download={email.emlFile}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 w-fit transition-colors cursor-pointer group"
            >
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 group-hover:text-blue-800">Download email with attachments</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
