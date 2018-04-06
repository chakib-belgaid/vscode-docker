"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const telemetry_1 = require("../telemetry/telemetry");
const dockerExtension_1 = require("../dockerExtension");
const teleCmdId = 'vscode-docker.image.build';
function getDockerFileUris(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield vscode.workspace.findFiles(new vscode.RelativePattern(folder, dockerExtension_1.DOCKERFILE_GLOB_PATTERN), null, 1000, null);
    });
}
function createItem(folder, uri) {
    let filePath = path.join(".", uri.fsPath.substr(folder.uri.fsPath.length));
    return {
        description: null,
        file: filePath,
        label: filePath,
        path: path.dirname(filePath)
    };
}
function computeItems(folder, uris) {
    let folder1,x ;
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document) {

        let x = vscode.window.activeTextEditor.document.fileName;
        folder1 = path.dirname(x);
   
    }
    let items = [];
    for (let i = 0; i < uris.length; i++) {
        if(folder1 && path.dirname(uris[i].fsPath) == folder1)
        x=i; 
        else
        items.push(createItem(folder, uris[i]));
    }
    if(folder1) items.unshift(createItem(folder,uris[x]))
    return items;
}
function resolveImageItem(folder, dockerFileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        if (dockerFileUri) {
            return createItem(folder, dockerFileUri);
        }
        ;
        const uris = yield getDockerFileUris(folder);
        if (!uris || uris.length == 0) {
            vscode.window.showInformationMessage('Couldn\'t find a Dockerfile in your workspace.');
            return;
        }
        else {
            const res = yield vscode.window.showQuickPick(computeItems(folder, uris), { placeHolder: 'Choose Dockerfile to build' });
            return res;
        }
    });
}
function buildImage(dockerFileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const configOptions = vscode.workspace.getConfiguration('docker');
        const defaultContextPath = configOptions.get('imageBuildContextPath', '');
        let folder,folder1;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
            folder = vscode.workspace.workspaceFolders[0];
        }
        else {
            folder = yield vscode.window.showWorkspaceFolderPick();
        }
        if (!folder) {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('Docker files can only be built if VS Code is opened on a folder.');
            }
            else {
                vscode.window.showErrorMessage('Docker files can only be built if a workspace folder is picked in VS Code.');
            }
            return;
        }
        const uri = yield resolveImageItem(folder, dockerFileUri);
        if (!uri)
            return;
        let contextPath = uri.path;
        if (defaultContextPath && defaultContextPath != '') {
            contextPath = defaultContextPath;
        }
        let imageName;
        if (process.platform === 'win32') {
            imageName = uri.path.split('\\').pop().toLowerCase();
        }
        else {
            imageName = uri.path.split('/').pop().toLowerCase();
        }
        if (imageName === '.') {
            if (process.platform === 'win32') {
                imageName = folder.uri.fsPath.split('\\').pop().toLowerCase();
            }
            else {
                imageName = folder.uri.fsPath.split('/').pop().toLowerCase();
            }
        }
        let dirname =path.basename(folder.uri.fsPath).toLowerCase();
        imageName =(dirname != imageName ) ?  "chakibmed/"+dirname+'_' + imageName:"chakibmed/" + imageName ; 
        const opt = {
            placeHolder: imageName + ':latest',
            prompt: 'Tag image as...',
            value: imageName + ':latest'
        };
        const value = yield vscode.window.showInputBox(opt);
        if (!value)
            return;
        const terminal = vscode.window.createTerminal('Docker');
        terminal.sendText(`docker build --rm -f ${uri.file} -t ${value} ${contextPath} && sleep 2 && exit`);
        terminal.show();
        if (telemetry_1.reporter) {
            /* __GDPR__
               "command" : {
                  "command" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
               }
             */
            telemetry_1.reporter.sendTelemetryEvent('command', {
                command: teleCmdId
            });
        }
    });
}
exports.buildImage = buildImage;
//# sourceMappingURL=build-image.js.map