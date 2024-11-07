import React from 'react'
import {Card, CardContent, CardTitle, CardHeader} from '@/components/ui/card'

export default function StudyTips() {
    return (
        <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center">Study Tips</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2">
                    <li>Take regular breaks</li>
                    <li>Stay hydrated</li>
                    <li>Use active recall techniques</li>
                </ul>
            </CardContent>
        </Card>
    )
}