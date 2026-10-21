'use client'

import React, { useState } from 'react'
import { FileText, CheckCircle, Clock, AlertTriangle, MoreVertical, Download } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import StatCard from '../../components/common/StatCard'

interface InvoiceRow {
  id: string
  client: string
  request: string
  amount: string
  status: string
  date: string
  statusColor: string
}

const invoices: InvoiceRow[] = [
  { id: 'INV-000241', client: 'Acme Corp', request: 'Document Translation', amount: 'K2,500.00', status: 'Paid', date: '12 Jun 2026', statusColor: 'bg-success/10 text-success' },
  { id: 'INV-000238', client: 'TechSolutions', request: 'Technical Review', amount: 'K1,800.00', status: 'Paid', date: '09 Jun 2026', statusColor: 'bg-success/10 text-success' },
  { id: 'INV-000235', client: 'Global Inc', request: 'Certification', amount: 'K3,200.00', status: 'Pending', date: '07 Jun 2026', statusColor: 'bg-warning/10 text-warning' },
  { id: 'INV-000229', client: 'StartUp Ltd', request: 'Compliance Audit', amount: 'K950.00', status: 'Overdue', date: '03 Jun 2026', statusColor: 'bg-danger/10 text-danger' },
  { id: 'INV-000218', client: 'Enterprise Co', request: 'Documentation', amount: 'K4,100.00', status: 'Paid', date: '28 May 2026', statusColor: 'bg-success/10 text-success' },
]

export default function InvoicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const metrics = [
    { title: 'Total Invoiced', value: 'K58,250', change: '+12.5%', trend: 'up' as const, icon: FileText, color: 'border-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { title: 'Paid', value: 'K42,100', change: '+9.2%', trend: 'up' as const, icon: CheckCircle, color: 'border-success', iconBg: 'bg-success/10', iconColor: 'text-success' },
    { title: 'Pending', value: 'K3,200', change: '+1.4%', trend: 'up' as const, icon: Clock, color: 'border-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { title: 'Overdue', value: 'K950', change: '-4.3%', trend: 'down' as const, icon: AlertTriangle, color: 'border-purple', iconBg: 'bg-purple/10', iconColor: 'text-purple' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="provider" />
      <div className="lg:ml-[246px]">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
            <p className="text-gray-500 mt-1">Track issued invoices and their settlement status.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">All Invoices</h3>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.client}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.request}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{inv.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${inv.statusColor}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <Download size={15} />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {invoices.length} invoices</p>
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
