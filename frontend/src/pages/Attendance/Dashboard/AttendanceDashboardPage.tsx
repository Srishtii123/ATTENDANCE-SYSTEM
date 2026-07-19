import { Card, DatePicker, Empty, Spin } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import { Area, Column } from '@ant-design/charts';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';

const BRAND = '#082a89';

const StatCard = ({
  title,
  value,
  loading,
  icon,
  tone
}: {
  title: string;
  value: number;
  loading?: boolean;
  icon: ReactNode;
  tone: 'blue' | 'green' | 'amber' | 'red';
}) => {
  const tones = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', text: BRAND },
    green: { bg: '#ecfdf5', border: '#bbf7d0', text: '#059669' },
    amber: { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' }
  }[tone];

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm" style={{ borderColor: tones.border }}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: tones.bg, color: tones.text }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
          {loading ? <Spin size="small" /> : <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>}
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, icon, loading, empty, children }: any) => (
  <Card
    className="h-full rounded-xl border border-blue-100 shadow-sm"
    title={
      <div className="flex items-center gap-2 text-[#082a89]">
        {icon}
        <span className="font-bold">{title}</span>
      </div>
    }
    styles={{ body: { padding: 10, height: 'calc(100% - 55px)' } }}
  >
    {loading ? (
      <div className="flex h-full min-h-[160px] items-center justify-center">
        <Spin size="large" />
      </div>
    ) : empty ? (
      <div className="flex h-full min-h-[160px] items-center justify-center">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />
      </div>
    ) : (
      children
    )}
  </Card>
);

const AttendanceDashboardPage = () => {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);

  const { data: dailyStats, isLoading: isDailyLoading, isError: isDailyError } = useQuery({
    queryKey: ['daily_stats'],
    queryFn: () => attendanceServiceInstance.getDailyStats()
  });

  const { data: monthlyStats, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['monthly_stats'],
    queryFn: () => attendanceServiceInstance.getMonthlyStats()
  });

  const { data: departmentStats, isLoading: isDeptLoading } = useQuery({
    queryKey: ['department_stats', dateRange],
    queryFn: () => attendanceServiceInstance.getDepartmentStats(dateRange[0], dateRange[1])
  });

  const { data: lateTrends, isLoading: isLateTrendsLoading } = useQuery({
    queryKey: ['late_trends'],
    queryFn: () => attendanceServiceInstance.getLateArrivalTrends(30)
  });

  const monthlyChartData = useMemo(
    () =>
      Object.entries(monthlyStats || {}).map(([date, stats]: [string, any]) => ({
        date: dayjs(date).format('MMM DD'),
        value: stats.present || 0,
        type: 'Present'
      })),
    [monthlyStats]
  );

  const departmentChartData = useMemo(
    () =>
      Object.entries(departmentStats || {})
        .map(([department, stats]: [string, any]) => [
          { department, value: stats.present || 0, type: 'Present' },
          { department, value: stats.late || 0, type: 'Late' }
        ])
        .flat(),
    [departmentStats]
  );

  const lateTrendData = useMemo(
    () =>
      Object.entries(lateTrends?.dailyTrends || {}).map(([date, count]) => ({
        date: dayjs(date).format('MMM DD'),
        value: count,
        type: 'Late Arrivals'
      })),
    [lateTrends]
  );

  const lateTrendConfig = {
    data: lateTrendData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    color: ['#d97706'],
    smooth: true,
    height: 210,
    areaStyle: { fill: 'l(270) 0:#ffffff 0.5:#fef3c7 1:#d97706' }
  } as any;

  return (
    <div className="bg-[#f4f7fb] p-3 sm:p-4 lg:p-5 md:h-[calc(100vh-145px)] md:overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1500px] flex-col gap-3 md:min-h-0">
        <section className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#082a89] text-lg text-white">
                <DashboardOutlined />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#082a89]">Attendance Dashboard</h1>
                <p className="text-xs text-slate-500">Operational view for attendance and exceptions.</p>
              </div>
            </div>
            <DatePicker.RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                }
              }}
              className="w-full rounded-lg sm:w-auto"
              size="middle"
              allowClear={false}
            />
          </div>
        </section>

        {isDailyError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Dashboard API is not responding. Please check backend logs or session authorization.
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Employees" value={dailyStats?.total || 0} loading={isDailyLoading} icon={<UserOutlined />} tone="blue" />
          <StatCard title="Present Today" value={dailyStats?.present || 0} loading={isDailyLoading} icon={<CheckCircleOutlined />} tone="green" />
          <StatCard title="Late Today" value={dailyStats?.late || 0} loading={isDailyLoading} icon={<WarningOutlined />} tone="amber" />
          <StatCard title="Absent Today" value={dailyStats?.absent || 0} loading={isDailyLoading} icon={<CloseCircleOutlined />} tone="red" />
        </section>

        <section className="grid flex-1 gap-3 md:min-h-0 xl:grid-cols-3">
          <ChartCard
            title="Monthly Attendance Trends"
            icon={<CalendarOutlined />}
            loading={isMonthlyLoading}
            empty={!monthlyChartData.length}
          >
            <Column
              data={monthlyChartData}
              xField="date"
              yField="value"
              seriesField="type"
              color={BRAND}
              height={210}
              columnStyle={{ radius: [6, 6, 0, 0] }}
            />
          </ChartCard>

          <ChartCard
            title="Department-wise Attendance"
            icon={<TeamOutlined />}
            loading={isDeptLoading}
            empty={!departmentChartData.length}
          >
            <Column
              data={departmentChartData}
              xField="department"
              yField="value"
              seriesField="type"
              isGroup
              color={['#059669', '#d97706']}
              height={210}
              columnStyle={{ radius: [6, 6, 0, 0] }}
            />
          </ChartCard>

          <ChartCard
            title="Late Arrival Trends"
            icon={<WarningOutlined />}
            loading={isLateTrendsLoading}
            empty={!lateTrendData.length}
          >
            <Area {...lateTrendConfig} />
          </ChartCard>
        </section>
      </div>
    </div>
  );
};

export default AttendanceDashboardPage;
