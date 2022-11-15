"use strict";
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
exports.encodeJsonRpc = exports.JsonRpcReader = void 0;
var CR = 13;
var LF = 10;
/**
 * JSON RPC reader following the Debug Adapter Protocol message
 * format which itself follows Chrome's V8 debugger protocol, originally
 * documented at
 * https://github.com/buggerjs/bugger-v8-client/blob/master/PROTOCOL.md#v8-debugger-protocol
 */
var JsonRpcReader = /** @class */ (function () {
    function JsonRpcReader(callback) {
        this.callback = callback;
        this.position = 0;
        this.allocationSize = 4096;
        this.decoder = new TextDecoder();
        this.buffer = new Uint8Array(this.allocationSize);
    }
    JsonRpcReader.prototype.append = function (data) {
        // Grow the buffer if necessary to hold the data.
        if (data.byteLength > (this.buffer.byteLength - this.position)) {
            var requiredSize = this.position + data.byteLength;
            var newSize = Math.ceil(requiredSize / this.allocationSize) * this.allocationSize;
            var newBuffer = new Uint8Array(newSize);
            newBuffer.set(this.buffer, 0);
            this.buffer = newBuffer;
        }
        // Push new data onto end of the buffer.
        this.buffer.set(data, this.position);
        this.position += data.byteLength;
        while (true) {
            // Parse all messages out of the buffer.
            var message = this.tryReadMessage();
            if (!message) {
                break;
            }
            this.callback(message);
        }
    };
    JsonRpcReader.prototype.tryReadMessage = function () {
        var e_1, _a;
        // Loop through looking for \r\n\r\n in the buffer.
        for (var i = 0; i < this.position - 4; ++i) {
            // First \r\n indicates the end of the headers.
            if (this.buffer[i] === CR && this.buffer[i + 1] === LF &&
                this.buffer[i + 2] === CR && this.buffer[i + 3] === LF) {
                // Parse each of the header lines out of the header block.
                var headerLength = i + 4;
                var headerBytes = this.buffer.subarray(0, headerLength);
                var headerString = this.decoder.decode(headerBytes);
                var headerLines = headerString.split('\r\n');
                var headers = {};
                try {
                    for (var headerLines_1 = (e_1 = void 0, __values(headerLines)), headerLines_1_1 = headerLines_1.next(); !headerLines_1_1.done; headerLines_1_1 = headerLines_1.next()) {
                        var line = headerLines_1_1.value;
                        if (!line.trim()) {
                            continue;
                        }
                        var pair = line.split(':');
                        if (pair.length !== 2) {
                            throw new Error("Illegal header value: ".concat(line));
                        }
                        headers[pair[0]] = pair[1].trim();
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (headerLines_1_1 && !headerLines_1_1.done && (_a = headerLines_1.return)) _a.call(headerLines_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                var contentLengthString = headers['Content-Length'];
                if (!contentLengthString) {
                    throw new Error('Missing Content-Length header.');
                }
                var contentLength = Number(contentLengthString);
                if (isNaN(contentLength)) {
                    throw new Error("Header Content-Length not a number: ".concat(contentLengthString, "."));
                }
                var requiredLength = headerLength + contentLength;
                if (requiredLength <= this.position) {
                    // This is just a view onto the current buffer.
                    var contentBytes = this.buffer.subarray(headerLength, headerLength + contentLength);
                    var content = this.decoder.decode(contentBytes);
                    this.buffer.copyWithin(0, headerLength + contentLength, this.position);
                    this.position = this.position - (headerLength + contentLength);
                    return { headers: headers, content: content };
                }
            }
        }
        return null;
    };
    return JsonRpcReader;
}());
exports.JsonRpcReader = JsonRpcReader;
/** Encodes the string content to a JSON RPC message. */
function encodeJsonRpc(content) {
    var e_2, _a;
    var headers = {
        'Content-Length': String(new TextEncoder().encode(content).byteLength),
    };
    var requestString = '';
    try {
        for (var _b = __values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            requestString += "".concat(key, ": ").concat(headers[key], "\r\n");
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    requestString += '\r\n';
    requestString += content;
    return requestString;
}
exports.encodeJsonRpc = encodeJsonRpc;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbl9ycGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi90aGlyZF9wYXJ0eS9jb2xhYi9zb3VyY2VzL2pzb25fcnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQ2QsSUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBUWQ7Ozs7O0dBS0c7QUFDSDtJQU1FLHVCQUFxQixRQUF5QztRQUF6QyxhQUFRLEdBQVIsUUFBUSxDQUFpQztRQUp0RCxhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBQ1osbUJBQWMsR0FBRyxJQUFJLENBQUM7UUFDdEIsWUFBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7UUFHM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELDhCQUFNLEdBQU4sVUFBTyxJQUFnQjtRQUNyQixpREFBaUQ7UUFDakQsSUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzlELElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNyRCxJQUFNLE9BQU8sR0FDVCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUN4RSxJQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7U0FDekI7UUFDRCx3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUM7UUFFakMsT0FBTyxJQUFJLEVBQUU7WUFDWCx3Q0FBd0M7WUFDeEMsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ1osTUFBTTthQUNQO1lBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN4QjtJQUNILENBQUM7SUFFRCxzQ0FBYyxHQUFkOztRQUNFLG1EQUFtRDtRQUNuRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDMUMsK0NBQStDO1lBQy9DLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRTtnQkFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDMUQsMERBQTBEO2dCQUMxRCxJQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzFELElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN0RCxJQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQyxJQUFNLE9BQU8sR0FBNEIsRUFBRSxDQUFDOztvQkFDNUMsS0FBbUIsSUFBQSwrQkFBQSxTQUFBLFdBQVcsQ0FBQSxDQUFBLHdDQUFBLGlFQUFFO3dCQUEzQixJQUFNLElBQUksd0JBQUE7d0JBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTs0QkFDaEIsU0FBUzt5QkFDVjt3QkFDRCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOzRCQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUF5QixJQUFJLENBQUUsQ0FBQyxDQUFDO3lCQUNsRDt3QkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO3FCQUNuQzs7Ozs7Ozs7O2dCQUNELElBQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxtQkFBbUIsRUFBRTtvQkFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO2lCQUNuRDtnQkFDRCxJQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQ1gsOENBQXVDLG1CQUFtQixNQUFHLENBQUMsQ0FBQztpQkFDcEU7Z0JBQ0QsSUFBTSxjQUFjLEdBQUcsWUFBWSxHQUFHLGFBQWEsQ0FBQztnQkFDcEQsSUFBSSxjQUFjLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDbkMsK0NBQStDO29CQUMvQyxJQUFNLFlBQVksR0FDZCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsWUFBWSxHQUFHLGFBQWEsQ0FBQyxDQUFDO29CQUNyRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQ2xCLENBQUMsRUFBRSxZQUFZLEdBQUcsYUFBYSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQyxDQUFDO29CQUMvRCxPQUFPLEVBQUMsT0FBTyxTQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUMsQ0FBQztpQkFDM0I7YUFDRjtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsb0JBQUM7QUFBRCxDQUFDLEFBaEZELElBZ0ZDO0FBaEZZLHNDQUFhO0FBa0YxQix3REFBd0Q7QUFDeEQsU0FBZ0IsYUFBYSxDQUFDLE9BQWU7O0lBQzNDLElBQU0sT0FBTyxHQUE0QjtRQUN2QyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDO0tBQ3ZFLENBQUM7SUFDRixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7O1FBQ3ZCLEtBQWtCLElBQUEsS0FBQSxTQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7WUFBbkMsSUFBTSxHQUFHLFdBQUE7WUFDWixhQUFhLElBQUksVUFBRyxHQUFHLGVBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFNLENBQUM7U0FDaEQ7Ozs7Ozs7OztJQUNELGFBQWEsSUFBSSxNQUFNLENBQUM7SUFDeEIsYUFBYSxJQUFJLE9BQU8sQ0FBQztJQUN6QixPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBWEQsc0NBV0MiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBDUiA9IDEzO1xuY29uc3QgTEYgPSAxMDtcblxuLyoqIE1lc3NhZ2VzIHJlY2VpdmVkIHZpYSB0aGUgcmVhZGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBKc29uUnBjTWVzc2FnZSB7XG4gIHJlYWRvbmx5IGhlYWRlcnM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xuICByZWFkb25seSBjb250ZW50OiBzdHJpbmc7XG59XG5cbi8qKlxuICogSlNPTiBSUEMgcmVhZGVyIGZvbGxvd2luZyB0aGUgRGVidWcgQWRhcHRlciBQcm90b2NvbCBtZXNzYWdlXG4gKiBmb3JtYXQgd2hpY2ggaXRzZWxmIGZvbGxvd3MgQ2hyb21lJ3MgVjggZGVidWdnZXIgcHJvdG9jb2wsIG9yaWdpbmFsbHlcbiAqIGRvY3VtZW50ZWQgYXRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9idWdnZXJqcy9idWdnZXItdjgtY2xpZW50L2Jsb2IvbWFzdGVyL1BST1RPQ09MLm1kI3Y4LWRlYnVnZ2VyLXByb3RvY29sXG4gKi9cbmV4cG9ydCBjbGFzcyBKc29uUnBjUmVhZGVyIHtcbiAgcHJpdmF0ZSBidWZmZXI6IFVpbnQ4QXJyYXk7XG4gIHByaXZhdGUgcG9zaXRpb246IG51bWJlciA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWxsb2NhdGlvblNpemUgPSA0MDk2O1xuICBwcml2YXRlIHJlYWRvbmx5IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSBjYWxsYmFjazogKG1lc3NhZ2U6IEpzb25ScGNNZXNzYWdlKT0+dm9pZCkge1xuICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5hbGxvY2F0aW9uU2l6ZSk7XG4gIH1cblxuICBhcHBlbmQoZGF0YTogVWludDhBcnJheSkge1xuICAgIC8vIEdyb3cgdGhlIGJ1ZmZlciBpZiBuZWNlc3NhcnkgdG8gaG9sZCB0aGUgZGF0YS5cbiAgICBpZiAoZGF0YS5ieXRlTGVuZ3RoID4gKHRoaXMuYnVmZmVyLmJ5dGVMZW5ndGggLSB0aGlzLnBvc2l0aW9uKSkge1xuICAgICAgY29uc3QgcmVxdWlyZWRTaXplID0gdGhpcy5wb3NpdGlvbiArIGRhdGEuYnl0ZUxlbmd0aDtcbiAgICAgIGNvbnN0IG5ld1NpemUgPVxuICAgICAgICAgIE1hdGguY2VpbChyZXF1aXJlZFNpemUgLyB0aGlzLmFsbG9jYXRpb25TaXplKSAqIHRoaXMuYWxsb2NhdGlvblNpemU7XG4gICAgICBjb25zdCBuZXdCdWZmZXIgPSBuZXcgVWludDhBcnJheShuZXdTaXplKTtcbiAgICAgIG5ld0J1ZmZlci5zZXQodGhpcy5idWZmZXIsIDApO1xuICAgICAgdGhpcy5idWZmZXIgPSBuZXdCdWZmZXI7XG4gICAgfVxuICAgIC8vIFB1c2ggbmV3IGRhdGEgb250byBlbmQgb2YgdGhlIGJ1ZmZlci5cbiAgICB0aGlzLmJ1ZmZlci5zZXQoZGF0YSwgdGhpcy5wb3NpdGlvbik7XG4gICAgdGhpcy5wb3NpdGlvbiArPSBkYXRhLmJ5dGVMZW5ndGg7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gUGFyc2UgYWxsIG1lc3NhZ2VzIG91dCBvZiB0aGUgYnVmZmVyLlxuICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMudHJ5UmVhZE1lc3NhZ2UoKTtcbiAgICAgIGlmICghbWVzc2FnZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuY2FsbGJhY2sobWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgdHJ5UmVhZE1lc3NhZ2UoKTogSnNvblJwY01lc3NhZ2V8bnVsbCB7XG4gICAgLy8gTG9vcCB0aHJvdWdoIGxvb2tpbmcgZm9yIFxcclxcblxcclxcbiBpbiB0aGUgYnVmZmVyLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbiAtIDQ7ICsraSkge1xuICAgICAgLy8gRmlyc3QgXFxyXFxuIGluZGljYXRlcyB0aGUgZW5kIG9mIHRoZSBoZWFkZXJzLlxuICAgICAgaWYgKHRoaXMuYnVmZmVyW2ldID09PSBDUiAmJiB0aGlzLmJ1ZmZlcltpICsgMV0gPT09IExGICYmXG4gICAgICAgICAgdGhpcy5idWZmZXJbaSArIDJdID09PSBDUiAmJiB0aGlzLmJ1ZmZlcltpICsgM10gPT09IExGKSB7XG4gICAgICAgIC8vIFBhcnNlIGVhY2ggb2YgdGhlIGhlYWRlciBsaW5lcyBvdXQgb2YgdGhlIGhlYWRlciBibG9jay5cbiAgICAgICAgY29uc3QgaGVhZGVyTGVuZ3RoID0gaSArIDQ7XG4gICAgICAgIGNvbnN0IGhlYWRlckJ5dGVzID0gdGhpcy5idWZmZXIuc3ViYXJyYXkoMCwgaGVhZGVyTGVuZ3RoKTtcbiAgICAgICAgY29uc3QgaGVhZGVyU3RyaW5nID0gdGhpcy5kZWNvZGVyLmRlY29kZShoZWFkZXJCeXRlcyk7XG4gICAgICAgIGNvbnN0IGhlYWRlckxpbmVzID0gaGVhZGVyU3RyaW5nLnNwbGl0KCdcXHJcXG4nKTtcbiAgICAgICAgY29uc3QgaGVhZGVyczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGhlYWRlckxpbmVzKSB7XG4gICAgICAgICAgaWYgKCFsaW5lLnRyaW0oKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBhaXIgPSBsaW5lLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgaWYgKHBhaXIubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgaGVhZGVyIHZhbHVlOiAke2xpbmV9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGhlYWRlcnNbcGFpclswXV0gPSBwYWlyWzFdLnRyaW0oKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250ZW50TGVuZ3RoU3RyaW5nID0gaGVhZGVyc1snQ29udGVudC1MZW5ndGgnXTtcbiAgICAgICAgaWYgKCFjb250ZW50TGVuZ3RoU3RyaW5nKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIENvbnRlbnQtTGVuZ3RoIGhlYWRlci4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gTnVtYmVyKGNvbnRlbnRMZW5ndGhTdHJpbmcpO1xuICAgICAgICBpZiAoaXNOYU4oY29udGVudExlbmd0aCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBIZWFkZXIgQ29udGVudC1MZW5ndGggbm90IGEgbnVtYmVyOiAke2NvbnRlbnRMZW5ndGhTdHJpbmd9LmApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkTGVuZ3RoID0gaGVhZGVyTGVuZ3RoICsgY29udGVudExlbmd0aDtcbiAgICAgICAgaWYgKHJlcXVpcmVkTGVuZ3RoIDw9IHRoaXMucG9zaXRpb24pIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGp1c3QgYSB2aWV3IG9udG8gdGhlIGN1cnJlbnQgYnVmZmVyLlxuICAgICAgICAgIGNvbnN0IGNvbnRlbnRCeXRlcyA9XG4gICAgICAgICAgICAgIHRoaXMuYnVmZmVyLnN1YmFycmF5KGhlYWRlckxlbmd0aCwgaGVhZGVyTGVuZ3RoICsgY29udGVudExlbmd0aCk7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMuZGVjb2Rlci5kZWNvZGUoY29udGVudEJ5dGVzKTtcbiAgICAgICAgICB0aGlzLmJ1ZmZlci5jb3B5V2l0aGluKFxuICAgICAgICAgICAgICAwLCBoZWFkZXJMZW5ndGggKyBjb250ZW50TGVuZ3RoLCB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiAtIChoZWFkZXJMZW5ndGggKyBjb250ZW50TGVuZ3RoKTtcbiAgICAgICAgICByZXR1cm4ge2hlYWRlcnMsIGNvbnRlbnR9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKiBFbmNvZGVzIHRoZSBzdHJpbmcgY29udGVudCB0byBhIEpTT04gUlBDIG1lc3NhZ2UuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlSnNvblJwYyhjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBoZWFkZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHtcbiAgICAnQ29udGVudC1MZW5ndGgnOiBTdHJpbmcobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGNvbnRlbnQpLmJ5dGVMZW5ndGgpLFxuICB9O1xuICBsZXQgcmVxdWVzdFN0cmluZyA9ICcnO1xuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhoZWFkZXJzKSkge1xuICAgIHJlcXVlc3RTdHJpbmcgKz0gYCR7a2V5fTogJHtoZWFkZXJzW2tleV19XFxyXFxuYDtcbiAgfVxuICByZXF1ZXN0U3RyaW5nICs9ICdcXHJcXG4nO1xuICByZXF1ZXN0U3RyaW5nICs9IGNvbnRlbnQ7XG4gIHJldHVybiByZXF1ZXN0U3RyaW5nO1xufVxuIl19