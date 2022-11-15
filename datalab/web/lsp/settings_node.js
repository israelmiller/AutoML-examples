"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.all = void 0;
/**
 * Settings which may be used by the Python language server.
 * These are from the default preferences from a VSCode client, culled
 * to the LSP-related values.
 *
 * The difficulty here is that LSP only defines a mechanism to provide
 * generic settings and the server expects the client to send all necessary
 * settings. VSCode sends all Python settings to every Python language server.
 * Furthermore the language server may request specific settings later.
 *
 * See:
 * https://github.com/microsoft/pyright/blob/9d4e58d06643dccbfe0f450070334675b6b64724/docs/settings.md
 */
exports.all = {
    "python": {
        "analysis": {
            "diagnosticPublishDelay": 1000,
            "errors": [],
            "warnings": [],
            "information": [],
            "disabled": [],
            "typeshedPaths": [],
            "cacheFolderPath": "",
            "memory": {
                "keepLibraryAst": false
            },
            "logLevel": "Warning",
            "symbolsHierarchyDepthLimit": 10,
            "completeFunctionParens": false,
            "autoImportCompletions": true,
            "autoSearchPaths": true,
            "stubPath": "typings",
            "diagnosticMode": "openFilesOnly",
            "extraPaths": [],
            "useLibraryCodeForTypes": true,
            "typeCheckingMode": "basic",
            // See diagnostics explanation at:
            // https://github.com/microsoft/pyright/blob/master/docs/configuration.md
            "diagnosticSeverityOverrides": {
                // Warning when a type stub is found but the module source file was not
                // found, indicating that the code may fail at runtime.
                // Suppress since it causes warnings for six.moves and our environment is
                // closed enough that it should be uncommon.
                "reportMissingModuleSource": "none",
            },
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3Nfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2dlbmZpbGVzL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvbHNwL3NldHRpbmdzX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBQ1UsUUFBQSxHQUFHLEdBQTZCO0lBQzNDLFFBQVEsRUFBRTtRQUNSLFVBQVUsRUFBRTtZQUNSLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsUUFBUSxFQUFFLEVBQUU7WUFDWixVQUFVLEVBQUUsRUFBRTtZQUNkLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLFVBQVUsRUFBRSxFQUFFO1lBQ2QsZUFBZSxFQUFFLEVBQUU7WUFDbkIsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQixRQUFRLEVBQUU7Z0JBQ04sZ0JBQWdCLEVBQUUsS0FBSzthQUMxQjtZQUNELFVBQVUsRUFBRSxTQUFTO1lBQ3JCLDRCQUE0QixFQUFFLEVBQUU7WUFDaEMsd0JBQXdCLEVBQUUsS0FBSztZQUMvQix1QkFBdUIsRUFBRSxJQUFJO1lBQzdCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsVUFBVSxFQUFFLFNBQVM7WUFDckIsZ0JBQWdCLEVBQUUsZUFBZTtZQUNqQyxZQUFZLEVBQUUsRUFBRTtZQUNoQix3QkFBd0IsRUFBRSxJQUFJO1lBQzlCLGtCQUFrQixFQUFFLE9BQU87WUFDM0Isa0NBQWtDO1lBQ2xDLHlFQUF5RTtZQUN6RSw2QkFBNkIsRUFBRTtnQkFDN0IsdUVBQXVFO2dCQUN2RSx1REFBdUQ7Z0JBQ3ZELHlFQUF5RTtnQkFDekUsNENBQTRDO2dCQUM1QywyQkFBMkIsRUFBRSxNQUFNO2FBQ3BDO1NBQ0o7S0FDRjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNldHRpbmdzIHdoaWNoIG1heSBiZSB1c2VkIGJ5IHRoZSBQeXRob24gbGFuZ3VhZ2Ugc2VydmVyLlxuICogVGhlc2UgYXJlIGZyb20gdGhlIGRlZmF1bHQgcHJlZmVyZW5jZXMgZnJvbSBhIFZTQ29kZSBjbGllbnQsIGN1bGxlZFxuICogdG8gdGhlIExTUC1yZWxhdGVkIHZhbHVlcy5cbiAqXG4gKiBUaGUgZGlmZmljdWx0eSBoZXJlIGlzIHRoYXQgTFNQIG9ubHkgZGVmaW5lcyBhIG1lY2hhbmlzbSB0byBwcm92aWRlXG4gKiBnZW5lcmljIHNldHRpbmdzIGFuZCB0aGUgc2VydmVyIGV4cGVjdHMgdGhlIGNsaWVudCB0byBzZW5kIGFsbCBuZWNlc3NhcnlcbiAqIHNldHRpbmdzLiBWU0NvZGUgc2VuZHMgYWxsIFB5dGhvbiBzZXR0aW5ncyB0byBldmVyeSBQeXRob24gbGFuZ3VhZ2Ugc2VydmVyLlxuICogRnVydGhlcm1vcmUgdGhlIGxhbmd1YWdlIHNlcnZlciBtYXkgcmVxdWVzdCBzcGVjaWZpYyBzZXR0aW5ncyBsYXRlci5cbiAqXG4gKiBTZWU6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L3B5cmlnaHQvYmxvYi85ZDRlNThkMDY2NDNkY2NiZmUwZjQ1MDA3MDMzNDY3NWI2YjY0NzI0L2RvY3Mvc2V0dGluZ3MubWRcbiAqL1xuZXhwb3J0IGNvbnN0IGFsbDoge1trZXk6IHN0cmluZ106IHVua25vd259ID0ge1xuICBcInB5dGhvblwiOiB7XG4gICAgXCJhbmFseXNpc1wiOiB7XG4gICAgICAgIFwiZGlhZ25vc3RpY1B1Ymxpc2hEZWxheVwiOiAxMDAwLFxuICAgICAgICBcImVycm9yc1wiOiBbXSxcbiAgICAgICAgXCJ3YXJuaW5nc1wiOiBbXSxcbiAgICAgICAgXCJpbmZvcm1hdGlvblwiOiBbXSxcbiAgICAgICAgXCJkaXNhYmxlZFwiOiBbXSxcbiAgICAgICAgXCJ0eXBlc2hlZFBhdGhzXCI6IFtdLFxuICAgICAgICBcImNhY2hlRm9sZGVyUGF0aFwiOiBcIlwiLFxuICAgICAgICBcIm1lbW9yeVwiOiB7XG4gICAgICAgICAgICBcImtlZXBMaWJyYXJ5QXN0XCI6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIFwibG9nTGV2ZWxcIjogXCJXYXJuaW5nXCIsXG4gICAgICAgIFwic3ltYm9sc0hpZXJhcmNoeURlcHRoTGltaXRcIjogMTAsXG4gICAgICAgIFwiY29tcGxldGVGdW5jdGlvblBhcmVuc1wiOiBmYWxzZSxcbiAgICAgICAgXCJhdXRvSW1wb3J0Q29tcGxldGlvbnNcIjogdHJ1ZSxcbiAgICAgICAgXCJhdXRvU2VhcmNoUGF0aHNcIjogdHJ1ZSxcbiAgICAgICAgXCJzdHViUGF0aFwiOiBcInR5cGluZ3NcIixcbiAgICAgICAgXCJkaWFnbm9zdGljTW9kZVwiOiBcIm9wZW5GaWxlc09ubHlcIixcbiAgICAgICAgXCJleHRyYVBhdGhzXCI6IFtdLFxuICAgICAgICBcInVzZUxpYnJhcnlDb2RlRm9yVHlwZXNcIjogdHJ1ZSxcbiAgICAgICAgXCJ0eXBlQ2hlY2tpbmdNb2RlXCI6IFwiYmFzaWNcIixcbiAgICAgICAgLy8gU2VlIGRpYWdub3N0aWNzIGV4cGxhbmF0aW9uIGF0OlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L3B5cmlnaHQvYmxvYi9tYXN0ZXIvZG9jcy9jb25maWd1cmF0aW9uLm1kXG4gICAgICAgIFwiZGlhZ25vc3RpY1NldmVyaXR5T3ZlcnJpZGVzXCI6IHtcbiAgICAgICAgICAvLyBXYXJuaW5nIHdoZW4gYSB0eXBlIHN0dWIgaXMgZm91bmQgYnV0IHRoZSBtb2R1bGUgc291cmNlIGZpbGUgd2FzIG5vdFxuICAgICAgICAgIC8vIGZvdW5kLCBpbmRpY2F0aW5nIHRoYXQgdGhlIGNvZGUgbWF5IGZhaWwgYXQgcnVudGltZS5cbiAgICAgICAgICAvLyBTdXBwcmVzcyBzaW5jZSBpdCBjYXVzZXMgd2FybmluZ3MgZm9yIHNpeC5tb3ZlcyBhbmQgb3VyIGVudmlyb25tZW50IGlzXG4gICAgICAgICAgLy8gY2xvc2VkIGVub3VnaCB0aGF0IGl0IHNob3VsZCBiZSB1bmNvbW1vbi5cbiAgICAgICAgICBcInJlcG9ydE1pc3NpbmdNb2R1bGVTb3VyY2VcIjogXCJub25lXCIsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn07XG4iXX0=