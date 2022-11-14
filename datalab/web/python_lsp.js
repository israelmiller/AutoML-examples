"use strict";
/*
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonLsp = void 0;
var logging = require("./logging");
var childProcess = require("child_process");
var jsonRpc = require("./json_rpc");
var bunyan = require("bunyan");
var path = require("path");
var fs = require("fs");
var protocol = require("./lsp/protocol_node");
var crypto_1 = require("crypto");
var os = require("os");
var sessionCounter = 0;
var activeCount = 0;
/** Socket.io<->pyright LSP. */
var Session = /** @class */ (function () {
    function Session(socket, rootDirectory, contentDirectory, logsDir, proxyBinaryPath) {
        var _this = this;
        this.socket = socket;
        this.closed = false;
        this.id = sessionCounter++;
        ++activeCount;
        var logPath = path.join(logsDir, "/lsp.".concat(sessionCounter, ".log"));
        this.consoleLogger = logging.getLogger();
        this.consoleLogger.info("LSP ".concat(this.id, " new session, ").concat(activeCount, " now active"));
        this.lspLogger = bunyan.createLogger({
            name: 'lsp',
            streams: [{
                    level: 'info',
                    path: logPath,
                }],
        });
        delete this.lspLogger.fields['hostname'];
        delete this.lspLogger.fields['name'];
        this.cancellation = new FileBasedCancellation(this.lspLogger);
        // To test against locally built versions of Pyright see the docs:
        // https://github.com/microsoft/pyright/blob/master/docs/build-debug.md
        //
        // You'll want to change the path to point to your local Pyright code e.g.
        // ${HOME}/pyright/packages/pyright/langserver.index.js
        //
        // Then from within the Pyright root folder rebuild the sources with:
        // npm run build:cli:dev
        var processName = 'node';
        var processArgs = [
            path.join(contentDirectory, '..', 'datalab', 'web', 'pyright', 'pyright-langserver.js'),
            // Using stdin/stdout for passing messages.
            '--stdio',
            // Use file-based cancellation to allow background analysis.
            "--cancellationReceive=file:".concat(this.cancellation.folderName),
        ];
        if (proxyBinaryPath) {
            processArgs.unshift(processName);
            processArgs.unshift('--');
            processName = proxyBinaryPath;
        }
        this.pyright = childProcess.spawn(processName, processArgs, {
            stdio: ['pipe'],
            cwd: rootDirectory,
        });
        var rpc = new jsonRpc.JsonRpcReader(function (message) {
            if (!_this.processLanguageServerMessage(message.content)) {
                _this.lspLogger.info('c<--s' + message.content);
                _this.socket.emit('data', { data: message.content });
            }
            else {
                _this.lspLogger.info(' <--s' + message.content);
            }
        });
        var encoder = new TextEncoder();
        this.pyright.stdout.on('data', function (data) {
            if (_this.closed) {
                return;
            }
            var start = Date.now();
            try {
                _this.consoleLogger.info({ id: _this.id, length: data.length }, "LSP ".concat(_this.id, " pyright->client starting"));
                rpc.append(encoder.encode(data));
                _this.consoleLogger.info({ id: _this.id, duration: (Date.now() - start), length: data.length }, "LSP ".concat(_this.id, " pyright->client"));
            }
            catch (error) {
                _this.consoleLogger.error("LSP ".concat(_this.id, " error handling pyright data: ").concat(error));
            }
        });
        this.pyright.stderr.on('data', function (data) {
            _this.consoleLogger.error("LSP ".concat(_this.id, " pyright error console: ").concat(data));
        });
        this.pyright.on('error', function (data) {
            _this.consoleLogger.error("LSP ".concat(_this.id, " pyright error: ").concat(data));
            _this.close();
        });
        this.socket.on('disconnect', function (reason) {
            _this.consoleLogger.debug("LSP ".concat(_this.id, " Socket disconnected for reason: \"%s\""), reason);
            // Handle client disconnects to close sockets, so as to free up resources.
            _this.close();
        });
        this.socket.on('data', function (event) {
            if (_this.closed) {
                return;
            }
            var start = Date.now();
            _this.consoleLogger.info({ id: _this.id, length: event.data.length }, "LSP ".concat(_this.id, " client->pyright starting"));
            _this.handleDataFromClient(event.data);
            _this.consoleLogger.info({ id: _this.id, duration: (Date.now() - start), length: event.data.length }, "LSP ".concat(_this.id, " client->pyright"));
        });
        try {
            this.pipLogWatcher = fs.watch(logsDir, {
                recursive: false,
            }, function (event, filename) {
                if (filename === 'pip.log') {
                    _this.pipLogChanged();
                }
            });
        }
        catch (error) {
            this.consoleLogger.debug("LSP ".concat(this.id, " Error starting pip.log watcher: %s"), error);
        }
    }
    Session.prototype.handleDataFromClient = function (data) {
        if (this.closed) {
            return;
        }
        try {
            this.lspLogger.info('c-->s' + data);
            // tslint:disable-next-line:no-any
            var message = JSON.parse(data);
            if (message.method === 'initialize') {
                // Patch the processId to be this one since the client does not does
                // not know about this process ID.
                message.params.processId = process.pid;
            }
            var json = JSON.stringify(message);
            json = json.replace(/[\u007F-\uFFFF]/g, function (chr) {
                // Replace non-ASCII characters with unicode encodings to avoid issues
                // sending unicode characters through stdin.
                // We don't need to handle surrogate pairs as these won't be a single
                // character in the JSON.
                return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
            });
            this.pyright.stdin.write(jsonRpc.encodeJsonRpc(json));
        }
        catch (error) {
            // Errors propagated from here will disconnect the kernel.
            this.consoleLogger.error("LSP ".concat(this.id, " Socket error writing %s"), String(error));
            this.close();
        }
    };
    /** @return True if the message is consumed and should not be forwarded. */
    Session.prototype.processLanguageServerMessage = function (data) {
        try {
            var message = JSON.parse(data);
            if ('id' in message) {
                if ('method' in message && 'params' in message) {
                    this.handleRequest(message);
                }
                else {
                    this.handleResponse(message);
                }
            }
            else {
                return this.handleNotification(message);
            }
        }
        catch (error) {
            this.consoleLogger.error("LSP ".concat(this.id, " Error processing message: %s from \"%s\""), error, data);
        }
        return false;
    };
    /** @return True if the message is consumed and should not be forwarded. */
    Session.prototype.handleNotification = function (notification) {
        // TODO(b/176851754): Re-enable when no longer redundant with protocol
        // traffic logging.
        // if (notification.method === protocol.Method.WindowLogMessage) {
        //   const logMessage = (notification as window.LogMessage).params;
        //   this.lspLogger.info(logMessage.message);
        // } else
        if (notification.method === protocol.Method.CancelRequest) {
            var cancellation = notification;
            this.cancellation.cancel(cancellation.params.id);
        }
        else if (notification.method === 'pyright/beginProgress' ||
            notification.method === 'pyright/reportProgress' ||
            notification.method === 'pyright/endProgress') {
            // Colab doesn't use these progress messages right now and they just
            // congest socket.io during completion flows.
            return true;
        }
        return false;
    };
    Session.prototype.handleRequest = function (request) {
        // Nothing to do here yet.
    };
    Session.prototype.handleResponse = function (response) {
        if (response.error && response.error.code === protocol.ErrorCode.RequestCancelled && response.id) {
            this.cancellation.cleanup(response.id);
        }
    };
    Session.prototype.pipLogChanged = function () {
        this.sendNotificationToClient(protocol.Method.ColabPipLogChanged, {});
    };
    Session.prototype.sendNotificationToClient = function (method, params) {
        if (this.closed) {
            return;
        }
        var json = {
            method: method,
            params: params,
            jsonrpc: '2.0',
        };
        var data = JSON.stringify(json);
        this.lspLogger.info('c<--s' + data);
        this.socket.emit('data', { data: data });
    };
    Session.prototype.close = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.socket.disconnect(false);
        // Force-kill pyright process to ensure full shutdown.
        // The process should effectively be read-only where it does not generate
        // any data other than what is sent back to this process.
        this.pyright.kill(9);
        if (this.pipLogWatcher) {
            this.pipLogWatcher.close();
        }
        this.cancellation.dispose();
        --activeCount;
        this.consoleLogger.info("LSP ".concat(this.id, " closed session, ").concat(activeCount, " remaining active"));
    };
    return Session;
}());
/** SocketIO to PyRight adapter. */
var PythonLsp = /** @class */ (function () {
    function PythonLsp(server, rootDirectory, contentDirectory, logsDir, languageServerProxy) {
        // Cast to string is because the typings are missing the regexp override.
        // Documented in https://socket.io/docs/v2/namespaces/.
        server.of(new RegExp('/python-lsp/.*')).on('connection', function (socket) {
            var proxyBinaryPath;
            if (languageServerProxy && socket.nsp.name.includes('use_proxy')) {
                proxyBinaryPath = languageServerProxy;
            }
            // Session manages its own lifetime.
            // tslint:disable-next-line:no-unused-expression
            new Session(socket, rootDirectory, contentDirectory, logsDir, proxyBinaryPath);
        });
    }
    return PythonLsp;
}());
exports.PythonLsp = PythonLsp;
var FileBasedCancellation = /** @class */ (function () {
    function FileBasedCancellation(logger) {
        this.logger = logger;
        this.folderName = (0, crypto_1.randomBytes)(21).toString('hex');
        // This must match the naming used in:
        // https://github.com/microsoft/pyright/blob/7bb059ecbab5c0c446d4dcf5376fc5ce8bd8cd26/packages/pyright-internal/src/common/cancellationUtils.ts#L189
        this.folderPath = path.join(os.tmpdir(), 'python-languageserver-cancellation', this.folderName);
        fs.mkdirSync(this.folderPath, { recursive: true });
    }
    FileBasedCancellation.prototype.cancel = function (id) {
        var _this = this;
        fs.promises.writeFile(this.getCancellationPath(id), '', { flag: 'w' }).catch(function (error) {
            _this.logger.error(error, "LSP FileBasedCancellation.cancel");
        });
    };
    FileBasedCancellation.prototype.cleanup = function (id) {
        var _this = this;
        fs.promises.unlink(this.getCancellationPath(id)).catch(function (error) {
            _this.logger.error(error, "LSP FileBasedCancellation.cleanup");
        });
    };
    FileBasedCancellation.prototype.dispose = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, files_1, files_1_1, file, error_1, e_1_1, error_2;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 13, , 14]);
                        return [4 /*yield*/, fs.promises.readdir(this.folderPath)];
                    case 1:
                        files = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 9, 10, 11]);
                        files_1 = __values(files), files_1_1 = files_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!files_1_1.done) return [3 /*break*/, 8];
                        file = files_1_1.value;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, fs.promises.unlink(path.join(this.folderPath, file))];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        this.logger.error(error_1, "LSP FileBasedCancellation.dispose");
                        return [3 /*break*/, 7];
                    case 7:
                        files_1_1 = files_1.next();
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (files_1_1 && !files_1_1.done && (_a = files_1.return)) _a.call(files_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 11: return [4 /*yield*/, fs.promises.rmdir(this.folderPath)];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        error_2 = _b.sent();
                        this.logger.error(error_2, "LSP FileBasedCancellation.dispose");
                        return [3 /*break*/, 14];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    FileBasedCancellation.prototype.getCancellationPath = function (id) {
        // This must match the naming used in:
        // https://github.com/microsoft/pyright/blob/7bb059ecbab5c0c446d4dcf5376fc5ce8bd8cd26/packages/pyright-internal/src/common/cancellationUtils.ts#L193
        return path.join(this.folderPath, "cancellation-".concat(id, ".tmp"));
    };
    return FileBasedCancellation;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHl0aG9uX2xzcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvcHl0aG9uX2xzcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsbUNBQXFDO0FBQ3JDLDRDQUE4QztBQUM5QyxvQ0FBc0M7QUFDdEMsK0JBQWlDO0FBQ2pDLDJCQUE2QjtBQUM3Qix1QkFBeUI7QUFDekIsOENBQWdEO0FBQ2hELGlDQUFxQztBQUNyQyx1QkFBeUI7QUFPekIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztBQUVwQiwrQkFBK0I7QUFDL0I7SUFTRSxpQkFBNkIsTUFBdUIsRUFBRSxhQUFxQixFQUFFLGdCQUF3QixFQUFFLE9BQWUsRUFBRSxlQUF3QjtRQUFoSixpQkEyR0M7UUEzRzRCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBTjVDLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFPckIsSUFBSSxDQUFDLEVBQUUsR0FBRyxjQUFjLEVBQUUsQ0FBQztRQUMzQixFQUFFLFdBQVcsQ0FBQztRQUVkLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQVEsY0FBYyxTQUFNLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFPLElBQUksQ0FBQyxFQUFFLDJCQUFpQixXQUFXLGdCQUFhLENBQUMsQ0FBQztRQUVqRixJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDbkMsSUFBSSxFQUFFLEtBQUs7WUFDWCxPQUFPLEVBQUUs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QUFDLEVBQUE7O3dCQUFsRCxLQUFLLEdBQUcsU0FBMEM7Ozs7d0JBQ3JDLFVBQUEsU0FBQSxLQUFLLENBQUE7Ozs7d0JBQWIsSUFBSTs7Ozt3QkFFWCxxQkFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBQTs7d0JBQTFELFNBQTBELENBQUM7Ozs7d0JBRTNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQWMsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OzZCQUczRSxxQkFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUE7O3dCQUF4QyxTQUF3QyxDQUFDOzs7O3dCQUV6QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFjLEVBQUUsbUNBQW1DLENBQUMsQ0FBQzs7Ozs7O0tBRTFFO0lBRUQsbURBQW1CLEdBQW5CLFVBQW9CLEVBQWlCO1FBQ25DLHNDQUFzQztRQUN0QyxvSkFBb0o7UUFDcEosT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsdUJBQWdCLEVBQUUsU0FBTSxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUNILDRCQUFDO0FBQUQsQ0FBQyxBQTVDRCxJQTRDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90XG4gKiB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZlxuICogdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVRcbiAqIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZVxuICogTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnMgdW5kZXJcbiAqIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnLi9sb2dnaW5nJztcbmltcG9ydCAqIGFzIGNoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGpzb25ScGMgZnJvbSAnLi9qc29uX3JwYyc7XG5pbXBvcnQgKiBhcyBidW55YW4gZnJvbSAnYnVueWFuJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwcm90b2NvbCBmcm9tICcuL2xzcC9wcm90b2NvbF9ub2RlJztcbmltcG9ydCB7IHJhbmRvbUJ5dGVzIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcblxuaW50ZXJmYWNlIERhdGFNZXNzYWdlIHtcbiAgY2hhbm5lbDogc3RyaW5nO1xuICBkYXRhOiBzdHJpbmc7XG59XG5cbmxldCBzZXNzaW9uQ291bnRlciA9IDA7XG5sZXQgYWN0aXZlQ291bnQgPSAwO1xuXG4vKiogU29ja2V0LmlvPC0+cHlyaWdodCBMU1AuICovXG5jbGFzcyBTZXNzaW9uIHtcbiAgcHJpdmF0ZSByZWFkb25seSBpZDogbnVtYmVyO1xuICBwcml2YXRlIHJlYWRvbmx5IHB5cmlnaHQ6IGNoaWxkUHJvY2Vzcy5DaGlsZFByb2Nlc3M7XG4gIHByaXZhdGUgY2xvc2VkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgbHNwTG9nZ2VyOiBidW55YW4uSUxvZ2dlcjtcbiAgcHJpdmF0ZSByZWFkb25seSBjb25zb2xlTG9nZ2VyOiBidW55YW4uSUxvZ2dlcjtcbiAgcHJpdmF0ZSByZWFkb25seSBwaXBMb2dXYXRjaGVyPzogZnMuRlNXYXRjaGVyO1xuICBwcml2YXRlIHJlYWRvbmx5IGNhbmNlbGxhdGlvbjogRmlsZUJhc2VkQ2FuY2VsbGF0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc29ja2V0OiBTb2NrZXRJTy5Tb2NrZXQsIHJvb3REaXJlY3Rvcnk6IHN0cmluZywgY29udGVudERpcmVjdG9yeTogc3RyaW5nLCBsb2dzRGlyOiBzdHJpbmcsIHByb3h5QmluYXJ5UGF0aD86IHN0cmluZykge1xuICAgIHRoaXMuaWQgPSBzZXNzaW9uQ291bnRlcisrO1xuICAgICsrYWN0aXZlQ291bnQ7XG5cbiAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKGxvZ3NEaXIsIGAvbHNwLiR7c2Vzc2lvbkNvdW50ZXJ9LmxvZ2ApO1xuICAgIHRoaXMuY29uc29sZUxvZ2dlciA9IGxvZ2dpbmcuZ2V0TG9nZ2VyKCk7XG4gICAgdGhpcy5jb25zb2xlTG9nZ2VyLmluZm8oYExTUCAke3RoaXMuaWR9IG5ldyBzZXNzaW9uLCAke2FjdGl2ZUNvdW50fSBub3cgYWN0aXZlYCk7XG5cbiAgICB0aGlzLmxzcExvZ2dlciA9IGJ1bnlhbi5jcmVhdGVMb2dnZXIoe1xuICAgICAgbmFtZTogJ2xzcCcsXG4gICAgICBzdHJlYW1zOiBbe1xuICAgICAgICBsZXZlbDogJ2luZm8nLFxuICAgICAgICBwYXRoOiBsb2dQYXRoLFxuICAgICAgfV0sXG4gICAgfSk7XG4gICAgZGVsZXRlIHRoaXMubHNwTG9nZ2VyLmZpZWxkc1snaG9zdG5hbWUnXTtcbiAgICBkZWxldGUgdGhpcy5sc3BMb2dnZXIuZmllbGRzWyduYW1lJ107XG4gICAgdGhpcy5jYW5jZWxsYXRpb24gPSBuZXcgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uKHRoaXMubHNwTG9nZ2VyKTtcblxuICAgIC8vIFRvIHRlc3QgYWdhaW5zdCBsb2NhbGx5IGJ1aWx0IHZlcnNpb25zIG9mIFB5cmlnaHQgc2VlIHRoZSBkb2NzOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvcHlyaWdodC9ibG9iL21hc3Rlci9kb2NzL2J1aWxkLWRlYnVnLm1kXG4gICAgLy9cbiAgICAvLyBZb3UnbGwgd2FudCB0byBjaGFuZ2UgdGhlIHBhdGggdG8gcG9pbnQgdG8geW91ciBsb2NhbCBQeXJpZ2h0IGNvZGUgZS5nLlxuICAgIC8vICR7SE9NRX0vcHlyaWdodC9wYWNrYWdlcy9weXJpZ2h0L2xhbmdzZXJ2ZXIuaW5kZXguanNcbiAgICAvL1xuICAgIC8vIFRoZW4gZnJvbSB3aXRoaW4gdGhlIFB5cmlnaHQgcm9vdCBmb2xkZXIgcmVidWlsZCB0aGUgc291cmNlcyB3aXRoOlxuICAgIC8vIG5wbSBydW4gYnVpbGQ6Y2xpOmRldlxuICAgIGxldCBwcm9jZXNzTmFtZSA9ICdub2RlJztcbiAgICBjb25zdCBwcm9jZXNzQXJncyA9IFtcbiAgICAgIHBhdGguam9pbihjb250ZW50RGlyZWN0b3J5LCAnLi4nLCAnZGF0YWxhYicsICd3ZWInLCAncHlyaWdodCcsICdweXJpZ2h0LWxhbmdzZXJ2ZXIuanMnKSxcbiAgICAgIC8vIFVzaW5nIHN0ZGluL3N0ZG91dCBmb3IgcGFzc2luZyBtZXNzYWdlcy5cbiAgICAgICctLXN0ZGlvJyxcbiAgICAgIC8vIFVzZSBmaWxlLWJhc2VkIGNhbmNlbGxhdGlvbiB0byBhbGxvdyBiYWNrZ3JvdW5kIGFuYWx5c2lzLlxuICAgICAgYC0tY2FuY2VsbGF0aW9uUmVjZWl2ZT1maWxlOiR7dGhpcy5jYW5jZWxsYXRpb24uZm9sZGVyTmFtZX1gLFxuICAgIF07XG5cbiAgICBpZiAocHJveHlCaW5hcnlQYXRoKSB7XG4gICAgICBwcm9jZXNzQXJncy51bnNoaWZ0KHByb2Nlc3NOYW1lKTtcbiAgICAgIHByb2Nlc3NBcmdzLnVuc2hpZnQoJy0tJyk7XG4gICAgICBwcm9jZXNzTmFtZSA9IHByb3h5QmluYXJ5UGF0aDtcbiAgICB9XG5cbiAgICB0aGlzLnB5cmlnaHQgPSBjaGlsZFByb2Nlc3Muc3Bhd24ocHJvY2Vzc05hbWUsIHByb2Nlc3NBcmdzLCB7XG4gICAgICBzdGRpbzogWydwaXBlJ10sXG4gICAgICBjd2Q6IHJvb3REaXJlY3RvcnksXG4gICAgfSk7XG5cbiAgICBjb25zdCBycGMgPSBuZXcganNvblJwYy5Kc29uUnBjUmVhZGVyKChtZXNzYWdlKSA9PiB7XG4gICAgICBpZiAoIXRoaXMucHJvY2Vzc0xhbmd1YWdlU2VydmVyTWVzc2FnZShtZXNzYWdlLmNvbnRlbnQpKSB7XG4gICAgICAgIHRoaXMubHNwTG9nZ2VyLmluZm8oJ2M8LS1zJyArIG1lc3NhZ2UuY29udGVudCk7XG4gICAgICAgIHRoaXMuc29ja2V0LmVtaXQoJ2RhdGEnLCB7ZGF0YTogbWVzc2FnZS5jb250ZW50fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxzcExvZ2dlci5pbmZvKCcgPC0tcycgKyBtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgIHRoaXMucHlyaWdodC5zdGRvdXQhLm9uKCdkYXRhJywgKGRhdGE6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5pbmZvKHtpZDogdGhpcy5pZCwgbGVuZ3RoOiBkYXRhLmxlbmd0aH0sIGBMU1AgJHt0aGlzLmlkfSBweXJpZ2h0LT5jbGllbnQgc3RhcnRpbmdgKTtcbiAgICAgICAgcnBjLmFwcGVuZChlbmNvZGVyLmVuY29kZShkYXRhKSk7XG4gICAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5pbmZvKHtpZDogdGhpcy5pZCwgZHVyYXRpb246IChEYXRlLm5vdygpIC0gc3RhcnQpLCBsZW5ndGg6IGRhdGEubGVuZ3RofSwgYExTUCAke3RoaXMuaWR9IHB5cmlnaHQtPmNsaWVudGApO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgICAgdGhpcy5jb25zb2xlTG9nZ2VyLmVycm9yKGBMU1AgJHt0aGlzLmlkfSBlcnJvciBoYW5kbGluZyBweXJpZ2h0IGRhdGE6ICR7ZXJyb3J9YCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5weXJpZ2h0LnN0ZGVyciEub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuZXJyb3IoYExTUCAke3RoaXMuaWR9IHB5cmlnaHQgZXJyb3IgY29uc29sZTogJHtkYXRhfWApO1xuICAgIH0pO1xuXG4gICAgdGhpcy5weXJpZ2h0Lm9uKCdlcnJvcicsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5lcnJvcihgTFNQICR7dGhpcy5pZH0gcHlyaWdodCBlcnJvcjogJHtkYXRhfWApO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCAocmVhc29uKSA9PiB7XG4gICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuZGVidWcoYExTUCAke3RoaXMuaWR9IFNvY2tldCBkaXNjb25uZWN0ZWQgZm9yIHJlYXNvbjogXCIlc1wiYCwgcmVhc29uKTtcblxuICAgICAgLy8gSGFuZGxlIGNsaWVudCBkaXNjb25uZWN0cyB0byBjbG9zZSBzb2NrZXRzLCBzbyBhcyB0byBmcmVlIHVwIHJlc291cmNlcy5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc29ja2V0Lm9uKCdkYXRhJywgKGV2ZW50OiBEYXRhTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5pbmZvKHtpZDogdGhpcy5pZCwgbGVuZ3RoOiBldmVudC5kYXRhLmxlbmd0aH0sIGBMU1AgJHt0aGlzLmlkfSBjbGllbnQtPnB5cmlnaHQgc3RhcnRpbmdgKTtcbiAgICAgIHRoaXMuaGFuZGxlRGF0YUZyb21DbGllbnQoZXZlbnQuZGF0YSk7XG4gICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuaW5mbyh7aWQ6IHRoaXMuaWQsIGR1cmF0aW9uOiAoRGF0ZS5ub3coKSAtIHN0YXJ0KSwgbGVuZ3RoOiBldmVudC5kYXRhLmxlbmd0aH0sIGBMU1AgJHt0aGlzLmlkfSBjbGllbnQtPnB5cmlnaHRgKTtcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnBpcExvZ1dhdGNoZXIgPSBmcy53YXRjaChsb2dzRGlyLCB7XG4gICAgICAgIHJlY3Vyc2l2ZTogZmFsc2UsXG4gICAgICB9LCAoZXZlbnQ6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoZmlsZW5hbWUgPT09ICdwaXAubG9nJykge1xuICAgICAgICAgIHRoaXMucGlwTG9nQ2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgdGhpcy5jb25zb2xlTG9nZ2VyLmRlYnVnKGBMU1AgJHt0aGlzLmlkfSBFcnJvciBzdGFydGluZyBwaXAubG9nIHdhdGNoZXI6ICVzYCwgZXJyb3IgYXMge30pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlRGF0YUZyb21DbGllbnQoZGF0YTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB0aGlzLmxzcExvZ2dlci5pbmZvKCdjLS0+cycgKyBkYXRhKTtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGRhdGEpIGFzIGFueTtcbiAgICAgIGlmIChtZXNzYWdlLm1ldGhvZCA9PT0gJ2luaXRpYWxpemUnKSB7XG4gICAgICAgIC8vIFBhdGNoIHRoZSBwcm9jZXNzSWQgdG8gYmUgdGhpcyBvbmUgc2luY2UgdGhlIGNsaWVudCBkb2VzIG5vdCBkb2VzXG4gICAgICAgIC8vIG5vdCBrbm93IGFib3V0IHRoaXMgcHJvY2VzcyBJRC5cbiAgICAgICAgbWVzc2FnZS5wYXJhbXMucHJvY2Vzc0lkID0gcHJvY2Vzcy5waWQ7XG4gICAgICB9XG4gICAgICBsZXQganNvbiA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpO1xuICAgICAganNvbiAgPSBqc29uLnJlcGxhY2UoL1tcXHUwMDdGLVxcdUZGRkZdL2csIChjaHIpID0+IHtcbiAgICAgICAgLy8gUmVwbGFjZSBub24tQVNDSUkgY2hhcmFjdGVycyB3aXRoIHVuaWNvZGUgZW5jb2RpbmdzIHRvIGF2b2lkIGlzc3Vlc1xuICAgICAgICAvLyBzZW5kaW5nIHVuaWNvZGUgY2hhcmFjdGVycyB0aHJvdWdoIHN0ZGluLlxuICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGhhbmRsZSBzdXJyb2dhdGUgcGFpcnMgYXMgdGhlc2Ugd29uJ3QgYmUgYSBzaW5nbGVcbiAgICAgICAgLy8gY2hhcmFjdGVyIGluIHRoZSBKU09OLlxuICAgICAgICByZXR1cm4gXCJcXFxcdVwiICsgKFwiMDAwMFwiICsgY2hyLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTQpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnB5cmlnaHQuc3RkaW4hLndyaXRlKGpzb25ScGMuZW5jb2RlSnNvblJwYyhqc29uKSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgIC8vIEVycm9ycyBwcm9wYWdhdGVkIGZyb20gaGVyZSB3aWxsIGRpc2Nvbm5lY3QgdGhlIGtlcm5lbC5cbiAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5lcnJvcihgTFNQICR7dGhpcy5pZH0gU29ja2V0IGVycm9yIHdyaXRpbmcgJXNgLCBTdHJpbmcoZXJyb3IpKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHJldHVybiBUcnVlIGlmIHRoZSBtZXNzYWdlIGlzIGNvbnN1bWVkIGFuZCBzaG91bGQgbm90IGJlIGZvcndhcmRlZC4gKi9cbiAgcHJpdmF0ZSBwcm9jZXNzTGFuZ3VhZ2VTZXJ2ZXJNZXNzYWdlKGRhdGE6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhKSBhcyBwcm90b2NvbC5NZXNzYWdlO1xuICAgICAgaWYgKCdpZCcgaW4gbWVzc2FnZSkge1xuICAgICAgICBpZiAoJ21ldGhvZCcgaW4gbWVzc2FnZSAmJiAncGFyYW1zJyBpbiBtZXNzYWdlKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZXF1ZXN0KG1lc3NhZ2UgYXMgcHJvdG9jb2wuUmVxdWVzdE1lc3NhZ2U8dW5rbm93bj4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFuZGxlUmVzcG9uc2UobWVzc2FnZSBhcyBwcm90b2NvbC5SZXNwb25zZU1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVOb3RpZmljYXRpb24oXG4gICAgICAgICAgbWVzc2FnZSBhcyBwcm90b2NvbC5Ob3RpZmljYXRpb25NZXNzYWdlPHVua25vd24+KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgdGhpcy5jb25zb2xlTG9nZ2VyLmVycm9yKGBMU1AgJHt0aGlzLmlkfSBFcnJvciBwcm9jZXNzaW5nIG1lc3NhZ2U6ICVzIGZyb20gXCIlc1wiYCwgZXJyb3IgYXMge30sIGRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogQHJldHVybiBUcnVlIGlmIHRoZSBtZXNzYWdlIGlzIGNvbnN1bWVkIGFuZCBzaG91bGQgbm90IGJlIGZvcndhcmRlZC4gKi9cbiAgcHJpdmF0ZSBoYW5kbGVOb3RpZmljYXRpb24obm90aWZpY2F0aW9uOiBwcm90b2NvbC5Ob3RpZmljYXRpb25NZXNzYWdlPHVua25vd24+KTogYm9vbGVhbiB7XG4gICAgLy8gVE9ETyhiLzE3Njg1MTc1NCk6IFJlLWVuYWJsZSB3aGVuIG5vIGxvbmdlciByZWR1bmRhbnQgd2l0aCBwcm90b2NvbFxuICAgIC8vIHRyYWZmaWMgbG9nZ2luZy5cbiAgICAvLyBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gcHJvdG9jb2wuTWV0aG9kLldpbmRvd0xvZ01lc3NhZ2UpIHtcbiAgICAvLyAgIGNvbnN0IGxvZ01lc3NhZ2UgPSAobm90aWZpY2F0aW9uIGFzIHdpbmRvdy5Mb2dNZXNzYWdlKS5wYXJhbXM7XG4gICAgLy8gICB0aGlzLmxzcExvZ2dlci5pbmZvKGxvZ01lc3NhZ2UubWVzc2FnZSk7XG4gICAgLy8gfSBlbHNlXG4gICAgaWYgKG5vdGlmaWNhdGlvbi5tZXRob2QgPT09IHByb3RvY29sLk1ldGhvZC5DYW5jZWxSZXF1ZXN0KSB7XG4gICAgICBjb25zdCBjYW5jZWxsYXRpb24gPSBub3RpZmljYXRpb24gYXMgcHJvdG9jb2wuTm90aWZpY2F0aW9uTWVzc2FnZTxwcm90b2NvbC5DYW5jZWxQYXJhbXM+O1xuICAgICAgdGhpcy5jYW5jZWxsYXRpb24uY2FuY2VsKGNhbmNlbGxhdGlvbi5wYXJhbXMuaWQpO1xuICAgIH0gZWxzZSBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gJ3B5cmlnaHQvYmVnaW5Qcm9ncmVzcycgfHxcbiAgICAgICAgbm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gJ3B5cmlnaHQvcmVwb3J0UHJvZ3Jlc3MnIHx8XG4gICAgICAgIG5vdGlmaWNhdGlvbi5tZXRob2QgPT09ICdweXJpZ2h0L2VuZFByb2dyZXNzJykge1xuICAgICAgLy8gQ29sYWIgZG9lc24ndCB1c2UgdGhlc2UgcHJvZ3Jlc3MgbWVzc2FnZXMgcmlnaHQgbm93IGFuZCB0aGV5IGp1c3RcbiAgICAgIC8vIGNvbmdlc3Qgc29ja2V0LmlvIGR1cmluZyBjb21wbGV0aW9uIGZsb3dzLlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogcHJvdG9jb2wuUmVxdWVzdE1lc3NhZ2U8dW5rbm93bj4pIHtcbiAgICAvLyBOb3RoaW5nIHRvIGRvIGhlcmUgeWV0LlxuICB9XG5cbiAgaGFuZGxlUmVzcG9uc2UocmVzcG9uc2U6IHByb3RvY29sLlJlc3BvbnNlTWVzc2FnZSkge1xuICAgIGlmIChyZXNwb25zZS5lcnJvciAmJiByZXNwb25zZS5lcnJvci5jb2RlID09PSBwcm90b2NvbC5FcnJvckNvZGUuUmVxdWVzdENhbmNlbGxlZCAmJiByZXNwb25zZS5pZCkge1xuICAgICAgdGhpcy5jYW5jZWxsYXRpb24uY2xlYW51cChyZXNwb25zZS5pZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwaXBMb2dDaGFuZ2VkKCkge1xuICAgIHRoaXMuc2VuZE5vdGlmaWNhdGlvblRvQ2xpZW50KHByb3RvY29sLk1ldGhvZC5Db2xhYlBpcExvZ0NoYW5nZWQsIHt9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2VuZE5vdGlmaWNhdGlvblRvQ2xpZW50PFQ+KG1ldGhvZDogcHJvdG9jb2wuTWV0aG9kLCBwYXJhbXM6IFQpIHtcbiAgICBpZiAodGhpcy5jbG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QganNvbjogcHJvdG9jb2wuTm90aWZpY2F0aW9uTWVzc2FnZTxUPiA9IHtcbiAgICAgIG1ldGhvZCxcbiAgICAgIHBhcmFtcyxcbiAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgIH07XG4gICAgY29uc3QgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGpzb24pO1xuICAgIHRoaXMubHNwTG9nZ2VyLmluZm8oJ2M8LS1zJyArIGRhdGEpO1xuICAgIHRoaXMuc29ja2V0LmVtaXQoJ2RhdGEnLCB7ZGF0YX0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy5jbG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgIHRoaXMuc29ja2V0LmRpc2Nvbm5lY3QoZmFsc2UpO1xuICAgIC8vIEZvcmNlLWtpbGwgcHlyaWdodCBwcm9jZXNzIHRvIGVuc3VyZSBmdWxsIHNodXRkb3duLlxuICAgIC8vIFRoZSBwcm9jZXNzIHNob3VsZCBlZmZlY3RpdmVseSBiZSByZWFkLW9ubHkgd2hlcmUgaXQgZG9lcyBub3QgZ2VuZXJhdGVcbiAgICAvLyBhbnkgZGF0YSBvdGhlciB0aGFuIHdoYXQgaXMgc2VudCBiYWNrIHRvIHRoaXMgcHJvY2Vzcy5cbiAgICB0aGlzLnB5cmlnaHQua2lsbCg5KTtcbiAgICBpZiAodGhpcy5waXBMb2dXYXRjaGVyKSB7XG4gICAgICB0aGlzLnBpcExvZ1dhdGNoZXIuY2xvc2UoKTtcbiAgICB9XG4gICAgdGhpcy5jYW5jZWxsYXRpb24uZGlzcG9zZSgpO1xuXG4gICAgLS1hY3RpdmVDb3VudDtcbiAgICB0aGlzLmNvbnNvbGVMb2dnZXIuaW5mbyhgTFNQICR7dGhpcy5pZH0gY2xvc2VkIHNlc3Npb24sICR7YWN0aXZlQ291bnR9IHJlbWFpbmluZyBhY3RpdmVgKTtcbiAgfVxufVxuXG4vKiogU29ja2V0SU8gdG8gUHlSaWdodCBhZGFwdGVyLiAqL1xuZXhwb3J0IGNsYXNzIFB5dGhvbkxzcCB7XG4gIGNvbnN0cnVjdG9yKHNlcnZlcjogU29ja2V0SU8uU2VydmVyLCByb290RGlyZWN0b3J5OiBzdHJpbmcsIGNvbnRlbnREaXJlY3Rvcnk6IHN0cmluZywgbG9nc0Rpcjogc3RyaW5nLCBsYW5ndWFnZVNlcnZlclByb3h5Pzogc3RyaW5nKSB7XG4gICAgLy8gQ2FzdCB0byBzdHJpbmcgaXMgYmVjYXVzZSB0aGUgdHlwaW5ncyBhcmUgbWlzc2luZyB0aGUgcmVnZXhwIG92ZXJyaWRlLlxuICAgIC8vIERvY3VtZW50ZWQgaW4gaHR0cHM6Ly9zb2NrZXQuaW8vZG9jcy92Mi9uYW1lc3BhY2VzLy5cbiAgICBzZXJ2ZXIub2YobmV3IFJlZ0V4cCgnL3B5dGhvbi1sc3AvLionKSBhcyB1bmtub3duIGFzIHN0cmluZykub24oJ2Nvbm5lY3Rpb24nLCAoc29ja2V0OiBTb2NrZXRJTy5Tb2NrZXQpID0+IHtcbiAgICAgIGxldCBwcm94eUJpbmFyeVBhdGg6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgICBpZiAobGFuZ3VhZ2VTZXJ2ZXJQcm94eSAmJiBzb2NrZXQubnNwLm5hbWUuaW5jbHVkZXMoJ3VzZV9wcm94eScpKSB7XG4gICAgICAgIHByb3h5QmluYXJ5UGF0aCA9IGxhbmd1YWdlU2VydmVyUHJveHk7XG4gICAgICB9XG4gICAgICAvLyBTZXNzaW9uIG1hbmFnZXMgaXRzIG93biBsaWZldGltZS5cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnVzZWQtZXhwcmVzc2lvblxuICAgICAgbmV3IFNlc3Npb24oc29ja2V0LCByb290RGlyZWN0b3J5LCBjb250ZW50RGlyZWN0b3J5LCBsb2dzRGlyLCBwcm94eUJpbmFyeVBhdGgpO1xuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIEZpbGVCYXNlZENhbmNlbGxhdGlvbiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZm9sZGVyUGF0aDogc3RyaW5nO1xuICByZWFkb25seSBmb2xkZXJOYW1lOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyOiBidW55YW4uSUxvZ2dlcikge1xuICAgIHRoaXMuZm9sZGVyTmFtZSA9IHJhbmRvbUJ5dGVzKDIxKS50b1N0cmluZygnaGV4Jyk7XG4gICAgLy8gVGhpcyBtdXN0IG1hdGNoIHRoZSBuYW1pbmcgdXNlZCBpbjpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L3B5cmlnaHQvYmxvYi83YmIwNTllY2JhYjVjMGM0NDZkNGRjZjUzNzZmYzVjZThiZDhjZDI2L3BhY2thZ2VzL3B5cmlnaHQtaW50ZXJuYWwvc3JjL2NvbW1vbi9jYW5jZWxsYXRpb25VdGlscy50cyNMMTg5XG4gICAgdGhpcy5mb2xkZXJQYXRoID0gcGF0aC5qb2luKG9zLnRtcGRpcigpLCAncHl0aG9uLWxhbmd1YWdlc2VydmVyLWNhbmNlbGxhdGlvbicsIHRoaXMuZm9sZGVyTmFtZSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMuZm9sZGVyUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH1cblxuICBjYW5jZWwoaWQ6IHN0cmluZ3xudW1iZXIpIHtcbiAgICBmcy5wcm9taXNlcy53cml0ZUZpbGUodGhpcy5nZXRDYW5jZWxsYXRpb25QYXRoKGlkKSwgJycsIHsgZmxhZzogJ3cnIH0pLmNhdGNoKChlcnJvcjogdW5rbm93bikgPT4ge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3IgYXMgRXJyb3IsIGBMU1AgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uLmNhbmNlbGApO1xuICAgIH0pO1xuICB9XG5cbiAgY2xlYW51cChpZDogc3RyaW5nfG51bWJlcikge1xuICAgIGZzLnByb21pc2VzLnVubGluayh0aGlzLmdldENhbmNlbGxhdGlvblBhdGgoaWQpKS5jYXRjaCgoZXJyb3I6IHVua25vd24pID0+IHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yIGFzIEVycm9yLCBgTFNQIEZpbGVCYXNlZENhbmNlbGxhdGlvbi5jbGVhbnVwYCk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBkaXNwb3NlKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIodGhpcy5mb2xkZXJQYXRoKTtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGZzLnByb21pc2VzLnVubGluayhwYXRoLmpvaW4odGhpcy5mb2xkZXJQYXRoLCBmaWxlKSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3IgYXMgRXJyb3IsIGBMU1AgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uLmRpc3Bvc2VgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgZnMucHJvbWlzZXMucm1kaXIodGhpcy5mb2xkZXJQYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3IgYXMgRXJyb3IsIGBMU1AgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uLmRpc3Bvc2VgKTtcbiAgICB9XG4gIH1cblxuICBnZXRDYW5jZWxsYXRpb25QYXRoKGlkOiBzdHJpbmd8bnVtYmVyKTogc3RyaW5nIHtcbiAgICAvLyBUaGlzIG11c3QgbWF0Y2ggdGhlIG5hbWluZyB1c2VkIGluOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvcHlyaWdodC9ibG9iLzdiYjA1OWVjYmFiNWMwYzQ0NmQ0ZGNmNTM3NmZjNWNlOGJkOGNkMjYvcGFja2FnZXMvcHlyaWdodC1pbnRlcm5hbC9zcmMvY29tbW9uL2NhbmNlbGxhdGlvblV0aWxzLnRzI0wxOTNcbiAgICByZXR1cm4gcGF0aC5qb2luKHRoaXMuZm9sZGVyUGF0aCwgYGNhbmNlbGxhdGlvbi0ke2lkfS50bXBgKTtcbiAgfVxufVxuIl19