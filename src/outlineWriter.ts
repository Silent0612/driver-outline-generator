import * as fs from 'fs';
import * as path from 'path';
import { OutlineDocument, FileOutline, SymbolOutline } from './outlineFormatter';

export class OutlineWriter {
    async writeOutlineFile(outline: OutlineDocument, outputPath: string): Promise<void> {
        // 生成JSON格式  
        const jsonContent = JSON.stringify(outline, null, 2);
        const jsonPath = path.join(path.dirname(outputPath), 'driver_outline.json');
        await fs.promises.writeFile(jsonPath, jsonContent, 'utf8');

        // 生成Markdown格式  
        const markdownContent = this.generateMarkdown(outline);
        const markdownPath = path.join(path.dirname(outputPath), 'driver_outline.md');
        await fs.promises.writeFile(markdownPath, markdownContent, 'utf8');

        // 生成简化的文本格式  
        const textContent = this.generateText(outline);
        const textPath = path.join(path.dirname(outputPath), 'driver_outline.txt');
        await fs.promises.writeFile(textPath, textContent, 'utf8');
    }

    private generateMarkdown(outline: OutlineDocument): string {
        let markdown = `# ${outline.title}\n\n`;
        markdown += `**生成时间**: ${new Date(outline.generatedAt).toLocaleString('zh-CN')}\n\n`;
        markdown += `**目录**: ${outline.directory}\n\n`;
        markdown += `**统计**: ${outline.totalFiles} 个文件，${outline.totalSymbols} 个符号\n\n`;

        markdown += `## 目录结构\n\n`;
        for (const file of outline.files) {
            markdown += `- [${file.path}](#${this.slugify(file.path)}) (${file.symbolCount} 个符号)\n`;
        }

        markdown += `\n---\n\n`;

        for (const file of outline.files) {
            markdown += `## ${file.path}\n\n`;
            markdown += `**完整路径**: \`${file.fullPath}\`\n\n`;
            markdown += `**符号数量**: ${file.symbolCount}\n\n`;

            for (const symbol of file.symbols) {
                markdown += this.generateSymbolMarkdown(symbol, 3);
            }

            markdown += `---\n\n`;
        }

        return markdown;
    }

    private generateSymbolMarkdown(symbol: SymbolOutline, level: number): string {
        const heading = '#'.repeat(level);
        let markdown = `${heading} ${symbol.name}\n\n`;

        markdown += `- **类型**: ${symbol.type}\n`;
        markdown += `- **位置**: 第${symbol.line}行，第${symbol.column}列`;
        if (symbol.endLine !== symbol.line || symbol.endColumn !== symbol.column) {
            markdown += ` - 第${symbol.endLine}行，第${symbol.endColumn}列`;
        }
        markdown += `\n`;

        if (symbol.detail) {
            markdown += `- **详情**: ${symbol.detail}\n`;
        }

        markdown += `\n`;

        if (symbol.children && symbol.children.length > 0) {
            for (const child of symbol.children) {
                markdown += this.generateSymbolMarkdown(child, level + 1);
            }
        }

        return markdown;
    }

    private generateText(outline: OutlineDocument): string {
        let text = `${outline.title}\n`;
        text += `${'='.repeat(outline.title.length)}\n\n`;
        text += `生成时间: ${new Date(outline.generatedAt).toLocaleString('zh-CN')}\n`;
        text += `目录: ${outline.directory}\n`;
        text += `统计: ${outline.totalFiles} 个文件，${outline.totalSymbols} 个符号\n\n`;

        for (const file of outline.files) {
            text += `${file.path}\n`;
            text += `${'-'.repeat(file.path.length)}\n`;
            text += `完整路径: ${file.fullPath}\n`;
            text += `符号数量: ${file.symbolCount}\n\n`;

            for (const symbol of file.symbols) {
                text += this.generateSymbolText(symbol, '');
            }

            text += '\n';
        }

        return text;
    }

    private generateSymbolText(symbol: SymbolOutline, indent: string): string {
        let text = `${indent}${symbol.name} (${symbol.type}) - 第${symbol.line}行\n`;

        if (symbol.detail) {
            text += `${indent}  详情: ${symbol.detail}\n`;
        }

        if (symbol.children && symbol.children.length > 0) {
            for (const child of symbol.children) {
                text += this.generateSymbolText(child, indent + '  ');
            }
        }

        return text;
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}