import * as vscode from 'vscode';
import { DriverOutlineGenerator } from './FileOutlineGenerator';

export function activate(context: vscode.ExtensionContext) {
	console.log('C/C++ File Outline Generator 扩展已激活');

	// 注册生成大纲命令  
	const generateOutlineCommand = vscode.commands.registerCommand(
		'ccppFileOutline.generate',
		async (uri?: vscode.Uri) => {
			const targetPath = uri?.fsPath || getWorkspaceRoot();

			if (!targetPath) {
				vscode.window.showErrorMessage('请先打开一个工作区或选择一个文件夹');
				return;
			}

			const generator = new DriverOutlineGenerator();

			try {
				const outputPath = await vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "正在生成C/C++文件大纲...",
					cancellable: false
				}, async (progress) => {
					progress.report({ increment: 0, message: "扫描文件..." });
					const resultPath = await generator.generateOutline(targetPath, (done, total) => {
						const percent = total === 0 ? 0 : Math.min(99, Math.floor((done / total) * 99));
						progress.report({ increment: 0, message: `解析符号 ${done}/${total}` });
						progress.report({ increment: percent });
					});
					progress.report({ increment: 100, message: "完成" });
					return resultPath;
				});

				const action = await vscode.window.showInformationMessage(
					`C/C++文件大纲已生成: ${outputPath}`,
					'打开文件', '在资源管理器中显示'
				);

				if (action === '打开文件') {
					await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(outputPath));
				} else if (action === '在资源管理器中显示') {
					await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outputPath));
				}

			} catch (error) {
				vscode.window.showErrorMessage(`生成大纲失败: ${error}`);
			}
		}
	);

	// 注册到扩展的订阅列表  
	context.subscriptions.push(generateOutlineCommand);
}

function getWorkspaceRoot(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	return workspaceFolders?.[0]?.uri.fsPath;
}

export function deactivate() {
	console.log('Driver Outline Generator 扩展已停用');
}