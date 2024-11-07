'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, AlertCircle, FileText, Trash2 } from 'lucide-react'

export default function PlagiarismChecker() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<Array<{ file1: string; file2: string; similarity: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      setFiles(prevFiles => [...prevFiles, ...newFiles])
      setResults([])
      setError(null)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length < 2) {
      setError('Please select at least 2 files to compare')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    files.forEach(file => {
      formData.append('docs', file)
    })

    try {
      const response = await fetch('/api/utilities/check-plagiarism', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process files')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Plagiarism Detector</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg">
            <Upload className="w-12 h-12 mb-4 text-gray-400" />
            <Input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
            >
              Select Files
            </label>
            <p className="mt-2 text-sm text-muted-foreground">
              Supported formats: PDF, DOCX
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Selected Files:</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || files.length < 2}
          >
            {loading ? 'Processing...' : 'Check Plagiarism'}
          </Button>

          {loading && <Progress value={33} className="w-full" />}

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="p-4 border rounded-lg"
                  >
                    <p className="font-medium">
                      {result.file1} vs {result.file2}
                    </p>
                    <Progress value={result.similarity} className="mt-2" />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.similarity.toFixed(1)}% similarity
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}