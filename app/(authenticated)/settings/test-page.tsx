'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestSettingsPage() {
  const [message, setMessage] = useState('Settings page loaded successfully!')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Settings Page</h1>
        <p className="text-gray-600 mt-1">{message}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setMessage('Button clicked!')}>
            Test Button
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
