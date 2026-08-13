import { useEffect, useState } from 'react';
import { Grid, Card, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  WorkOutline as WorkIcon,
  PeopleOutlined as PeopleIcon,
  CheckCircleOutlined as HiredIcon,
  EventOutlined as InterviewIcon,
  TrendingUp as MetricIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#818cf8', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        backgroundColor: '#101318',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        p: 1.5,
      }}>
        <Typography variant="caption" sx={{ color: '#626975', display: 'block', mb: 0.5, fontWeight: 600 }}>
          {label || payload[0].name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 700 }} className="font-mono">
          {payload[0].value} {payload[0].value === 1 ? 'record' : 'records'}
        </Typography>
      </Box>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const isInterviewerRole = user?.role === 'INTERVIEWER';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={32} sx={{ color: '#818cf8' }} />
      </Box>
    );
  }

  const { summary, charts, isInterviewer } = stats || {};

  const isInterviewerMode = isInterviewer || isInterviewerRole;

  // Build metric cards dynamically based on whether user is interviewer
  const metricCards = isInterviewerMode ? [
    { title: 'Total Assigned Candidates', value: summary?.assignedCandidates || 0, badge: 'Assigned', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
    { title: 'Total Hired', value: summary?.assignedHired || 0, badge: 'Success', icon: <HiredIcon sx={{ fontSize: 18 }} /> },
    { title: 'Interviews Conducted', value: summary?.interviewsConducted || 0, badge: 'Completed', icon: <InterviewIcon sx={{ fontSize: 18 }} /> },
  ] : [
    { title: 'Total Jobs Openings', value: summary?.totalJobs || 0, badge: `${summary?.openJobs || 0} Active`, icon: <WorkIcon sx={{ fontSize: 18 }} /> },
    { title: 'Total Applicants', value: summary?.totalCandidates || 0, badge: 'Pipeline', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
    { title: 'Candidates Shortlisted', value: summary?.shortlisted || 0, badge: 'Target Fit', icon: <MetricIcon sx={{ fontSize: 18 }} /> },
    { title: 'Total Hired', value: summary?.hired || 0, badge: 'Success', icon: <HiredIcon sx={{ fontSize: 18 }} /> },
    { title: 'Interviews This Week', value: summary?.interviewsThisWeek || 0, badge: 'Scheduled', icon: <InterviewIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Box>
      {/* Editorial Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            {isInterviewerMode ? 'Interviewer Evaluation Desk' : 'Recruitment Intelligence OS'}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.025em' }}>
            {isInterviewerMode ? 'Assigned Interviews Overview' : 'System Overview'}
          </Typography>
        </Box>
        <Chip
          label="● System Live"
          size="small"
          sx={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={2} mb={4}>
        {metricCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={isInterviewerMode ? 4 : 2.4} key={index}>
            <Card sx={{ backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography color="#626975" variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.title}
                </Typography>
                <Box sx={{ color: '#969DAA' }}>{item.icon}</Box>
              </Box>
              <Typography variant="h4" color="#F5F7FA" fontWeight={700} className="font-mono" sx={{ mb: 1 }}>
                {item.value}
              </Typography>
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#969DAA',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={isInterviewerMode ? 12 : 8}>
          <Card sx={{ p: 3, backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', height: 380 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                  {isInterviewerMode ? 'Assigned Candidates Pipeline' : 'Candidate Pipeline Distribution'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#626975' }}>
                  {isInterviewerMode ? 'Stage breakdown for candidates assigned to your interview panel' : 'Live breakdown across recruitment stages'}
                </Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={charts?.pipeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#626975" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#626975" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {!isInterviewerMode && charts?.departmentChart && (
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', height: 380 }}>
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                  Openings by Department
                </Typography>
                <Typography variant="caption" sx={{ color: '#626975' }}>
                  Organizational distribution
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={charts.departmentChart}
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {charts.departmentChart.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
