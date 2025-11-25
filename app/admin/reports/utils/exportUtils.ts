interface AttendanceData {
  employee: string;
  department: string;
  workDays: number;
  presentDays: number;
  absences: number;
  rate: number;
}

interface LeaveData {
  employee: string;
  department: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}

interface DepartmentStats {
  name: string;
  employees: number;
  attendance: number;
  leaves: number;
}

interface TimesheetData {
  angajat: string;
  departament: string;
  prezenta: string;
  update_pr: string;
  lucru_acasa: string;
  status: string;
  ora_trimitere: string;
}
export const exportToCSV = (data: any[], filename: string, type: 'attendance' | 'leave' | 'summary' | 'timesheet') => {
  let csvContent = '';
  
  if (type === 'attendance') {
    csvContent = 'Angajat,Departament,Zile Lucru,Prezent,Absent,Rata Prezenta\n';
    data.forEach((row: AttendanceData) => {
      csvContent += `"${row.employee}","${row.department}",${row.workDays},${row.presentDays},${row.absences},${row.rate}%\n`;
    });
  } else if (type === 'leave') {
    csvContent = 'Angajat,Departament,Total Zile,Folosite,Ramase,Pendente\n';
    data.forEach((row: LeaveData) => {
      csvContent += `"${row.employee}","${row.department}",${row.totalDays},${row.usedDays},${row.remainingDays},${row.pendingDays}\n`;
    });
  } else if (type === 'summary') {
    csvContent = 'Departament,Angajati,Rata Prezenta,Zile Concediu\n';
    data.forEach((row: DepartmentStats) => {
      csvContent += `"${row.name}",${row.employees},${row.attendance}%,${row.leaves}\n`;
    });
  } else if (type === 'timesheet') {
    csvContent = 'Angajat,Departament,Status,Ora Trimitere\n';
    data.forEach((row: TimesheetData) => {
      csvContent += `"${row.angajat}","${row.departament}","${row.status}","${row.ora_trimitere}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = (data: any[], filename: string, type: 'attendance' | 'leave' | 'summary' | 'timesheet') => {
  let headers: string[] = [];
  let rows: string[][] = [];

  if (type === 'attendance') {
    headers = ['Angajat', 'Departament', 'Zile Lucru', 'Prezent', 'Absent', 'Rata Prezenta'];
    rows = data.map((row: AttendanceData) => [
      row.employee,
      row.department,
      row.workDays.toString(),
      row.presentDays.toString(),
      row.absences.toString(),
      `${row.rate}%`
    ]);
  } else if (type === 'leave') {
    headers = ['Angajat', 'Departament', 'Total Zile', 'Folosite', 'Ramase', 'Pendente'];
    rows = data.map((row: LeaveData) => [
      row.employee,
      row.department,
      row.totalDays.toString(),
      row.usedDays.toString(),
      row.remainingDays.toString(),
      row.pendingDays.toString()
    ]);
  } else if (type === 'summary') {
    headers = ['Departament', 'Angajati', 'Rata Prezenta', 'Zile Concediu'];
    rows = data.map((row: DepartmentStats) => [
      row.name,
      row.employees.toString(),
      `${row.attendance}%`,
      row.leaves.toString()
    ]);
  } else if (type === 'timesheet') {
    headers = ['Angajat', 'Departament', 'Status', 'Ora Trimitere'];
    rows = data.map((row: TimesheetData) => [
      row.angajat,
      row.departament,
      row.status,
      row.ora_trimitere
    ]);
  }

  // Create Excel file using the most reliable method - Tab-separated values with .xls extension
  // This approach is widely supported and opens correctly in Excel, LibreOffice, Google Sheets
  const createExcelContent = (headers: string[], rows: string[][]) => {
    // Use tab separation for better Excel compatibility
    const headerRow = headers.join('\t');
    const dataRows = rows.map(row => row.join('\t')).join('\n');
    return headerRow + '\n' + dataRows;
  };

  const excelContent = createExcelContent(headers, rows);
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const finalContent = BOM + excelContent;
  
  // Create blob with Excel MIME type
  const blob = new Blob([finalContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  });
  
  // Create and trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${filename}.xls`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const exportToPDF = (data: any[], filename: string, type: 'attendance' | 'leave' | 'summary' | 'timesheet', selectedMonth: string) => {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocker detectat. Te rog permite popup-urile pentru export PDF.');
    return;
  }

  let headers: string[] = [];
  let rows: string[][] = [];
  let reportTitle = '';

  if (type === 'attendance') {
    reportTitle = 'Raport Prezenta Detailat';
    headers = ['Angajat', 'Departament', 'Zile Lucru', 'Prezent', 'Absent', 'Rata'];
    rows = data.map((row: AttendanceData) => [
      row.employee,
      row.department,
      row.workDays.toString(),
      row.presentDays.toString(),
      row.absences.toString(),
      `${row.rate}%`
    ]);
  } else if (type === 'leave') {
    reportTitle = 'Raport Concedii Detailat';
    headers = ['Angajat', 'Departament', 'Total', 'Folosite', 'Ramase', 'Pendente'];
    rows = data.map((row: LeaveData) => [
      row.employee,
      row.department,
      row.totalDays.toString(),
      row.usedDays.toString(),
      row.remainingDays.toString(),
      row.pendingDays.toString()
    ]);
  } else if (type === 'summary') {
    reportTitle = 'Sumar pe Departamente';
    headers = ['Departament', 'Angajati', 'Rata Prezenta', 'Zile Concediu'];
    rows = data.map((row: DepartmentStats) => [
      row.name,
      row.employees.toString(),
      `${row.attendance}%`,
      row.leaves.toString()
    ]);
  } else if (type === 'timesheet') {
    reportTitle = 'Raport Pontaj Zilnic';
    headers = ['Angajat', 'Departament', 'Status', 'Ora'];
    rows = data.map((row: TimesheetData) => [
      row.angajat,
      row.departament,
      row.status,
      row.ora_trimitere
    ]);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportTitle}</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          .no-print {
            display: none !important;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #4472C4;
          padding-bottom: 15px;
        }
        
        .header h1 {
          color: #4472C4;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        
        .header h2 {
          color: #666;
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: normal;
        }
        
        .header .meta {
          color: #888;
          font-size: 14px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #4472C4;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        tr:hover {
          background-color: #f5f5f5;
        }
        
        .print-button {
          background-color: #4472C4;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 20px 0;
        }
        
        .print-button:hover {
          background-color: #365a96;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #888;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Raport Angajati</h1>
        <h2>${reportTitle}</h2>
        <div class="meta">
          <div>Perioada: ${selectedMonth}</div>
          <div>Generat la: ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO')}</div>
        </div>
      </div>
      
      <button class="print-button no-print" onclick="window.print()">
        🖨️ Printează / Salvează ca PDF
      </button>
      
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <div>Sistem de Management Pontaj - Generat automat</div>
        <div>Total înregistrări: ${rows.length}</div>
      </div>
      
      <script>
        // Auto-focus for immediate printing
        window.addEventListener('load', function() {
          // Optional: Auto-print after 1 second
          // setTimeout(() => window.print(), 1000);
        });
        
        // Close window after printing
        window.addEventListener('afterprint', function() {
          setTimeout(() => window.close(), 500);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Focus the new window for better user experience
  printWindow.focus();
};

export const getFormattedFilename = (type: string, selectedMonth: string) => {
  const monthYear = selectedMonth.replace('-', '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  return `raport_${type}_${monthYear}_${timestamp}`;
};