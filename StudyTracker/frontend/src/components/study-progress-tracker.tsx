'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Book, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface StudySession {
  _id?: ObjectId
  subject: string
  duration: number
  date: Date
}

export default function StudyProgressTracker() {
  const [totalHours, setTotalHours] = useState(0)
  const [subjects, setSubjects] = useState<{ [key: string]: number }>({})
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [newSession, setNewSession] = useState<Omit<StudySession, '_id'>>({
    subject: '',
    duration: 0,
    date: new Date()
  })
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)

  useEffect(() => {
    fetchStudyData()
  }, [])

  const fetchStudyData = async () => {
    try {
      const { db } = await connectToDatabase()
      const fetchedSessions = await db.collection('studySessions').find({}).toArray()
      setStudySessions(fetchedSessions)

      let total = 0
      const subjectHours: { [key: string]: number } = {}

      fetchedSessions.forEach((session: StudySession) => {
        total += session.duration
        subjectHours[session.subject] = (subjectHours[session.subject] || 0) + session.duration
      })

      setTotalHours(total)
      setSubjects(subjectHours)
    } catch (error) {
      console.error('Failed to fetch study data:', error)
    }
  }

  const addStudySession = async () => {
    try {
      const { db } = await connectToDatabase()
      const result = await db.collection('studySessions').insertOne(newSession)
      const insertedSession = {
        _id: result.insertedId,
        ...newSession
      }
      setStudySessions([...studySessions, insertedSession])
      setNewSession({
        subject: '',
        duration: 0,
        date: new Date()
      })
      await fetchStudyData()
    } catch (error) {
      console.error('Failed to add study session:', error)
    }
  }

  const updateStudySession = async () => {
    if (editingSession && editingSession._id) {
      try {
        const { db } = await connectToDatabase()
        await db.collection('studySessions').updateOne(
          { _id: editingSession._id },
          { $set: editingSession }
        )
        setStudySessions(studySessions.map(session => session._id === editingSession._id ? editingSession : session))
        setEditingSession(null)
        await fetchStudyData()
      } catch (error) {
        console.error('Failed to update study session:', error)
      }
    }
  }

  const deleteStudySession = async (id: ObjectId) => {
    try {
      const { db } = await connectToDatabase()
      await db.collection('studySessions').deleteOne({ _id: id })
      setStudySessions(studySessions.filter(session => session._id !== id))
      await fetchStudyData()
    } catch (error) {
      console.error('Failed to delete study session:', error)
    }
  }

  const renderStudySessionDialog = (session: StudySession | null, isNew: boolean) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {isNew ? <Plus className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
          {isNew ? 'Add Session' : 'Edit'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add New Study Session' : 'Edit Study Session'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input
              id="subject"
              value={isNew ? newSession.subject : editingSession?.subject}
              onChange={(e) => isNew
                ? setNewSession({ ...newSession, subject: e.target.value })
                : setEditingSession({ ...editingSession!, subject: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration (hours)
            </Label>
            <Input
              id="duration"
              type="number"
              min="0"
              step="0.5"
              value={isNew ? newSession.duration : editingSession?.duration}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                isNew
                  ? setNewSession({ ...newSession, duration: value })
                  : setEditingSession({ ...editingSession!, duration: value })
              }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={isNew
                ? newSession.date.toISOString().split('T')[0]
                : editingSession?.date.toISOString().split('T')[0]
              }
              onChange={(e) => {
                const newDate = new Date(e.target.value)
                isNew
                  ? setNewSession({ ...newSession, date: newDate })
                  : setEditingSession({ ...editingSession!, date: newDate })
              }}
              className="col-span-3"
            />
          </div>
        </div>
        <Button onClick={isNew ? addStudySession : updateStudySession}>
          {isNew ? 'Add Session' : 'Update Session'}
        </Button>
      </DialogContent>
    </Dialog>
  )

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Study Progress</span>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Total Study Hours</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)} hours</p>
            </div>
            {renderStudySessionDialog(null, true)}
          </div>
          <div className="space-y-2">
            {Object.entries(subjects).map(([subject, hours]) => (
              <div key={subject}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{subject}</span>
                  <span>{hours.toFixed(1)} hours</span>
                </div>
                <Progress value={(hours / totalHours) * 100} className="h-2" />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Recent Study Sessions</h4>
            {studySessions.slice(0, 5).map(session => (
              <div key={session._id?.toString()} className="flex items-center justify-between text-sm py-1 border-b">
                <div>
                  <span className="font-medium">{session.subject}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(session.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{session.duration.toFixed(1)} hours</span>
                  {renderStudySessionDialog(session, false)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => session._id && deleteStudySession(session._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}