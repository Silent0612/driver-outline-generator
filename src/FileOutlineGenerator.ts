import * as path from 'path';
import { DriverSymbolCollector } from './symbolCollector';
import { OutlineFormatter } from './outlineFormatter';
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

    async generateOutline(directoryPath: string, onProgress?: (done: number, total: number) => void): Promise<string> {
        if (!path.isAbsolute(directoryPath)) {
            throw new Error('目录路径必须是绝对路径');
        }

        try {
            // 收集所有符号  
            const symbols = await this.collector.collectSymbolsFromDirectory(directoryPath, onProgress);

            if (symbols.length === 0) {
                throw new Error('未找到任何C/C++符号，请确保目录包含.c、.h等源文件');
            }

            // 格式化大纲  
            const outline = this.formatter.formatOutline(symbols, directoryPath);

            // 输出文件  
            const outputPath = path.join(directoryPath, 'driver_outline.json');
            await this.writer.writeOutlineFile(outline, outputPath);

            return outputPath;
        } catch (error) {
            throw new Error(`生成文件目录大纲失败: ${error}`);
        }
    }
}