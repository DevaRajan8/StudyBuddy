import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Type for the route params
type RouteParams = {
  params: {
    collection: string
  }
}

// Helper function to validate collection name
function isValidCollection(collection: string): boolean {
  const validCollections = ['calendarEntries', 'taskEntries', 'scheduleEntries']
  return validCollections.includes(collection)
}

// Helper function to add CORS headers
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Generic error handler with CORS
function handleError(message: string, status: number = 500) {
  return corsHeaders(NextResponse.json({ error: message }, { status }))
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  return corsHeaders(response)
}

export async function GET(request: Request, { params }: RouteParams) {
    const { collection } = params

    if (!isValidCollection(collection)) {
        return handleError('Invalid collection', 400)
    }

    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const { db } = await connectToDatabase()

        let query = {}

        if (startDate && endDate) {
            query = {
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }

            console.log('Query:', JSON.stringify(query))
        }

        const entries = await db
            .collection(collection)
            .find(query)
            .toArray()

        return corsHeaders(NextResponse.json(entries))
    } catch (error) {
        console.error('Error in GET route:', error)
        return handleError('Internal server error', 500)
    }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { collection } = params

  if (!isValidCollection(collection)) {
    return handleError('Invalid collection', 400)
  }

  try {
    const { db } = await connectToDatabase()
    const entry = await request.json()
    const result = await db.collection(collection).insertOne(entry)
    return corsHeaders(NextResponse.json({ _id: result.insertedId, ...entry }))
  } catch (error) {
    console.error('Error in POST route:', error)
    return handleError(`Failed to add ${collection} entry`)
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { collection } = params

  if (!isValidCollection(collection)) {
    return handleError('Invalid collection', 400)
  }

  try {
    const { db } = await connectToDatabase()
    const entry = await request.json()
    const { _id, ...updateData } = entry

    await db.collection(collection).updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    )
    return corsHeaders(NextResponse.json({ message: 'Entry updated successfully' }))
    } catch (error) {
    console.error('Error in PUT route:', error)
    return handleError(`Failed to update ${collection} entry`)
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { collection } = params

  if (!isValidCollection(collection)) {
    return handleError('Invalid collection', 400)
  }

  try {
    const { db } = await connectToDatabase()
    const { id } = await request.json()
    await db.collection(collection).deleteOne({ _id: new ObjectId(id) })
    return corsHeaders(NextResponse.json({ message: 'Entry deleted successfully' }))
  } catch (error) {
    console.error('Error in DELETE route:', error)
    return handleError(`Failed to delete ${collection} entry`)
  }
}