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
exports.initializeLoggers = exports.logRequest = exports.getJupyterLogger = exports.getLogger = void 0;
var bunyan = require("bunyan");
var path = require("path");
// We import the bunyan-rotating-file-stream package, which exports a
// constructor as a single object; we use lint disables here to make the usage
// below look reasonable.
//
// tslint:disable-next-line:no-require-imports variable-name enforce-name-casing
var RotatingFileStream = require('bunyan-rotating-file-stream');
var logger = null;
var requestLogger = null;
var jupyterLogger = null;
/**
 * Gets the logger for generating debug logs.
 * @returns the logger configured for debugging logging.
 */
function getLogger() {
    return logger;
}
exports.getLogger = getLogger;
/**
 * Gets the logger for generating Jupyter logs.
 * @returns the logger configured for Jupyter logging.
 */
function getJupyterLogger() {
    return jupyterLogger;
}
exports.getJupyterLogger = getJupyterLogger;
/**
 * Logs a request and the corresponding response.
 * @param request the request to be logged.
 * @param response the response to be logged.
 */
function logRequest(request, response) {
    requestLogger.info({ url: request.url, method: request.method }, 'Received a new request');
    response.on('finish', function () {
        requestLogger.info({
            url: request.url,
            method: request.method,
            status: response.statusCode
        });
    });
}
exports.logRequest = logRequest;
/**
 * Initializes loggers used within the application.
 */
function initializeLoggers(settings) {
    var e_1, _a;
    // We configure our loggers as follows:
    //  * our base logger tags all log records with `"name":"app"`, and sends logs
    //    to stderr (including logs of all children)
    //  * one child logger adds `"type":"request"`, and records method/URL for all
    //    HTTP requests to the app, and method/URL/response code for all responses
    //  * one child logger adds `"type":"jupyter"`, and records all messages from
    //    the jupyter notebook server. These logs are also sent to a file on disk
    //    (to assist user debugging).
    //
    // For more about bunyan, see:
    //   https://github.com/trentm/node-bunyan/tree/f21007d46c0e64072617380b70d3f542368318a8
    var jupyterLogPath = path.join(settings.datalabRoot, '/var/colab/app.log');
    logger = bunyan.createLogger({
        name: 'app',
        streams: [
            { level: 'debug', type: 'stream', stream: process.stderr },
        ]
    });
    requestLogger = logger.child({ type: 'request' });
    jupyterLogger = logger.child({
        type: 'jupyter',
        streams: [{
                level: 'info',
                type: 'stream',
                stream: new RotatingFileStream({
                    path: jupyterLogPath,
                    rotateExisting: false,
                    threshold: '2m',
                    totalSize: '20m'
                }),
            }]
    });
    try {
        for (var _b = __values([logger, jupyterLogger, requestLogger]), _c = _b.next(); !_c.done; _c = _b.next()) {
            var logs = _c.value;
            // Omit superfluous fields.
            delete logs.fields['hostname'];
            delete logs.fields['name'];
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
exports.initializeLoggers = initializeLoggers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvbG9nZ2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7OztHQVlHOzs7Ozs7Ozs7Ozs7OztBQUVILCtCQUFpQztBQUVqQywyQkFBNkI7QUFJN0IscUVBQXFFO0FBQ3JFLDhFQUE4RTtBQUM5RSx5QkFBeUI7QUFDekIsRUFBRTtBQUNGLGdGQUFnRjtBQUNoRixJQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLElBQUksTUFBTSxHQUF3QixJQUFJLENBQUM7QUFDdkMsSUFBSSxhQUFhLEdBQXdCLElBQUksQ0FBQztBQUM5QyxJQUFJLGFBQWEsR0FBd0IsSUFBSSxDQUFDO0FBRTlDOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsT0FBTyxNQUFPLENBQUM7QUFDakIsQ0FBQztBQUZELDhCQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsZ0JBQWdCO0lBQzlCLE9BQU8sYUFBYyxDQUFDO0FBQ3hCLENBQUM7QUFGRCw0Q0FFQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQixVQUFVLENBQUMsT0FBNkIsRUFBRSxRQUE2QjtJQUNyRixhQUFjLENBQUMsSUFBSSxDQUNmLEVBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0lBQzFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO1FBQ3BCLGFBQWMsQ0FBQyxJQUFJLENBQUM7WUFDbEIsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHO1lBQ2hCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtZQUN0QixNQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVU7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBVkQsZ0NBVUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLFFBQXFCOztJQUNyRCx1Q0FBdUM7SUFDdkMsOEVBQThFO0lBQzlFLGdEQUFnRDtJQUNoRCw4RUFBOEU7SUFDOUUsOEVBQThFO0lBQzlFLDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFDN0UsaUNBQWlDO0lBQ2pDLEVBQUU7SUFDRiw4QkFBOEI7SUFDOUIsd0ZBQXdGO0lBQ3hGLElBQU0sY0FBYyxHQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUMxRCxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztRQUMzQixJQUFJLEVBQUUsS0FBSztRQUNYLE9BQU8sRUFBRTtZQUNQLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFDO1NBQ3pEO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsYUFBYSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLENBQUMsQ0FBQztJQUNoRCxhQUFhLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUMzQixJQUFJLEVBQUUsU0FBUztRQUNmLE9BQU8sRUFBRSxDQUFDO2dCQUNSLEtBQUssRUFBRSxNQUFNO2dCQUNiLElBQUksRUFBRSxRQUFRO2dCQUNkLE1BQU0sRUFBRSxJQUFJLGtCQUFrQixDQUFDO29CQUM3QixJQUFJLEVBQUUsY0FBYztvQkFDcEIsY0FBYyxFQUFFLEtBQUs7b0JBQ3JCLFNBQVMsRUFBRSxJQUFJO29CQUNmLFNBQVMsRUFBRSxLQUFLO2lCQUNqQixDQUFDO2FBQ0gsQ0FBQztLQUNILENBQUMsQ0FBQzs7UUFDSCxLQUFtQixJQUFBLEtBQUEsU0FBQSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7WUFBdEQsSUFBTSxJQUFJLFdBQUE7WUFDYiwyQkFBMkI7WUFDM0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM1Qjs7Ozs7Ozs7O0FBQ0gsQ0FBQztBQXZDRCw4Q0F1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdFxuICogaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlXG4gKiBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzc1xuICogb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgYnVueWFuIGZyb20gJ2J1bnlhbic7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtBcHBTZXR0aW5nc30gZnJvbSAnLi9hcHBTZXR0aW5ncyc7XG5cbi8vIFdlIGltcG9ydCB0aGUgYnVueWFuLXJvdGF0aW5nLWZpbGUtc3RyZWFtIHBhY2thZ2UsIHdoaWNoIGV4cG9ydHMgYVxuLy8gY29uc3RydWN0b3IgYXMgYSBzaW5nbGUgb2JqZWN0OyB3ZSB1c2UgbGludCBkaXNhYmxlcyBoZXJlIHRvIG1ha2UgdGhlIHVzYWdlXG4vLyBiZWxvdyBsb29rIHJlYXNvbmFibGUuXG4vL1xuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXJlcXVpcmUtaW1wb3J0cyB2YXJpYWJsZS1uYW1lIGVuZm9yY2UtbmFtZS1jYXNpbmdcbmNvbnN0IFJvdGF0aW5nRmlsZVN0cmVhbSA9IHJlcXVpcmUoJ2J1bnlhbi1yb3RhdGluZy1maWxlLXN0cmVhbScpO1xuXG5sZXQgbG9nZ2VyOiBidW55YW4uSUxvZ2dlcnxudWxsID0gbnVsbDtcbmxldCByZXF1ZXN0TG9nZ2VyOiBidW55YW4uSUxvZ2dlcnxudWxsID0gbnVsbDtcbmxldCBqdXB5dGVyTG9nZ2VyOiBidW55YW4uSUxvZ2dlcnxudWxsID0gbnVsbDtcblxuLyoqXG4gKiBHZXRzIHRoZSBsb2dnZXIgZm9yIGdlbmVyYXRpbmcgZGVidWcgbG9ncy5cbiAqIEByZXR1cm5zIHRoZSBsb2dnZXIgY29uZmlndXJlZCBmb3IgZGVidWdnaW5nIGxvZ2dpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2dnZXIoKTogYnVueWFuLklMb2dnZXIge1xuICByZXR1cm4gbG9nZ2VyITtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsb2dnZXIgZm9yIGdlbmVyYXRpbmcgSnVweXRlciBsb2dzLlxuICogQHJldHVybnMgdGhlIGxvZ2dlciBjb25maWd1cmVkIGZvciBKdXB5dGVyIGxvZ2dpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRKdXB5dGVyTG9nZ2VyKCk6IGJ1bnlhbi5JTG9nZ2VyIHtcbiAgcmV0dXJuIGp1cHl0ZXJMb2dnZXIhO1xufVxuXG4vKipcbiAqIExvZ3MgYSByZXF1ZXN0IGFuZCB0aGUgY29ycmVzcG9uZGluZyByZXNwb25zZS5cbiAqIEBwYXJhbSByZXF1ZXN0IHRoZSByZXF1ZXN0IHRvIGJlIGxvZ2dlZC5cbiAqIEBwYXJhbSByZXNwb25zZSB0aGUgcmVzcG9uc2UgdG8gYmUgbG9nZ2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9nUmVxdWVzdChyZXF1ZXN0OiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzcG9uc2U6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiB2b2lkIHtcbiAgcmVxdWVzdExvZ2dlciEuaW5mbyhcbiAgICAgIHt1cmw6IHJlcXVlc3QudXJsLCBtZXRob2Q6IHJlcXVlc3QubWV0aG9kfSwgJ1JlY2VpdmVkIGEgbmV3IHJlcXVlc3QnKTtcbiAgcmVzcG9uc2Uub24oJ2ZpbmlzaCcsICgpID0+IHtcbiAgICByZXF1ZXN0TG9nZ2VyIS5pbmZvKHtcbiAgICAgIHVybDogcmVxdWVzdC51cmwsXG4gICAgICBtZXRob2Q6IHJlcXVlc3QubWV0aG9kLFxuICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXNDb2RlXG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGxvZ2dlcnMgdXNlZCB3aXRoaW4gdGhlIGFwcGxpY2F0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZUxvZ2dlcnMoc2V0dGluZ3M6IEFwcFNldHRpbmdzKTogdm9pZCB7XG4gIC8vIFdlIGNvbmZpZ3VyZSBvdXIgbG9nZ2VycyBhcyBmb2xsb3dzOlxuICAvLyAgKiBvdXIgYmFzZSBsb2dnZXIgdGFncyBhbGwgbG9nIHJlY29yZHMgd2l0aCBgXCJuYW1lXCI6XCJhcHBcImAsIGFuZCBzZW5kcyBsb2dzXG4gIC8vICAgIHRvIHN0ZGVyciAoaW5jbHVkaW5nIGxvZ3Mgb2YgYWxsIGNoaWxkcmVuKVxuICAvLyAgKiBvbmUgY2hpbGQgbG9nZ2VyIGFkZHMgYFwidHlwZVwiOlwicmVxdWVzdFwiYCwgYW5kIHJlY29yZHMgbWV0aG9kL1VSTCBmb3IgYWxsXG4gIC8vICAgIEhUVFAgcmVxdWVzdHMgdG8gdGhlIGFwcCwgYW5kIG1ldGhvZC9VUkwvcmVzcG9uc2UgY29kZSBmb3IgYWxsIHJlc3BvbnNlc1xuICAvLyAgKiBvbmUgY2hpbGQgbG9nZ2VyIGFkZHMgYFwidHlwZVwiOlwianVweXRlclwiYCwgYW5kIHJlY29yZHMgYWxsIG1lc3NhZ2VzIGZyb21cbiAgLy8gICAgdGhlIGp1cHl0ZXIgbm90ZWJvb2sgc2VydmVyLiBUaGVzZSBsb2dzIGFyZSBhbHNvIHNlbnQgdG8gYSBmaWxlIG9uIGRpc2tcbiAgLy8gICAgKHRvIGFzc2lzdCB1c2VyIGRlYnVnZ2luZykuXG4gIC8vXG4gIC8vIEZvciBtb3JlIGFib3V0IGJ1bnlhbiwgc2VlOlxuICAvLyAgIGh0dHBzOi8vZ2l0aHViLmNvbS90cmVudG0vbm9kZS1idW55YW4vdHJlZS9mMjEwMDdkNDZjMGU2NDA3MjYxNzM4MGI3MGQzZjU0MjM2ODMxOGE4XG4gIGNvbnN0IGp1cHl0ZXJMb2dQYXRoID1cbiAgICAgIHBhdGguam9pbihzZXR0aW5ncy5kYXRhbGFiUm9vdCwgJy92YXIvY29sYWIvYXBwLmxvZycpO1xuICBsb2dnZXIgPSBidW55YW4uY3JlYXRlTG9nZ2VyKHtcbiAgICBuYW1lOiAnYXBwJyxcbiAgICBzdHJlYW1zOiBbXG4gICAgICB7bGV2ZWw6ICdkZWJ1ZycsIHR5cGU6ICdzdHJlYW0nLCBzdHJlYW06IHByb2Nlc3Muc3RkZXJyfSxcbiAgICBdXG4gIH0pO1xuICByZXF1ZXN0TG9nZ2VyID0gbG9nZ2VyLmNoaWxkKHt0eXBlOiAncmVxdWVzdCd9KTtcbiAganVweXRlckxvZ2dlciA9IGxvZ2dlci5jaGlsZCh7XG4gICAgdHlwZTogJ2p1cHl0ZXInLFxuICAgIHN0cmVhbXM6IFt7XG4gICAgICBsZXZlbDogJ2luZm8nLFxuICAgICAgdHlwZTogJ3N0cmVhbScsXG4gICAgICBzdHJlYW06IG5ldyBSb3RhdGluZ0ZpbGVTdHJlYW0oe1xuICAgICAgICBwYXRoOiBqdXB5dGVyTG9nUGF0aCxcbiAgICAgICAgcm90YXRlRXhpc3Rpbmc6IGZhbHNlLFxuICAgICAgICB0aHJlc2hvbGQ6ICcybScsXG4gICAgICAgIHRvdGFsU2l6ZTogJzIwbSdcbiAgICAgIH0pLFxuICAgIH1dXG4gIH0pO1xuICBmb3IgKGNvbnN0IGxvZ3Mgb2YgW2xvZ2dlciwganVweXRlckxvZ2dlciwgcmVxdWVzdExvZ2dlcl0pIHtcbiAgICAvLyBPbWl0IHN1cGVyZmx1b3VzIGZpZWxkcy5cbiAgICBkZWxldGUgbG9ncy5maWVsZHNbJ2hvc3RuYW1lJ107XG4gICAgZGVsZXRlIGxvZ3MuZmllbGRzWyduYW1lJ107XG4gIH1cbn1cbiJdfQ==