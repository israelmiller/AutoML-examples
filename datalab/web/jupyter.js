"use strict";
/*
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
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
exports.handleRequest = exports.handleSocket = exports.close = exports.init = void 0;
var childProcess = require("child_process");
var httpProxy = require("http-proxy");
var path = require("path");
var logging = require("./logging");
/**
 * Singleton tracking the jupyter server instance we manage.
 */
var jupyterServer = null;
/**
 * The maximum number of times we'll restart jupyter; we set a limit to avoid
 * users being stuck with a slow-crash-looping server.
 */
var remainingJupyterServerRestarts = 20;
/**
 * The application settings instance.
 */
var appSettings;
function pipeOutput(stream) {
    stream.setEncoding('utf8');
    // The format we parse here corresponds to the log format we set in our
    // jupyter configuration.
    var logger = logging.getJupyterLogger();
    stream.on('data', function (data) {
        var e_1, _a;
        try {
            for (var _b = __values(data.split('\n')), _c = _b.next(); !_c.done; _c = _b.next()) {
                var line = _c.value;
                if (line.trim().length === 0) {
                    continue;
                }
                var parts = line.split('|', 3);
                if (parts.length !== 3) {
                    // Non-logging messages (eg tracebacks) get logged as warnings.
                    logger.warn(line);
                    continue;
                }
                var level = parts[1];
                var message = parts[2];
                // We need to map Python's log levels to those used by bunyan.
                if (level === "CRITICAL" /* LogLevels.CRITICAL */ || level === "ERROR" /* LogLevels.ERROR */) {
                    logger.error(message);
                }
                else if (level === "WARNING" /* LogLevels.WARNING */) {
                    logger.warn(message);
                }
                else if (level === "INFO" /* LogLevels.INFO */) {
                    logger.info(message);
                }
                else {
                    // We map DEBUG, NOTSET, and any unknown log levels to debug.
                    logger.debug(message);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function createJupyterServer() {
    var e_2, _a;
    if (!remainingJupyterServerRestarts) {
        logging.getLogger().error('No jupyter restart attempts remaining.');
        return;
    }
    remainingJupyterServerRestarts -= 1;
    var port = appSettings.nextJupyterPort;
    logging.getLogger().info('Launching Jupyter server at %d', port);
    function exitHandler(code, signal) {
        if (jupyterServer) {
            logging.getLogger().error('Jupyter process %d exited due to signal: %s', jupyterServer.childProcess.pid, signal);
        }
        else {
            logging.getLogger().error('Jupyter process exit before server creation finished due to signal: %s', signal);
        }
        // We want to restart jupyter whenever it terminates.
        createJupyterServer();
    }
    var contentDir = path.join(appSettings.datalabRoot, appSettings.contentDir);
    var processArgs = ['notebook'].concat(appSettings.jupyterArgs).concat([
        "--port=".concat(port),
        "--FileContentsManager.root_dir=".concat(appSettings.datalabRoot, "/"),
        // TODO(b/136659627): Delete this line.
        "--MappingKernelManager.root_dir=".concat(contentDir),
    ]);
    var jupyterServerAddr = 'localhost';
    try {
        for (var _b = __values(appSettings.jupyterArgs), _c = _b.next(); !_c.done; _c = _b.next()) {
            var flag = _c.value;
            // Extracts a string like '1.2.3.4' from the string '--ip=1.2.3.4'
            var match = flag.match(/--ip=([^ ]+)/);
            if (match) {
                jupyterServerAddr = match[1];
                break;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    logging.getLogger().info('Using jupyter server address %s', jupyterServerAddr);
    var processOptions = {
        detached: false,
        env: process.env,
    };
    var serverProcess = childProcess.spawn('jupyter', processArgs, processOptions);
    serverProcess.on('exit', exitHandler);
    logging.getLogger().info('Jupyter process started with pid %d and args %j', serverProcess.pid, processArgs);
    // Capture the output, so it can be piped for logging.
    pipeOutput(serverProcess.stdout);
    pipeOutput(serverProcess.stderr);
    // Create the proxy.
    var proxyTargetHost = appSettings.kernelManagerProxyHost || jupyterServerAddr;
    var proxyTargetPort = appSettings.kernelManagerProxyPort || port;
    var proxy = httpProxy.createProxyServer({ target: "http://".concat(proxyTargetHost, ":").concat(proxyTargetPort) });
    proxy.on('error', errorHandler);
    jupyterServer = { port: port, proxy: proxy, childProcess: serverProcess };
}
/**
 * Initializes the Jupyter server manager.
 */
function init(settings) {
    appSettings = settings;
    createJupyterServer();
}
exports.init = init;
/**
 * Closes the Jupyter server manager.
 */
function close() {
    if (!jupyterServer) {
        return;
    }
    var pid = jupyterServer.childProcess.pid;
    logging.getLogger().info("jupyter close: PID: ".concat(pid));
    jupyterServer.childProcess.kill('SIGHUP');
}
exports.close = close;
/** Proxy this socket request to jupyter. */
function handleSocket(request, socket, head) {
    if (!jupyterServer) {
        logging.getLogger().error('Jupyter server is not running.');
        return;
    }
    jupyterServer.proxy.ws(request, socket, head);
}
exports.handleSocket = handleSocket;
/** Proxy this HTTP request to jupyter. */
function handleRequest(request, response) {
    if (!jupyterServer) {
        response.statusCode = 500;
        response.end();
        return;
    }
    jupyterServer.proxy.web(request, response, null);
}
exports.handleRequest = handleRequest;
function errorHandler(error, request, response) {
    logging.getLogger().error(error, 'Jupyter server returned error.');
    response.writeHead(500, 'Internal Server Error');
    response.end();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVweXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvanVweXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7OztHQVlHOzs7Ozs7Ozs7Ozs7OztBQUVILDRDQUE4QztBQUU5QyxzQ0FBd0M7QUFFeEMsMkJBQTZCO0FBRzdCLG1DQUFxQztBQVFyQzs7R0FFRztBQUNILElBQUksYUFBYSxHQUF1QixJQUFJLENBQUM7QUFFN0M7OztHQUdHO0FBQ0gsSUFBSSw4QkFBOEIsR0FBVyxFQUFFLENBQUM7QUFFaEQ7O0dBRUc7QUFDSCxJQUFJLFdBQXdCLENBQUM7QUFlN0IsU0FBUyxVQUFVLENBQUMsTUFBNkI7SUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUUzQix1RUFBdUU7SUFDdkUseUJBQXlCO0lBQ3pCLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUMsSUFBWTs7O1lBQzdCLEtBQW1CLElBQUEsS0FBQSxTQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7Z0JBQWhDLElBQU0sSUFBSSxXQUFBO2dCQUNiLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQzVCLFNBQVM7aUJBQ1Y7Z0JBQ0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQ3RCLCtEQUErRDtvQkFDL0QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEIsU0FBUztpQkFDVjtnQkFDRCxJQUFN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SUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFSRCxzQkFRQztBQUVELDRDQUE0QztBQUM1QyxTQUFnQixZQUFZLENBQUMsT0FBNkIsRUFBRSxNQUFrQixFQUFFLElBQVk7SUFDMUYsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUNsQixPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDNUQsT0FBTztLQUNSO0lBQ0QsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoRCxDQUFDO0FBTkQsb0NBTUM7QUFFRCwwQ0FBMEM7QUFDMUMsU0FBZ0IsYUFBYSxDQUFDLE9BQTZCLEVBQUUsUUFBNkI7SUFDeEYsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUNsQixRQUFRLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUMxQixRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDZixPQUFPO0tBQ1I7SUFFRCxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFSRCxzQ0FRQztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQVksRUFBRSxPQUE2QixFQUFFLFFBQTZCO0lBQzlGLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7SUFFbkUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUNqRCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0XG4gKiBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2VcbiAqIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzXG4gKiBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zIHVuZGVyXG4gKiB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBjaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cFByb3h5IGZyb20gJ2h0dHAtcHJveHknO1xuaW1wb3J0ICogYXMgbmV0IGZyb20gJ25ldCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge0FwcFNldHRpbmdzfSBmcm9tICcuL2FwcFNldHRpbmdzJztcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnLi9sb2dnaW5nJztcblxuaW50ZXJmYWNlIEp1cHl0ZXJTZXJ2ZXIge1xuICBwb3J0OiBudW1iZXI7XG4gIGNoaWxkUHJvY2VzczogY2hpbGRQcm9jZXNzLkNoaWxkUHJvY2VzcztcbiAgcHJveHk6IGh0dHBQcm94eS5Qcm94eVNlcnZlcjtcbn1cblxuLyoqXG4gKiBTaW5nbGV0b24gdHJhY2tpbmcgdGhlIGp1cHl0ZXIgc2VydmVyIGluc3RhbmNlIHdlIG1hbmFnZS5cbiAqL1xubGV0IGp1cHl0ZXJTZXJ2ZXI6IEp1cHl0ZXJTZXJ2ZXJ8bnVsbCA9IG51bGw7XG5cbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIHRpbWVzIHdlJ2xsIHJlc3RhcnQganVweXRlcjsgd2Ugc2V0IGEgbGltaXQgdG8gYXZvaWRcbiAqIHVzZXJzIGJlaW5nIHN0dWNrIHdpdGggYSBzbG93LWNyYXNoLWxvb3Bpbmcgc2VydmVyLlxuICovXG5sZXQgcmVtYWluaW5nSnVweXRlclNlcnZlclJlc3RhcnRzOiBudW1iZXIgPSAyMDtcblxuLyoqXG4gKiBUaGUgYXBwbGljYXRpb24gc2V0dGluZ3MgaW5zdGFuY2UuXG4gKi9cbmxldCBhcHBTZXR0aW5nczogQXBwU2V0dGluZ3M7XG5cbi8qXG4gKiBUaGlzIGxpc3Qgb2YgbGV2ZWxzIHNob3VsZCBtYXRjaCB0aGUgb25lcyB1c2VkIGJ5IFB5dGhvbjpcbiAqICAgaHR0cHM6Ly9kb2NzLnB5dGhvbi5vcmcvMy9saWJyYXJ5L2xvZ2dpbmcuaHRtbCNsb2dnaW5nLWxldmVsc1xuICovXG5jb25zdCBlbnVtIExvZ0xldmVscyB7XG4gIENSSVRJQ0FMID0gJ0NSSVRJQ0FMJyxcbiAgRVJST1IgPSAnRVJST1InLFxuICBXQVJOSU5HID0gJ1dBUk5JTkcnLFxuICBJTkZPID0gJ0lORk8nLFxuICBERUJVRyA9ICdERUJVRycsXG4gIE5PVFNFVCA9ICdOT1RTRVQnLFxufVxuXG5mdW5jdGlvbiBwaXBlT3V0cHV0KHN0cmVhbTogTm9kZUpTLlJlYWRhYmxlU3RyZWFtKSB7XG4gIHN0cmVhbS5zZXRFbmNvZGluZygndXRmOCcpO1xuXG4gIC8vIFRoZSBmb3JtYXQgd2UgcGFyc2UgaGVyZSBjb3JyZXNwb25kcyB0byB0aGUgbG9nIGZvcm1hdCB3ZSBzZXQgaW4gb3VyXG4gIC8vIGp1cHl0ZXIgY29uZmlndXJhdGlvbi5cbiAgY29uc3QgbG9nZ2VyID0gbG9nZ2luZy5nZXRKdXB5dGVyTG9nZ2VyKCk7XG4gIHN0cmVhbS5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgZGF0YS5zcGxpdCgnXFxuJykpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJ0cyA9IGxpbmUuc3BsaXQoJ3wnLCAzKTtcbiAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDMpIHtcbiAgICAgICAgLy8gTm9uLWxvZ2dpbmcgbWVzc2FnZXMgKGVnIHRyYWNlYmFja3MpIGdldCBsb2dnZWQgYXMgd2FybmluZ3MuXG4gICAgICAgIGxvZ2dlci53YXJuKGxpbmUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxldmVsID0gcGFydHNbMV07XG4gICAgICBjb25zdCBtZXNzYWdlID0gcGFydHNbMl07XG4gICAgICAvLyBXZSBuZWVkIHRvIG1hcCBQeXRob24ncyBsb2cgbGV2ZWxzIHRvIHRob3NlIHVzZWQgYnkgYnVueWFuLlxuICAgICAgaWYgKGxldmVsID09PSBMb2dMZXZlbHMuQ1JJVElDQUwgfHwgbGV2ZWwgPT09IExvZ0xldmVscy5FUlJPUikge1xuICAgICAgICBsb2dnZXIuZXJyb3IobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKGxldmVsID09PSBMb2dMZXZlbHMuV0FSTklORykge1xuICAgICAgICBsb2dnZXIud2FybihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09IExvZ0xldmVscy5JTkZPKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgbWFwIERFQlVHLCBOT1RTRVQsIGFuZCBhbnkgdW5rbm93biBsb2cgbGV2ZWxzIHRvIGRlYnVnLlxuICAgICAgICBsb2dnZXIuZGVidWcobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSnVweXRlclNlcnZlcigpIHtcbiAgaWYgKCFyZW1haW5pbmdKdXB5dGVyU2VydmVyUmVzdGFydHMpIHtcbiAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKCdObyBqdXB5dGVyIHJlc3RhcnQgYXR0ZW1wdHMgcmVtYWluaW5nLicpO1xuICAgIHJldHVybjtcbiAgfVxuICByZW1haW5pbmdKdXB5dGVyU2VydmVyUmVzdGFydHMgLT0gMTtcbiAgY29uc3QgcG9ydCA9IGFwcFNldHRpbmdzLm5leHRKdXB5dGVyUG9ydDtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKCdMYXVuY2hpbmcgSnVweXRlciBzZXJ2ZXIgYXQgJWQnLCBwb3J0KTtcblxuICBmdW5jdGlvbiBleGl0SGFuZGxlcihjb2RlOiBudW1iZXIsIHNpZ25hbDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKGp1cHl0ZXJTZXJ2ZXIpIHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoXG4gICAgICAgICAgJ0p1cHl0ZXIgcHJvY2VzcyAlZCBleGl0ZWQgZHVlIHRvIHNpZ25hbDogJXMnLFxuICAgICAgICAgIGp1cHl0ZXJTZXJ2ZXIuY2hpbGRQcm9jZXNzLnBpZCEsIHNpZ25hbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoXG4gICAgICAgICdKdXB5dGVyIHByb2Nlc3MgZXhpdCBiZWZvcmUgc2VydmVyIGNyZWF0aW9uIGZpbmlzaGVkIGR1ZSB0byBzaWduYWw6ICVzJyxcbiAgICAgICAgc2lnbmFsKTtcbiAgICB9XG4gICAgLy8gV2Ugd2FudCB0byByZXN0YXJ0IGp1cHl0ZXIgd2hlbmV2ZXIgaXQgdGVybWluYXRlcy5cbiAgICBjcmVhdGVKdXB5dGVyU2VydmVyKCk7XG4gIH1cblxuICBjb25zdCBjb250ZW50RGlyID0gcGF0aC5qb2luKGFwcFNldHRpbmdzLmRhdGFsYWJSb290LCBhcHBTZXR0aW5ncy5jb250ZW50RGlyKTtcbiAgY29uc3QgcHJvY2Vzc0FyZ3MgPSBbJ25vdGVib29rJ10uY29uY2F0KGFwcFNldHRpbmdzLmp1cHl0ZXJBcmdzKS5jb25jYXQoW1xuICAgIGAtLXBvcnQ9JHtwb3J0fWAsXG4gICAgYC0tRmlsZUNvbnRlbnRzTWFuYWdlci5yb290X2Rpcj0ke2FwcFNldHRpbmdzLmRhdGFsYWJSb290fS9gLFxuICAgIC8vIFRPRE8oYi8xMzY2NTk2MjcpOiBEZWxldGUgdGhpcyBsaW5lLlxuICAgIGAtLU1hcHBpbmdLZXJuZWxNYW5hZ2VyLnJvb3RfZGlyPSR7Y29udGVudERpcn1gLFxuICBdKTtcblxuICBsZXQganVweXRlclNlcnZlckFkZHIgPSAnbG9jYWxob3N0JztcbiAgZm9yIChjb25zdCBmbGFnIG9mIGFwcFNldHRpbmdzLmp1cHl0ZXJBcmdzKSB7XG4gICAgLy8gRXh0cmFjdHMgYSBzdHJpbmcgbGlrZSAnMS4yLjMuNCcgZnJvbSB0aGUgc3RyaW5nICctLWlwPTEuMi4zLjQnXG4gICAgY29uc3QgbWF0Y2ggPSBmbGFnLm1hdGNoKC8tLWlwPShbXiBdKykvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGp1cHl0ZXJTZXJ2ZXJBZGRyID0gbWF0Y2hbMV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKFxuICAgICAgJ1VzaW5nIGp1cHl0ZXIgc2VydmVyIGFkZHJlc3MgJXMnLCBqdXB5dGVyU2VydmVyQWRkcik7XG5cbiAgY29uc3QgcHJvY2Vzc09wdGlvbnMgPSB7XG4gICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgIGVudjogcHJvY2Vzcy5lbnYsXG4gIH07XG5cbiAgY29uc3Qgc2VydmVyUHJvY2VzcyA9XG4gICAgICBjaGlsZFByb2Nlc3Muc3Bhd24oJ2p1cHl0ZXInLCBwcm9jZXNzQXJncywgcHJvY2Vzc09wdGlvbnMpO1xuICBzZXJ2ZXJQcm9jZXNzLm9uKCdleGl0JywgZXhpdEhhbmRsZXIpO1xuICBsb2dnaW5nLmdldExvZ2dlcigpLmluZm8oXG4gICAgICAnSnVweXRlciBwcm9jZXNzIHN0YXJ0ZWQgd2l0aCBwaWQgJWQgYW5kIGFyZ3MgJWonLCBzZXJ2ZXJQcm9jZXNzLnBpZCEsXG4gICAgICBwcm9jZXNzQXJncyk7XG5cbiAgLy8gQ2FwdHVyZSB0aGUgb3V0cHV0LCBzbyBpdCBjYW4gYmUgcGlwZWQgZm9yIGxvZ2dpbmcuXG4gIHBpcGVPdXRwdXQoc2VydmVyUHJvY2Vzcy5zdGRvdXQpO1xuICBwaXBlT3V0cHV0KHNlcnZlclByb2Nlc3Muc3RkZXJyKTtcblxuICAvLyBDcmVhdGUgdGhlIHByb3h5LlxuICBjb25zdCBwcm94eVRhcmdldEhvc3QgPVxuICAgICAgYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdCB8fCBqdXB5dGVyU2VydmVyQWRkcjtcbiAgY29uc3QgcHJveHlUYXJnZXRQb3J0ID0gYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5UG9ydCB8fCBwb3J0O1xuXG4gIGNvbnN0IHByb3h5ID0gaHR0cFByb3h5LmNyZWF0ZVByb3h5U2VydmVyKFxuICAgICAge3RhcmdldDogYGh0dHA6Ly8ke3Byb3h5VGFyZ2V0SG9zdH06JHtwcm94eVRhcmdldFBvcnR9YH0pO1xuICBwcm94eS5vbignZXJyb3InLCBlcnJvckhhbmRsZXIpO1xuXG4gIGp1cHl0ZXJTZXJ2ZXIgPSB7cG9ydCwgcHJveHksIGNoaWxkUHJvY2Vzczogc2VydmVyUHJvY2Vzc307XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIEp1cHl0ZXIgc2VydmVyIG1hbmFnZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KHNldHRpbmdzOiBBcHBTZXR0aW5ncyk6IHZvaWQge1xuICBhcHBTZXR0aW5ncyA9IHNldHRpbmdzO1xuICBjcmVhdGVKdXB5dGVyU2VydmVyKCk7XG59XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBKdXB5dGVyIHNlcnZlciBtYW5hZ2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2UoKTogdm9pZCB7XG4gIGlmICghanVweXRlclNlcnZlcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBpZCA9IGp1cHl0ZXJTZXJ2ZXIuY2hpbGRQcm9jZXNzLnBpZDtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKGBqdXB5dGVyIGNsb3NlOiBQSUQ6ICR7cGlkfWApO1xuICBqdXB5dGVyU2VydmVyLmNoaWxkUHJvY2Vzcy5raWxsKCdTSUdIVVAnKTtcbn1cblxuLyoqIFByb3h5IHRoaXMgc29ja2V0IHJlcXVlc3QgdG8ganVweXRlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVTb2NrZXQocmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHNvY2tldDogbmV0LlNvY2tldCwgaGVhZDogQnVmZmVyKSB7XG4gIGlmICghanVweXRlclNlcnZlcikge1xuICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoJ0p1cHl0ZXIgc2VydmVyIGlzIG5vdCBydW5uaW5nLicpO1xuICAgIHJldHVybjtcbiAgfVxuICBqdXB5dGVyU2VydmVyLnByb3h5LndzKHJlcXVlc3QsIHNvY2tldCwgaGVhZCk7XG59XG5cbi8qKiBQcm94eSB0aGlzIEhUVFAgcmVxdWVzdCB0byBqdXB5dGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlc3BvbnNlOiBodHRwLlNlcnZlclJlc3BvbnNlKSB7XG4gIGlmICghanVweXRlclNlcnZlcikge1xuICAgIHJlc3BvbnNlLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgcmVzcG9uc2UuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAganVweXRlclNlcnZlci5wcm94eS53ZWIocmVxdWVzdCwgcmVzcG9uc2UsIG51bGwpO1xufVxuXG5mdW5jdGlvbiBlcnJvckhhbmRsZXIoZXJyb3I6IEVycm9yLCByZXF1ZXN0OiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzcG9uc2U6IGh0dHAuU2VydmVyUmVzcG9uc2UpIHtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihlcnJvciwgJ0p1cHl0ZXIgc2VydmVyIHJldHVybmVkIGVycm9yLicpO1xuXG4gIHJlc3BvbnNlLndyaXRlSGVhZCg1MDAsICdJbnRlcm5hbCBTZXJ2ZXIgRXJyb3InKTtcbiAgcmVzcG9uc2UuZW5kKCk7XG59XG4iXX0=