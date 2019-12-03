/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */

import * as _ from 'lodash'

import { TableDefinition } from './schemaInterfaces'
import Options from './options'

function nameIsReservedKeyword (name: string): boolean {
    const reservedKeywords = [
        'string',
        'number',
        'package',
        'symbol'
    ]
    return reservedKeywords.indexOf(name) !== -1
}

function normalizeName (name: string, options: Options): string {
    if (nameIsReservedKeyword(name)) {
        return name + '_'
    } else {
        return name
    }
}

export function generateTableInterface (tableNameRaw: string, tableDefinition: TableDefinition, options: Options) {
    const tableName = options.transformTypeName(tableNameRaw)
    let members = ''
    Object.keys(tableDefinition).filter(c=>['id', 'createdAt', 'updatedAt'].indexOf(c)<0).map(c => options.transformColumnName(c)).forEach((columnName) => {
        members += `${columnName}: ${tableName}Fields.${normalizeName(columnName, options)};\n`
    })
    const constructorstr = Object.keys(tableDefinition).filter(c=>['id', 'createdAt', 'updatedAt'].indexOf(c)<0).map(c => {
      const definition = tableDefinition[c];
      const fieldType = definition['tsType'];
      const fieldName = options.transformColumnName(c);
      const type = `${tableName}Fields.${normalizeName(fieldName, options)}`;
      let assignToField = '';
      switch (fieldType) {
        case 'Date':
          const nullable = tableDefinition[c].nullable;
          assignToField = nullable ?  `this.${fieldName} = !!raw['${c}'] ? new Date(raw['${c}']) : null;` : `this.${fieldName} = new Date(raw['${c}']);`;
          break;
        default: 
          assignToField = `this.${fieldName} = raw['${c}'] as ${type};`;
      }
      return assignToField;
    }).join('\n');

    return `
export class ${normalizeName(tableName, options)} extends CommonModel {
  static tableName = '${tableNameRaw}';
  ${members}

  constructor(raw:any) {
    super(raw);
    ${constructorstr}
  }
}

`
}

export function generateEnumType (enumObject: any, options: Options) {
    let enumString = ''
    for (let enumNameRaw in enumObject) {
        const enumName = options.transformTypeName(enumNameRaw)
        enumString += `export type ${enumName} = `
        enumString += enumObject[enumNameRaw].map((v: string) => `'${v}'`).join(' | ')
        enumString += ';\n'
    }
    return enumString
}

export function generateTableTypes (tableNameRaw: string, tableDefinition: TableDefinition, options: Options) {
    const tableName = options.transformTypeName(tableNameRaw)
    let fields = ''
    Object.keys(tableDefinition).forEach((columnNameRaw) => {
        let type = tableDefinition[columnNameRaw].tsType
        let nullable = tableDefinition[columnNameRaw].nullable ? '| null' : ''
        const columnName = options.transformColumnName(columnNameRaw)
        fields += `export type ${normalizeName(columnName, options)} = ${type}${nullable};\n`
    })

    return `
        export namespace ${tableName}Fields {
        ${fields}
        }
    `
}
