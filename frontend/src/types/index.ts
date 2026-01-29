export type EmailCategory = 
  | 'suspension'
  | 'fir'
  | 'semester'
  | 'miscellaneous';

export type MailType = 'fresh' | 'follow-up';

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  instituteName: string;
  subject: string;
  content: string;
  hasAttachment: boolean;
  attachments: string[];
  emlFile: string;
  category: EmailCategory;
  mailType: MailType;
  followUpCount: number;
  emailDate: Date;
  parentEmailId?: string;
  replied: boolean;
  replyText?: string;
}

export interface CategoryInfo {
  id: EmailCategory | 'all';
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface DashboardStats {
  totalEmails: number;
  freshEmails: number;
  followUpEmails: number;
  emailsWithAttachments: number;
}