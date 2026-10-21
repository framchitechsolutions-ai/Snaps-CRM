'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<any>
  color: string
  iconBg: string
  iconColor: string
}

export default function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card p-6 border-l-[4px] ${color} hover:shadow-elevated transition-shadow duration-200`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-success' : 'text-danger'
          }`}
        >
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {change}
        </div>
      </div>
    </div>
  )
}
