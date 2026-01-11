import * as vscode from 'vscode';
import * as path from 'path';
import { DriverSymbol, CollectionResult } from './symbolCollector';

export interface OutlineDocument {
    title: string;
    generatedAt: string;
    directory: string;
    totalFiles: number;
    totalSymbols: number;
    files: FileOutline[];
}

export interface FileOutline {
    path: string;
    fullPath: string;
    symbols: SymbolOutline[];
    symbolCount: number;
}

export interface SymbolOutline {
    name: string;
    type: string;
    typeCode: number;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    detail?: string;
    children?: SymbolOutline[];
}

export class OutlineFormatter {
    formatOutline(result: CollectionResult, directory: string): OutlineDocument {
        const fileMap = new Map<string, DriverSymbol[]>();

        // 初始化所有文件（即使没有符号）
        result.allFiles.forEach(filePath => {
            fileMap.set(filePath, []);
        });

        // 按文件分组符号  
        result.symbols.forEach(symbol => {
            if (fileMap.has(symbol.filePath)) {
                fileMap.get(symbol.filePath)!.push(symbol);
            }
        });

        const files: FileOutline[] = [];
        let totalSymbols = 0;

        for (const [filePath, fileSymbols] of fileMap) {
            const sortedSymbols = this.sortSymbols(fileSymbols);
            const symbolOutlines = sortedSymbols.map(symbol => this.formatSymbol(symbol));

            files.push({
                path: path.relative(directory, filePath),
                fullPath: filePath,
                symbols: symbolOutlines,
                symbolCount: this.countSymbols(symbolOutlines)
            });

            totalSymbols += this.countSymbols(symbolOutlines);
        }

        return {
            title: "C/C++文件大纲",
            generatedAt: new Date().toISOString(),
            directory: directory,
            totalFiles: files.length,
            totalSymbols: totalSymbols,
            files: files.sort((a, b) => a.path.localeCompare(b.path))
        };
    }

    private sortSymbols(symbols: DriverSymbol[]): DriverSymbol[] {
        return symbols.sort((a, b) => {
            // 首先按行号排序  
            if (a.range.start.line !== b.range.start.line) {
                return a.range.start.line - b.range.start.line;
            }
            // 然后按列号排序  
            return a.range.start.character - b.range.start.character;
        });
    }

    private formatSymbol(symbol: DriverSymbol): SymbolOutline {
        return {
            name: symbol.name,
            type: this.getSymbolTypeName(symbol.kind),
            typeCode: symbol.kind,
            line: symbol.range.start.line + 1,
            column: symbol.range.start.character + 1,
            endLine: symbol.range.end.line + 1,
            endColumn: symbol.range.end.character + 1,
            detail: symbol.detail,
            children: symbol.children && symbol.children.length > 0
                ? this.sortSymbols(symbol.children).map(child => this.formatSymbol(child))
                : undefined
        };
    }

    private countSymbols(symbols: SymbolOutline[]): number {
        let count = symbols.length;
        for (const symbol of symbols) {
            if (symbol.children) {
                count += this.countSymbols(symbol.children);
            }
        }
        return count;
    }

    private getSymbolTypeName(kind: vscode.SymbolKind): string {
        const typeNames: { [key: number]: string } = {
            [vscode.SymbolKind.File]: "文件",
            [vscode.SymbolKind.Module]: "模块",
            [vscode.SymbolKind.Namespace]: "命名空间",
            [vscode.SymbolKind.Package]: "包",
            [vscode.SymbolKind.Class]: "类",
            [vscode.SymbolKind.Method]: "方法",
            [vscode.SymbolKind.Property]: "属性",
            [vscode.SymbolKind.Field]: "字段",
            [vscode.SymbolKind.Constructor]: "构造函数",
            [vscode.SymbolKind.Enum]: "枚举",
            [vscode.SymbolKind.Interface]: "接口",
            [vscode.SymbolKind.Function]: "函数",
            [vscode.SymbolKind.Variable]: "变量",
            [vscode.SymbolKind.Constant]: "常量",
            [vscode.SymbolKind.String]: "字符串",
            [vscode.SymbolKind.Number]: "数字",
            [vscode.SymbolKind.Boolean]: "布尔值",
            [vscode.SymbolKind.Array]: "数组",
            [vscode.SymbolKind.Object]: "对象",
            [vscode.SymbolKind.Key]: "键",
            [vscode.SymbolKind.Null]: "空值",
            [vscode.SymbolKind.EnumMember]: "枚举成员",
            [vscode.SymbolKind.Struct]: "结构体",
            [vscode.SymbolKind.Event]: "事件",
            [vscode.SymbolKind.Operator]: "操作符",
            [vscode.SymbolKind.TypeParameter]: "类型参数"
        };

        return typeNames[kind] || "未知";
    }
}