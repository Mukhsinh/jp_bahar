/**
 * Lazy import utilities for heavy dependencies
 * Reduces initial bundle size by loading libraries only when needed
 */

// PDF Export - Load only when user initiates PDF export
export const loadPDFLibraries = async () => {
  const [jsPDF, autoTable] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])
  
  return {
    jsPDF: jsPDF.default,
    autoTable: autoTable.default
  }
}

// Excel Export - Load only when user initiates Excel export
export const loadExcelLibraries = async () => {
  const XLSX = await import('xlsx')
  return XLSX
}

// Chart Libraries - Load only when dashboard is accessed
export const loadChartLibraries = async () => {
  const recharts = await import('recharts')
  return recharts
}

// Date utilities - Load only when needed
export const loadDateLibraries = async () => {
  const dateFns = await import('date-fns')
  return dateFns
}