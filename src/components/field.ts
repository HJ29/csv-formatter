export enum FieldType {
  text = 'TEXT',
  excel = 'EXCEL',
  index = 'INDEX',
}

interface BaseField {
  type: FieldType;
  position: number;
  label: string;
}

export interface ExcelField extends BaseField {
  type: FieldType.excel;
  range: string;
  file: any;
}

const defaultExcelField: ExcelField = {
  type: FieldType.excel,
  label: '',
  position: null,
  range: 'B9:B*',
  file: null,
};

export interface TextField extends BaseField {
  type: FieldType.text;
  value: string;
}

const defaultTextField: TextField = {
  type: FieldType.text,
  label: '',
  position: null,
  value: '',
};

export interface IndexField extends BaseField {
  type: FieldType.index;
  skip: number;
  value: number;
}

const defaultIndexField: IndexField = {
  type: FieldType.index,
  label: '',
  skip: 0,
  position: null,
  value: 0,
};

export type Field = IndexField | TextField | ExcelField;

export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

export function getDefaultField(type: FieldType, position: number = null) {
  let field;
  switch (type) {
    case FieldType.excel:
      field = clone(defaultExcelField);
      break;
    case FieldType.text:
      field = clone(defaultTextField);
      break;
    case FieldType.index:
      field = clone(defaultIndexField);
      break;
    default:
      throw new Error(`invalid type: ${type}`);
  }
  if (typeof position === 'number') {
    field.position = Number(position);
  }
  return field;
}

export function fieldToValue(
  field: ExcelField | TextField | IndexField,
  index: number,
  prevPosition = 0
): string[] {
  const spaces = field.position - prevPosition - 1;
  const result = [...new Array(spaces)].map(() => '');
  switch (field.type) {
    case FieldType.text:
      return [...result, field.value];
    case FieldType.excel:
      const [start, end] = field.range.split(':');
      let value;
      const { x, y } = columnNameToXY(start);
      if (!end) {
        value = field.file[y][x];
      } else {
        value = field.file[y + index][x];
      }
      return [...result, value];
    case FieldType.index: {
      const number = padZero(
        `${index + Number(field.skip)}`,
        Number(field.value)
      );
      return [...result, number];
    }
    default:
      return [];
  }
}

function padZero(number: string, pad: number): string {
  number = number.toString();
  while (number.length < pad + 1) number = '0' + number;
  return number;
}

// function getCsvValue(range: string, data: string[][]) {}

export function countRows(fields: Field[]): number {
  let count = 0;
  fields.forEach((field) => {
    if (field.type === FieldType.excel) {
      const [start, end] = field.range.split(':');
      if (start && end) {
        const { x: startX, y: startY } = columnNameToXY(start);
        const { x: endX, y: endY } = columnNameToXY(end);
        if (startX !== endX) {
          throw new Error(`invalid range: ${start}:${end}`);
        }
        if (typeof endY === 'number' && typeof startY === 'number') {
          // limited range
          const y = endY - startY;
          count = y > count ? y : count;
        } else if (endY === null) {
          // unlimited range
          let fileRowCount = 0;
          if (!field.file) {
            throw new Error('excel field without file');
          }
          for (let i = 0; i < field.file.length; i++) {
            const row = field.file[i];
            if (i >= startY) {
              if (
                row[startX] !== '' &&
                row[startX] !== undefined &&
                row[startX] !== null
              ) {
                const y = i - startY + 1;
                fileRowCount = y > fileRowCount ? y : fileRowCount;
              } else {
                break;
              }
            }
          }
          count = fileRowCount > count ? fileRowCount : count;
        }
      }
    }
  });
  return count;
}

function alphabetToNumber(alphabet: string) {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 0;
  for (
    let i = 0, j = alphabet.length - 1;
    i < alphabet.length;
    i += 1, j -= 1
  ) {
    result += Math.pow(base.length, j) * (base.indexOf(alphabet[i]) + 1);
  }
  return result;
}

function columnNameToXY(name: string) {
  if (!name) return null;
  const patt1 = /[0-9*]/g;
  const patt2 = /[a-zA-Z]/g;
  const row = name.match(patt2).join('');
  const x = Number(alphabetToNumber(row)) - 1;
  const col = name.match(patt1).join('');
  let y;
  if (col === '*') {
    y = null;
  } else if (!isNaN(Number(col))) {
    y = Number(col) - 1;
  }
  return {
    y,
    x,
  };
}
