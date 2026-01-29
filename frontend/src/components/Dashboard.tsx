import { 
  Mail, 
  MailOpen, 
  Reply, 
  Paperclip,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Email } from '../types';

interface DashboardProps {
  emails: Email[];
}

export function Dashboard({ emails }: DashboardProps) {
  // Calculate statistics
  const unrepliedEmails = emails.filter(e => !e.replied);
  
  // Calculate average pending duration for unreplied emails
  const calculateAveragePendingDuration = () => {
    if (unrepliedEmails.length === 0) return '0 days';
    
    const now = new Date();
    const totalDays = unrepliedEmails.reduce((sum, email) => {
      const emailDate = new Date(email.emailDate);
      const diffTime = Math.abs(now.getTime() - emailDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    const avgDays = Math.round(totalDays / unrepliedEmails.length);
    
    if (avgDays === 0) return '< 1 day';
    if (avgDays === 1) return '1 day';
    return `${avgDays} days`;
  };
  
  const stats = {
    total: emails.length,
    unreplied: unrepliedEmails.length,
    avgPendingDuration: calculateAveragePendingDuration(),
    fresh: emails.filter(e => e.mailType === 'fresh').length,
    followUp: emails.filter(e => e.mailType === 'follow-up').length,
    withAttachments: emails.filter(e => e.hasAttachment).length
  };

  // Category distribution data with explicit colors
  const categoryData = [
    {
      name: 'Suspension',
      count: emails.filter(e => e.category === 'suspension').length,
      fill: '#f97316'
    },
    {
      name: 'FIR/Arrest',
      count: emails.filter(e => e.category === 'fir').length,
      fill: '#ef4444'
    },
    {
      name: 'Semester',
      count: emails.filter(e => e.category === 'semester').length,
      fill: '#3b82f6'
    },
    {
      name: 'Miscellaneous',
      count: emails.filter(e => e.category === 'miscellaneous').length,
      fill: '#6b7280'
    }
  ];

  // Fresh vs Follow-up pie chart data
  const mailTypeData = [
    { name: 'Fresh', value: stats.fresh, fill: '#22c55e' },
    { name: 'Follow-up', value: stats.followUp, fill: '#f97316' }
  ];

  // Daily volume data (last 7 days)
  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = emails.filter(e => {
        const emailDate = new Date(e.emailDate);
        return emailDate >= date && emailDate < nextDate;
      }).length;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }
    
    return data;
  };

  const dailyVolumeData = getLast7DaysData();

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Emails"
          value={stats.total}
          icon={<Mail className="w-6 h-6" />}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Replies"
          value={stats.unreplied}
          icon={<Clock className="w-6 h-6" />}
          bgColor="bg-red-50"
          iconColor="text-red-600"
          subtitle={`Avg: ${stats.avgPendingDuration}`}
        />
        <StatCard
          title="Fresh Emails"
          value={stats.fresh}
          icon={<MailOpen className="w-6 h-6" />}
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Follow-up Emails"
          value={stats.followUp}
          icon={<Reply className="w-6 h-6" />}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          title="With Attachments"
          value={stats.withAttachments}
          icon={<Paperclip className="w-6 h-6" />}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bar Chart: Emails by Category */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#374151' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: '#374151' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Fresh vs Follow-up */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mail Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mailTypeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {mailTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart: Daily Volume */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Email Volume (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyVolumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#374151' }} />
            <YAxis tick={{ fontSize: 12, fill: '#374151' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#2563eb' }}
              name="Emails"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, bgColor, iconColor, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}