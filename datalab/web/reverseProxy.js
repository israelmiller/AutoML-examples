"use strict";
/*
 * Copyright 2016 Google Inc. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.handleRequest = exports.getRequestPort = void 0;
var httpProxy = require("http-proxy");
var appSettings;
var proxy = httpProxy.createProxyServer(null);
var regex = new RegExp('/_proxy/([0-9]+)($|/)');
function errorHandler(error, request, response) {
    response.writeHead(500, 'Reverse Proxy Error.');
    response.end();
}
/**
 * Get port from request. If the request should be handled by reverse proxy,
 * returns the port. Otherwise, returns 0.
 */
function getRequestPort(path) {
    if (path) {
        var match = regex.exec(path);
        if (match) {
            return Number(match[1]);
        }
    }
    return 0;
}
exports.getRequestPort = getRequestPort;
/**
 * Handle request by sending it to the internal http endpoint.
 */
function handleRequest(request, response, port) {
    request.url = request.url.replace(regex, '');
    var host = 'localhost';
    if ('TEST_TMPDIR' in process.env) {
        host = '[::1]'; // Avoid DNS.
    }
    var target = "http://".concat(host, ":").concat(port);
    proxy.web(request, response, {
        target: target
    });
}
exports.handleRequest = handleRequest;
/**
 * Initialize the handler.
 */
function init(settings) {
    appSettings = settings;
    proxy.on('error', errorHandler);
}
exports.init = init;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV2ZXJzZVByb3h5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9yZXZlcnNlUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7R0FZRzs7O0FBR0gsc0NBQXdDO0FBSXhDLElBQUksV0FBd0IsQ0FBQztBQUM3QixJQUFNLEtBQUssR0FBMEIsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLElBQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFFbEQsU0FBUyxZQUFZLENBQUMsS0FBWSxFQUFFLE9BQTZCLEVBQUUsUUFBNkI7SUFDOUYsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUNoRCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDakIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxJQUFZO0lBQ3pDLElBQUksSUFBSSxFQUFFO1FBQ1IsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixJQUFJLEtBQUssRUFBRTtZQUNULE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pCO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUFSRCx3Q0FRQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsYUFBYSxDQUN6QixPQUE2QixFQUFFLFFBQTZCLEVBQzVELElBQVk7SUFDZCxPQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5QyxJQUFJLElBQUksR0FBRyxXQUFXLENBQUM7SUFDdkIsSUFBSSxhQUFhLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNoQyxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUUsYUFBYTtLQUMvQjtJQUNELElBQU0sTUFBTSxHQUFHLGlCQUFVLElBQUksY0FBSSxJQUFJLENBQUUsQ0FBQztJQUV4QyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUU7UUFDM0IsTUFBTSxRQUFBO0tBQ1AsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQWJELHNDQWFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixJQUFJLENBQUMsUUFBcUI7SUFDeEMsV0FBVyxHQUFHLFFBQVEsQ0FBQztJQUN2QixLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBSEQsb0JBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdFxuICogaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlXG4gKiBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzc1xuICogb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBQcm94eSBmcm9tICdodHRwLXByb3h5JztcblxuaW1wb3J0IHtBcHBTZXR0aW5nc30gZnJvbSAnLi9hcHBTZXR0aW5ncyc7XG5cbmxldCBhcHBTZXR0aW5nczogQXBwU2V0dGluZ3M7XG5jb25zdCBwcm94eTogaHR0cFByb3h5LlByb3h5U2VydmVyID0gaHR0cFByb3h5LmNyZWF0ZVByb3h5U2VydmVyKG51bGwpO1xuY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKCcvX3Byb3h5LyhbMC05XSspKCR8LyknKTtcblxuZnVuY3Rpb24gZXJyb3JIYW5kbGVyKGVycm9yOiBFcnJvciwgcmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlc3BvbnNlOiBodHRwLlNlcnZlclJlc3BvbnNlKSB7XG4gIHJlc3BvbnNlLndyaXRlSGVhZCg1MDAsICdSZXZlcnNlIFByb3h5IEVycm9yLicpO1xuICByZXNwb25zZS5lbmQoKTtcbn1cblxuLyoqXG4gKiBHZXQgcG9ydCBmcm9tIHJlcXVlc3QuIElmIHRoZSByZXF1ZXN0IHNob3VsZCBiZSBoYW5kbGVkIGJ5IHJldmVyc2UgcHJveHksXG4gKiByZXR1cm5zIHRoZSBwb3J0LiBPdGhlcndpc2UsIHJldHVybnMgMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcXVlc3RQb3J0KHBhdGg6IHN0cmluZyk6IG51bWJlciB7XG4gIGlmIChwYXRoKSB7XG4gICAgY29uc3QgbWF0Y2ggPSByZWdleC5leGVjKHBhdGgpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgcmV0dXJuIE51bWJlcihtYXRjaFsxXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG4vKipcbiAqIEhhbmRsZSByZXF1ZXN0IGJ5IHNlbmRpbmcgaXQgdG8gdGhlIGludGVybmFsIGh0dHAgZW5kcG9pbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVSZXF1ZXN0KFxuICAgIHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXNwb25zZTogaHR0cC5TZXJ2ZXJSZXNwb25zZSxcbiAgICBwb3J0OiBudW1iZXIpIHtcbiAgcmVxdWVzdC51cmwgPSByZXF1ZXN0LnVybCEucmVwbGFjZShyZWdleCwgJycpO1xuICBsZXQgaG9zdCA9ICdsb2NhbGhvc3QnO1xuICBpZiAoJ1RFU1RfVE1QRElSJyBpbiBwcm9jZXNzLmVudikge1xuICAgIGhvc3QgPSAnWzo6MV0nOyAgLy8gQXZvaWQgRE5TLlxuICB9XG4gIGNvbnN0IHRhcmdldCA9IGBodHRwOi8vJHtob3N0fToke3BvcnR9YDtcblxuICBwcm94eS53ZWIocmVxdWVzdCwgcmVzcG9uc2UsIHtcbiAgICB0YXJnZXRcbiAgfSk7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgaGFuZGxlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXQoc2V0dGluZ3M6IEFwcFNldHRpbmdzKSB7XG4gIGFwcFNldHRpbmdzID0gc2V0dGluZ3M7XG4gIHByb3h5Lm9uKCdlcnJvcicsIGVycm9ySGFuZGxlcik7XG59XG4iXX0=