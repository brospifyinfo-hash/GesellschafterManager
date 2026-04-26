export function exportToJSON(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (data.length === 0) return

  // Generate headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportMultipleFormats(
  data: any,
  filename: string,
  formats: ('json' | 'csv')[]
) {
  formats.forEach(format => {
    if (format === 'json') {
      exportToJSON(data, filename)
    } else if (format === 'csv' && Array.isArray(data)) {
      exportToCSV(data, filename)
    }
  })
}
