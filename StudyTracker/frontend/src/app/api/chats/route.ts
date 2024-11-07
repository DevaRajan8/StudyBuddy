import { NextResponse } from 'next/server'

const BASE_URL = 'http://localhost:5000'

export async function GET() {
    try {
        const response = await fetch(`${BASE_URL}/chats`)
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in GET route:', error)
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const response = await fetch(`${BASE_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in POST route:', error)
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()
        await fetch(`${BASE_URL}/chats/${id}`, {
            method: 'DELETE'
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE route:', error)
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, title } = await request.json()
        const response = await fetch(`${BASE_URL}/chats/${id}/title`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        })
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in PATCH route:', error)
        return NextResponse.json({ error: 'Failed to update chat title' }, { status: 500 })
    }
}
