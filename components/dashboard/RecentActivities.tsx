'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, User, FileText, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'realization' | 'calculation' | 'approval' | 'report'
  description: string
  user: string
  timestamp: Date
}

interface RecentActivitiesProps {
  activities: Activity[]
}

const activityIcons = {
  realization: FileText,
  calculation: CheckCircle,
  approval: CheckCircle,
  report: FileText
}

const activityColors = {
  realization: 'text-blue-600',
  calculation: 'text-green-600',
  approval: 'text-purple-600',
  report: 'text-orange-600'
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
        <CardDescription>Aktivitas sistem dalam 7 hari terakhir</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada aktivitas</p>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`mt-0.5 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      <span>{activity.user}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {formatDistanceToNow(activity.timestamp, { 
                          addSuffix: true, 
                          locale: id 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
