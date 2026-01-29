import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Email } from '../types';
import { askChatbot } from '../services/api';

interface ChatbotProps {
  emails: Email[];
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function Chatbot({ emails }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I can help you query the grievance email database. Ask me questions like:\n\n• "How many suspension emails in the last 7 days?"\n• "Show follow-up emails from XYZ College"\n• "How many emails had attachments?"',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuery = async (query: string): Promise<string> => {
    try {
      // Try to use backend chatbot API first
      const answer = await askChatbot(query);
      return answer;
    } catch (error) {
      console.error('Chatbot API error, using fallback:', error);
      // Fallback to local processing if API fails
      return processFallbackQuery(query);
    }
  };

  const processFallbackQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Count suspension emails
    if (lowerQuery.includes('suspension') && (lowerQuery.includes('how many') || lowerQuery.includes('count'))) {
      const days = lowerQuery.match(/(\d+)\s*days?/)?.[1];
      let filteredEmails = emails.filter(e => e.category === 'suspension');
      
      if (days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        filteredEmails = filteredEmails.filter(e => new Date(e.emailDate) >= daysAgo);
      }
      
      return `${filteredEmails.length} suspension email${filteredEmails.length !== 1 ? 's' : ''}${days ? ` in the last ${days} days` : ''}.`;
    }

    // Count FIR emails
    if (lowerQuery.includes('fir') && (lowerQuery.includes('how many') || lowerQuery.includes('count'))) {
      const days = lowerQuery.match(/(\d+)\s*days?/)?.[1];
      let filteredEmails = emails.filter(e => e.category === 'fir');
      
      if (days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        filteredEmails = filteredEmails.filter(e => new Date(e.emailDate) >= daysAgo);
      }
      
      return `${filteredEmails.length} FIR/arrest email${filteredEmails.length !== 1 ? 's' : ''}${days ? ` in the last ${days} days` : ''}.`;
    }

    // Count attachments
    if (lowerQuery.includes('attachment') && (lowerQuery.includes('how many') || lowerQuery.includes('count'))) {
      const withAttachments = emails.filter(e => e.hasAttachment);
      return `${withAttachments.length} email${withAttachments.length !== 1 ? 's' : ''} with attachments.`;
    }

    // Follow-up emails
    if (lowerQuery.includes('follow') && lowerQuery.includes('up')) {
      const followUps = emails.filter(e => e.mailType === 'follow-up');
      
      // Check if asking about a specific college
      const collegeMatch = lowerQuery.match(/from\s+([a-z\s]+)/i);
      if (collegeMatch) {
        const collegeName = collegeMatch[1].trim();
        const collegeFollowUps = followUps.filter(e => 
          e.instituteName.toLowerCase().includes(collegeName)
        );
        
        if (collegeFollowUps.length === 0) {
          return `No follow-up emails found from colleges matching "${collegeName}".`;
        }
        
        const list = collegeFollowUps.slice(0, 5).map(e => 
          `• ${e.subject} (${new Date(e.emailDate).toLocaleDateString()})`
        ).join('\n');
        
        return `Found ${collegeFollowUps.length} follow-up email${collegeFollowUps.length !== 1 ? 's' : ''} from colleges matching "${collegeName}":\n\n${list}${collegeFollowUps.length > 5 ? '\n\n...and more' : ''}`;
      }
      
      return `${followUps.length} follow-up email${followUps.length !== 1 ? 's' : ''} in the database.`;
    }

    // Fresh emails
    if (lowerQuery.includes('fresh') && (lowerQuery.includes('how many') || lowerQuery.includes('count'))) {
      const fresh = emails.filter(e => e.mailType === 'fresh');
      return `${fresh.length} fresh email${fresh.length !== 1 ? 's' : ''}.`;
    }

    // Total emails
    if ((lowerQuery.includes('total') || lowerQuery.includes('how many')) && lowerQuery.includes('email')) {
      return `${emails.length} total email${emails.length !== 1 ? 's' : ''} in the database.`;
    }

    // Semester/exam emails
    if ((lowerQuery.includes('semester') || lowerQuery.includes('exam')) && (lowerQuery.includes('how many') || lowerQuery.includes('count'))) {
      const semesterEmails = emails.filter(e => e.category === 'semester');
      return `${semesterEmails.length} semester/examination email${semesterEmails.length !== 1 ? 's' : ''}.`;
    }

    // Default response
    return "I'm not sure how to answer that. Try asking:\n\n• \"How many suspension emails in the last 7 days?\"\n• \"Show follow-up emails from [College Name]\"\n• \"How many emails had attachments?\"\n• \"Count fresh emails\"";
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const answer = await processQuery(query);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: answer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-40 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-40 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}