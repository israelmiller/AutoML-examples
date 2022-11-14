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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoToDap = void 0;
var childProcess = require("child_process");
var crypto = require("crypto");
var net = require("net");
var jsonRpc = require("./json_rpc");
var logging = require("./logging");
var sessionCounter = 0;
/** Socket.io<->debug adapter. */
var Session = /** @class */ (function () {
    function Session(clientSocket, domainSocketPath) {
        var _this = this;
        this.clientSocket = clientSocket;
        this.id = sessionCounter++;
        this.clientSocket.on('disconnect', function (reason) {
            logging.getLogger().debug('DAP socket disconnected for session %d reason: %s', _this.id, reason);
            // Handle client disconnects to close sockets, so as to free up resources.
            _this.close();
        });
        this.connect(domainSocketPath);
    }
    Session.prototype.close = function () {
        if (this.dapSocket) {
            this.dapSocket.destroy();
        }
        this.clientSocket.disconnect(false);
    };
    Session.prototype.connect = function (domainSocketPath) {
        return __awaiter(this, void 0, void 0, function () {
            var rpc_1, dapSocket_1, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logging.getLogger().info('DAP creating Socket to %s for session %d', domainSocketPath, this.id);
                        rpc_1 = new jsonRpc.JsonRpcReader(function (message) {
                            _this.clientSocket.emit('data', {
                                data: jsonRpc.encodeJsonRpc(message.content),
                            });
                        });
                        dapSocket_1 = new net.Socket();
                        this.dapSocket = dapSocket_1;
                        dapSocket_1.on('data', function (data) {
                            rpc_1.append(data);
                        });
                        dapSocket_1.on('close', function () {
                            _this.close();
                        });
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                dapSocket_1.on('error', reject);
                                dapSocket_1.connect(domainSocketPath, resolve);
                            })];
                    case 1:
                        _a.sent();
                        // Notify the client that the connection.is now open.
                        this.clientSocket.emit('open');
                        this.clientSocket.on('data', function (data) {
                            dapSocket_1.write(Uint8Array.from(data));
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logging.getLogger().error('Error connecting to Debug Adapter: %s', error_1);
                        this.close();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return Session;
}());
/** SocketIO to Debug Adapter Protocol. */
var SocketIoToDap = /** @class */ (function () {
    function SocketIoToDap(muxBinary, server) {
        var _this = this;
        this.portPromise = this.spawnMultiplexer(muxBinary);
        server.of('/debugger').on('connection', function (socket) {
            _this.portPromise.then(function (domainSocketPath) {
                // Session manages its own lifetime.
                // tslint:disable-next-line:no-unused-expression
                new Session(socket, domainSocketPath);
            });
        });
    }
    SocketIoToDap.prototype.spawnMultiplexer = function (muxBinary) {
        return __awaiter(this, void 0, void 0, function () {
            var filename, muxProcess, muxOutput;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filename = "/tmp/debugger_".concat(crypto.randomBytes(6).readUIntLE(0, 6).toString(36));
                        muxProcess = childProcess.spawn(muxBinary, [
                            "--domain_socket_path=".concat(filename),
                        ]);
                        muxProcess.stdout.on('data', function (data) {
                            logging.getLogger().info('%s: %s', muxBinary, data);
                        });
                        muxProcess.stdout.on('error', function (data) {
                            logging.getLogger().info('%s: %s', muxBinary, data);
                        });
                        muxOutput = '';
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var connectionHandler = function (data) {
                                    muxOutput += data;
                                    // Wait for the process to indicate that it is listening.
                                    if (muxOutput.match(/Listening on /)) {
                                        muxProcess.stdout.off('data', connectionHandler);
                                        resolve();
                                    }
                                };
                                muxProcess.stdout.on('data', connectionHandler);
                                muxProcess.stdout.on('error', reject);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, filename];
                }
            });
        });
    };
    return SocketIoToDap;
}());
exports.SocketIoToDap = SocketIoToDap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0aW9fdG9fZGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9zb2NrZXRpb190b19kYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7OztHQWNHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw0Q0FBOEM7QUFDOUMsK0JBQWlDO0FBQ2pDLHlCQUEyQjtBQUszQixvQ0FBc0M7QUFDdEMsbUNBQXFDO0FBRXJDLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztBQUV2QixpQ0FBaUM7QUFDakM7SUFJRSxpQkFBNkIsWUFBNkIsRUFBRSxnQkFBd0I7UUFBcEYsaUJBV0M7UUFYNEIsaUJBQVksR0FBWixZQUFZLENBQWlCO1FBQ3hELElBQUksQ0FBQyxFQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7UUFFM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQUMsTUFBTTtZQUN4QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxFQUFFLEtBQUksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFaEcsMEVBQTBFO1lBQzFFLEtBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFTyx1QkFBSyxHQUFiO1FBQ0UsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7UUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRWEseUJBQU8sR0FBckIsVUFBc0IsZ0JBQXdCOzs7Ozs7Ozt3QkFF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RSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUN0RCxDQUFDLENBQUMsQ0FBQzt3QkFDSCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBQyxJQUFZOzRCQUN6QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ3RELENBQUMsQ0FBQyxDQUFDO3dCQUVDLFNBQVMsR0FBRyxFQUFFLENBQUM7d0JBQ25CLHFCQUFNLElBQUksT0FBTyxDQUFPLFVBQUMsT0FBTyxFQUFFLE1BQU07Z0NBQ3RDLElBQU0saUJBQWlCLEdBQUcsVUFBQyxJQUFZO29DQUNyQyxTQUFTLElBQUksSUFBSSxDQUFDO29DQUNsQix5REFBeUQ7b0NBQ3pELElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRTt3Q0FDcEMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7d0NBQ2pELE9BQU8sRUFBRSxDQUFDO3FDQUNYO2dDQUNILENBQUMsQ0FBQztnQ0FDRixVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQ0FDaEQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDOzRCQUN4QyxDQUFDLENBQUMsRUFBQTs7d0JBWEYsU0FXRSxDQUFDO3dCQUNILHNCQUFPLFFBQVEsRUFBQzs7OztLQUNqQjtJQUNILG9CQUFDO0FBQUQsQ0FBQyxBQTFDRCxJQTBDQztBQTFDWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAyMCBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90XG4gKiB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZlxuICogdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVRcbiAqIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZVxuICogTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnMgdW5kZXJcbiAqIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIGNoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgbmV0IGZyb20gJ25ldCc7XG4vLyBUaGUgdW51c3VhbCBjYXNpbmcgaXMgZnJvbSB1cHN0cmVhbSBTb2NrZXRJTy5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTplbmZvcmNlLW5hbWUtY2FzaW5nXG5pbXBvcnQgKiBhcyBTb2NrZXRJTyBmcm9tICdzb2NrZXQuaW8nO1xuXG5pbXBvcnQgKiBhcyBqc29uUnBjIGZyb20gJy4vanNvbl9ycGMnO1xuaW1wb3J0ICogYXMgbG9nZ2luZyBmcm9tICcuL2xvZ2dpbmcnO1xuXG5sZXQgc2Vzc2lvbkNvdW50ZXIgPSAwO1xuXG4vKiogU29ja2V0LmlvPC0+ZGVidWcgYWRhcHRlci4gKi9cbmNsYXNzIFNlc3Npb24ge1xuICBwcml2YXRlIHJlYWRvbmx5IGlkOiBudW1iZXI7XG4gIHByaXZhdGUgZGFwU29ja2V0PzogbmV0LlNvY2tldDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNsaWVudFNvY2tldDogU29ja2V0SU8uU29ja2V0LCBkb21haW5Tb2NrZXRQYXRoOiBzdHJpbmcpIHtcbiAgICB0aGlzLmlkID0gc2Vzc2lvbkNvdW50ZXIrKztcblxuICAgIHRoaXMuY2xpZW50U29ja2V0Lm9uKCdkaXNjb25uZWN0JywgKHJlYXNvbikgPT4ge1xuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnREFQIHNvY2tldCBkaXNjb25uZWN0ZWQgZm9yIHNlc3Npb24gJWQgcmVhc29uOiAlcycsIHRoaXMuaWQsIHJlYXNvbik7XG5cbiAgICAgIC8vIEhhbmRsZSBjbGllbnQgZGlzY29ubmVjdHMgdG8gY2xvc2Ugc29ja2V0cywgc28gYXMgdG8gZnJlZSB1cCByZXNvdXJjZXMuXG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbm5lY3QoZG9tYWluU29ja2V0UGF0aCk7XG4gIH1cblxuICBwcml2YXRlIGNsb3NlKCkge1xuICAgIGlmICh0aGlzLmRhcFNvY2tldCkge1xuICAgICAgdGhpcy5kYXBTb2NrZXQuZGVzdHJveSgpO1xuICAgIH1cbiAgICB0aGlzLmNsaWVudFNvY2tldC5kaXNjb25uZWN0KGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29ubmVjdChkb21haW5Tb2NrZXRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKFxuICAgICAgICAgICdEQVAgY3JlYXRpbmcgU29ja2V0IHRvICVzIGZvciBzZXNzaW9uICVkJywgZG9tYWluU29ja2V0UGF0aCwgdGhpcy5pZCk7XG5cbiAgICAgIGNvbnN0IHJwYyA9IG5ldyBqc29uUnBjLkpzb25ScGNSZWFkZXIoKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgdGhpcy5jbGllbnRTb2NrZXQuZW1pdCgnZGF0YScsIHtcbiAgICAgICAgICBkYXRhOiBqc29uUnBjLmVuY29kZUpzb25ScGMobWVzc2FnZS5jb250ZW50KSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZGFwU29ja2V0ID0gbmV3IG5ldC5Tb2NrZXQoKTtcbiAgICAgIHRoaXMuZGFwU29ja2V0ID0gZGFwU29ja2V0O1xuICAgICAgZGFwU29ja2V0Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBycGMuYXBwZW5kKGRhdGEpO1xuICAgICAgfSk7XG4gICAgICBkYXBTb2NrZXQub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZGFwU29ja2V0Lm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgIGRhcFNvY2tldC5jb25uZWN0KGRvbWFpblNvY2tldFBhdGgsIHJlc29sdmUpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIE5vdGlmeSB0aGUgY2xpZW50IHRoYXQgdGhlIGNvbm5lY3Rpb24uaXMgbm93IG9wZW4uXG4gICAgICB0aGlzLmNsaWVudFNvY2tldC5lbWl0KCdvcGVuJyk7XG5cbiAgICAgIHRoaXMuY2xpZW50U29ja2V0Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBkYXBTb2NrZXQud3JpdGUoVWludDhBcnJheS5mcm9tKGRhdGEpKTtcbiAgICAgIH0pO1xuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoJ0Vycm9yIGNvbm5lY3RpbmcgdG8gRGVidWcgQWRhcHRlcjogJXMnLCBlcnJvcik7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBTb2NrZXRJTyB0byBEZWJ1ZyBBZGFwdGVyIFByb3RvY29sLiAqL1xuZXhwb3J0IGNsYXNzIFNvY2tldElvVG9EYXAge1xuICBwcml2YXRlIHJlYWRvbmx5IHBvcnRQcm9taXNlOiBQcm9taXNlPHN0cmluZz47XG4gIGNvbnN0cnVjdG9yKG11eEJpbmFyeTogc3RyaW5nLCBzZXJ2ZXI6IFNvY2tldElPLlNlcnZlcikge1xuICAgIHRoaXMucG9ydFByb21pc2UgPSB0aGlzLnNwYXduTXVsdGlwbGV4ZXIobXV4QmluYXJ5KTtcblxuICAgIHNlcnZlci5vZignL2RlYnVnZ2VyJykub24oJ2Nvbm5lY3Rpb24nLCAoc29ja2V0OiBTb2NrZXRJTy5Tb2NrZXQpID0+IHtcbiAgICAgIHRoaXMucG9ydFByb21pc2UudGhlbigoZG9tYWluU29ja2V0UGF0aCkgPT4ge1xuICAgICAgICAvLyBTZXNzaW9uIG1hbmFnZXMgaXRzIG93biBsaWZldGltZS5cbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXVudXNlZC1leHByZXNzaW9uXG4gICAgICAgIG5ldyBTZXNzaW9uKHNvY2tldCwgZG9tYWluU29ja2V0UGF0aCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3Bhd25NdWx0aXBsZXhlcihtdXhCaW5hcnk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBgL3RtcC9kZWJ1Z2dlcl8ke2NyeXB0by5yYW5kb21CeXRlcyg2KS5yZWFkVUludExFKDAsNikudG9TdHJpbmcoMzYpfWA7XG4gICAgY29uc3QgbXV4UHJvY2VzcyA9IGNoaWxkUHJvY2Vzcy5zcGF3bihtdXhCaW5hcnksIFtcbiAgICAgIGAtLWRvbWFpbl9zb2NrZXRfcGF0aD0ke2ZpbGVuYW1lfWAsXG4gICAgXSk7XG5cbiAgICBtdXhQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuaW5mbygnJXM6ICVzJywgbXV4QmluYXJ5LCBkYXRhKTtcbiAgICB9KTtcbiAgICBtdXhQcm9jZXNzLnN0ZG91dC5vbignZXJyb3InLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmluZm8oJyVzOiAlcycsIG11eEJpbmFyeSwgZGF0YSk7XG4gICAgfSk7XG5cbiAgICBsZXQgbXV4T3V0cHV0ID0gJyc7XG4gICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgY29ubmVjdGlvbkhhbmRsZXIgPSAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIG11eE91dHB1dCArPSBkYXRhO1xuICAgICAgICAvLyBXYWl0IGZvciB0aGUgcHJvY2VzcyB0byBpbmRpY2F0ZSB0aGF0IGl0IGlzIGxpc3RlbmluZy5cbiAgICAgICAgaWYgKG11eE91dHB1dC5tYXRjaCgvTGlzdGVuaW5nIG9uIC8pKSB7XG4gICAgICAgICAgbXV4UHJvY2Vzcy5zdGRvdXQub2ZmKCdkYXRhJywgY29ubmVjdGlvbkhhbmRsZXIpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIG11eFByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgY29ubmVjdGlvbkhhbmRsZXIpO1xuICAgICAgbXV4UHJvY2Vzcy5zdGRvdXQub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICB9KTtcbiAgICByZXR1cm4gZmlsZW5hbWU7XG4gIH1cbn1cbiJdfQ==