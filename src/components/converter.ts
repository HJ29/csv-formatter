import XLSX from 'xlsx';

export function csvToJson(file: File): Promise<string[]> {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = (event) => {
      let result = [];
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const worksheet = workbook.SheetNames[0];
      if (worksheet) {
        result = XLSX.utils.sheet_to_json(workbook.Sheets[worksheet], {
          range: 0,
          header: 1,
          blankrows: true,
        });
      }
      resolve(result);
    };
    reader.readAsBinaryString(file);
  });
}
