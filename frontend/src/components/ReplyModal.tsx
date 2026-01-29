import { useState } from 'react';
import { Send, Sparkles, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Email } from '../types';
import { generateReply } from '../services/api';

interface ReplyModalProps {
  email: Email;
  onClose: () => void;
  onSendReply: (replyText: string) => void;
}

export function ReplyModal({ email, onClose, onSendReply }: ReplyModalProps) {
  const [replyText, setReplyText] = useState('');
  const [usingSuggested, setUsingSuggested] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generate suggested reply based on email category (fallback/template-based)
  const generateTemplateSuggestedReply = (): string => {
    const greetings = `Dear ${email.sender},\n\nThank you for your email regarding "${email.subject}".\n\n`;
    
    const categoryResponses = {
      suspension: `We have received and reviewed your communication regarding the disciplinary matter. The Education Department acknowledges the seriousness of this case and will conduct a thorough review.\n\nOur team will examine the documentation provided and coordinate with the relevant authorities. You can expect a formal response within 5-7 working days with our recommendations.\n\nIn the interim, please ensure all procedural guidelines are being followed and maintain detailed records of all proceedings.`,
      
      fir: `We acknowledge receipt of your notification regarding the legal matter involving a student from your institution.\n\nThe Education Department takes such matters with utmost seriousness. We will coordinate with the legal affairs division and provide necessary guidance on maintaining the student's academic records during this period.\n\nPlease continue to cooperate fully with law enforcement authorities and keep us updated on any significant developments. Official documentation will be provided within 3 working days.`,
      
      semester: `Your request regarding semester examination arrangements has been received and is being reviewed by our examination coordination team.\n\nWe understand the urgency of this matter and will work to provide a resolution promptly. Our team will assess the feasibility of your request considering the academic calendar and regulatory requirements.\n\nYou will receive our decision along with detailed guidelines within 2-3 working days.`,
      
      miscellaneous: `We have received your communication and appreciate you keeping us informed.\n\nYour message has been noted and will be reviewed by the appropriate team. If any action or response is required, we will get back to you promptly.\n\nThank you for your continued cooperation with the Education Department.`
    };

    const closing = `\n\nBest regards,\nEducation Department\nGovernment Office`;

    return greetings + categoryResponses[email.category] + closing;
  };

  // Generate AI-powered reply using RAG system
  const handleGenerateAIReply = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const aiReply = await generateReply(
        email.content,
        email.subject,
        email.sender
      );
      setReplyText(aiReply);
      setUsingSuggested(true);
    } catch (error) {
      console.error('Failed to generate AI reply:', error);
      setGenerationError('Failed to generate AI reply. Using template instead.');
      // Fallback to template-based reply
      const templateReply = generateTemplateSuggestedReply();
      setReplyText(templateReply);
      setUsingSuggested(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseSuggested = () => {
    const suggested = generateTemplateSuggestedReply();
    setReplyText(suggested);
    setUsingSuggested(true);
  };

  const handleSend = () => {
    if (replyText.trim()) {
      onSendReply(replyText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Reply to Email</h3>
            <p className="text-sm text-blue-100 mt-1">{email.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Email Preview */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-sm">
            <p className="text-gray-600">From: <span className="text-gray-900 font-medium">{email.sender}</span> ({email.senderEmail})</p>
            <p className="text-gray-600 mt-1">Institution: <span className="text-gray-900 font-medium">{email.instituteName}</span></p>
          </div>
        </div>

        {/* Reply Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* AI Reply Generation Buttons */}
          {!replyText && !isGenerating && (
            <div className="space-y-3 mb-4">
              <button
                onClick={handleGenerateAIReply}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Generate AI Suggested Reply (RAG-Based)</span>
              </button>
              
              <button
                onClick={handleUseSuggested}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-300"
              >
                <span className="text-sm">Use Template Reply</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="mb-4 flex items-center justify-center gap-3 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-700 font-medium">Generating AI Reply...</span>
            </div>
          )}

          {/* Error Message */}
          {generationError && (
            <div className="mb-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <span>{generationError}</span>
            </div>
          )}

          {usingSuggested && !generationError && (
            <div className="mb-3 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
              <Sparkles className="w-4 h-4" />
              <span>AI-generated reply - you can edit it before sending</span>
            </div>
          )}

          {/* Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {replyText.length} characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!replyText.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Send Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReplyStatusProps {
  replied: boolean;
  onReply: () => void;
}

export function ReplyStatus({ replied, onReply }: ReplyStatusProps) {
  if (replied) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">Reply Sent</span>
      </div>
    );
  }

  return (
    <button
      onClick={onReply}
      className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
    >
      <Sparkles className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium text-purple-700">Suggested Reply</span>
    </button>
  );
}