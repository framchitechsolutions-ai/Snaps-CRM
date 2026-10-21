'use client'

import React, { useState } from 'react'
import { DollarSign, FolderOpen, CheckCircle, FileText, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import Sidebar from '../../../components/layout/Sidebar'
import DashboardHeader from '../../../components/layout/DashboardHeader'

const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 4500 },
  { name: 'Fri', revenue: 6000 },
  { name: 'Sat', revenue: 5500 },
  { name: 'Sun', revenue: 7000 },
]

const statusData = [
  { name: 'Completed', value: 12, color: '#10B981' },
  { name: 'In Progress', value: 8, color: '#3B82F6' },
  { name: 'Pending', value: 5, color: '#F97316' },
  { name: 'Overdue', value: 2, color: '#EF4444' },
]

interface Transaction {
  id: number
  client: string
  project: string
  amount: string
  status: string
  date: string
  avatar: string
  statusColor: string
}

const recentTransactions: Transaction[] = [
  { id: 1, client: 'Acme Corp', project: 'Document Translation', amount: 'K2,500.00', status: 'Completed', date: '2 min ago', avatar: 'AC', statusColor: 'bg-success/10 text-success' },
  { id: 2, client: 'TechSolutions', project: 'Technical Review', amount: 'K1,800.00', status: 'In Progress', date: '15 min ago', avatar: 'TS', statusColor: 'bg-primary/10 text-primary' },
  { id: 3, client: 'Global Inc', project: 'Certification', amount: 'K3,200.00', status: 'Pending', date: '1 hour ago', avatar: 'GI', statusColor: 'bg-warning/10 text-warning' },
  { id: 4, client: 'StartUp Ltd', project: 'Compliance Audit', amount: 'K950.00', status: 'Completed', date: '3 hours ago', avatar: 'SU', statusColor: 'bg-success/10 text-success' },
  { id: 5, client: 'Enterprise Co', project: 'Documentation', amount: 'K4,100.00', status: 'Overdue', date: '5 hours ago', avatar: 'EC', statusColor: 'bg-danger/10 text-danger' },
]

const metrics = [
  {
    title: 'Total Revenue',
    value: 'K48,250',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'border-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    title: 'Pending Projects',
    value: '24',
    change: '+8.2%',
    trend: 'up',
    icon: FolderOpen,
    color: 'border-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  {
    title: 'Completed Projects',
    value: '142',
    change: '+23.1%',
    trend: 'up',
    icon: CheckCircle,
    color: 'border-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    title: 'Active Invoices',
    value: '18',
    change: '-4.3%',
    trend: 'down',
    icon: FileText,
    color: 'border-purple',
    iconBg: 'bg-purple/10',
    iconColor: 'text-purple',
  },
]

export default function ProviderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="provider" />

      <div className="lg:ml-[246px]">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Provider Dashboard</h2>
            <p className="text-gray-500 mt-1">Monitor your projects, earnings, and performance metrics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-card p-6 border-l-[4px] ${metric.color} hover:shadow-elevated transition-shadow duration-200`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${metric.iconBg}`}>
                      <Icon size={22} className={metric.iconColor} />
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <div className={`flex items-center gap-1 text-sm font-medium ${metric.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                      {metric.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {metric.change}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Invoice Stats</h3>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Sales Analytics</h3>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => `K${value / 1000}k`}
                    />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: any) => [`K${Number(value).toLocaleString()}`, 'Revenue']}
                      />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Filter
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs">
                            {tx.avatar}
                          </div>
                          <span className="font-medium text-gray-900">{tx.client}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tx.project}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{tx.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tx.statusColor}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing 5 of 24 transactions</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}