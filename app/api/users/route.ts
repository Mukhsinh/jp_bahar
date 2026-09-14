import { NextResponse } from 'next/server'

/**
 * GET /api/users
 * 
 * This endpoint exists to prevent 500 errors when browser/tools
 * try to fetch /users as an API endpoint instead of navigating to the page.
 * 
 * The actual users page is at app/(authenticated)/users/page.tsx
 * and uses Server Actions for data fetching.
 */
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This is not an API endpoint',
      message: 'Please navigate to /users in your browser or use the appropriate API endpoints',
      availableEndpoints: [
        '/api/users/list - Get users list',
        '/api/users/create - Create new user',
        '/api/users/update - Update user',
        '/api/users/delete - Delete user',
        '/api/users/import - Import users from Excel',
        '/api/users/export - Export users to Excel',
        '/api/users/template - Download import template'
      ]
    },
    { status: 400 }
  )
}
