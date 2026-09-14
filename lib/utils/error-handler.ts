/**
 * Centralized error handling utilities
 * Eliminates error handling duplication across API routes and services
 */

import { NextResponse } from 'next/server'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export function createApiError(
  message: string, 
  status: number = 500, 
  code?: string,
  details?: any
): ApiError {
  return { message, status, code, details }
}

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error)
  
  // Handle known error types
  if (error.status && error.message) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status }
    )
  }
  
  // Handle Supabase errors
  if (error.code && error.message) {
    const status = error.code === 'PGRST116' ? 404 : 400
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    )
  }
  
  // Handle generic errors
  return NextResponse.json(
    { error: 'Terjadi kesalahan internal server' },
    { status: 500 }
  )
}

export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export function logError(context: string, error: any, details?: any) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    details
  })
}