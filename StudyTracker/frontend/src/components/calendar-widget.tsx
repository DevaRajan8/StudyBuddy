'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Calendar} from '@/components/ui/calendar'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ChevronLeft, ChevronRight, Plus, Edit, Trash2} from 'lucide-react'
import {format, isSameDay, isAfter, addDays, startOfDay} from 'date-fns'
import {ObjectId} from 'mongodb'

interface CalendarEntry {
    _id?: ObjectId
    date: Date
    title: string
    description: string
    type: 'class' | 'assignment' | 'exam' | 'other'
}

interface CalendarWidgetProps {
    mode: 'full' | 'dashboard'
}

export default function CalendarWidget({mode}: CalendarWidgetProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [entries, setEntries] = useState<CalendarEntry[]>([])
    const [newEntry, setNewEntry] = useState<Omit<CalendarEntry, '_id'>>({
        date: new Date(),
        title: '',
        description: '',
        type: 'other'
    })
    const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null)
    const [activeTab, setActiveTab] = useState('calendar')

    useEffect(() => {
        fetchEntries()
    }, [])

    const fetchEntries = async () => {
        try {
            const response = await fetch('/api/db/calendarEntries')
            if (!response.ok) throw new Error('Failed to fetch calendar entries')
            const data = await response.json()
            setEntries(data.map((entry: CalendarEntry) => ({
                ...entry,
                date: new Date(entry.date)
            })))
        } catch (error) {
            console.error('Failed to fetch calendar entries:', error)
        }
    }

    const addEntry = async () => {
        try {
            const response = await fetch('/api/db/calendarEntries', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...newEntry,
                    date: selectedDate || new Date()
                })
            })
            if (!response.ok) throw new Error('Failed to add calendar entry')
            const addedEntry = await response.json()
            setEntries([...entries, {...addedEntry, date: new Date(addedEntry.date)}])
            setNewEntry({date: new Date(), title: '', description: '', type: 'other'})
        } catch (error) {
            console.error('Failed to add calendar entry:', error)
        }
    }

    const updateEntry = async () => {
        if (editingEntry && editingEntry._id) {
            try {
                const response = await fetch('/api/db/calendarEntries', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(editingEntry)
                })
                if (!response.ok) throw new Error('Failed to update calendar entry')
                setEntries(entries.map(entry => entry._id === editingEntry._id ? editingEntry : entry))
                setEditingEntry(null)
            } catch (error) {
                console.error('Failed to update calendar entry:', error)
            }
        }
    }

    const deleteEntry = async (id: string) => {
        try {
            const response = await fetch('/api/db/calendarEntries', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id})
            })
            if (!response.ok) throw new Error('Failed to delete calendar entry')
            setEntries(entries.filter(entry => entry._id !== id))
        } catch (error) {
            console.error('Failed to delete calendar entry:', error)
        }
    }

    const entriesForSelectedDate = entries.filter(entry => selectedDate && isSameDay(entry.date, selectedDate))

    const upcomingEntries = entries
        // .filter(entry => isAfter(entry.date, startOfDay(new Date())) || isSameDay(entry.date, new Date()))
        .sort((a, b) => a.date.getTime() - b.date.getTime())

    const renderEntryDialog = (entry: CalendarEntry | null, isNew: boolean) => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    {isNew ? <Plus className="h-4 w-4 mr-2"/> : <Edit className="h-4 w-4 mr-2"/>}
                    {isNew ? 'Add Entry' : 'Edit'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Add New Entry' : 'Edit Entry'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={isNew ? newEntry.title : editingEntry?.title}
                            onChange={(e) => isNew
                                ? setNewEntry({...newEntry, title: e.target.value})
                                : setEditingEntry({...editingEntry!, title: e.target.value})
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={isNew ? newEntry.description : editingEntry?.description}
                            onChange={(e) => isNew
                                ? setNewEntry({...newEntry, description: e.target.value})
                                : setEditingEntry({...editingEntry!, description: e.target.value})
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <Select
                            value={isNew ? newEntry.type : editingEntry?.type}
                            onValueChange={(value: 'class' | 'assignment' | 'exam' | 'other') => isNew
                                ? setNewEntry({...newEntry, type: value})
                                : setEditingEntry({...editingEntry!, type: value})
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class">Class</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                                <SelectItem value="exam">Exam</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={format(isNew ? newEntry.date : editingEntry?.date || new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => {
                                const newDate = new Date(e.target.value)
                                isNew
                                    ? setNewEntry({...newEntry, date: newDate})
                                    : setEditingEntry({...editingEntry!, date: newDate})
                            }}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <Button onClick={isNew ? addEntry : updateEntry}>
                    {isNew ? 'Add Entry' : 'Update Entry'}
                </Button>
            </DialogContent>
        </Dialog>
    )

    const renderEntries = (entries: CalendarEntry[]) => (
        <ScrollArea className={`${mode === 'full' ? 'h-[400px]' : 'h-[200px]'}`}>
            {entries.length === 0 ? (
                <p className="text-center text-muted-foreground">No entries found.</p>
            ) : (
                entries.map(entry => (
                    <div key={entry._id?.toString()} className="flex items-center justify-between p-2 border-b">
                        <div>
                            <h4 className="font-semibold">{entry.title}</h4>
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {entry.type}
                </span>
                                <span className="text-xs text-muted-foreground">
                  {format(entry.date, 'MMM d, yyyy')}
                </span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {renderEntryDialog(entry, false)}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => entry._id && deleteEntry(entry._id)}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </ScrollArea>
    )

    return (
        <Card className={`${mode === 'full' ? 'w-full' : 'w-max'} h-[500px]`}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Calendar</span>
                    {renderEntryDialog(null, true)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                        <TabsTrigger value="list">List View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="calendar" className="h-[400px] overflow-hidden">
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <div>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Entries for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
                                </h3>
                                {renderEntries(entriesForSelectedDate)}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="list" className="h-[400px] overflow-hidden">
                        <div>
                            <h3 className="font-semibold mb-2">Upcoming Events</h3>
                            {renderEntries(upcomingEntries)}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}