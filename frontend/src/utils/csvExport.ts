export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers: { key: keyof T; label: string }[]
): void {
  if (!rows || !rows.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const separator = ',';
  const csvContent: string[] = [];

  // Header row
  csvContent.push(headers.map((h) => `"${String(h.label).replace(/"/g, '""')}"`).join(separator));

  // Data rows
  for (const row of rows) {
    const line = headers.map((h) => {
      const rawVal: unknown = row[h.key];
      let valStr = '';
      if (rawVal === null || rawVal === undefined) {
        valStr = '';
      } else if (typeof rawVal === 'object') {
        valStr = JSON.stringify(rawVal);
      } else {
        valStr = String(rawVal);
      }
      return `"${valStr.replace(/"/g, '""')}"`;
    });
    csvContent.push(line.join(separator));
  }

  const blob = new Blob(['\uFEFF' + csvContent.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
