import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatPeso, formatDate, getStatusStyle, isToday, isThisMonth } from "@/utils/format";
import { TrendingUp, Briefcase, Users, AlertTriangle, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => base44.entities.InventoryItem.list() });

  const salesToday = useMemo(() => jobs.filter(j => j.status === "Done" && isToday(j.job_date || j.created_date)).reduce((s, j) => s + (j.grand_total || 0), 0), [jobs]);
  const salesMonth = useMemo(() => jobs.filter(j => j.status === "Done" && isThisMonth(j.job_date || j.created_date)).reduce((s, j) => s + (j.grand_total || 0), 0), [jobs]);
  const activeJobs = useMemo(() => jobs.filter(j => j.status === "Pending" || j.status === "In progress").length, [jobs]);
  const lowStock = useMemo(() => inventory.filter(i => (i.stock_qty || 0) < (i.min_stock || 0)).length, [inventory]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6 + i);
      const label = days[d.getDay()];
      const total = jobs
        .filter(j => j.status === "Done" && j.job_date && new Date(j.job_date).toDateString() === d.toDateString())
        .reduce((s, j) => s + (j.grand_total || 0), 0);
      return { label, total, isToday: d.toDateString() === today.toDateString() };
    });
  }, [jobs]);

  const recentJobs = useMemo(() => [...jobs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5), [jobs]);

  const stats = [
    { label: "Sales Today", value: formatPeso(salesToday), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "This Month", value: formatPeso(salesMonth), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Jobs", value: activeJobs, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: lowStock > 0 ? "text-red-600" : "text-gray-400", bg: lowStock > 0 ? "bg-red-50" : "bg-gray-50", alert: lowStock > 0 },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <img
          src="https://media.base44.com/images/public/6a2a70d825eb74bfc42552f4/e390fab89_Screenshot2026-06-11154850.png"
          alt="Don Grace Motor Shop"
          className="w-16 h-16 object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Don Grace</h1>
          <p className="text-sm text-muted-foreground">Motor Shop Dashboard</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl p-4 border ${stat.alert ? "border-red-200" : "border-border"}`}>
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.alert ? "text-red-600" : "text-foreground"}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Bar Chart */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Sales This Week</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weeklyData} barSize={24}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(v) => [formatPeso(v), "Sales"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, i) => (
                <Cell key={i} fill={entry.isToday ? "#BA7517" : "#EF9F2733"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Jobs</h2>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No jobs yet.</p>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{job.client_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{job.motor_model || ""} · {job.job_type}</p>
                </div>
                <div className="flex flex-col items-end ml-3 shrink-0">
                  <span className="text-sm font-bold text-primary">{formatPeso(job.grand_total)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium mt-1 ${getStatusStyle(job.status)}`}>{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Footer note */}
      <p className="text-center text-[10px] text-muted-foreground mt-5 mb-2">
        Built with privacy-first principles and secure data handling practices.
      </p>
    </div>
  );
}
