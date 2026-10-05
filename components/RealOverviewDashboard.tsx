'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Users,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '@/components/i18n';

type Overview = {
  visitors: number;
  sessions: number;
  pageViews: number;
  clicks: number;
  rageClicks: number;
  deadClicks: number;
  scrolls: number;
  activeTimeMs: number;
  sectionAttentionMs: number;
  taskStarts: number;
  taskCompletions: number;
  taskSuccessRate: number | null;
  frictionEvents: number;
  avgAttentionMs: number | null;
  uxHealthScore: number | null;
};

type TrendRow = {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  activeTimeMs: number;
  clicks: number;
  frictionEvents: number;
};

type PageRow = {
  page: string;
  views: number;
  activeTimeMs: number;
  dwellTimeMs: number;
  clicks: number;
  rageClicks: number;
  deadClicks: number;
  scrollMax: number;
};

type DeviceRow = { name: string; count: number; percentage: number | null };
type TaskRow = { task: string; starts: number; completes: number; successRate: number; medianCompletionTimeMs: number };
type Signal = {
  type: 'friction' | 'attention' | 'task';
  severity: 'HIGH' | 'MEDIUM';
  page?: string;
  section?: string;
  rageClicks?: number;
  deadClicks?: number;
  attentionMs?: number;
  clicks?: number;
  taskSuccessRate?: number;
};

export type RealDashboardData = {
  period: { days: number; from: string; to: string };
  coverage: { currentEvents: number; previousEvents: number };
  overview: Overview;
  comparison: {
    visitors: number | null;
    sessions: number | null;
    pageViews: number | null;
    activeTimeMs: number | null;
    taskSuccessRate: number | null;
  };
  previousAvailable: boolean;
  trend: TrendRow[];
  pages: PageRow[];
  devices: DeviceRow[];
  tasks: TaskRow[];
  signals: Signal[];
};

function duration(ms: number | null | undefined) {
  if (ms == null) return '--';
  if (ms < 1000) return '0s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`;
}

function number(value: number | null | undefined, available = true) {
  return available && value != null ? new Intl.NumberFormat().format(value) : '--';
}

function changeText(value: number | null, previousAvailable: boolean, lang: 'en' | 'vi') {
  if (!previousAvailable || value == null) return { text: '--', cls: 'neutral' };
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  const cls = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  return { text: `${arrow} ${Math.abs(value)}% ${lang === 'vi' ? 'so với kỳ trước' : 'vs previous period'}`, cls };
}

const COLORS = ['#696cff', '#03c3ec', '#71dd37', '#aeb4c0'];

export default function RealOverviewDashboard({ data }: { data: RealDashboardData }) {
  const { lang, t } = useI18n();
  const vi = lang === 'vi';
  const hasEvents = data.coverage.currentEvents > 0;
  const hasActiveTime = data.overview.activeTimeMs > 0;
  const visitorChange = changeText(data.comparison.visitors, data.previousAvailable, lang);
  const activeChange = changeText(data.comparison.activeTimeMs, data.previousAvailable, lang);
  const taskChange = changeText(data.comparison.taskSuccessRate, data.previousAvailable, lang);

  const trend = data.trend.map((row) => ({
    ...row,
    label: new Date(`${row.date}T00:00:00`).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: 'short' }),
    activeMinutes: Math.round((row.activeTimeMs / 60000) * 10) / 10,
  }));

  const devices = data.devices.filter((row) => row.count > 0);
  const topDevice = [...devices].sort((a, b) => b.count - a.count)[0];
  const deviceLabel = (key: string) => key === 'mobile' ? t('mobile') : key === 'desktop' ? t('desktop') : key === 'tablet' ? t('tablet') : (vi ? 'Không xác định' : 'Unknown');

  return <>
    <div className="grid grid4 metric-grid-v2" style={{ marginBottom: 24 }}>
      <Metric icon={Activity} label={t('uxHealth')} value="-- / 100" meta="--" metaClass="neutral" />
      <Metric icon={Users} label={t('activeUsers')} value={number(data.overview.visitors, hasEvents)} meta={visitorChange.text} metaClass={visitorChange.cls} />
      <Metric icon={Clock3} label={t('activeTime')} value={hasActiveTime ? duration(data.overview.activeTimeMs) : '--'} meta={activeChange.text} metaClass={activeChange.cls} />
      <Metric icon={CheckCircle2} label={t('taskSuccess')} value={data.overview.taskSuccessRate == null ? '--' : `${data.overview.taskSuccessRate}%`} meta={taskChange.text} metaClass={taskChange.cls} />
    </div>

    <div className="grid grid-main" style={{ marginBottom: 24 }}>
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t('userAttention')}</h2>
            <p className="card-subtitle">{vi ? 'Dữ liệu người dùng hoạt động và active time theo ngày.' : 'Daily active users and active time from real events.'}</p>
          </div>
          <span className="pill good">{vi ? 'Dữ liệu thật' : 'Live data'}</span>
        </div>
        {hasEvents ? <div className="chart-wrap" style={{ height: 292 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend}>
              <CartesianGrid vertical={false} strokeDasharray="4 5" stroke="#dfe2e8" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8b939e' }} minTickGap={22} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8b939e' }} width={34} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8b939e' }} width={34} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="right" dataKey="activeMinutes" fill="#03c3ec" radius={[5, 5, 0, 0]} name={vi ? 'Active time (phút)' : 'Active time (min)'} />
              <Line yAxisId="left" type="monotone" dataKey="visitors" stroke="#696cff" strokeWidth={2.5} dot={false} name={t('activeUsers')} />
            </ComposedChart>
          </ResponsiveContainer>
        </div> : <EmptyChart text={vi ? 'Chưa có event trong khoảng thời gian này.' : 'No events in this time range yet.'} />}
        <div className="mini-stat-row">
          <MiniStat label={t('activeTimeLabel')} value={hasActiveTime ? duration(data.overview.activeTimeMs) : '--'} primary />
          <MiniStat label={t('avgAttention')} value={data.overview.avgAttentionMs == null || data.overview.avgAttentionMs <= 0 ? '--' : duration(data.overview.avgAttentionMs)} />
        </div>
      </div>

      <div className="card chart-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t('uxHealth')}</h2>
            <p className="card-subtitle">{vi ? 'Bắt đầu từ 100 và trừ 1 điểm cho mỗi vấn đề UX/UI khác nhau.' : 'Starts at 100 and subtracts 1 point for each unique UX/UI issue.'}</p>
          </div>
        </div>
        <div className="donut-wrap">
          <ResponsiveContainer width="220" height="190">
            <PieChart><Pie data={[{ value: 100 }]} innerRadius={62} outerRadius={82} startAngle={90} endAngle={-270} dataKey="value" stroke="none"><Cell fill="#eef0f5" /></Pie></PieChart>
          </ResponsiveContainer>
          <div className="donut-center"><div className="donut-value">{data.overview.uxHealthScore == null ? '--' : data.overview.uxHealthScore}</div><div className="donut-label">{t('uxScore')}</div></div>
        </div>
        <div style={{ padding: '0 24px 18px' }}><div className="stat-meta neutral">-- {t('previousPeriod')}</div></div>
        <div className="mini-stat-row">
          <MiniStat label={t('taskSuccess')} value={data.overview.taskSuccessRate == null ? '--' : `${data.overview.taskSuccessRate}%`} primary />
          <MiniStat label={t('frictionEvents')} value={hasEvents ? number(data.overview.frictionEvents) : '--'} />
        </div>
      </div>
    </div>

    <div className="grid grid3" style={{ marginBottom: 24 }}>
      <TaskCard tasks={data.tasks} vi={vi} />
      <DeviceCard devices={devices} topDevice={topDevice} deviceLabel={deviceLabel} vi={vi} />
      <SignalsCard signals={data.signals} vi={vi} />
    </div>

    <div className="card">
      <div className="card-header">
        <div><h2 className="card-title">{t('pageAttention')}</h2><p className="card-subtitle">{vi ? 'Xếp hạng trang bằng page view, active time, dwell và friction thực tế.' : 'Rank pages using real page views, active time, dwell and friction.'}</p></div>
      </div>
      <div className="card-body">
        {data.pages.length ? <div style={{ overflowX: 'auto' }}><table className="attention-table">
          <thead><tr><th>{t('page')}</th><th>{t('views')}</th><th>{t('activeTimeShort')}</th><th>{t('dwell')}</th><th>{vi ? 'Friction' : 'Friction'}</th><th>{vi ? 'Scroll tối đa' : 'Max scroll'}</th></tr></thead>
          <tbody>{data.pages.map((row) => {
            const friction = row.rageClicks + row.deadClicks;
            const maxActive = Math.max(...data.pages.map((p) => p.activeTimeMs), 1);
            return <tr key={row.page}>
              <td><b>{row.page}</b></td>
              <td>{row.views}</td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 170 }}><div className="attention-bar" style={{ flex: 1 }}><i style={{ width: `${Math.max(3, Math.round(row.activeTimeMs / maxActive * 100))}%` }} /></div><span>{row.activeTimeMs > 0 ? duration(row.activeTimeMs) : '--'}</span></div></td>
              <td>{row.dwellTimeMs > 0 ? duration(row.dwellTimeMs) : '--'}</td>
              <td><span className={`pill ${friction > 0 ? 'high' : 'good'}`}>{friction}</span></td>
              <td>{row.scrollMax > 0 ? `${row.scrollMax}%` : '--'}</td>
            </tr>;
          })}</tbody>
        </table></div> : <div className="dashboard-empty-inline">--<small>{vi ? 'Chưa có dữ liệu page view.' : 'No page-view data yet.'}</small></div>}
      </div>
    </div>
  </>;
}

function Metric({ icon: Icon, label, value, meta, metaClass }: { icon: typeof Activity; label: string; value: string; meta: string; metaClass: string }) {
  return <div className="card stat-card stat-card-v2"><div className="stat-card-top"><div className="metric-icon-v2"><Icon size={18} /></div><ArrowUpRight size={16} className="metric-arrow" /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className={`stat-meta ${metaClass}`}>{meta}</div></div>;
}

function MiniStat({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return <div className="mini-stat"><div className={`mini-icon ${primary ? 'primary' : 'info'}`}>{primary ? '◷' : '◉'}</div><div><small>{label}</small><b>{value}</b></div></div>;
}

function EmptyChart({ text }: { text: string }) {
  return <div className="dashboard-empty-chart"><strong>--</strong><span>{text}</span></div>;
}

function TaskCard({ tasks, vi }: { tasks: TaskRow[]; vi: boolean }) {
  const chart = tasks.slice(0, 4).map((task) => ({ name: task.task, seconds: Math.round(task.medianCompletionTimeMs / 1000) }));
  return <div className="card"><div className="card-header"><div><h2 className="card-title">{vi ? 'Hiệu quả tác vụ' : 'Task efficiency'}</h2><p className="card-subtitle">{vi ? 'Thời gian hoàn thành trung vị của task có tracking.' : 'Median completion time for tracked tasks.'}</p></div></div>
    {chart.length ? <div className="chart-wrap" style={{ height: 250 }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chart} layout="vertical" margin={{ left: 16, right: 16 }}><CartesianGrid horizontal={false} stroke="#eef0f4"/><XAxis type="number" hide/><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#596273' }} width={80}/><Tooltip/><Bar dataKey="seconds" fill="#696cff" radius={[0, 6, 6, 0]} name={vi ? 'Giây' : 'Seconds'}/></ComposedChart></ResponsiveContainer></div> : <EmptyChart text={vi ? 'Chưa có task_start/task_complete.' : 'No task_start/task_complete data yet.'} />}
  </div>;
}

function DeviceCard({ devices, topDevice, deviceLabel, vi }: { devices: DeviceRow[]; topDevice?: DeviceRow; deviceLabel: (key: string) => string; vi: boolean }) {
  const pie = devices.map((row) => ({ name: deviceLabel(row.name), value: row.percentage || 0 }));
  return <div className="card device-card"><div className="card-header"><div><h2 className="card-title">{vi ? 'Thiết bị' : 'Device mix'}</h2><p className="card-subtitle">{vi ? 'Tỷ trọng session theo loại thiết bị.' : 'Session share by device type.'}</p></div></div>
    {pie.length ? <div className="device-chart-body"><div className="donut-wrap device-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={4} stroke="none">{pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><div className="donut-value">{topDevice?.percentage == null ? '--' : `${topDevice.percentage}%`}</div><div className="donut-label">{topDevice ? deviceLabel(topDevice.name) : '--'}</div></div></div><div className="device-legend">{devices.map((row, i) => <div className="device-legend-row" key={row.name}><span className="device-dot" style={{ background: COLORS[i % COLORS.length] }}/><div><b>{deviceLabel(row.name)}</b><small>{row.count} {vi ? 'phiên' : 'sessions'}</small></div><strong>{row.percentage == null ? '--' : `${row.percentage}%`}</strong></div>)}</div></div> : <EmptyChart text={vi ? 'Chưa có session có thông tin thiết bị.' : 'No session device data yet.'} />}
  </div>;
}

function SignalsCard({ signals, vi }: { signals: Signal[]; vi: boolean }) {
  return <div className="card opportunity-card"><div className="card-header"><div><h2 className="card-title">{vi ? 'Ưu tiên UX' : 'UX priorities'}</h2><p className="card-subtitle">{vi ? 'Tín hiệu quan sát được từ dữ liệu thật, chưa phải điểm AI.' : 'Observed signals from real events, not an AI score.'}</p></div></div><div className="card-body">
    {signals.length ? signals.slice(0, 2).map((signal, index) => <div className={`priority ${signal.severity === 'MEDIUM' ? 'medium' : ''}`} style={index ? { marginTop: 12 } : undefined} key={`${signal.type}-${index}`}>
      <span className={`pill ${signal.severity === 'HIGH' ? 'high' : 'medium'}`}>{signal.severity}</span>
      <h3>{signal.type === 'friction' ? (vi ? `Friction trên ${signal.page || '/'}` : `Friction on ${signal.page || '/'}`) : signal.type === 'attention' ? (vi ? `Attention cao tại ${signal.section || signal.page || '/'}` : `High attention at ${signal.section || signal.page || '/'}`) : (vi ? 'Task success thấp' : 'Low task success')}</h3>
      <p>{signal.type === 'friction' ? `${signal.rageClicks || 0} rage · ${signal.deadClicks || 0} dead clicks` : signal.type === 'attention' ? `${duration(signal.attentionMs)} · ${signal.clicks || 0} clicks` : `${signal.taskSuccessRate ?? '--'}%`}</p>
      <Link href={signal.type === 'friction' ? '/heatmaps' : signal.type === 'task' ? '/tasks' : '/analytics'} className="btn outline">{vi ? 'Xem bằng chứng' : 'Inspect evidence'}</Link>
    </div>) : <div className="dashboard-empty-inline">--<small>{vi ? 'Chưa có đủ tín hiệu friction/attention/task.' : 'No friction, attention or task signal yet.'}</small></div>}
  </div></div>;
}
