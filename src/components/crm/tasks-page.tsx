'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreHorizontal, Clock, CheckCircle, Circle, Loader2, User } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee: { id: string; name: string; email: string; avatar: string | null }
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  const statusIcons: Record<string, React.ReactNode> = {
    TODO: <Circle className="h-5 w-5 text-slate-400" />,
    IN_PROGRESS: <Clock className="h-5 w-5 text-amber-500" />,
    COMPLETED: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    CANCELLED: <Circle className="h-5 w-5 text-red-400" />,
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Tasks</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
              </div>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No tasks found. Click "Add Task" to create one.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {statusIcons[task.status] || statusIcons.TODO}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Badge className={priorityColors[task.priority] || priorityColors.MEDIUM}>{task.priority}</Badge>
                  <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
