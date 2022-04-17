// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as cp from 'child_process';
import * as vscode from 'vscode';

let channel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    channel = vscode.window.createOutputChannel('dynamic_intl');

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'dynamic-intl-plugin.generate',
            generateIntlFiles
        )
    );

    initFileWatcher();
}

function initFileWatcher() {
    let timeout: NodeJS.Timeout | null = null;
    function _scheduleGeneration() {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(
            () =>
                vscode.commands.executeCommand('dynamic-intl-plugin.generate'),
            1000
        );
    }

    const fsWatcher =
        vscode.workspace.createFileSystemWatcher('**/lib/l10n/*.arb');
    fsWatcher.onDidChange(() => _scheduleGeneration());
    fsWatcher.onDidCreate(() => _scheduleGeneration());
    fsWatcher.onDidDelete(() => _scheduleGeneration());
}

// this method is called when your extension is deactivated
export function deactivate() {
    channel.dispose();
}

function generateIntlFiles() {
    const workingFolders = vscode.workspace.workspaceFolders;
    if (workingFolders !== undefined && workingFolders.length > 0) {
        const workingFolder = workingFolders[0];
        const path = workingFolder.uri.fsPath;

        channel.clear();
        channel.show();

        const command = 'flutter pub run dynamic_intl_generator';
        channel.appendLine(`> ${command}`);

        const process = cp.exec(
            `cd ${path} && ${command}`,
            (err, stdout, stderr) => {
                if (err !== null) {
                    channel.appendLine(`${err.code} ${err.message}`);
                }
                if (stdout !== null) {
                    channel.appendLine(stdout);
                }
                if (stderr !== null) {
                    channel.appendLine(stderr);
                }
            }
        );

        process.on('close', (code) => {
            channel.appendLine(`process closed with code ${code}`);
        });
    } else {
        vscode.window.showErrorMessage('Project are not opened');
    }
}
