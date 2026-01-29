import { Email, EmailCategory } from '../types';

const generateMockEmails = (): Email[] => {
  const categories: EmailCategory[] = ['suspension', 'fir', 'semester', 'miscellaneous'];
  const institutions = [
    'St. Xavier\'s College',
    'Government Engineering College',
    'National Institute of Technology',
    'State University',
    'City Polytechnic College',
    'Regional Arts & Science College',
    'Medical College',
    'Law College',
    'Commerce Institute',
    'Teachers Training College'
  ];

  const senderNames = [
    'Dr. Rajesh Kumar', 'Prof. Anita Sharma', 'Mr. Suresh Patel',
    'Dr. Priya Nair', 'Prof. Vikram Singh', 'Ms. Meera Iyer',
    'Dr. Arun Desai', 'Prof. Kavita Rao', 'Mr. Deepak Joshi',
    'Dr. Shalini Gupta'
  ];

  const subjectTemplates = {
    suspension: [
      'Urgent: Student Suspension Case - Disciplinary Action Required',
      'Request for Review - Student Disciplinary Matter',
      'Suspension Appeal - Student Conduct Issue',
      'Disciplinary Committee Report - Suspension Case'
    ],
    fir: [
      'FIR Filed Against Student - Immediate Attention Required',
      'Police Investigation - Student Arrest Matter',
      'Legal Notice - Criminal Case Involving Student',
      'Court Summons - Student Legal Matter'
    ],
    semester: [
      'Semester Examination Postponement Request',
      'Exam Schedule Conflict - Urgent Resolution Needed',
      'Re-evaluation Request - Semester Results',
      'Supplementary Exam Arrangement Required'
    ],
    miscellaneous: [
      'Infrastructure Development Update',
      'Annual Report Submission',
      'General Administrative Query',
      'Meeting Schedule Coordination'
    ]
  };

  const contentTemplates = {
    suspension: [
      'We are writing to inform you about a serious disciplinary incident involving a student. The matter requires immediate attention from the department. The student has been temporarily suspended pending investigation.',
      'This is a follow-up to our previous communication regarding the suspension case. We request your guidance on the next steps to be taken in this matter.',
      'We need urgent approval for the disciplinary action taken against the student. The case has been reviewed by our internal committee and we await your decision.'
    ],
    fir: [
      'We regret to inform you that an FIR has been filed against one of our students. The matter involves serious allegations and requires immediate legal intervention.',
      'Further to our previous email, the police investigation is ongoing. We need guidance on how to proceed with the student\'s academic status during this period.',
      'The court hearing is scheduled for next week. We require official documentation from the department to present in court.'
    ],
    semester: [
      'We are facing significant challenges with the current semester examination schedule. Due to unforeseen circumstances, we request postponement of exams.',
      'Several students have requested re-evaluation of their semester results. We need clarification on the official process and timeline.',
      'The supplementary examinations need to be scheduled urgently. We await your approval and guidelines for the same.'
    ],
    miscellaneous: [
      'We are updating you on the ongoing infrastructure development at our institution. The project is progressing as planned.',
      'Please find attached our annual report. We welcome your feedback and suggestions for improvement.',
      'We have a few administrative queries that need clarification. Your guidance would be much appreciated.'
    ]
  };

  const emails: Email[] = [];
  const now = new Date();

  // Generate 150 emails over the last 30 days
  for (let i = 0; i < 150; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const institution = institutions[Math.floor(Math.random() * institutions.length)];
    const senderName = senderNames[Math.floor(Math.random() * senderNames.length)];
    const isFollowUp = Math.random() > 0.7;
    const followUpCount = isFollowUp ? Math.floor(Math.random() * 5) + 1 : 0;
    
    const daysAgo = Math.floor(Math.random() * 30);
    const emailDate = new Date(now);
    emailDate.setDate(emailDate.getDate() - daysAgo);

    const subjects = subjectTemplates[category];
    const contents = contentTemplates[category];

    const email: Email = {
      id: `email-${i + 1}`,
      sender: senderName,
      senderEmail: `${senderName.toLowerCase().replace(/\s+/g, '.')}@${institution.toLowerCase().replace(/\s+/g, '')}.edu`,
      instituteName: institution,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      hasAttachment: Math.random() > 0.6,
      category,
      mailType: isFollowUp ? 'follow-up' : 'fresh',
      followUpCount,
      emailDate,
      parentEmailId: isFollowUp ? `email-${Math.max(1, i - Math.floor(Math.random() * 20))}` : undefined,
      replied: Math.random() > 0.7, // 30% of emails are replied to
      replyText: undefined
    };

    emails.push(email);
  }

  // Sort by date (newest first)
  return emails.sort((a, b) => b.emailDate.getTime() - a.emailDate.getTime());
};

export const mockEmails = generateMockEmails();