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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSocketIoPath = exports.init = void 0;
var socketio = require("socket.io");
var url = require("url");
// tslint:disable-next-line:enforce-name-casing
var WebSocket = require("ws");
var logging = require("./logging");
var sessionCounter = 0;
/**
 * The application settings instance.
 */
var appSettings;
/**
 * Creates a WebSocket connected to the Jupyter server for the URL in the specified session.
 */
function createWebSocket(socketHost, port, session) {
    var path = url.parse(session.url).path;
    var socketUrl = "ws://".concat(socketHost, ":").concat(port).concat(path);
    logging.getLogger().debug('Creating WebSocket to %s for session %d', socketUrl, session.id);
    var ws = new WebSocket(socketUrl);
    ws.on('open', function () {
        // Stash the resulting WebSocket, now that it is in open state
        session.webSocket = ws;
        session.socket.emit('open', { url: session.url });
    })
        .on('close', function () {
        // Remove the WebSocket from the session, once it is in closed state
        logging.getLogger().debug('WebSocket [%d] closed', session.id);
        session.webSocket = null;
        session.socket.emit('close', { url: session.url });
    })
        .on('message', function (data) {
        // Propagate messages arriving on the WebSocket to the client.
        if (data instanceof Buffer) {
            logging.getLogger().debug('WebSocket [%d] binary message length %d', session.id, data.length);
        }
        else {
            logging.getLogger().debug('WebSocket [%d] message\n%j', session.id, data);
        }
        session.socket.emit('data', { data: data });
    })
        // tslint:disable-next-line:no-any
        .on('error', function (e) {
        logging.getLogger().error('WebSocket [%d] error\n%j', session.id, e);
        if (e.code === 'ECONNREFUSED') {
            // This happens in the following situation -- old kernel that has gone
            // away likely due to a restart/shutdown... and an old notebook client
            // attempts to reconnect to the old kernel. That connection will be
            // refused. In this case, there is no point in keeping this socket.io
            // connection open.
            session.socket.disconnect(/* close */ true);
        }
    });
    return ws;
}
/**
 * Closes the WebSocket instance associated with the session.
 */
function closeWebSocket(session) {
    if (session.webSocket) {
        session.webSocket.close();
        session.webSocket = null;
    }
}
/**
 * Handles communication over the specified socket.
 */
function socketHandler(socket) {
    sessionCounter++;
    // Each socket is associated with a session that tracks the following:
    // - id: a counter for use in log output
    // - url: the url used to connect to the Jupyter server
    // - socket: the socket.io socket reference, which generates message
    //           events for anything sent by the browser client, and allows
    //           emitting messages to send to the browser
    // - webSocket: the corresponding WebSocket connection to the Jupyter
    //              server.
    // Within a session, messages recieved over the socket.io socket (from the browser)
    // are relayed to the WebSocket, and messages recieved over the WebSocket socket are
    // relayed back to the socket.io socket (to the browser).
    var session = { id: sessionCounter, url: '', socket: socket, webSocket: null };
    logging.getLogger().debug('Socket connected for session %d', session.id);
    socket.on('disconnect', function (reason) {
        logging.getLogger().debug('Socket disconnected for session %d reason: %s', session.id, reason);
        // Handle client disconnects to close WebSockets, so as to free up resources
        closeWebSocket(session);
    });
    socket.on('start', function (message) {
        logging.getLogger().debug('Start in session %d with url %s', session.id, message.url);
        try {
            var port = appSettings.nextJupyterPort;
            if (appSettings.kernelManagerProxyPort) {
                port = appSettings.kernelManagerProxyPort;
                logging.getLogger().debug('Using kernel manager proxy port %d', port);
            }
            var host = 'localhost';
            if (appSettings.kernelManagerProxyHost) {
                host = appSettings.kernelManagerProxyHost;
            }
            session.url = message.url;
            session.webSocket = createWebSocket(host, port, session);
            // tslint:disable-next-line:no-any
        }
        catch (e) {
            logging.getLogger().error(e, 'Unable to create WebSocket connection to %s', message.url);
            session.socket.disconnect(/* close */ true);
        }
    });
    socket.on('stop', function (message) {
        logging.getLogger().debug('Stop in session %d with url %s', session.id, message.url);
        closeWebSocket(session);
    });
    socket.on('data', function (message) {
        // The client sends this message per data message to a particular channel. Propagate the
        // message over to the WebSocket associated with the specified channel.
        if (session.webSocket) {
            if (message instanceof Buffer) {
                logging.getLogger().debug('Send binary data of length %d in session %d.', message.length, session.id);
                session.webSocket.send(message, function (e) {
                    if (e) {
                        logging.getLogger().error(e, 'Failed to send message to websocket');
                    }
                });
            }
            else {
                logging.getLogger().debug('Send data in session %d\n%s', session.id, message.data);
                session.webSocket.send(message.data, function (e) {
                    if (e) {
                        logging.getLogger().error(e, 'Failed to send message to websocket');
                    }
                });
            }
        }
        else {
            logging.getLogger().error('Unable to send message; WebSocket is not open');
        }
    });
}
/** Initialize the socketio handler. */
function init(server, settings) {
    appSettings = settings;
    var io = socketio(server, {
        path: '/socket.io',
        transports: ['polling'],
        allowUpgrades: false,
        // v2.10 changed default from 60s to 5s, prefer the longer timeout to
        // avoid errant disconnects.
        pingTimeout: 60000,
    });
    io.of('/session').on('connection', socketHandler);
    return io;
}
exports.init = init;
/** Return true iff path is handled by socket.io. */
function isSocketIoPath(path) {
    return path.indexOf('/socket.io/') === 0;
}
exports.isSocketIoPath = isSocketIoPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvc29ja2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7OztHQVlHOzs7QUFHSCxvQ0FBc0M7QUFDdEMseUJBQTJCO0FBQzNCLCtDQUErQztBQUMvQyw4QkFBZ0M7QUFHaEMsbUNBQXFDO0FBa0JyQyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFFdkI7O0dBRUc7QUFDSCxJQUFJLFdBQXdCLENBQUM7QUFFN0I7O0dBRUc7QUFDSCxTQUFTLGVBQWUsQ0FBQyxVQUFrQixFQUFFLElBQVksRUFBRSxPQUFnQjtJQUN6RSxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDekMsSUFBTSxTQUFTLEdBQUcsZUFBUSxVQUFVLGNBQUksSUFBSSxTQUFHLElBQUksQ0FBRSxDQUFDO0lBQ3RELE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMseUNBQXlDLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUU1RixJQUFNLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFDTjtRQUNFLDhEQUE4RDtRQUM5RCxPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUN2QixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxDQUFDO1NBQ0gsRUFBRSxDQUFDLE9BQU8sRUFDUDtRQUNFLG9FQUFvRTtRQUNwRSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLHVC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LFNBQVMsQ0FBQztRQUN2QixhQUFhLEVBQUUsS0FBSztRQUNwQixxRUFBcUU7UUFDckUsNEJBQTRCO1FBQzVCLFdBQVcsRUFBRSxLQUFLO0tBQ25CLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNsRCxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFiRCxvQkFhQztBQUVELG9EQUFvRDtBQUNwRCxTQUFnQixjQUFjLENBQUMsSUFBWTtJQUN6QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFGRCx3Q0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0XG4gKiBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2VcbiAqIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzXG4gKiBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zIHVuZGVyXG4gKiB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgc29ja2V0aW8gZnJvbSAnc29ja2V0LmlvJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmVuZm9yY2UtbmFtZS1jYXNpbmdcbmltcG9ydCAqIGFzIFdlYlNvY2tldCBmcm9tICd3cyc7XG5cbmltcG9ydCB7QXBwU2V0dGluZ3N9IGZyb20gJy4vYXBwU2V0dGluZ3MnO1xuaW1wb3J0ICogYXMgbG9nZ2luZyBmcm9tICcuL2xvZ2dpbmcnO1xuXG5pbnRlcmZhY2UgU2Vzc2lvbiB7XG4gIGlkOiBudW1iZXI7XG4gIHVybDogc3RyaW5nO1xuICBzb2NrZXQ6IFNvY2tldElPLlNvY2tldDtcbiAgd2ViU29ja2V0OiBXZWJTb2NrZXR8bnVsbDtcbn1cblxuaW50ZXJmYWNlIFNlc3Npb25NZXNzYWdlIHtcbiAgdXJsOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBEYXRhTWVzc2FnZSB7XG4gIGNoYW5uZWw6IHN0cmluZztcbiAgZGF0YTogc3RyaW5nO1xufVxuXG5sZXQgc2Vzc2lvbkNvdW50ZXIgPSAwO1xuXG4vKipcbiAqIFRoZSBhcHBsaWNhdGlvbiBzZXR0aW5ncyBpbnN0YW5jZS5cbiAqL1xubGV0IGFwcFNldHRpbmdzOiBBcHBTZXR0aW5ncztcblxuLyoqXG4gKiBDcmVhdGVzIGEgV2ViU29ja2V0IGNvbm5lY3RlZCB0byB0aGUgSnVweXRlciBzZXJ2ZXIgZm9yIHRoZSBVUkwgaW4gdGhlIHNwZWNpZmllZCBzZXNzaW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVXZWJTb2NrZXQoc29ja2V0SG9zdDogc3RyaW5nLCBwb3J0OiBudW1iZXIsIHNlc3Npb246IFNlc3Npb24pOiBXZWJTb2NrZXQge1xuICBjb25zdCBwYXRoID0gdXJsLnBhcnNlKHNlc3Npb24udXJsKS5wYXRoO1xuICBjb25zdCBzb2NrZXRVcmwgPSBgd3M6Ly8ke3NvY2tldEhvc3R9OiR7cG9ydH0ke3BhdGh9YDtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnQ3JlYXRpbmcgV2ViU29ja2V0IHRvICVzIGZvciBzZXNzaW9uICVkJywgc29ja2V0VXJsLCBzZXNzaW9uLmlkKTtcblxuICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXQoc29ja2V0VXJsKTtcbiAgd3Mub24oJ29wZW4nLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLy8gU3Rhc2ggdGhlIHJlc3VsdGluZyBXZWJTb2NrZXQsIG5vdyB0aGF0IGl0IGlzIGluIG9wZW4gc3RhdGVcbiAgICAgICAgICBzZXNzaW9uLndlYlNvY2tldCA9IHdzO1xuICAgICAgICAgIHNlc3Npb24uc29ja2V0LmVtaXQoJ29wZW4nLCB7dXJsOiBzZXNzaW9uLnVybH0pO1xuICAgICAgICB9KVxuICAgICAgLm9uKCdjbG9zZScsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBXZWJTb2NrZXQgZnJvbSB0aGUgc2Vzc2lvbiwgb25jZSBpdCBpcyBpbiBjbG9zZWQgc3RhdGVcbiAgICAgICAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoJ1dlYlNvY2tldCBbJWRdIGNsb3NlZCcsIHNlc3Npb24uaWQpO1xuICAgICAgICAgICAgc2Vzc2lvbi53ZWJTb2NrZXQgPSBudWxsO1xuICAgICAgICAgICAgc2Vzc2lvbi5zb2NrZXQuZW1pdCgnY2xvc2UnLCB7dXJsOiBzZXNzaW9uLnVybH0pO1xuICAgICAgICAgIH0pXG4gICAgICAub24oJ21lc3NhZ2UnLFxuICAgICAgICAgIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAvLyBQcm9wYWdhdGUgbWVzc2FnZXMgYXJyaXZpbmcgb24gdGhlIFdlYlNvY2tldCB0byB0aGUgY2xpZW50LlxuICAgICAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICdXZWJTb2NrZXQgWyVkXSBiaW5hcnkgbWVzc2FnZSBsZW5ndGggJWQnLCBzZXNzaW9uLmlkLCBkYXRhLmxlbmd0aCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmRlYnVnKFxuICAgICAgICAgICAgICAgICdXZWJTb2NrZXQgWyVkXSBtZXNzYWdlXFxuJWonLCBzZXNzaW9uLmlkLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlc3Npb24uc29ja2V0LmVtaXQoJ2RhdGEnLCB7ZGF0YX0pO1xuICAgICAgICAgIH0pXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAub24oJ2Vycm9yJywgKGU6IGFueSkgPT4ge1xuICAgICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKCdXZWJTb2NrZXQgWyVkXSBlcnJvclxcbiVqJywgc2Vzc2lvbi5pZCwgZSk7XG4gICAgICAgIGlmIChlLmNvZGUgPT09ICdFQ09OTlJFRlVTRUQnKSB7XG4gICAgICAgICAgLy8gVGhpcyBoYXBwZW5zIGluIHRoZSBmb2xsb3dpbmcgc2l0dWF0aW9uIC0tIG9sZCBrZXJuZWwgdGhhdCBoYXMgZ29uZVxuICAgICAgICAgIC8vIGF3YXkgbGlrZWx5IGR1ZSB0byBhIHJlc3RhcnQvc2h1dGRvd24uLi4gYW5kIGFuIG9sZCBub3RlYm9vayBjbGllbnRcbiAgICAgICAgICAvLyBhdHRlbXB0cyB0byByZWNvbm5lY3QgdG8gdGhlIG9sZCBrZXJuZWwuIFRoYXQgY29ubmVjdGlvbiB3aWxsIGJlXG4gICAgICAgICAgLy8gcmVmdXNlZC4gSW4gdGhpcyBjYXNlLCB0aGVyZSBpcyBubyBwb2ludCBpbiBrZWVwaW5nIHRoaXMgc29ja2V0LmlvXG4gICAgICAgICAgLy8gY29ubmVjdGlvbiBvcGVuLlxuICAgICAgICAgIHNlc3Npb24uc29ja2V0LmRpc2Nvbm5lY3QoLyogY2xvc2UgKi8gdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gIHJldHVybiB3cztcbn1cblxuLyoqXG4gKiBDbG9zZXMgdGhlIFdlYlNvY2tldCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNlc3Npb24uXG4gKi9cbmZ1bmN0aW9uIGNsb3NlV2ViU29ja2V0KHNlc3Npb246IFNlc3Npb24pOiB2b2lkIHtcbiAgaWYgKHNlc3Npb24ud2ViU29ja2V0KSB7XG4gICAgc2Vzc2lvbi53ZWJTb2NrZXQuY2xvc2UoKTtcbiAgICBzZXNzaW9uLndlYlNvY2tldCA9IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBIYW5kbGVzIGNvbW11bmljYXRpb24gb3ZlciB0aGUgc3BlY2lmaWVkIHNvY2tldC5cbiAqL1xuZnVuY3Rpb24gc29ja2V0SGFuZGxlcihzb2NrZXQ6IFNvY2tldElPLlNvY2tldCkge1xuICBzZXNzaW9uQ291bnRlcisrO1xuXG4gIC8vIEVhY2ggc29ja2V0IGlzIGFzc29jaWF0ZWQgd2l0aCBhIHNlc3Npb24gdGhhdCB0cmFja3MgdGhlIGZvbGxvd2luZzpcbiAgLy8gLSBpZDogYSBjb3VudGVyIGZvciB1c2UgaW4gbG9nIG91dHB1dFxuICAvLyAtIHVybDogdGhlIHVybCB1c2VkIHRvIGNvbm5lY3QgdG8gdGhlIEp1cHl0ZXIgc2VydmVyXG4gIC8vIC0gc29ja2V0OiB0aGUgc29ja2V0LmlvIHNvY2tldCByZWZlcmVuY2UsIHdoaWNoIGdlbmVyYXRlcyBtZXNzYWdlXG4gIC8vICAgICAgICAgICBldmVudHMgZm9yIGFueXRoaW5nIHNlbnQgYnkgdGhlIGJyb3dzZXIgY2xpZW50LCBhbmQgYWxsb3dzXG4gIC8vICAgICAgICAgICBlbWl0dGluZyBtZXNzYWdlcyB0byBzZW5kIHRvIHRoZSBicm93c2VyXG4gIC8vIC0gd2ViU29ja2V0OiB0aGUgY29ycmVzcG9uZGluZyBXZWJTb2NrZXQgY29ubmVjdGlvbiB0byB0aGUgSnVweXRlclxuICAvLyAgICAgICAgICAgICAgc2VydmVyLlxuICAvLyBXaXRoaW4gYSBzZXNzaW9uLCBtZXNzYWdlcyByZWNpZXZlZCBvdmVyIHRoZSBzb2NrZXQuaW8gc29ja2V0IChmcm9tIHRoZSBicm93c2VyKVxuICAvLyBhcmUgcmVsYXllZCB0byB0aGUgV2ViU29ja2V0LCBhbmQgbWVzc2FnZXMgcmVjaWV2ZWQgb3ZlciB0aGUgV2ViU29ja2V0IHNvY2tldCBhcmVcbiAgLy8gcmVsYXllZCBiYWNrIHRvIHRoZSBzb2NrZXQuaW8gc29ja2V0ICh0byB0aGUgYnJvd3NlcikuXG4gIGNvbnN0IHNlc3Npb246XG4gICAgICBTZXNzaW9uID0ge2lkOiBzZXNzaW9uQ291bnRlciwgdXJsOiAnJywgc29ja2V0LCB3ZWJTb2NrZXQ6IG51bGx9O1xuXG4gIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoJ1NvY2tldCBjb25uZWN0ZWQgZm9yIHNlc3Npb24gJWQnLCBzZXNzaW9uLmlkKTtcblxuICBzb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCAocmVhc29uKSA9PiB7XG4gICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnU29ja2V0IGRpc2Nvbm5lY3RlZCBmb3Igc2Vzc2lvbiAlZCByZWFzb246ICVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb24uaWQsIHJlYXNvbik7XG5cbiAgICAvLyBIYW5kbGUgY2xpZW50IGRpc2Nvbm5lY3RzIHRvIGNsb3NlIFdlYlNvY2tldHMsIHNvIGFzIHRvIGZyZWUgdXAgcmVzb3VyY2VzXG4gICAgY2xvc2VXZWJTb2NrZXQoc2Vzc2lvbik7XG4gIH0pO1xuXG4gIHNvY2tldC5vbignc3RhcnQnLCAobWVzc2FnZTogU2Vzc2lvbk1lc3NhZ2UpID0+IHtcbiAgICBsb2dnaW5nLmdldExvZ2dlcigpLmRlYnVnKCdTdGFydCBpbiBzZXNzaW9uICVkIHdpdGggdXJsICVzJywgc2Vzc2lvbi5pZCwgbWVzc2FnZS51cmwpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBwb3J0ID0gYXBwU2V0dGluZ3MubmV4dEp1cHl0ZXJQb3J0O1xuICAgICAgaWYgKGFwcFNldHRpbmdzLmtlcm5lbE1hbmFnZXJQcm94eVBvcnQpIHtcbiAgICAgICAgcG9ydCA9IGFwcFNldHRpbmdzLmtlcm5lbE1hbmFnZXJQcm94eVBvcnQ7XG4gICAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoJ1VzaW5nIGtlcm5lbCBtYW5hZ2VyIHByb3h5IHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgIH1cbiAgICAgIGxldCBob3N0ID0gJ2xvY2FsaG9zdCc7XG4gICAgICBpZiAoYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdCkge1xuICAgICAgICBob3N0ID0gYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdDtcbiAgICAgIH1cbiAgICAgIHNlc3Npb24udXJsID0gbWVzc2FnZS51cmw7XG4gICAgICBzZXNzaW9uLndlYlNvY2tldCA9IGNyZWF0ZVdlYlNvY2tldChob3N0LCBwb3J0LCBzZXNzaW9uKTtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoZSwgJ1VuYWJsZSB0byBjcmVhdGUgV2ViU29ja2V0IGNvbm5lY3Rpb24gdG8gJXMnLCBtZXNzYWdlLnVybCk7XG4gICAgICBzZXNzaW9uLnNvY2tldC5kaXNjb25uZWN0KC8qIGNsb3NlICovIHRydWUpO1xuICAgIH1cbiAgfSk7XG5cbiAgc29ja2V0Lm9uKCdzdG9wJywgKG1lc3NhZ2U6IFNlc3Npb25NZXNzYWdlKSA9PiB7XG4gICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnU3RvcCBpbiBzZXNzaW9uICVkIHdpdGggdXJsICVzJywgc2Vzc2lvbi5pZCwgbWVzc2FnZS51cmwpO1xuXG4gICAgY2xvc2VXZWJTb2NrZXQoc2Vzc2lvbik7XG4gIH0pO1xuXG4gIHNvY2tldC5vbignZGF0YScsIChtZXNzYWdlOiBEYXRhTWVzc2FnZSkgPT4ge1xuICAgIC8vIFRoZSBjbGllbnQgc2VuZHMgdGhpcyBtZXNzYWdlIHBlciBkYXRhIG1lc3NhZ2UgdG8gYSBwYXJ0aWN1bGFyIGNoYW5uZWwuIFByb3BhZ2F0ZSB0aGVcbiAgICAvLyBtZXNzYWdlIG92ZXIgdG8gdGhlIFdlYlNvY2tldCBhc3NvY2lhdGVkIHdpdGggdGhlIHNwZWNpZmllZCBjaGFubmVsLlxuICAgIGlmIChzZXNzaW9uLndlYlNvY2tldCkge1xuICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnU2VuZCBiaW5hcnkgZGF0YSBvZiBsZW5ndGggJWQgaW4gc2Vzc2lvbiAlZC4nLCBtZXNzYWdlLmxlbmd0aCwgc2Vzc2lvbi5pZCk7XG4gICAgICAgIHNlc3Npb24ud2ViU29ja2V0LnNlbmQobWVzc2FnZSwgKGUpID0+IHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihlLCAnRmFpbGVkIHRvIHNlbmQgbWVzc2FnZSB0byB3ZWJzb2NrZXQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnU2VuZCBkYXRhIGluIHNlc3Npb24gJWRcXG4lcycsIHNlc3Npb24uaWQsIG1lc3NhZ2UuZGF0YSk7XG4gICAgICAgIHNlc3Npb24ud2ViU29ja2V0LnNlbmQobWVzc2FnZS5kYXRhLCAoZSkgPT4ge1xuICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKGUsICdGYWlsZWQgdG8gc2VuZCBtZXNzYWdlIHRvIHdlYnNvY2tldCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcignVW5hYmxlIHRvIHNlbmQgbWVzc2FnZTsgV2ViU29ja2V0IGlzIG5vdCBvcGVuJyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqIEluaXRpYWxpemUgdGhlIHNvY2tldGlvIGhhbmRsZXIuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdChzZXJ2ZXI6IGh0dHAuU2VydmVyLCBzZXR0aW5nczogQXBwU2V0dGluZ3MpOiBTb2NrZXRJTy5TZXJ2ZXIge1xuICBhcHBTZXR0aW5ncyA9IHNldHRpbmdzO1xuICBjb25zdCBpbyA9IHNvY2tldGlvKHNlcnZlciwge1xuICAgIHBhdGg6ICcvc29ja2V0LmlvJyxcbiAgICB0cmFuc3BvcnRzOiBbJ3BvbGxpbmcnXSxcbiAgICBhbGxvd1VwZ3JhZGVzOiBmYWxzZSxcbiAgICAvLyB2Mi4xMCBjaGFuZ2VkIGRlZmF1bHQgZnJvbSA2MHMgdG8gNXMsIHByZWZlciB0aGUgbG9uZ2VyIHRpbWVvdXQgdG9cbiAgICAvLyBhdm9pZCBlcnJhbnQgZGlzY29ubmVjdHMuXG4gICAgcGluZ1RpbWVvdXQ6IDYwMDAwLFxuICB9KTtcblxuICBpby5vZignL3Nlc3Npb24nKS5vbignY29ubmVjdGlvbicsIHNvY2tldEhhbmRsZXIpO1xuICByZXR1cm4gaW87XG59XG5cbi8qKiBSZXR1cm4gdHJ1ZSBpZmYgcGF0aCBpcyBoYW5kbGVkIGJ5IHNvY2tldC5pby4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NvY2tldElvUGF0aChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHBhdGguaW5kZXhPZignL3NvY2tldC5pby8nKSA9PT0gMDtcbn1cbiJdfQ==