'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Book, Brain, Clock, Target, TrendingUp, Award } from 'lucide-react'

interface PerformanceData {
  overallProgress: number
  studyHours: number
  tasksCompleted: number
  averageGrade: number
  streak: number
  focusScore: number
  upcomingDeadlines: { task: string; date: string }[]
  recentAchievements: string[]
  subjectPerformance: { subject: string; score: number }[]
  weeklyStudyHours: { day: string; hours: number }[]
}

export default function ProductivityDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('http://localhost:5000/performance')
      const data = await response.json()
      setPerformanceData(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching performance data:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!performanceData) {
    return <div>Error loading performance data</div>
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Productivity Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.overallProgress}%</div>
              <Progress value={performanceData.overallProgress} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.studyHours}</div>
              <p className="text-xs text-muted-foreground">hours this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground">tasks this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.averageGrade}</div>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.streak}</div>
              <p className="text-xs text-muted-foreground">days in a row</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Score</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.focusScore}</div>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {performanceData.upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex justify-between items-center mb-2">
                    <span>{deadline.task}</span>
                    <Badge variant="secondary">{deadline.date}</Badge>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {performanceData.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <Award className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="subjects">
              <TabsList>
                <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
                <TabsTrigger value="studyHours">Weekly Study Hours</TabsTrigger>
              </TabsList>
              <TabsContent value="subjects">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.subjectPerformance} width={750} height={300} >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="studyHours">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.weeklyStudyHours} width={750} height={300}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="hours" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}