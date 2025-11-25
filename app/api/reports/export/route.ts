import { NextRequest, NextResponse } from 'next/server';
import { reportsService } from '../../../lib/services/reportsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    if (!type || !format || !year) {
      return NextResponse.json(
        { success: false, error: 'Type, format, and year are required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Exporting report', { type, format, year, month, date });

    let data;
    let filename;

    // Load report data based on type
    switch (type) {
      case 'attendance':
        if (!month) {
          return NextResponse.json(
            { success: false, error: 'Month is required for attendance report' },
            { status: 400 }
          );
        }
        data = await reportsService.getAttendanceReport(parseInt(year), parseInt(month));
        filename = `attendance_${year}_${month}`;
        break;

      case 'leave':
        data = await reportsService.getLeaveReport(parseInt(year));
        filename = `leave_${year}`;
        break;

      case 'summary':
        if (!month) {
          return NextResponse.json(
            { success: false, error: 'Month is required for summary report' },
            { status: 400 }
          );
        }
        data = await reportsService.getDepartmentSummary(parseInt(year), parseInt(month));
        filename = `summary_${year}_${month}`;
        break;

      case 'timesheet':
        if (!date) {
          return NextResponse.json(
            { success: false, error: 'Date is required for timesheet report' },
            { status: 400 }
          );
        }
        data = await reportsService.getTimesheetReport(date);
        filename = `timesheet_${date}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Generate export based on format
    let contentType: string;
    let fileExtension: string;
    let content: string;

    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        fileExtension = 'csv';
        content = generateCSV(data, type);
        break;

      case 'excel':
        contentType = 'application/vnd.ms-excel';
        fileExtension = 'xls';
        content = generateExcel(data, type);
        break;

      case 'pdf':
        contentType = 'text/html';
        fileExtension = 'html';
        content = generatePDF(data, type, year, month || date || '');
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid export format' },
          { status: 400 }
        );
    }

    console.log('✅ Report exported successfully:', { type, format, records: data.length });

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('❌ API: Error exporting report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export report' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any[], type: string): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    )
  ].join('\n');

  return csvContent;
}

function generateExcel(data: any[], type: string): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const BOM = '\uFEFF'; // Excel UTF-8 BOM
  const excelContent = [
    headers.join('\t'),
    ...data.map(row => 
      headers.map(header => `${row[header] || ''}`).join('\t')
    )
  ].join('\n');

  return BOM + excelContent;
}

function generatePDF(data: any[], type: string, year: string, period: string): string {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Raport ${type} - ${year} ${period}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4472C4; padding-bottom: 15px; }
        .header h1 { color: #4472C4; margin: 0 0 10px 0; font-size: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4472C4; color: white; font-weight: bold; text-align: center; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .print-button { background-color: #4472C4; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 20px 0; }
        @media print { .print-button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Raport ${type.toUpperCase()}</h1>
        <div>Perioada: ${year} ${period}</div>
        <div>Generat la: ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO')}</div>
      </div>
      
      <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>
      
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      
      <script>
        window.addEventListener('afterprint', () => setTimeout(() => window.close(), 500));
      </script>
    </body>
    </html>
  `;
}