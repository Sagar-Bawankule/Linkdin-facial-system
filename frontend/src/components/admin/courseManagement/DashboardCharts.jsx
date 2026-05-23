import React from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getGradeDistribution, getDepartmentDistribution, getEnrollmentTrend } from './chartUtils';
import { PieChart as PieIcon, BarChart2, TrendingUp, Info } from 'lucide-react';

// Color palette for premium charts
const CHART_COLORS = ['#506EE5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const ChartContainer = ({ title, icon: Icon, children, isDark }) => (
  <div className={`relative p-6 rounded-[2rem] border transition-all hover:shadow-xl ${isDark ? 'bg-[#121A22] border-[#1E2733] shadow-black/20 text-white' : 'bg-white border-gray-100 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-brand-primary/10 text-brand-primary' : 'bg-indigo-50 text-indigo-600'}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest opacity-80">{title}</h3>
      </div>
      <Info size={16} className="text-gray-400 cursor-help" />
    </div>
    <div className="h-[220px] w-full">
      {children}
    </div>
  </div>
);

const DepartmentDistributionChart = ({ courses, isDark }) => {
  const data = getDepartmentDistribution(courses);
  return (
    <ChartContainer title="Departments" icon={BarChart2} isDark={isDark}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E2733' : '#F1F5F9'} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: isDark ? '#4B5563' : '#94A3B8', fontSize: 10, fontWeight: 700 }}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: isDark ? '#1E2733' : '#F8FAFC' }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              color: isDark ? '#F3F4F6' : '#1F2937'
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const EnrollmentTrendChart = ({ isDark }) => {
  const data = getEnrollmentTrend();
  return (
    <ChartContainer title="Enrollment Trend" icon={TrendingUp} isDark={isDark}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E2733' : '#F1F5F9'} />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: isDark ? '#4B5563' : '#94A3B8', fontSize: 10, fontWeight: 700 }}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#10B981" 
            strokeWidth={4} 
            dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#121A22' : 'white' }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const CourseStatusChart = ({ courses, isDark }) => {
  const activeCount = courses.filter(c => c.isActive).length;
  const inactiveCount = courses.length - activeCount;
  const data = [
    { name: 'Active', value: activeCount },
    { name: 'Archived', value: inactiveCount }
  ];

  return (
    <ChartContainer title="Course Status" icon={PieIcon} isDark={isDark}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={8}
            dataKey="value"
          >
            <Cell fill="#506EE5" stroke="none" />
            <Cell fill={isDark ? '#1E2733' : '#F1F5F9'} stroke="none" />
          </Pie>
          <Tooltip 
             contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
         <p className="text-2xl font-black">{Math.round((activeCount/courses.length)*100 || 0)}%</p>
      </div>
    </ChartContainer>
  );
};

const DashboardCharts = ({ courses, isDark }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <DepartmentDistributionChart courses={courses} isDark={isDark} />
      <EnrollmentTrendChart isDark={isDark} />
      <CourseStatusChart courses={courses} isDark={isDark} />
    </div>
  );
};

export default DashboardCharts;