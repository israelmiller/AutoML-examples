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
var fs = require("fs");
var path = require("path");
var logging = require("./logging");
var server = require("./server");
/**
 * Loads the configuration settings for the application to use.
 * On first run, this generates any dynamic settings and merges them into the
 * settings result.
 * @returns the settings object for the application to use.
 */
function loadAppSettings() {
    var settingsPath = path.join(__dirname, 'config', 'settings.json');
    if (!fs.existsSync(settingsPath)) {
        var msg = "App settings file \"".concat(settingsPath, "\" not found.");
        console.error(msg);
        throw new Error(msg);
    }
    try {
        var settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8') || '{}');
        var settingsOverrides = process.env['DATALAB_SETTINGS_OVERRIDES'];
        if (settingsOverrides) {
            // Allow overriding individual settings via JSON provided as an environment variable.
            var overrides = JSON.parse(settingsOverrides);
            Object.assign(settings, overrides);
        }
        return settings;
    }
    catch (e) {
        console.error(e);
        throw new Error("Error parsing settings overrides: ".concat(e));
    }
}
/**
 * Load the configuration settings, and then start the server, which
 * runs indefinitely, listening to and processing incoming HTTP requests.
 */
var appSettings = loadAppSettings();
if (appSettings != null) {
    logging.initializeLoggers(appSettings);
    server.run(appSettings);
}
/**
 * Handle shutdown of this process, to also stop the server, which will in turn stop the
 * associated Jupyter server process.
 */
function exit() {
    logging.getLogger().info('app: exit');
    server.stop();
    logging.getLogger().info('app: exit: stopped');
    process.exit(0);
}
/**
 * Handle uncaught exceptions to log them.
 */
function errorHandler(e) {
    console.error(e.stack);
    logging.getLogger().error(e, 'Unhandled exception');
    process.exit(1);
}
process.on('uncaughtException', errorHandler);
process.on('exit', exit);
process.on('SIGINT', exit);
process.on('SIGTERM', exit);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7R0FZRzs7QUFFSCx1QkFBeUI7QUFDekIsMkJBQTZCO0FBRzdCLG1DQUFxQztBQUNyQyxpQ0FBbUM7QUFFbkM7Ozs7O0dBS0c7QUFDSCxTQUFTLGVBQWU7SUFDdEIsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXJFLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFO1FBQ2hDLElBQU0sR0FBRyxHQUFHLDhCQUFzQixZQUFZLGtCQUFjLENBQUM7UUFDN0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3RCO0lBRUQsSUFBSTtRQUNGLElBQU0sUUFBUSxHQUNWLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxDQUM3QyxDQUFDO1FBQ2hCLElBQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQ3BFLElBQUksaUJBQWlCLEVBQUU7WUFDckIscUZBQXFGO1lBQ3JGLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNwQztRQUNELE9BQU8sUUFBUSxDQUFDO0tBQ2pCO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQXFDLENBQUMsQ0FBRSxDQUFDLENBQUM7S0FDM0Q7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsSUFBTSxXQUFXLEdBQUcsZUFBZSxFQUFFLENBQUM7QUFDdEMsSUFBSSxXQUFXLElBQUksSUFBSSxFQUFFO0lBQ3ZCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN2QyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0NBQ3pCO0FBR0Q7OztHQUdHO0FBQ0gsU0FBUyxJQUFJO0lBQ1gsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN0QyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDL0MsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFlBQVksQ0FBQyxDQUFRO0lBQzVCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXZCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUFDcEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDO0FBRUQsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUM5QyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6QixPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMzQixPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0XG4gKiBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2VcbiAqIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzXG4gKiBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zIHVuZGVyXG4gKiB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge0FwcFNldHRpbmdzfSBmcm9tICcuL2FwcFNldHRpbmdzJztcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnLi9sb2dnaW5nJztcbmltcG9ydCAqIGFzIHNlcnZlciBmcm9tICcuL3NlcnZlcic7XG5cbi8qKlxuICogTG9hZHMgdGhlIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3MgZm9yIHRoZSBhcHBsaWNhdGlvbiB0byB1c2UuXG4gKiBPbiBmaXJzdCBydW4sIHRoaXMgZ2VuZXJhdGVzIGFueSBkeW5hbWljIHNldHRpbmdzIGFuZCBtZXJnZXMgdGhlbSBpbnRvIHRoZVxuICogc2V0dGluZ3MgcmVzdWx0LlxuICogQHJldHVybnMgdGhlIHNldHRpbmdzIG9iamVjdCBmb3IgdGhlIGFwcGxpY2F0aW9uIHRvIHVzZS5cbiAqL1xuZnVuY3Rpb24gbG9hZEFwcFNldHRpbmdzKCk6IEFwcFNldHRpbmdzIHtcbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2NvbmZpZycsICdzZXR0aW5ncy5qc29uJyk7XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKHNldHRpbmdzUGF0aCkpIHtcbiAgICBjb25zdCBtc2cgPSBgQXBwIHNldHRpbmdzIGZpbGUgXCIke3NldHRpbmdzUGF0aH1cIiBub3QgZm91bmQuYDtcbiAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHNldHRpbmdzID1cbiAgICAgICAgSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoc2V0dGluZ3NQYXRoLCAndXRmOCcpIHx8ICd7fScpIGFzXG4gICAgICAgIEFwcFNldHRpbmdzO1xuICAgIGNvbnN0IHNldHRpbmdzT3ZlcnJpZGVzID0gcHJvY2Vzcy5lbnZbJ0RBVEFMQUJfU0VUVElOR1NfT1ZFUlJJREVTJ107XG4gICAgaWYgKHNldHRpbmdzT3ZlcnJpZGVzKSB7XG4gICAgICAvLyBBbGxvdyBvdmVycmlkaW5nIGluZGl2aWR1YWwgc2V0dGluZ3MgdmlhIEpTT04gcHJvdmlkZWQgYXMgYW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAgICBjb25zdCBvdmVycmlkZXMgPSBKU09OLnBhcnNlKHNldHRpbmdzT3ZlcnJpZGVzKTtcbiAgICAgIE9iamVjdC5hc3NpZ24oc2V0dGluZ3MsIG92ZXJyaWRlcyk7XG4gICAgfVxuICAgIHJldHVybiBzZXR0aW5ncztcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBwYXJzaW5nIHNldHRpbmdzIG92ZXJyaWRlczogJHtlfWApO1xuICB9XG59XG5cbi8qKlxuICogTG9hZCB0aGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncywgYW5kIHRoZW4gc3RhcnQgdGhlIHNlcnZlciwgd2hpY2hcbiAqIHJ1bnMgaW5kZWZpbml0ZWx5LCBsaXN0ZW5pbmcgdG8gYW5kIHByb2Nlc3NpbmcgaW5jb21pbmcgSFRUUCByZXF1ZXN0cy5cbiAqL1xuY29uc3QgYXBwU2V0dGluZ3MgPSBsb2FkQXBwU2V0dGluZ3MoKTtcbmlmIChhcHBTZXR0aW5ncyAhPSBudWxsKSB7XG4gIGxvZ2dpbmcuaW5pdGlhbGl6ZUxvZ2dlcnMoYXBwU2V0dGluZ3MpO1xuICBzZXJ2ZXIucnVuKGFwcFNldHRpbmdzKTtcbn1cblxuXG4vKipcbiAqIEhhbmRsZSBzaHV0ZG93biBvZiB0aGlzIHByb2Nlc3MsIHRvIGFsc28gc3RvcCB0aGUgc2VydmVyLCB3aGljaCB3aWxsIGluIHR1cm4gc3RvcCB0aGVcbiAqIGFzc29jaWF0ZWQgSnVweXRlciBzZXJ2ZXIgcHJvY2Vzcy5cbiAqL1xuZnVuY3Rpb24gZXhpdCgpIHtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKCdhcHA6IGV4aXQnKTtcbiAgc2VydmVyLnN0b3AoKTtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKCdhcHA6IGV4aXQ6IHN0b3BwZWQnKTtcbiAgcHJvY2Vzcy5leGl0KDApO1xufVxuXG4vKipcbiAqIEhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25zIHRvIGxvZyB0aGVtLlxuICovXG5mdW5jdGlvbiBlcnJvckhhbmRsZXIoZTogRXJyb3IpOiB2b2lkIHtcbiAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcblxuICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKGUsICdVbmhhbmRsZWQgZXhjZXB0aW9uJyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxucHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCBlcnJvckhhbmRsZXIpO1xucHJvY2Vzcy5vbignZXhpdCcsIGV4aXQpO1xucHJvY2Vzcy5vbignU0lHSU5UJywgZXhpdCk7XG5wcm9jZXNzLm9uKCdTSUdURVJNJywgZXhpdCk7XG4iXX0=