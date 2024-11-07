'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {ChevronLeft, ChevronRight, Clock, Plus, Edit, Trash2} from 'lucide-react'
import {format, addDays, subDays, isSameDay} from 'date-fns'
import {ObjectId} from 'mongodb'

interface ScheduleItem {
    _id?: ObjectId
    title: string
    startTime: string
    endTime: string
    type: 'class' | 'study' | 'break' | 'other'
    date: Date
}

export default function DailyScheduleWidget() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
    const [newItem, setNewItem] = useState<Omit<ScheduleItem, '_id'>>({
        title: '',
        startTime: '',
        endTime: '',
        type: 'other',
        date: new Date()
    })
    const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)

    useEffect(() => {
        fetchScheduleItems()
    }, [currentDate])

    const fetchScheduleItems = async () => {
        try {
            // Add date parameters to the URL for filtering
            const startDate = new Date(currentDate.setHours(0, 0, 0, 0)).toISOString()
            const endDate = new Date(currentDate.setHours(23, 59, 59, 999)).toISOString()

            const response = await fetch(
                `/api/db/scheduleEntries?startDate=${startDate}&endDate=${endDate}`
            )
            if (!response.ok) throw new Error('Failed to fetch schedule items')

            const data = await response.json()
            // Convert string dates back to Date objects
            const itemsWithDates = data.map((item: any) => ({
                ...item,
                date: new Date(item.date)
            }))
            setScheduleItems(itemsWithDates)
        } catch (error) {
            console.error('Failed to fetch schedule items:', error)
        }
    }

    const addScheduleItem = async () => {
        try {
            const response = await fetch('/api/db/scheduleEntries', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...newItem,
                    date: currentDate
                })
            })
            if (!response.ok) throw new Error('Failed to add schedule item')

            const insertedItem = await response.json()
            setScheduleItems([...scheduleItems, {
                ...insertedItem,
                date: new Date(insertedItem.date)
            }])
            setNewItem({
                title: '',
                startTime: '',
                endTime: '',
                type: 'other',
                date: new Date()
            })
        } catch (error) {
            console.error('Failed to add schedule item:', error)
        }
    }

    const updateScheduleItem = async () => {
        if (editingItem && editingItem._id) {
            try {
                const response = await fetch('/api/db/scheduleEntries', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(editingItem)
                })
                if (!response.ok) throw new Error('Failed to update schedule item')

                setScheduleItems(scheduleItems.map(item =>
                    item._id === editingItem._id ? editingItem : item
                ))
                setEditingItem(null)
            } catch (error) {
                console.error('Failed to update schedule item:', error)
            }
        }
    }

    const deleteScheduleItem = async (id: ObjectId) => {
        try {
            const response = await fetch('/api/db/scheduleEntries', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id})
            })
            if (!response.ok) throw new Error('Failed to delete schedule item')

            setScheduleItems(scheduleItems.filter(item => item._id !== id))
        } catch (error) {
            console.error('Failed to delete schedule item:', error)
        }
    }

    const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1))
    const goToNextDay = () => setCurrentDate(addDays(currentDate, 1))

    const isToday = isSameDay(currentDate, new Date())

    const getItemColor = (type: ScheduleItem['type']) => {
        switch (type) {
            case 'class':
                return 'bg-blue-100 border-blue-300 text-blue-800'
            case 'study':
                return 'bg-green-100 border-green-300 text-green-800'
            case 'break':
                return 'bg-yellow-100 border-yellow-300 text-yellow-800'
            default:
                return 'bg-gray-700 border-gray-300 text-blue-400'
        }
    }

    const renderScheduleItemDialog = (item: ScheduleItem | null, isNew: boolean) => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    {isNew ? <Plus className="h-4 w-4 mr-2"/> : <Edit className="h-4 w-4 mr-2"/>}
                    {isNew ? 'Add Item' : 'Edit'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Add New Schedule Item' : 'Edit Schedule Item'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={isNew ? newItem.title : editingItem?.title}
                            onChange={(e) => isNew
                                ? setNewItem({...newItem, title: e.target.value})
                                : setEditingItem({...editingItem!, title: e.target.value})
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startTime" className="text-right">
                            Start Time
                        </Label>
                        <Input
                            id="startTime"
                            type="time"
                            value={isNew ? newItem.startTime : editingItem?.startTime}
                            onChange={(e) => isNew
                                ? setNewItem({...newItem, startTime: e.target.value})
                                : setEditingItem({...editingItem!, startTime: e.target.value})
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endTime" className="text-right">
                            End Time
                        </Label>
                        <Input
                            id="endTime"
                            type="time"
                            value={isNew ? newItem.endTime : editingItem?.endTime}
                            onChange={(e) => isNew
                                ? setNewItem({...newItem, endTime: e.target.value})
                                : setEditingItem({...editingItem!, endTime: e.target.value})
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <select
                            id="type"
                            value={isNew ? newItem.type : editingItem?.type}
                            onChange={(e) => isNew
                                ? setNewItem({...newItem, type: e.target.value as ScheduleItem['type']})
                                : setEditingItem({...editingItem!, type: e.target.value as ScheduleItem['type']})
                            }
                            className="col-span-3"
                        >
                            <option value="class">Class</option>
                            <option value="study">Study</option>
                            <option value="break">Break</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <Button onClick={isNew ? addScheduleItem : updateScheduleItem}>
                    {isNew ? 'Add Item' : 'Update Item'}
                </Button>
            </DialogContent>
        </Dialog>
    )

    return (
        <Card className="w-full h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">Daily Schedule</CardTitle>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPreviousDay}
                        aria-label="Previous day"
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <span className="text-sm font-medium">
            {isToday ? 'Today' : format(currentDate, 'MMM d, yyyy')}
          </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextDay}
                        aria-label="Next day"
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Clock className="h-5 w-5 text-muted-foreground"/>
                    {renderScheduleItemDialog(null, true)}
                </div>
                <ScrollArea className="h-[280px] pr-4">
                    {scheduleItems.length === 0 ? (
                        <p className="text-center text-muted-foreground">No schedule items for this day.</p>
                    ) : (
                        scheduleItems
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map(item => (
                                <div
                                    key={item._id?.toString()}
                                    className={`mb-2 p-2 rounded-md border ${getItemColor(item.type)}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold">{item.title}</h4>
                                            <p className="text-sm">
                                                {item.startTime} - {item.endTime}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {renderScheduleItemDialog(item, false)}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => item._id && deleteScheduleItem(item._id)}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}