import * as path from 'path';
import * as vscode from 'vscode';
import { TFolder } from '.';
import crypto from 'crypto';

export function getCwd() {
	if (!vscode.workspace.workspaceFolders) {
		let message = "Image Gallery: Working folder not found, open a folder and try again";
		vscode.window.showErrorMessage(message);
		return '';
	}
	let cwd = vscode.workspace.workspaceFolders[0].uri.path;
	return cwd;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 16; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
export const nonce = getNonce();

export function getGlob() {
	const imgExtensions = [
		'ai',
		'avif',
		'bmp',
		'dib',
		'gif',
		'heif',
		'heic',
		'eps',
		'ico',
		'ind',
		'indd',
		'indt',
		'jp2',
		'j2k',
		'jpf',
		'jpx',
		'jpm',
		'mj2',
		'jpg',
		'jpe',
		'jpeg',
		'jpg_orig',
		'jif',
		'jfif',
		'jfi',
		'tif',
		'tiff',
		'psd',
		'png',
		'raw',
		'arw',
		'cr2',
		'nrw',
		'k25',
		'webp',
		'svg',
		'svgz',
	];
	let upperCaseImg = imgExtensions.map(ext => ext.toUpperCase());
	const globPattern = `**/*.{${[...imgExtensions, ...upperCaseImg].join(',')}}`;
	return globPattern;
}

export function getFilename(imgPath: string) {
	const filename = decodeURI(imgPath).split("/").pop();
	if (filename) {
		return filename.split("?").shift();
	}
	return filename;
}

export function hash256(str: string, truncate=16) {
	return crypto.createHash('sha256').update(str).digest('hex').substring(0, truncate);
}

export async function getFolders(imgUris: vscode.Uri[], action: "create" | "change" | "delete" = "create") {
	let folders: Record<string, TFolder> = {};
	for (const imgUri of imgUris) {
		const folderPath = path.dirname(imgUri.path);
		const key = hash256(folderPath);

		if (!folders[key]) { // first image of the folder
			folders[key] = {
				id: key,
				path: folderPath,
				images: [],
			};
		}

		if (action !== 'delete') {
			const fileStat = await vscode.workspace.fs.stat(imgUri);
			const dotIndex = imgUri.fsPath.lastIndexOf('.');
			folders[key]["images"].push({
				id: hash256(imgUri.path),
				uri: imgUri,
				ext: imgUri.fsPath.slice(dotIndex + 1).toUpperCase(),
				size: fileStat.size,
				mtime: fileStat.mtime,
				ctime: fileStat.ctime,
			});
		}
	}
	return folders;
}