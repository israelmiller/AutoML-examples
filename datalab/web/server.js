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
exports.stop = exports.run = void 0;
var http = require("http");
var path = require("path");
var url = require("url");
var socketio_to_dap_1 = require("./socketio_to_dap");
var socketio_to_pty_1 = require("./socketio_to_pty");
var python_lsp_1 = require("./python_lsp");
var jupyter = require("./jupyter");
var logging = require("./logging");
var reverseProxy = require("./reverseProxy");
var sockets = require("./sockets");
var server;
/**
 * The application settings instance.
 */
var appSettings;
/**
 * Handles all requests.
 * @param request the incoming HTTP request.
 * @param response the out-going HTTP response.
 * @path the parsed path in the request.
 */
function handleRequest(request, response, requestPath) {
    // The explicit set of paths we proxy to jupyter.
    if ((requestPath.indexOf('/api') === 0) ||
        (requestPath.indexOf('/nbextensions') === 0) ||
        // /files and /static are only used in runlocal.
        (requestPath.indexOf('/files') === 0) ||
        (requestPath.indexOf('/static') === 0)) {
        jupyter.handleRequest(request, response);
        return;
    }
    if (appSettings.colabRedirect && requestPath === '/') {
        var host = process.env['WEB_HOST'] || '';
        var url_1 = appSettings.colabRedirect.replace('{jupyter_host}', host);
        response.writeHead(302, {
            'Location': url_1,
        });
        response.end();
        return;
    }
    // Not Found
    response.statusCode = 404;
    response.end();
}
/**
 * Base logic for handling all requests sent to the proxy web server. Some
 * requests are handled within the server, while some are proxied to the
 * Jupyter notebook server.
 *
 * Error handling is left to the caller.
 *
 * @param request the incoming HTTP request.
 * @param response the out-going HTTP response.
 */
function uncheckedRequestHandler(request, response) {
    var e_1, _a;
    var parsedUrl = url.parse(request.url || '', true);
    var urlpath = parsedUrl.pathname || '';
    logging.logRequest(request, response);
    try {
        for (var socketIoHandlers_1 = __values(socketIoHandlers), socketIoHandlers_1_1 = socketIoHandlers_1.next(); !socketIoHandlers_1_1.done; socketIoHandlers_1_1 = socketIoHandlers_1.next()) {
            var handler = socketIoHandlers_1_1.value;
            if (handler.isPathProxied(urlpath)) {
                // Will automatically be handled by socket.io.
                return;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (socketIoHandlers_1_1 && !socketIoHandlers_1_1.done && (_a = socketIoHandlers_1.return)) _a.call(socketIoHandlers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var proxyPort = reverseProxy.getRequestPort(urlpath);
    if (sockets.isSocketIoPath(urlpath)) {
        // Will automatically be handled by socket.io.
    }
    else if (proxyPort && proxyPort !== request.socket.localPort) {
        // Do not allow proxying to this same port, as that can be used to mask the
        // target path.
        reverseProxy.handleRequest(request, response, proxyPort);
    }
    else {
        handleRequest(request, response, urlpath);
    }
}
function socketHandler(request, socket, head) {
    jupyter.handleSocket(request, socket, head);
}
/**
 * Handles all requests sent to the proxy web server. Some requests are handled within
 * the server, while some are proxied to the Jupyter notebook server.
 * @param request the incoming HTTP request.
 * @param response the out-going HTTP response.
 */
function requestHandler(request, response) {
    try {
        uncheckedRequestHandler(request, response);
    }
    catch (e) {
        logging.getLogger().error("Uncaught error handling a request to \"".concat(request.url, "\": ").concat(e));
    }
}
var socketIoHandlers = [];
/**
 * Runs the proxy web server.
 * @param settings the configuration settings to use.
 */
function run(settings) {
    jupyter.init(settings);
    reverseProxy.init(settings);
    appSettings = settings;
    server = http.createServer(requestHandler);
    // Disable HTTP keep-alive connection timeouts in order to avoid connection
    // flakes. Details: b/112151064
    server.keepAliveTimeout = 0;
    server.on('upgrade', socketHandler);
    var socketIoServer = sockets.init(server, settings);
    socketIoHandlers.push(new socketio_to_pty_1.SocketIoToPty('/tty', server));
    if (settings.debugAdapterMultiplexerPath) {
        // Handler manages its own lifetime.
        // tslint:disable-next-line:no-unused-expression
        new socketio_to_dap_1.SocketIoToDap(settings.debugAdapterMultiplexerPath, socketIoServer);
    }
    if (settings.enableLsp) {
        var contentDir = path.join(settings.datalabRoot, settings.contentDir);
        var logsDir = path.join(settings.datalabRoot, '/var/log/');
        // Handler manages its own lifetime.
        // tslint:disable-next-line:no-unused-expression
        new python_lsp_1.PythonLsp(socketIoServer, __dirname, contentDir, logsDir, settings.languageServerProxy);
    }
    logging.getLogger().info('Starting server at http://localhost:%d', settings.serverPort);
    process.on('SIGINT', function () { return process.exit(); });
    var options = { port: settings.serverPort, ipv6Only: false, host: settings.serverHost || '' };
    if ('TEST_TMPDIR' in process.env) {
        // Required to avoid "EAFNOSUPPORT: address family not supported" on IPv6-only environments
        // (notably, even with the host override below).
        options['ipv6Only'] = true;
        // ipv6Only alone isn't enough to avoid attempting to bind to 0.0.0.0 (which
        // fails on IPv6-only environments).  Need to specify an IP address because
        // DNS resolution even of ip6-localhost fails on some such environments.
        options['host'] = '::1';
    }
    server.listen(options);
}
exports.run = run;
/**
 * Stops the server and associated Jupyter server.
 */
function stop() {
    jupyter.close();
}
exports.stop = stop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7R0FZRzs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQkFBNkI7QUFFN0IsMkJBQTZCO0FBQzdCLHlCQUEyQjtBQUczQixxREFBZ0Q7QUFDaEQscURBQWdEO0FBQ2hELDJDQUF1QztBQUN2QyxtQ0FBcUM7QUFDckMsbUNBQXFDO0FBQ3JDLDZDQUErQztBQUMvQyxtQ0FBcUM7QUFFckMsSUFBSSxNQUFtQixDQUFDO0FBQ3hCOztHQUVHO0FBQ0YsSUFBSSxXQUF3QixDQUFDO0FBRTlCOzs7OztHQUtHO0FBQ0gsU0FBUyxhQUFhLENBQUMsT0FBNkIsRUFDN0IsUUFBNkIsRUFDN0IsV0FBbUI7SUFFeEMsaURBQWlEO0lBQ2pELElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLGdEQUFnRDtRQUNoRCxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRztRQUMzQyxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN6QyxPQUFPO0tBQ1I7SUFDRCxJQUFJLFdBQVcsQ0FBQyxhQUFhLElBQUksV0FBVyxLQUFLLEdBQUcsRUFBRTtRQUNwRCxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQyxJQUFNLEtBQUcsR0FBRyxXQUFXLENBQUMsYUFB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QzNFLHdFQUF3RTtRQUN4RSxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQ3pCO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBM0NELGtCQTJDQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsSUFBSTtJQUNsQixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbEIsQ0FBQztBQUZELG9CQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHRcbiAqIGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZVxuICogaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3NcbiAqIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnMgdW5kZXJcbiAqIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBuZXQgZnJvbSAnbmV0JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcblxuaW1wb3J0IHtBcHBTZXR0aW5nc30gZnJvbSAnLi9hcHBTZXR0aW5ncyc7XG5pbXBvcnQge1NvY2tldElvVG9EYXB9IGZyb20gJy4vc29ja2V0aW9fdG9fZGFwJztcbmltcG9ydCB7U29ja2V0SW9Ub1B0eX0gZnJvbSAnLi9zb2NrZXRpb190b19wdHknO1xuaW1wb3J0IHtQeXRob25Mc3B9IGZyb20gJy4vcHl0aG9uX2xzcCc7XG5pbXBvcnQgKiBhcyBqdXB5dGVyIGZyb20gJy4vanVweXRlcic7XG5pbXBvcnQgKiBhcyBsb2dnaW5nIGZyb20gJy4vbG9nZ2luZyc7XG5pbXBvcnQgKiBhcyByZXZlcnNlUHJveHkgZnJvbSAnLi9yZXZlcnNlUHJveHknO1xuaW1wb3J0ICogYXMgc29ja2V0cyBmcm9tICcuL3NvY2tldHMnO1xuXG5sZXQgc2VydmVyOiBodHRwLlNlcnZlcjtcbi8qKlxuICogVGhlIGFwcGxpY2F0aW9uIHNldHRpbmdzIGluc3RhbmNlLlxuICovXG4gbGV0IGFwcFNldHRpbmdzOiBBcHBTZXR0aW5ncztcblxuLyoqXG4gKiBIYW5kbGVzIGFsbCByZXF1ZXN0cy5cbiAqIEBwYXJhbSByZXF1ZXN0IHRoZSBpbmNvbWluZyBIVFRQIHJlcXVlc3QuXG4gKiBAcGFyYW0gcmVzcG9uc2UgdGhlIG91dC1nb2luZyBIVFRQIHJlc3BvbnNlLlxuICogQHBhdGggdGhlIHBhcnNlZCBwYXRoIGluIHRoZSByZXF1ZXN0LlxuICovXG5mdW5jdGlvbiBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogaHR0cC5TZXJ2ZXJSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFBhdGg6IHN0cmluZykge1xuXG4gIC8vIFRoZSBleHBsaWNpdCBzZXQgb2YgcGF0aHMgd2UgcHJveHkgdG8ganVweXRlci5cbiAgaWYgKChyZXF1ZXN0UGF0aC5pbmRleE9mKCcvYXBpJykgPT09IDApIHx8XG4gICAgICAocmVxdWVzdFBhdGguaW5kZXhPZignL25iZXh0ZW5zaW9ucycpID09PSAwKSB8fFxuICAgICAgLy8gL2ZpbGVzIGFuZCAvc3RhdGljIGFyZSBvbmx5IHVzZWQgaW4gcnVubG9jYWwuXG4gICAgICAocmVxdWVzdFBhdGguaW5kZXhPZignL2ZpbGVzJykgPT09IDApIHx8XG4gICAgICAocmVxdWVzdFBhdGguaW5kZXhPZignL3N0YXRpYycpID09PSAwKSkgIHtcbiAgICBqdXB5dGVyLmhhbmRsZVJlcXVlc3QocmVxdWVzdCwgcmVzcG9uc2UpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoYXBwU2V0dGluZ3MuY29sYWJSZWRpcmVjdCAmJiByZXF1ZXN0UGF0aCA9PT0gJy8nKSB7XG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52WydXRUJfSE9TVCddIHx8ICcnO1xuICAgIGNvbnN0IHVybCA9IGFwcFNldHRpbmdzLmNvbGFiUmVkaXJlY3QucmVwbGFjZSgne2p1cHl0ZXJfaG9zdH0nLCBob3N0KTtcbiAgICByZXNwb25zZS53cml0ZUhlYWQoMzAyLCB7XG4gICAgICAnTG9jYXRpb24nOiB1cmwsXG4gICAgfSk7XG4gICAgcmVzcG9uc2UuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gTm90IEZvdW5kXG4gIHJlc3BvbnNlLnN0YXR1c0NvZGUgPSA0MDQ7XG4gIHJlc3BvbnNlLmVuZCgpO1xufVxuXG4vKipcbiAqIEJhc2UgbG9naWMgZm9yIGhhbmRsaW5nIGFsbCByZXF1ZXN0cyBzZW50IHRvIHRoZSBwcm94eSB3ZWIgc2VydmVyLiBTb21lXG4gKiByZXF1ZXN0cyBhcmUgaGFuZGxlZCB3aXRoaW4gdGhlIHNlcnZlciwgd2hpbGUgc29tZSBhcmUgcHJveGllZCB0byB0aGVcbiAqIEp1cHl0ZXIgbm90ZWJvb2sgc2VydmVyLlxuICpcbiAqIEVycm9yIGhhbmRsaW5nIGlzIGxlZnQgdG8gdGhlIGNhbGxlci5cbiAqXG4gKiBAcGFyYW0gcmVxdWVzdCB0aGUgaW5jb21pbmcgSFRUUCByZXF1ZXN0LlxuICogQHBhcmFtIHJlc3BvbnNlIHRoZSBvdXQtZ29pbmcgSFRUUCByZXNwb25zZS5cbiAqL1xuZnVuY3Rpb24gdW5jaGVja2VkUmVxdWVzdEhhbmRsZXIocmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlc3BvbnNlOiBodHRwLlNlcnZlclJlc3BvbnNlKSB7XG4gIGNvbnN0IHBhcnNlZFVybCA9IHVybC5wYXJzZShyZXF1ZXN0LnVybCB8fCAnJywgdHJ1ZSk7XG4gIGNvbnN0IHVybHBhdGggPSBwYXJzZWRVcmwucGF0aG5hbWUgfHwgJyc7XG5cbiAgbG9nZ2luZy5sb2dSZXF1ZXN0KHJlcXVlc3QsIHJlc3BvbnNlKTtcblxuICBmb3IgKGNvbnN0IGhhbmRsZXIgb2Ygc29ja2V0SW9IYW5kbGVycykge1xuICAgIGlmIChoYW5kbGVyLmlzUGF0aFByb3hpZWQodXJscGF0aCkpIHtcbiAgICAgIC8vIFdpbGwgYXV0b21hdGljYWxseSBiZSBoYW5kbGVkIGJ5IHNvY2tldC5pby5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcm94eVBvcnQgPSByZXZlcnNlUHJveHkuZ2V0UmVxdWVzdFBvcnQodXJscGF0aCk7XG4gIGlmIChzb2NrZXRzLmlzU29ja2V0SW9QYXRoKHVybHBhdGgpKSB7XG4gICAgLy8gV2lsbCBhdXRvbWF0aWNhbGx5IGJlIGhhbmRsZWQgYnkgc29ja2V0LmlvLlxuICB9IGVsc2UgaWYgKHByb3h5UG9ydCAmJiBwcm94eVBvcnQgIT09IHJlcXVlc3Quc29ja2V0LmxvY2FsUG9ydCkge1xuICAgIC8vIERvIG5vdCBhbGxvdyBwcm94eWluZyB0byB0aGlzIHNhbWUgcG9ydCwgYXMgdGhhdCBjYW4gYmUgdXNlZCB0byBtYXNrIHRoZVxuICAgIC8vIHRhcmdldCBwYXRoLlxuICAgIHJldmVyc2VQcm94eS5oYW5kbGVSZXF1ZXN0KHJlcXVlc3QsIHJlc3BvbnNlLCBwcm94eVBvcnQpO1xuICB9IGVsc2Uge1xuICAgIGhhbmRsZVJlcXVlc3QocmVxdWVzdCwgcmVzcG9uc2UsIHVybHBhdGgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNvY2tldEhhbmRsZXIocmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHNvY2tldDogbmV0LlNvY2tldCwgaGVhZDogQnVmZmVyKSB7XG4gIGp1cHl0ZXIuaGFuZGxlU29ja2V0KHJlcXVlc3QsIHNvY2tldCwgaGVhZCk7XG59XG5cbi8qKlxuICogSGFuZGxlcyBhbGwgcmVxdWVzdHMgc2VudCB0byB0aGUgcHJveHkgd2ViIHNlcnZlci4gU29tZSByZXF1ZXN0cyBhcmUgaGFuZGxlZCB3aXRoaW5cbiAqIHRoZSBzZXJ2ZXIsIHdoaWxlIHNvbWUgYXJlIHByb3hpZWQgdG8gdGhlIEp1cHl0ZXIgbm90ZWJvb2sgc2VydmVyLlxuICogQHBhcmFtIHJlcXVlc3QgdGhlIGluY29taW5nIEhUVFAgcmVxdWVzdC5cbiAqIEBwYXJhbSByZXNwb25zZSB0aGUgb3V0LWdvaW5nIEhUVFAgcmVzcG9uc2UuXG4gKi9cbmZ1bmN0aW9uIHJlcXVlc3RIYW5kbGVyKHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXNwb25zZTogaHR0cC5TZXJ2ZXJSZXNwb25zZSkge1xuICB0cnkge1xuICAgIHVuY2hlY2tlZFJlcXVlc3RIYW5kbGVyKHJlcXVlc3QsIHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoXG4gICAgICAgIGBVbmNhdWdodCBlcnJvciBoYW5kbGluZyBhIHJlcXVlc3QgdG8gXCIke3JlcXVlc3QudXJsfVwiOiAke2V9YCk7XG4gIH1cbn1cblxuY29uc3Qgc29ja2V0SW9IYW5kbGVyczogU29ja2V0SW9Ub1B0eVtdID0gW107XG5cbi8qKlxuICogUnVucyB0aGUgcHJveHkgd2ViIHNlcnZlci5cbiAqIEBwYXJhbSBzZXR0aW5ncyB0aGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyB0byB1c2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBydW4oc2V0dGluZ3M6IEFwcFNldHRpbmdzKTogdm9pZCB7XG4gIGp1cHl0ZXIuaW5pdChzZXR0aW5ncyk7XG4gIHJldmVyc2VQcm94eS5pbml0KHNldHRpbmdzKTtcbiAgYXBwU2V0dGluZ3MgPSBzZXR0aW5ncztcblxuICBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihyZXF1ZXN0SGFuZGxlcik7XG4gIC8vIERpc2FibGUgSFRUUCBrZWVwLWFsaXZlIGNvbm5lY3Rpb24gdGltZW91dHMgaW4gb3JkZXIgdG8gYXZvaWQgY29ubmVjdGlvblxuICAvLyBmbGFrZXMuIERldGFpbHM6IGIvMTEyMTUxMDY0XG4gIHNlcnZlci5rZWVwQWxpdmVUaW1lb3V0ID0gMDtcbiAgc2VydmVyLm9uKCd1cGdyYWRlJywgc29ja2V0SGFuZGxlcik7XG5cbiAgY29uc3Qgc29ja2V0SW9TZXJ2ZXIgPSBzb2NrZXRzLmluaXQoc2VydmVyLCBzZXR0aW5ncyk7XG5cbiAgc29ja2V0SW9IYW5kbGVycy5wdXNoKG5ldyBTb2NrZXRJb1RvUHR5KCcvdHR5Jywgc2VydmVyKSk7XG5cbiAgaWYgKHNldHRpbmdzLmRlYnVnQWRhcHRlck11bHRpcGxleGVyUGF0aCkge1xuICAgIC8vIEhhbmRsZXIgbWFuYWdlcyBpdHMgb3duIGxpZmV0aW1lLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnVzZWQtZXhwcmVzc2lvblxuICAgIG5ldyBTb2NrZXRJb1RvRGFwKHNldHRpbmdzLmRlYnVnQWRhcHRlck11bHRpcGxleGVyUGF0aCwgc29ja2V0SW9TZXJ2ZXIpO1xuICB9XG5cbiAgaWYgKHNldHRpbmdzLmVuYWJsZUxzcCkge1xuICAgIGNvbnN0IGNvbnRlbnREaXIgPSBwYXRoLmpvaW4oc2V0dGluZ3MuZGF0YWxhYlJvb3QsIHNldHRpbmdzLmNvbnRlbnREaXIpO1xuICAgIGNvbnN0IGxvZ3NEaXIgPSBwYXRoLmpvaW4oc2V0dGluZ3MuZGF0YWxhYlJvb3QsICcvdmFyL2xvZy8nKTtcbiAgICAvLyBIYW5kbGVyIG1hbmFnZXMgaXRzIG93biBsaWZldGltZS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdW51c2VkLWV4cHJlc3Npb25cbiAgICBuZXcgUHl0aG9uTHNwKHNvY2tldElvU2VydmVyLCBfX2Rpcm5hbWUsIGNvbnRlbnREaXIsIGxvZ3NEaXIsIHNldHRpbmdzLmxhbmd1YWdlU2VydmVyUHJveHkpO1xuICB9XG5cbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKCdTdGFydGluZyBzZXJ2ZXIgYXQgaHR0cDovL2xvY2FsaG9zdDolZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5zZXJ2ZXJQb3J0KTtcbiAgcHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4gcHJvY2Vzcy5leGl0KCkpO1xuICBjb25zdCBvcHRpb25zID0ge3BvcnQ6IHNldHRpbmdzLnNlcnZlclBvcnQsIGlwdjZPbmx5OiBmYWxzZSwgaG9zdDogc2V0dGluZ3Muc2VydmVySG9zdCB8fCAnJ307XG4gIGlmICgnVEVTVF9UTVBESVInIGluIHByb2Nlc3MuZW52KSB7XG4gICAgLy8gUmVxdWlyZWQgdG8gYXZvaWQgXCJFQUZOT1NVUFBPUlQ6IGFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWRcIiBvbiBJUHY2LW9ubHkgZW52aXJvbm1lbnRzXG4gICAgLy8gKG5vdGFibHksIGV2ZW4gd2l0aCB0aGUgaG9zdCBvdmVycmlkZSBiZWxvdykuXG4gICAgb3B0aW9uc1snaXB2Nk9ubHknXSA9IHRydWU7XG4gICAgLy8gaXB2Nk9ubHkgYWxvbmUgaXNuJ3QgZW5vdWdoIHRvIGF2b2lkIGF0dGVtcHRpbmcgdG8gYmluZCB0byAwLjAuMC4wICh3aGljaFxuICAgIC8vIGZhaWxzIG9uIElQdjYtb25seSBlbnZpcm9ubWVudHMpLiAgTmVlZCB0byBzcGVjaWZ5IGFuIElQIGFkZHJlc3MgYmVjYXVzZVxuICAgIC8vIEROUyByZXNvbHV0aW9uIGV2ZW4gb2YgaXA2LWxvY2FsaG9zdCBmYWlscyBvbiBzb21lIHN1Y2ggZW52aXJvbm1lbnRzLlxuICAgIG9wdGlvbnNbJ2hvc3QnXSA9ICc6OjEnO1xuICB9XG4gIHNlcnZlci5saXN0ZW4ob3B0aW9ucyk7XG59XG5cbi8qKlxuICogU3RvcHMgdGhlIHNlcnZlciBhbmQgYXNzb2NpYXRlZCBKdXB5dGVyIHNlcnZlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3AoKTogdm9pZCB7XG4gIGp1cHl0ZXIuY2xvc2UoKTtcbn1cbiJdfQ==