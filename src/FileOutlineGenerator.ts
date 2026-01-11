import * as path from 'path';
import { DriverSymbolCollector } from './symbolCollector';
import { OutlineFormatter, OutlineDocument } from './outlineFormatter';
import { OutlineWriter } from './outlineWriter';

export class DriverOutlineGenerator {
    private collector: DriverSymbolCollector;
    private formatter: OutlineFormatter;
    private writer: OutlineWriter;

    constructor() {
        this.collector = new DriverSymbolCollector();
        this.formatter = new OutlineFormatter();
        this.writer = new OutlineWriter();
    }

    async generateOutlineRaw(directoryPath: string, onProgress?: (done: number, total: number) => void): Promise<OutlineDocument> {
        if (!path.isAbsolute(directoryPath)) {
            throw new Error('目录路径必须是绝对路径');
        }

        try {
            const result = await this.collector.collectSymbolsFromDirectory(directoryPath, onProgress);

            if (result.allFiles.length === 0) {
                throw new Error('未找到任何C/C++文件，请确保目录包含.c、.h等源文件');
            }

            const outline = this.formatter.formatOutline(result, directoryPath);
            return outline;
        } catch (error) {
            throw new Error(`生成文件目录大纲失败: ${error}`);
        }
    }

    async writeOutline(outline: OutlineDocument, directoryPath: string): Promise<void> {
        const outputPath = path.join(directoryPath, 'driver_outline.json');
        await this.writer.writeOutlineFile(outline, outputPath);
    }

    async generateOutline(directoryPath: string, onProgress?: (done: number, total: number) => void): Promise<string> {
        const outline = await this.generateOutlineRaw(directoryPath, onProgress);
        await this.writeOutline(outline, directoryPath);
        return path.join(directoryPath, 'driver_outline.json');
    }
}