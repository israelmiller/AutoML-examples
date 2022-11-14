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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoToPty = void 0;
var logging = require("./logging");
var socketio = require("socket.io");
var nodePty = require("node-pty");
var sessionCounter = 0;
// Inspired by https://xtermjs.org/docs/guides/flowcontrol/#ideas-for-a-better-mechanism.
var ACK_CALLBACK_EVERY_BYTES = 100000;
var UNACKED_HIGH_WATERMARK = 5;
var UNACKED_LOW_WATERMARK = 2;
/** Socket.io<->terminal adapter. */
var Session = /** @class */ (function () {
    function Session(socket) {
        var _this = this;
        this.socket = socket;
        this.pendingAckCallbacks = 0;
        this.writtenBytes = 0;
        this.id = sessionCounter++;
        this.socket.on('disconnect', function (reason) {
            logging.getLogger().debug('PTY socket disconnected for session %d reason: %s', _this.id, reason);
            // Handle client disconnects to close sockets, so as to free up resources.
            _this.close();
        });
        this.socket.on('data', function (event) {
            // The client sends this message per data message to a particular channel.
            // Propagate the message over to the Socket associated with the
            // specified channel.
            logging.getLogger().debug('Send data in session %d\n%s', _this.id, event.data);
            var message = JSON.parse(event.data);
            if (message.data) {
                _this.pty.write(message.data);
            }
            if (message.cols && message.rows) {
                _this.pty.resize(message.cols, message.rows);
            }
        });
        this.pty = nodePty.spawn('tmux', ['new-session', '-A', '-D', '-s', '0'], {
            name: "xterm-color",
            cwd: './content',
            // Pass environment variables
            env: process.env,
        });
        this.pty.onData(function (data) {
            _this.writtenBytes += data.length;
            if (_this.writtenBytes < ACK_CALLBACK_EVERY_BYTES) {
                _this.socket.emit('data', { data: data, pause: true });
            }
            else {
                _this.socket.emit('data', { data: data, pause: true }, function () {
                    _this.pendingAckCallbacks--;
                    if (_this.pendingAckCallbacks < UNACKED_LOW_WATERMARK) {
                        _this.pty.resume();
                    }
                });
                _this.pendingAckCallbacks++;
                _this.writtenBytes = 0;
                if (_this.pendingAckCallbacks > UNACKED_HIGH_WATERMARK) {
                    _this.pty.pause();
                }
            }
        });
        this.pty.onExit(function (_a) {
            var exitCode = _a.exitCode, signal = _a.signal;
            _this.socket.emit('exit', { exitCode: exitCode, signal: signal });
            _this.socket.disconnect(true);
        });
    }
    Session.prototype.close = function () {
        this.socket.disconnect(true);
        this.pty.kill();
    };
    return Session;
}());
/** SocketIO to node-pty adapter. */
var SocketIoToPty = /** @class */ (function () {
    function SocketIoToPty(path, server) {
        this.path = path;
        var io = socketio(server, {
            path: path,
            transports: ['polling'],
            allowUpgrades: false,
            // v2.10 changed default from 60s to 5s, prefer the longer timeout to
            // avoid errant disconnects.
            pingTimeout: 60000,
        });
        io.of('/').on('connection', function (socket) {
            // Session manages its own lifetime.
            // tslint:disable-next-line:no-unused-expression
            new Session(socket);
        });
    }
    /** Return true iff path is handled by socket.io. */
    SocketIoToPty.prototype.isPathProxied = function (path) {
        return path.indexOf(this.path + '/') === 0;
    };
    return SocketIoToPty;
}());
exports.SocketIoToPty = SocketIoToPty;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0aW9fdG9fcHR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9zb2NrZXRpb190b19wdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7OztHQWNHOzs7QUFHSCxtQ0FBcUM7QUFDckMsb0NBQXNDO0FBQ3RDLGtDQUFvQztBQWFwQyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFFdkIseUZBQXlGO0FBQ3pGLElBQU0sd0JBQXdCLEdBQUcsTUFBTSxDQUFDO0FBQ3hDLElBQU0sc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLElBQU0scUJBQXFCLEdBQUcsQ0FBQyxDQUFDO0FBRWhDLG9DQUFvQztBQUNwQztJQU1FLGlCQUE2QixNQUF1QjtRQUFwRCxpQkF3REM7UUF4RDRCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBSDVDLHdCQUFtQixHQUFHLENBQUMsQ0FBQztRQUN4QixpQkFBWSxHQUFHLENBQUMsQ0FBQztRQUd2QixJQUFJLENBQUMsRUFBRSxHQUFHLGNBQWMsRUFBRSxDQUFDO1FBRTNCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFDLE1BQU07WUFDbEMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxtREFBbUQsRUFBRSxLQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRWhHLDBFQUEwRTtZQUMxRSxLQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFDLEtBQWtCO1lBQ3hDLDBFQUEwRTtZQUMxRSwrREFBK0Q7WUFDL0QscUJBQXFCO1lBRXJCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsS0FBSSxD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LENBQUMsU0FBUyxDQUFDO1lBQ3ZCLGFBQWEsRUFBRSxLQUFLO1lBQ3BCLHFFQUFxRTtZQUNyRSw0QkFBNEI7WUFDNUIsV0FBVyxFQUFFLEtBQUs7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQUMsTUFBdUI7WUFDbEQsb0NBQW9DO1lBQ3BDLGdEQUFnRDtZQUNoRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxvREFBb0Q7SUFDcEQscUNBQWEsR0FBYixVQUFjLElBQVk7UUFDeEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFDSCxvQkFBQztBQUFELENBQUMsQUF0QkQsSUFzQkM7QUF0Qlksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMjAgR29vZ2xlIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdFxuICogdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2ZcbiAqIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUXG4gKiBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGVcbiAqIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zIHVuZGVyXG4gKiB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgbG9nZ2luZyBmcm9tICcuL2xvZ2dpbmcnO1xuaW1wb3J0ICogYXMgc29ja2V0aW8gZnJvbSAnc29ja2V0LmlvJztcbmltcG9ydCAqIGFzIG5vZGVQdHkgZnJvbSAnbm9kZS1wdHknO1xuXG5pbnRlcmZhY2UgRGF0YU1lc3NhZ2Uge1xuICBjaGFubmVsOiBzdHJpbmc7XG4gIGRhdGE6IHN0cmluZztcbn1cblxuLy8gUGF1c2UgYW5kIHJlc3VtZSBhcmUgbWlzc2luZyBmcm9tIHRoZSB0eXBpbmdzLlxuaW50ZXJmYWNlIFB0eSB7XG4gIHBhdXNlKCk6IHZvaWQ7XG4gIHJlc3VtZSgpOiB2b2lkO1xufVxuXG5sZXQgc2Vzc2lvbkNvdW50ZXIgPSAwO1xuXG4vLyBJbnNwaXJlZCBieSBodHRwczovL3h0ZXJtanMub3JnL2RvY3MvZ3VpZGVzL2Zsb3djb250cm9sLyNpZGVhcy1mb3ItYS1iZXR0ZXItbWVjaGFuaXNtLlxuY29uc3QgQUNLX0NBTExCQUNLX0VWRVJZX0JZVEVTID0gMTAwMDAwO1xuY29uc3QgVU5BQ0tFRF9ISUdIX1dBVEVSTUFSSyA9IDU7XG5jb25zdCBVTkFDS0VEX0xPV19XQVRFUk1BUksgPSAyO1xuXG4vKiogU29ja2V0LmlvPC0+dGVybWluYWwgYWRhcHRlci4gKi9cbmNsYXNzIFNlc3Npb24ge1xuICBwcml2YXRlIHJlYWRvbmx5IGlkOiBudW1iZXI7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHR5OiBub2RlUHR5LklQdHk7XG4gIHByaXZhdGUgcGVuZGluZ0Fja0NhbGxiYWNrcyA9IDA7XG4gIHByaXZhdGUgd3JpdHRlbkJ5dGVzID0gMDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNvY2tldDogU29ja2V0SU8uU29ja2V0KSB7XG4gICAgdGhpcy5pZCA9IHNlc3Npb25Db3VudGVyKys7XG5cbiAgICB0aGlzLnNvY2tldC5vbignZGlzY29ubmVjdCcsIChyZWFzb24pID0+IHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoJ1BUWSBzb2NrZXQgZGlzY29ubmVjdGVkIGZvciBzZXNzaW9uICVkIHJlYXNvbjogJXMnLCB0aGlzLmlkLCByZWFzb24pO1xuXG4gICAgICAvLyBIYW5kbGUgY2xpZW50IGRpc2Nvbm5lY3RzIHRvIGNsb3NlIHNvY2tldHMsIHNvIGFzIHRvIGZyZWUgdXAgcmVzb3VyY2VzLlxuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub24oJ2RhdGEnLCAoZXZlbnQ6IERhdGFNZXNzYWdlKSA9PiB7XG4gICAgICAvLyBUaGUgY2xpZW50IHNlbmRzIHRoaXMgbWVzc2FnZSBwZXIgZGF0YSBtZXNzYWdlIHRvIGEgcGFydGljdWxhciBjaGFubmVsLlxuICAgICAgLy8gUHJvcGFnYXRlIHRoZSBtZXNzYWdlIG92ZXIgdG8gdGhlIFNvY2tldCBhc3NvY2lhdGVkIHdpdGggdGhlXG4gICAgICAvLyBzcGVjaWZpZWQgY2hhbm5lbC5cblxuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnU2VuZCBkYXRhIGluIHNlc3Npb24gJWRcXG4lcycsIHRoaXMuaWQsXG4gICAgICBldmVudC5kYXRhKTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpIGFzIFB0eU1lc3NhZ2U7XG4gICAgICBpZiAobWVzc2FnZS5kYXRhKSB7XG4gICAgICAgIHRoaXMucHR5LndyaXRlKG1lc3NhZ2UuZGF0YSk7XG4gICAgICB9XG4gICAgICBpZiAobWVzc2FnZS5jb2xzICYmIG1lc3NhZ2Uucm93cykge1xuICAgICAgICB0aGlzLnB0eS5yZXNpemUobWVzc2FnZS5jb2xzLCBtZXNzYWdlLnJvd3MpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wdHkgPSBub2RlUHR5LnNwYXduKCd0bXV4JywgWyduZXctc2Vzc2lvbicsICctQScsICctRCcsICctcycsICcwJ10sIHtcbiAgICAgIG5hbWU6IFwieHRlcm0tY29sb3JcIixcbiAgICAgIGN3ZDogJy4vY29udGVudCcsIC8vIFdoaWNoIHBhdGggc2hvdWxkIHRlcm1pbmFsIHN0YXJ0XG4gICAgICAvLyBQYXNzIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgICAgZW52OiBwcm9jZXNzLmVudiBhcyB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSxcbiAgICB9KTtcblxuICAgIHRoaXMucHR5Lm9uRGF0YSgoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICB0aGlzLndyaXR0ZW5CeXRlcyArPSBkYXRhLmxlbmd0aDtcbiAgICAgIGlmICh0aGlzLndyaXR0ZW5CeXRlcyA8IEFDS19DQUxMQkFDS19FVkVSWV9CWVRFUykge1xuICAgICAgICB0aGlzLnNvY2tldC5lbWl0KCdkYXRhJywge2RhdGEsIHBhdXNlOiB0cnVlfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNvY2tldC5lbWl0KCdkYXRhJywge2RhdGEsIHBhdXNlOiB0cnVlfSwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGVuZGluZ0Fja0NhbGxiYWNrcy0tO1xuICAgICAgICAgIGlmICh0aGlzLnBlbmRpbmdBY2tDYWxsYmFja3MgPCBVTkFDS0VEX0xPV19XQVRFUk1BUkspIHtcbiAgICAgICAgICAgICh0aGlzLnB0eSBhcyB1bmtub3duIGFzIFB0eSkucmVzdW1lKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wZW5kaW5nQWNrQ2FsbGJhY2tzKys7XG4gICAgICAgIHRoaXMud3JpdHRlbkJ5dGVzID0gMDtcbiAgICAgICAgaWYgKHRoaXMucGVuZGluZ0Fja0NhbGxiYWNrcyA+IFVOQUNLRURfSElHSF9XQVRFUk1BUkspIHtcbiAgICAgICAgICAodGhpcy5wdHkgYXMgdW5rbm93biBhcyBQdHkpLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucHR5Lm9uRXhpdCgoe2V4aXRDb2RlLCBzaWduYWx9OiB7ZXhpdENvZGU6IG51bWJlciwgc2lnbmFsPzogbnVtYmVyfSkgPT4ge1xuICAgICAgdGhpcy5zb2NrZXQuZW1pdCgnZXhpdCcsIHtleGl0Q29kZSwgc2lnbmFsfSk7XG4gICAgICB0aGlzLnNvY2tldC5kaXNjb25uZWN0KHRydWUpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjbG9zZSgpIHtcbiAgICB0aGlzLnNvY2tldC5kaXNjb25uZWN0KHRydWUpO1xuICAgIHRoaXMucHR5LmtpbGwoKTtcbiAgfVxufVxuXG4vKiogU29ja2V0SU8gdG8gbm9kZS1wdHkgYWRhcHRlci4gKi9cbmV4cG9ydCBjbGFzcyBTb2NrZXRJb1RvUHR5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwYXRoOiBzdHJpbmcsIHNlcnZlcjogaHR0cC5TZXJ2ZXIpIHtcbiAgICBjb25zdCBpbyA9IHNvY2tldGlvKHNlcnZlciwge1xuICAgICAgcGF0aCxcbiAgICAgIHRyYW5zcG9ydHM6IFsncG9sbGluZyddLFxuICAgICAgYWxsb3dVcGdyYWRlczogZmFsc2UsXG4gICAgICAvLyB2Mi4xMCBjaGFuZ2VkIGRlZmF1bHQgZnJvbSA2MHMgdG8gNXMsIHByZWZlciB0aGUgbG9uZ2VyIHRpbWVvdXQgdG9cbiAgICAgIC8vIGF2b2lkIGVycmFudCBkaXNjb25uZWN0cy5cbiAgICAgIHBpbmdUaW1lb3V0OiA2MDAwMCxcbiAgICB9KTtcblxuICAgIGlvLm9mKCcvJykub24oJ2Nvbm5lY3Rpb24nLCAoc29ja2V0OiBTb2NrZXRJTy5Tb2NrZXQpID0+IHtcbiAgICAgIC8vIFNlc3Npb24gbWFuYWdlcyBpdHMgb3duIGxpZmV0aW1lLlxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXVudXNlZC1leHByZXNzaW9uXG4gICAgICBuZXcgU2Vzc2lvbihzb2NrZXQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJldHVybiB0cnVlIGlmZiBwYXRoIGlzIGhhbmRsZWQgYnkgc29ja2V0LmlvLiAqL1xuICBpc1BhdGhQcm94aWVkKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwYXRoLmluZGV4T2YodGhpcy5wYXRoICsgJy8nKSA9PT0gMDtcbiAgfVxufVxuXG5kZWNsYXJlIGludGVyZmFjZSBQdHlNZXNzYWdlIHtcbiAgcmVhZG9ubHkgZGF0YT86IHN0cmluZztcbiAgcmVhZG9ubHkgY29scz86IG51bWJlcjtcbiAgcmVhZG9ubHkgcm93cz86IG51bWJlcjtcbn1cbiJdfQ==