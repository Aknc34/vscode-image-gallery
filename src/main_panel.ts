import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

export async function createPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'imagegallery',
        'Image Gallery',
        vscode.ViewColumn.One,
        {
            localResourceRoots: [
                vscode.Uri.file(
                    utils.getCwd()),
                vscode.Uri.file(path.join(context.extensionPath, 'media'),
                ),
            ],
            enableScripts: true,
        }
    );

    const imgPaths = await getImagePaths();
    const imgWebviewUris = imgPaths.map(
        imgPath => panel.webview.asWebviewUri(imgPath)
    );
    panel.webview.html = getWebviewContent(context, panel.webview, imgWebviewUris);

    return panel;
}

export async function getImagePaths() {
    const imgExtensions = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
    ];
    const files = await vscode.workspace.findFiles('**/*.{' + imgExtensions.join(',') + '}');
    const imgPaths = files.map(
        file => vscode.Uri.file(file.fsPath)
    );
    return imgPaths;
}

export function getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    imgWebviewUris: vscode.Uri[],
) {
    const placeholder_url = "https://www.prowebdesign.ro/wp-content/uploads/2012/12/2-150x150.jpg"
    const imgHtml = imgWebviewUris.map(
        img => `
        <div class="image-container">
            <img src="${placeholder_url}" data-src="${img}" class="image lazy">
        </div>
        `
    ).join('\n');

    const styleHref = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.css')
    );

    const scriptUri = vscode.Uri.joinPath(
        context.extensionUri, 'media', 'gallery.js'
    ).with({
        'scheme': 'vscode-resource'
    });

    return (
        `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${utils.nonce}'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource};">
			
			<link href="${styleHref}" rel="stylesheet" />

			<title>Image Gallery</title>
		</head>
		<body>
			<div class="grid">
                ${imgHtml}
			</div>
			
			<script nonce="${utils.nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
    );
}