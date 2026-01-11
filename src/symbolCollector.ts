import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface DriverSymbol {
    name: string;
    kind: vscode.SymbolKind;
    filePath: string;
    range: vscode.Range;
    detail?: string;
    children?: DriverSymbol[];
}

export interface CollectionResult {
    allFiles: string[];
    symbols: DriverSymbol[];
}

export class DriverSymbolCollector {
    private readonly cFileExtensions = /\.(c|h|cpp|hpp|cc|cxx|c\+\+|h\+\+|inl|txx)$/i;
    private readonly ignoredDirs = ['.git', '.vscode', 'node_modules', 'build', 'dist', 'out', '__pycache__'];
    private readonly maxConcurrent = 8; // 避免一次性打开过多文件

    async collectSymbolsFromDirectory(dirPath: string, onProgress?: (done: number, total: number) => void): Promise<CollectionResult> {
        const allSymbols: DriverSymbol[] = [];
        const files = await this.getCAndHFiles(dirPath);

        const total = files.length;
        let done = 0;

        await this.runWithLimit(files, this.maxConcurrent, async (file) => {
            try {
                const symbols = await this.getSymbolsFromFile(file);
                allSymbols.push(...symbols);
            } catch (error) {
                console.warn(`无法处理文件 ${file}: ${error}`);
            } finally {
                done += 1;
                onProgress?.(done, total);
            }
        });

        return {
            allFiles: files,
            symbols: allSymbols
        };
    }

    private async getCAndHFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    if (!this.shouldIgnoreDirectory(entry.name)) {
                        files.push(...await this.getCAndHFiles(fullPath));
                    }
                } else if (this.isCOrHFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.warn(`无法读取目录 ${dirPath}: ${error}`);
        }

        return files;
    }

    private shouldIgnoreDirectory(dirName: string): boolean {
        return this.ignoredDirs.includes(dirName) || dirName.startsWith('.');
    }

    private isCOrHFile(fileName: string): boolean {
        return this.cFileExtensions.test(fileName);
    }

    private async getSymbolsFromFile(filePath: string): Promise<DriverSymbol[]> {
        const document = await vscode.workspace.openTextDocument(filePath);

        // 尝试多次以适配语言服务器预热阶段
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (symbols && symbols.length >= 0) {
                return this.convertToDriverSymbols(symbols, filePath);
            }

            // 渐进退避：100ms, 300ms, 600ms
            const delayMs = attempt === 1 ? 100 : attempt === 2 ? 300 : 600;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // 最终仍无符号，返回空集合（文件仍会在结果中被记录）
        return [];
    }

    private convertToDriverSymbols(symbols: vscode.DocumentSymbol[], filePath: string): DriverSymbol[] {
        return symbols.map(symbol => ({
            name: symbol.name,
            kind: symbol.kind,
            filePath: filePath,
            range: symbol.range,
            detail: symbol.detail,
            children: symbol.children && symbol.children.length > 0
                ? this.convertToDriverSymbols(symbol.children, filePath)
                : undefined
        }));
    }

    // 简单的并发限制执行器，避免一次性打开过多文件导致卡顿
    private async runWithLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
        const executing: Promise<void>[] = [];

        for (const item of items) {
            const p = Promise.resolve().then(() => worker(item));
            executing.push(p);

            p.finally(() => {
                const idx = executing.indexOf(p);
                if (idx >= 0) {
                    executing.splice(idx, 1);
                }
            });

            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }

        await Promise.all(executing);
    }
}