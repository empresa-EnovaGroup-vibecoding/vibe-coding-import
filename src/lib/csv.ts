interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportToCSV<T>(data: T[], columns: CSVColumn<T>[], filename: string): void {
  const headers = columns.map(c => c.header).join(",");
  const rows = data.map(row =>
    columns.map(col => {
      const value = col.accessor(row);
      const stringValue = String(value ?? "");
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",")
  );

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
