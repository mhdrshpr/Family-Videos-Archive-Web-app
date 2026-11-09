/**
 * Family Pics - Centralized Error & Diagnostics Logger v1.7
 * Captures all runtime errors, unhandled rejections, and system diagnostics.
 * Dual-persistence:
 * 1. Sends to server endpoint /api/log (writes directly to logs/app.log).
 * 2. Saves locally to localStorage (circular buffer) for offline/file:/// sessions.
 */
(function(root) {
    'use strict';

    var STORAGE_LOGS_KEY = 'family_pics_system_logs';
    var MAX_LOCAL_LOGS = 100;
    var lastRecorded = { msg: '', time: 0 };

    function getLocalLogs() {
        try {
            var raw = localStorage.getItem(STORAGE_LOGS_KEY);
            var logs = raw ? JSON.parse(raw) : [];
            // Filter out any legacy 'Script error.' spam from storage
            return logs.filter(function(l) {
                return l && l.message && l.message !== 'Script error.' && l.message.indexOf('interrupted by a call to pause') === -1;
            });
        } catch (e) {
            return [];
        }
    }

    function saveLocalLog(entry) {
        try {
            var logs = getLocalLogs();
            logs.push(entry);
            if (logs.length > MAX_LOCAL_LOGS) {
                logs = logs.slice(logs.length - MAX_LOCAL_LOGS);
            }
            localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
        } catch (e) {}
    }

    function sendServerLog(entry) {
        try {
            if (root.location && root.location.protocol.indexOf('http') === 0) {
                fetch('/api/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry)
                }).catch(function() {});
            }
        } catch (e) {}
    }

    function isMaintenanceMode() {
        try {
            return localStorage.getItem('family_pics_maintenance_mode') === 'true';
        } catch (e) {
            return false;
        }
    }

    function record(level, message, source, details) {
        if (!isMaintenanceMode()) return;

        var msgStr = String(message || 'Unknown event');

        // Ignore harmless browser artifacts and extension noise
        if (msgStr === 'Script error.' || msgStr === 'null') return;
        if (msgStr.indexOf('interrupted by a call to pause') !== -1) return;
        if (msgStr.indexOf('ResizeObserver loop') !== -1) return;
        if (msgStr.indexOf('CORS policy') !== -1 && root.location && root.location.protocol === 'file:') return;

        // Deduplicate identical errors within 3 seconds
        var now = Date.now();
        if (lastRecorded.msg === msgStr && (now - lastRecorded.time) < 3000) {
            return;
        }
        lastRecorded.msg = msgStr;
        lastRecorded.time = now;

        var entry = {
            timestamp: new Date().toISOString(),
            level: (level || 'INFO').toUpperCase(),
            message: msgStr,
            source: source || (root.location ? root.location.pathname.split('/').pop() : 'window'),
            details: details || '',
            userAgent: navigator.userAgent
        };

        saveLocalLog(entry);
        sendServerLog(entry);
    }

    // Global Error Listeners
    root.onerror = function(message, source, lineno, colno, error) {
        var msg = String(message || '');
        if (msg === 'Script error.' && (!source || source === 'window') && (!lineno || lineno === 0)) {
            return false;
        }
        var file = (source || '').split('/').pop();
        var details = 'line ' + lineno + ':' + colno;
        if (error && error.stack) {
            details += ' | stack: ' + error.stack.split('\n').slice(0, 3).join(' -> ');
        }
        record('ERROR', msg, file, details);
        return false;
    };

    root.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        var msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
        if (msg.indexOf('interrupted by a call to pause') !== -1) {
            return; // Normal video hover leave behavior
        }
        var details = reason && reason.stack ? reason.stack.split('\n').slice(0, 3).join(' -> ') : '';
        record('ERROR', msg, 'Promise', details);
    });

    root.AppLogger = {
        error: function(msg, details) { record('ERROR', msg, null, details); },
        warn: function(msg, details) { record('WARN', msg, null, details); },
        info: function(msg, details) { record('INFO', msg, null, details); },
        getLogs: getLocalLogs,
        clearLogs: function() {
            try { localStorage.removeItem(STORAGE_LOGS_KEY); } catch (e) {}
        }
    };

})(typeof window !== 'undefined' ? window : this);
