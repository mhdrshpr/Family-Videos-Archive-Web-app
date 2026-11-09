/**
 * Family Pics - Main Application Controller v1.8
 * Key Updates:
 * - Direct index.html in root folder for clean browser launch
 * - Ground-up rewritten timeline seeker and hover preview for Chrome
 * - Enforced persistent version constant v1.8 across settings and storage
 * - Interactive password visibility toggle (Eye button) on all PIN fields
 * - Upward top-center permission prompt guide arrow
 * - Active filter visual border highlighting
 * - Live search query text highlighting with mark badges
 */

(function() {
    'use strict';

    var APP_VERSION = '2.6.2';
    var STORAGE_DATA_KEY = 'family_pics_database';
    var STORAGE_AUTH_KEY = 'family_pics_master_pin';
    var STORAGE_USER_KEY = 'family_pics_editor_name';
    var STORAGE_ACTIVE_VIDEO_KEY = 'family_pics_active_video';

    // State
    var appState = {
        videos: [],
        videoBlobs: {},
        systemName: 'خانواده من',
        version: APP_VERSION,
        masterPassword: '1234',
        defaultEditorName: 'مدیر سیستم',
        activeFilter: 'all',
        activeYear: 'all',
        activeTag: 'all',
        activeSort: 'date-desc',
        searchQuery: '',
        currentEditingId: null,
        pendingEditId: null,
        currentEditingTags: [],
        currentEditingThumbnail: null,
        currentQrVideo: null,
        storageStats: {
            videoCount: 0,
            totalVideoSizeBytes: 0,
            totalMiscSizeBytes: 0,
            miscFilesCount: 0,
            miscFiles: [],
            databaseSizeBytes: 0,
            totalStorageBytes: 0
        }
    };

    // DOM Elements
    var videoGrid = document.getElementById('videoGrid');
    var skeletonGrid = document.getElementById('skeletonGrid');
    var alertBanner = document.getElementById('alertBanner');
    var alertCountEl = document.getElementById('alertCount');
    var btnViewIncomplete = document.getElementById('btnViewIncomplete');
    var searchInput = document.getElementById('searchInput');
    var filterStatus = document.getElementById('filterStatus');
    var filterYear = document.getElementById('filterYear');
    var filterTag = document.getElementById('filterTag');
    var sortSelect = document.getElementById('sortSelect');
    var totalCountEl = document.getElementById('totalCount');
    var shownCountEl = document.getElementById('shownCount');

    // Modals & Overlays
    var editModal = document.getElementById('editModal');
    var pinModal = document.getElementById('pinModal');
    var setupPinModal = document.getElementById('setupPinModal');
    var qrModal = document.getElementById('qrModal');
    var settingsModal = document.getElementById('settingsModal');
    var permissionGuideOverlay = document.getElementById('permissionGuideOverlay');

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        if (window.Icons) {
            window.Icons.renderAll(document);
        }

        initTooltipSystem();
        checkBrowserRecommendation();
        loadDatabase();
        bindEvents();
        setupTagInputComponent();
        setupSettingsTabs();
        setupInputValidationClearers();
        initAutoBackupSystem();
    });

    /**
     * Browser Recommendation: Advise Google Chrome if opened in Firefox, Safari, Edge, etc.
     */
    function checkBrowserRecommendation() {
        try {
            var ua = navigator.userAgent || '';
            var isChromium = /Chrome\//i.test(ua) || /CriOS\//i.test(ua);
            var isEdge = /Edg\//i.test(ua);
            var isOpera = /OPR\//i.test(ua) || /Opera\//i.test(ua);
            var isSamsung = /SamsungBrowser\//i.test(ua);
            var isBrave = (navigator.brave && typeof navigator.brave.isBrave === 'function') || /Brave\//i.test(ua);
            var isChrome = isChromium && !isEdge && !isOpera && !isSamsung && !isBrave;

            if (!isChrome) {
                setTimeout(function() {
                    showToast(
                        'برای تجربه بهینه، روانی پخش ویدئوها و عملکرد بهتر امکانات، پیشنهاد می‌شود این سامانه را با مرورگر Google Chrome باز فرمایید.',
                        'success',
                        'info',
                        8500
                    );
                }, 1200);
            }
        } catch (e) {
            console.warn('Browser detection notice:', e);
        }
    }

    /**
     * Dedicated 1-Second Hover Tooltip System
     * Prevents text overflow with multi-line wrap and viewport boundaries
     */
    function initTooltipSystem() {
        var tooltipEl = document.createElement('div');
        tooltipEl.className = 'custom-tooltip';
        document.body.appendChild(tooltipEl);

        var hoverTimer = null;

        document.addEventListener('mouseover', function(e) {
            var target = e.target.closest('[data-tooltip]');
            if (!target) return;

            var text = target.getAttribute('data-tooltip');
            if (!text) return;

            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(function() {
                tooltipEl.innerText = text;
                tooltipEl.classList.add('show');

                var rect = target.getBoundingClientRect();
                var tipRect = tooltipEl.getBoundingClientRect();

                var top = rect.top - tipRect.height - 8;
                if (top < 10) top = rect.bottom + 8;
                var left = rect.left + (rect.width / 2) - (tipRect.width / 2);
                if (left < 10) left = 10;
                if (left + tipRect.width > window.innerWidth - 10) {
                    left = window.innerWidth - tipRect.width - 10;
                }

                tooltipEl.style.top = top + 'px';
                tooltipEl.style.left = left + 'px';
            }, 1000);
        });

        document.addEventListener('mouseout', function(e) {
            var target = e.target.closest('[data-tooltip]');
            if (target) {
                clearTimeout(hoverTimer);
                tooltipEl.classList.remove('show');
            }
        });

        document.addEventListener('click', function() {
            clearTimeout(hoverTimer);
            tooltipEl.classList.remove('show');
        });
    }

    /**
     * Advanced Multi-Type Toast Notification System with configurable duration
     */
    function showToast(message, type, iconName, duration) {
        var container = document.getElementById('toastContainer');
        if (!container) return;

        type = type || 'info';
        duration = duration || 4500;
        if (!iconName) {
            if (type === 'success') iconName = 'check';
            else if (type === 'error') iconName = 'alert';
            else if (type === 'warning') iconName = 'alert';
            else iconName = 'info';
        }

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;

        var iconHtml = window.Icons ? window.Icons.get(iconName, { size: 18 }) : '';
        toast.innerHTML = [
            '<div class="toast-content">',
            iconHtml,
            '<span>' + escapeHtml(message) + '</span>',
            '</div>',
            '<button class="toast-close-btn" title="بستن">&times;</button>'
        ].join('');

        toast.querySelector('.toast-close-btn').addEventListener('click', function() {
            removeToast(toast);
        });

        container.appendChild(toast);
        setTimeout(function() { toast.classList.add('show'); }, 10);

        var autoTimer = setTimeout(function() {
            removeToast(toast);
        }, duration);

        function removeToast(el) {
            clearTimeout(autoTimer);
            el.classList.remove('show');
            setTimeout(function() { el.remove(); }, 250);
        }
    }

    /**
     * Clear error borders dynamically on input typing
     */
    function setupInputValidationClearers() {
        document.addEventListener('input', function(e) {
            if (e.target && e.target.classList.contains('input-error')) {
                e.target.classList.remove('input-error');
            }
        });
    }

    /**
     * Resolve Video Path seamlessly for both HTTP and file:/// modes
     */
    function resolveVideoPath(video) {
        if (!video) return '';
        var raw = video.path || ('VIDEOS/' + (video.filename || ''));
        if (window.location.protocol === 'file:') {
            var isInCodeDir = window.location.pathname.replace(/\\/g, '/').toLowerCase().indexOf('/code/') !== -1;
            if (isInCodeDir) {
                if (raw.indexOf('VIDEOS/') === 0) {
                    return '../' + raw;
                }
            } else {
                return raw;
            }
        }
        return '/' + raw.replace(/^\//, '');
    }

    /**
     * Load Database and Auto-Sync Videos (Offline-First via Static Bundle)
     */
    function loadDatabase() {
        showSkeleton(true);

        // Priority 0: Synchronous static bundle via window.__INITIAL_DATA__
        if (window.__INITIAL_DATA__ && window.__INITIAL_DATA__.videos && window.__INITIAL_DATA__.videos.length > 0) {
            applyLoadedData(window.__INITIAL_DATA__);
            return;
        }

        var isInCodeDir = window.location.pathname.replace(/\\/g, '/').toLowerCase().indexOf('/code/') !== -1;
        var dataJsonUrl = isInCodeDir ? 'data.json' : 'code/data.json';
        var fallbackJsonUrl = isInCodeDir ? '../data.json' : 'data.json';

        if (window.location.protocol === 'file:') {
            // Direct file:/// execution: avoid CORS network errors on /api/scan
            fetch(dataJsonUrl)
                .then(function(r) { return r.json(); })
                .then(function(d) { applyLoadedData(d); })
                .catch(function() {
                    return fetch(fallbackJsonUrl)
                        .then(function(r) { return r.json(); })
                        .then(function(d) { applyLoadedData(d); });
                })
                .catch(function() {
                    var cached = localStorage.getItem(STORAGE_DATA_KEY);
                    if (cached) {
                        try {
                            applyLoadedData(JSON.parse(cached));
                            return;
                        } catch (e) {}
                    }
                    applyLoadedData({ systemName: 'خانواده من', version: APP_VERSION, masterPassword: '1234', videos: [] });
                });
            return;
        }

        fetch('/api/scan')
            .then(function(res) {
                if (!res.ok) throw new Error('API offline');
                return res.json();
            })
            .then(function(payload) {
                if (payload.data && Array.isArray(payload.data.videos)) {
                    applyLoadedData(payload.data);
                    return;
                }
                throw new Error('Invalid payload');
            })
            .catch(function() {
                fetch(dataJsonUrl)
                    .then(function(r) { return r.json(); })
                    .then(function(d) {
                        applyLoadedData(d);
                    })
                    .catch(function() {
                        var cached = localStorage.getItem(STORAGE_DATA_KEY);
                        if (cached) {
                            try {
                                var parsed = JSON.parse(cached);
                                applyLoadedData(parsed);
                                return;
                            } catch (e) {}
                        }
                        applyLoadedData({ systemName: 'خانواده من', version: APP_VERSION, masterPassword: '1234', videos: [] });
                    });
            });
    }

    function applyLoadedData(data) {
        appState.systemName = data.systemName || 'خانواده من';
        appState.version = APP_VERSION;
        appState.videos = normalizeVideos(data.videos || []);

        if (data.masterPassword) {
            appState.masterPassword = data.masterPassword;
            localStorage.setItem(STORAGE_AUTH_KEY, data.masterPassword);
        } else if (!appState.masterPassword) {
            appState.masterPassword = localStorage.getItem(STORAGE_AUTH_KEY) || '1234';
        }

        if (data.defaultEditorName) {
            appState.defaultEditorName = data.defaultEditorName;
            localStorage.setItem(STORAGE_USER_KEY, data.defaultEditorName);
        } else if (!appState.defaultEditorName) {
            appState.defaultEditorName = localStorage.getItem(STORAGE_USER_KEY) || 'مدیر سیستم';
        }

        // Note: No saving on page load! Data is read after videos load
        showSkeleton(false);
        render();
        fetchStorageStats();

        // Stage 2: Check reference folder connection; if connected, load videos then fetch data.json
        setTimeout(function() {
            checkFolderAndTriggerSync();
        }, 150);
    }

    function normalizeVideos(list) {
        return list.map(function(v) {
            if (!Array.isArray(v.tags)) v.tags = [];
            if (typeof v.fileSizeBytes !== 'number') v.fileSizeBytes = 0;
            if (!v.lastEditedBy) v.lastEditedBy = '';
            if (!v.lastEditedAt) v.lastEditedAt = '';
            if (!v.thumbnail) v.thumbnail = '';
            if (!v.onlineLink) v.onlineLink = '';
            if (typeof v.fileExists === 'undefined') v.fileExists = true;
            return v;
        });
    }

    function saveDatabaseLocally() {
        var payload = {
            systemName: appState.systemName,
            version: appState.version,
            masterPassword: appState.masterPassword,
            defaultEditorName: appState.defaultEditorName,
            lastUpdated: new Date().toISOString(),
            videos: appState.videos
        };
        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(payload));

        // 1. Direct path if on HTTP
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function() {});

        // 2. Cross-origin localhost if opened via file:///
        if (window.location.protocol === 'file:') {
            fetch('http://localhost:8080/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function() {});
        }

        // 3. Save copy to directory handle if writable
        if (appState.dirHandle) {
            try {
                appState.dirHandle.getFileHandle('data.json', { create: true }).then(function(fh) {
                    return fh.createWritable().then(function(writable) {
                        return writable.write(JSON.stringify(payload, null, 2)).then(function() {
                            return writable.close();
                        });
                    });
                }).catch(function() {});
            } catch (e) {}
        }
    }

    function showSkeleton(show) {
        if (skeletonGrid) skeletonGrid.style.display = show ? 'grid' : 'none';
        if (videoGrid) videoGrid.style.display = show ? 'none' : 'grid';
    }

    function isVideoIncomplete(v) {
        var hasTitle = v.title && v.title.trim().length > 0;
        var hasYear = v.year && String(v.year).trim().length > 0;
        var hasDesc = v.description && v.description.trim().length > 0;
        return !(hasTitle && hasYear && hasDesc);
    }

    function getAllTagsWithCount() {
        var tagMap = {};
        appState.videos.forEach(function(v) {
            if (Array.isArray(v.tags)) {
                v.tags.forEach(function(t) {
                    var clean = t.trim();
                    if (clean) tagMap[clean] = (tagMap[clean] || 0) + 1;
                });
            }
        });
        return tagMap;
    }

    function fetchStorageStats() {
        fetch('/api/stats')
            .then(function(res) {
                if (!res.ok) throw new Error('API stats error');
                return res.json();
            })
            .then(function(data) {
                appState.storageStats = data;
                updateStatsModalUI();
            })
            .catch(function() {
                var totalBytes = 0;
                appState.videos.forEach(function(v) {
                    totalBytes += (v.fileSizeBytes || 0);
                });
                var dbSize = (localStorage.getItem(STORAGE_DATA_KEY) || '').length * 2;
                appState.storageStats = {
                    videoCount: appState.videos.length,
                    totalVideoSizeBytes: totalBytes,
                    totalMiscSizeBytes: 0,
                    miscFilesCount: 0,
                    miscFiles: [],
                    databaseSizeBytes: dbSize,
                    totalStorageBytes: totalBytes + dbSize
                };
                updateStatsModalUI();
            });
    }

    /**
     * Bind all interactive events
     */
    function bindEvents() {
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                appState.searchQuery = e.target.value.trim().toLowerCase();
                renderVideoList();
            });
        }
        if (filterStatus) {
            filterStatus.addEventListener('change', function(e) {
                appState.activeFilter = e.target.value;
                renderVideoList();
            });
        }
        if (filterYear) {
            filterYear.addEventListener('change', function(e) {
                appState.activeYear = e.target.value;
                renderVideoList();
            });
        }
        if (filterTag) {
            filterTag.addEventListener('change', function(e) {
                appState.activeTag = e.target.value;
                renderVideoList();
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', function(e) {
                appState.activeSort = e.target.value;
                renderVideoList();
            });
        }

        if (btnViewIncomplete) {
            btnViewIncomplete.addEventListener('click', function() {
                if (filterStatus) {
                    filterStatus.value = 'incomplete';
                    appState.activeFilter = 'incomplete';
                    renderVideoList();
                    var grid = document.getElementById('videoSection');
                    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Settings Modal
        var btnOpenSettings = document.getElementById('btnOpenSettings');
        if (btnOpenSettings) {
            btnOpenSettings.addEventListener('click', function() {
                fetchStorageStats();
                openModal(settingsModal);
            });
        }

        // Setup Initial PIN & Name Form
        var setupPinForm = document.getElementById('setupPinForm');
        if (setupPinForm) {
            setupPinForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var btn = setupPinForm.querySelector('button[type="submit"]');
                var nameInput = document.getElementById('setupEditorName');
                var pinInput = document.getElementById('newPinInput');
                var pinConfirm = document.getElementById('newPinConfirm');

                var hasError = false;
                if (!nameInput.value.trim()) {
                    nameInput.classList.add('input-error');
                    hasError = true;
                }
                if (!pinInput.value.trim() || pinInput.value.trim().length < 4) {
                    pinInput.classList.add('input-error');
                    hasError = true;
                }
                if (!pinConfirm.value.trim() || pinConfirm.value.trim() !== pinInput.value.trim()) {
                    pinConfirm.classList.add('input-error');
                    hasError = true;
                }

                if (hasError) {
                    showToast('لطفاً فیلدهای مشخص شده با رنگ قرمز را به درستی تکمیل فرمایید.', 'error');
                    return;
                }

                setButtonLoading(btn, true);
                setTimeout(function() {
                    appState.masterPassword = pinInput.value.trim();
                    appState.defaultEditorName = nameInput.value.trim();
                    localStorage.setItem(STORAGE_AUTH_KEY, appState.masterPassword);
                    localStorage.setItem(STORAGE_USER_KEY, appState.defaultEditorName);
                    saveDatabaseLocally();

                    setButtonLoading(btn, false);
                    closeModal(setupPinModal);
                    showToast('رمز عبور و مشخصات شما با موفقیت ثبت شد.', 'success');
                }, 400);
            });
        }

        // PIN Verification Form
        var verifyPinForm = document.getElementById('verifyPinForm');
        if (verifyPinForm) {
            verifyPinForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var btn = verifyPinForm.querySelector('button[type="submit"]');
                var input = document.getElementById('verifyPinInput');
                var storedPin = appState.masterPassword || localStorage.getItem(STORAGE_AUTH_KEY) || '1234';

                if (!input.value.trim()) {
                    input.classList.add('input-error');
                    showToast('لطفاً رمز عبور را وارد کنید.', 'warning');
                    return;
                }

                setButtonLoading(btn, true);
                setTimeout(function() {
                    setButtonLoading(btn, false);
                    if (input.value.trim() === storedPin) {
                        closeModal(pinModal);
                        input.value = '';
                        if (appState.pendingEditId) {
                            openEditModal(appState.pendingEditId);
                            appState.pendingEditId = null;
                        }
                    } else {
                        input.classList.add('input-error');
                        showToast('رمز عبور اشتباه است!', 'error');
                        input.select();
                    }
                }, 300);
            });
        }

        // Change Password Form in Settings
        var changePinForm = document.getElementById('changePinForm');
        if (changePinForm) {
            changePinForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var btn = changePinForm.querySelector('button[type="submit"]');
                var oldPinInput = document.getElementById('changePinOld');
                var newPinInput = document.getElementById('changePinNew');
                var confirmPinInput = document.getElementById('changePinConfirm');
                var editorNameInput = document.getElementById('changeEditorName');

                var storedPin = appState.masterPassword || localStorage.getItem(STORAGE_AUTH_KEY) || '1234';
                var hasError = false;

                if (oldPinInput.value.trim() !== storedPin) {
                    oldPinInput.classList.add('input-error');
                    hasError = true;
                }
                if (newPinInput.value.trim().length < 4) {
                    newPinInput.classList.add('input-error');
                    hasError = true;
                }
                if (newPinInput.value.trim() !== confirmPinInput.value.trim()) {
                    confirmPinInput.classList.add('input-error');
                    hasError = true;
                }

                if (hasError) {
                    showToast('لطفاً فیلدهای قرمز را بررسی و اصلاح فرمایید.', 'error');
                    return;
                }

                setButtonLoading(btn, true);
                setTimeout(function() {
                    appState.masterPassword = newPinInput.value.trim();
                    if (editorNameInput && editorNameInput.value.trim()) {
                        appState.defaultEditorName = editorNameInput.value.trim();
                        localStorage.setItem(STORAGE_USER_KEY, appState.defaultEditorName);
                    }
                    localStorage.setItem(STORAGE_AUTH_KEY, appState.masterPassword);
                    saveDatabaseLocally();

                    setButtonLoading(btn, false);
                    oldPinInput.value = '';
                    newPinInput.value = '';
                    confirmPinInput.value = '';
                    showToast('رمز عبور ویرایش با موفقیت تغییر کرد.', 'success');
                }, 400);
            });
        }

        // Global Password Eye Visibility Toggle
        document.addEventListener('click', function(e) {
            var toggleBtn = e.target.closest('.btn-toggle-password');
            if (!toggleBtn) return;
            e.preventDefault();
            e.stopPropagation();

            var targetId = toggleBtn.getAttribute('data-target');
            var input = targetId ? document.getElementById(targetId) : toggleBtn.parentElement.querySelector('input');
            if (!input) return;

            var iconEl = toggleBtn.querySelector('.eye-icon') || toggleBtn;
            if (input.type === 'password') {
                input.type = 'text';
                if (window.Icons) {
                    iconEl.innerHTML = window.Icons.get('eyeOff', { size: 18 });
                }
                toggleBtn.setAttribute('data-tooltip', 'مخفی‌سازی رمز عبور');
                toggleBtn.setAttribute('aria-label', 'مخفی‌سازی رمز عبور');
            } else {
                input.type = 'password';
                if (window.Icons) {
                    iconEl.innerHTML = window.Icons.get('eye', { size: 18 });
                }
                toggleBtn.setAttribute('data-tooltip', 'نمایش رمز عبور');
                toggleBtn.setAttribute('aria-label', 'نمایش رمز عبور');
            }
        });

        // Edit Video Form
        var editVideoForm = document.getElementById('editVideoForm');
        if (editVideoForm) {
            editVideoForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var btn = editVideoForm.querySelector('button[type="submit"]');
                var title = document.getElementById('editTitle');
                var year = document.getElementById('editYear');
                var desc = document.getElementById('editDesc');
                var editor = document.getElementById('editEditorName');
                var onlineLinkInput = document.getElementById('editOnlineLink');

                if (!appState.currentEditingId) return;

                var hasError = false;
                if (!title.value.trim()) { title.classList.add('input-error'); hasError = true; }
                if (!year.value.trim()) { year.classList.add('input-error'); hasError = true; }
                if (!desc.value.trim()) { desc.classList.add('input-error'); hasError = true; }
                if (!editor.value.trim()) { editor.classList.add('input-error'); hasError = true; }

                if (hasError) {
                    showToast('لطفاً فیلدهای مشخص شده با رنگ قرمز را تکمیل کنید.', 'error');
                    return;
                }

                setButtonLoading(btn, true);
                setTimeout(function() {
                    var v = appState.videos.find(function(item) { return item.id === appState.currentEditingId; });
                    if (v) {
                        v.title = title.value.trim();
                        v.year = year.value.trim();
                        v.description = desc.value.trim();
                        v.lastEditedBy = editor.value.trim();
                        v.lastEditedAt = new Date().toISOString();
                        v.tags = appState.currentEditingTags.slice();
                        if (onlineLinkInput) {
                            v.onlineLink = onlineLinkInput.value.trim();
                        }
                        if (appState.currentEditingThumbnail) {
                            v.thumbnail = appState.currentEditingThumbnail;
                        }

                        saveDatabaseLocally();
                        render();
                        showToast('اطلاعات فیلم "' + v.title + '" با موفقیت ذخیره شد.', 'success');

                        // Automatic Backup immediately upon movie completion
                        performAutoBackup('movie_completed', v.title);
                    }
                    setButtonLoading(btn, false);
                    closeModal(editModal);
                }, 400);
            });
        }

        // Button 1: "همگام‌سازی و ذخیره" (Saves to data.json first, then syncs videos)
        var btnSyncVideos = document.getElementById('btnSyncVideos');
        if (btnSyncVideos) {
            btnSyncVideos.addEventListener('click', function() {
                handleSyncAndSaveButton();
            });
        }

        // Button 2 & Banner: Connect VIDEOS directory via Educational Guide
        var btnRegisterFolder = document.getElementById('btnRegisterFolder');
        var btnBannerConnectFolder = document.getElementById('btnBannerConnectFolder');
        var folderGuideModal = document.getElementById('folderGuideModal');
        var btnStartFolderPicker = document.getElementById('btnStartFolderPicker');
        var folderInput = document.getElementById('folderInput');

        function openFolderGuide() {
            if (folderGuideModal) openModal(folderGuideModal);
        }

        if (btnRegisterFolder) {
            btnRegisterFolder.addEventListener('click', function() {
                openFolderGuide();
            });
        }

        if (btnBannerConnectFolder) {
            btnBannerConnectFolder.addEventListener('click', function() {
                openFolderGuide();
            });
        }

        if (btnStartFolderPicker) {
            btnStartFolderPicker.addEventListener('click', function() {
                if (folderGuideModal) closeModal(folderGuideModal);
                if (window.showDirectoryPicker) {
                    runDirectoryPickerWithValidation();
                } else if (folderInput) {
                    folderInput.click();
                } else {
                    showToast('مرورگر از انتخاب مستقیم پوشه پشتیبانی نمی‌کند. لطفاً با مرورگر Google Chrome باز فرمایید.', 'warning');
                }
            });
        }

        if (folderInput) {
            folderInput.addEventListener('change', function(e) {
                runFolderInputWithValidation(e.target.files);
                folderInput.value = '';
            });
        }

        // Permission Guide Dismiss Button
        var btnDismissPermissionGuide = document.getElementById('btnDismissPermissionGuide');
        if (btnDismissPermissionGuide) {
            btnDismissPermissionGuide.addEventListener('click', function() {
                hidePermissionGuide();
            });
        }

        // Export BACKUP.JSON Button
        var btnBackup = document.getElementById('btnBackup');
        if (btnBackup) {
            btnBackup.addEventListener('click', function() {
                setButtonLoading(btnBackup, true);
                setTimeout(function() {
                    exportBackupJSON();
                    setButtonLoading(btnBackup, false);
                }, 350);
            });
        }

        // Restore BACKUP.JSON Button
        var fileRestore = document.getElementById('fileRestore');
        var btnRestoreTrigger = document.getElementById('btnRestoreTrigger');
        if (btnRestoreTrigger && fileRestore) {
            btnRestoreTrigger.addEventListener('click', function() {
                fileRestore.click();
            });

            fileRestore.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;

                setButtonLoading(btnRestoreTrigger, true);
                var reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        var parsed = JSON.parse(evt.target.result);
                        if (parsed && Array.isArray(parsed.videos)) {
                            appState.videos = normalizeVideos(parsed.videos);
                            if (parsed.systemName) appState.systemName = parsed.systemName;
                            saveDatabaseLocally();
                            render();
                            fetchStorageStats();
                            showToast('فایل BACKUP.JSON با موفقیت بازیابی شد.', 'success');
                        } else {
                            showToast('فرمت فایل پشتیبان نامعتبر است! فایل باید دارای لیست ویدئوها باشد.', 'error');
                        }
                    } catch (err) {
                        showToast('خطا در خواندن و پارس فایل JSON پشتیبان!', 'error');
                    }
                    setButtonLoading(btnRestoreTrigger, false);
                    fileRestore.value = '';
                };
                reader.readAsText(file);
            });
        }

        // Thumbnail Drag & Drop and Upload Actions in Edit Modal
        var btnCaptureFrame = document.getElementById('btnCaptureFrame');
        var thumbFileInput = document.getElementById('thumbFileInput');
        var btnUploadThumb = document.getElementById('btnUploadThumb');
        var thumbDropzone = document.getElementById('thumbDropzone');

        if (btnCaptureFrame) {
            btnCaptureFrame.addEventListener('click', function() {
                captureMiddleFrameOfEditingVideo();
            });
        }
        if (btnUploadThumb && thumbFileInput) {
            btnUploadThumb.addEventListener('click', function() {
                thumbFileInput.click();
            });
            thumbFileInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        appState.currentEditingThumbnail = evt.target.result;
                        updateEditThumbPreview(evt.target.result);
                        showToast('تصویر تامنیل انتخاب شد (جهت ذخیره نهایی، دکمه ذخیره تغییرات را بزنید).', 'info');
                    };
                    reader.readAsDataURL(file);
                }
                thumbFileInput.value = '';
            });
        }

        // Drag & Drop Handler on Thumbnail Box
        if (thumbDropzone) {
            ['dragenter', 'dragover'].forEach(function(eventName) {
                thumbDropzone.addEventListener(eventName, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    thumbDropzone.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(function(eventName) {
                thumbDropzone.addEventListener(eventName, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    thumbDropzone.classList.remove('dragover');
                });
            });

            thumbDropzone.addEventListener('drop', function(e) {
                var dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    var file = dt.files[0];
                    if (file.type && file.type.startsWith('image/')) {
                        var reader = new FileReader();
                        reader.onload = function(evt) {
                            appState.currentEditingThumbnail = evt.target.result;
                            updateEditThumbPreview(evt.target.result);
                            showToast('تصویر تامنیل با موفقیت رهاسازی شد.', 'success');
                        };
                        reader.readAsDataURL(file);
                    } else {
                        showToast('لطفاً یک فایل تصویری معتبر (JPG, PNG, WebP) رها کنید.', 'warning');
                    }
                }
            });
        }

        // Copy QR Link
        var btnCopyQrLink = document.getElementById('btnCopyQrLink');
        if (btnCopyQrLink) {
            btnCopyQrLink.addEventListener('click', function() {
                var linkEl = document.getElementById('qrDirectLink');
                if (linkEl) {
                    navigator.clipboard.writeText(linkEl.innerText)
                        .then(function() { showToast('لینک مستقیم دانلود کپی شد.', 'success'); })
                        .catch(function() { showToast('خطا در کپی کلیپ‌بورد!', 'error'); });
                }
            });
        }

        // Close Modal buttons
        var closeButtons = document.querySelectorAll('[data-close-modal]');
        for (var i = 0; i < closeButtons.length; i++) {
            closeButtons[i].addEventListener('click', function() {
                var m = this.closest('.modal-overlay');
                if (m) closeModal(m);
            });
        }

        // Missing File Modal Event Handlers
        var btnDeleteMissingFile = document.getElementById('btnDeleteMissingFile');
        var btnKeepMissingFile = document.getElementById('btnKeepMissingFile');
        var missingFileModal = document.getElementById('missingFileModal');

        if (btnDeleteMissingFile) {
            btnDeleteMissingFile.addEventListener('click', function() {
                if (!activeMissingVideo) return;
                var deletedTitle = activeMissingVideo.title || activeMissingVideo.filename;
                appState.videos = appState.videos.filter(function(v) { return v.id !== activeMissingVideo.id; });
                saveDatabaseLocally();
                render();
                fetchStorageStats();
                performAutoBackup('movie_deleted', deletedTitle);
                if (missingFileModal) closeModal(missingFileModal);
                showToast('فیلم «' + deletedTitle + '» و کلیه مشخصات آن از سامانه حذف گردید.', 'success');
                activeMissingVideo = null;
            });
        }

        if (btnKeepMissingFile) {
            btnKeepMissingFile.addEventListener('click', function() {
                if (missingFileModal) closeModal(missingFileModal);
                showToast('مشخصات این فیلم در سامانه باقی می‌ماند تا فایل دوباره درون پوشه قرار گیرد.', 'info');
                activeMissingVideo = null;
            });
        }
    }

    /**
     * Capture Middle Frame of Currently Editing Video using HTML5 Canvas
     */
    function captureMiddleFrameOfEditingVideo() {
        var video = appState.videos.find(function(v) { return v.id === appState.currentEditingId; });
        if (!video) return;

        var videoPath = video.path || ('VIDEOS/' + video.filename);
        var tempVid = document.createElement('video');
        tempVid.crossOrigin = 'anonymous';
        tempVid.src = videoPath;
        tempVid.muted = true;
        tempVid.preload = 'auto';

        showToast('در حال پردازش و استخراج فریم میانی ویدئو...', 'info');

        tempVid.addEventListener('loadedmetadata', function() {
            var dur = tempVid.duration;
            var isFin = dur && !isNaN(dur) && isFinite(dur) && dur > 4;
            var targetSecond = isFin ? (dur / 2) : 3;
            tempVid.currentTime = targetSecond;
        });

        tempVid.addEventListener('seeked', function() {
            try {
                var canvas = document.createElement('canvas');
                canvas.width = tempVid.videoWidth || 640;
                canvas.height = tempVid.videoHeight || 360;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(tempVid, 0, 0, canvas.width, canvas.height);
                var dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                appState.currentEditingThumbnail = dataUrl;
                updateEditThumbPreview(dataUrl);
                showToast('فریم میانی ویدئو به عنوان تامنیل با موفقیت استخراج شد.', 'success');
            } catch (err) {
                console.warn('Canvas frame capture error', err);
                showToast('به دلیل محدودیت‌های امنیتی مرورگر، فریم‌گیری مستقیم ممکن نشد. می‌توانید با دکمه "انتخاب تصویر"، عکس دلخواه را انتخاب کنید.', 'warning');
            }
        });

        tempVid.addEventListener('error', function() {
            showToast('خطا در بارگذاری ویدئو جهت استخراج فریم!', 'error');
        });
    }

    function updateEditThumbPreview(src) {
        var box = document.getElementById('editThumbPreviewBox');
        if (box) {
            box.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
        }
    }

    // Permission Overlay Helpers
    function showPermissionGuide() {
        if (permissionGuideOverlay) permissionGuideOverlay.classList.remove('hidden');
    }
    function hidePermissionGuide() {
        if (permissionGuideOverlay) permissionGuideOverlay.classList.add('hidden');
    }

    // IndexedDB Directory Handle Persistence
    var IDB_NAME = 'family_pics_idb';
    var IDB_STORE = 'handles';

    function getIDB() {
        return new Promise(function(resolve, reject) {
            if (!window.indexedDB) {
                return reject(new Error('IndexedDB not supported'));
            }
            var req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE);
                }
            };
            req.onsuccess = function() { resolve(req.result); };
            req.onerror = function() { reject(req.error); };
        });
    }

    async function saveDirectoryHandle(handle) {
        try {
            var db = await getIDB();
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(IDB_STORE, 'readwrite');
                var store = tx.objectStore(IDB_STORE);
                var req = store.put(handle, 'videos_dir');
                req.onsuccess = function() { resolve(true); };
                req.onerror = function() { reject(req.error); };
            });
        } catch (e) {
            console.warn('Could not save dir handle in IDB:', e);
        }
    }

    async function getStoredDirectoryHandle() {
        try {
            var db = await getIDB();
            return new Promise(function(resolve) {
                var tx = db.transaction(IDB_STORE, 'readonly');
                var store = tx.objectStore(IDB_STORE);
                var req = store.get('videos_dir');
                req.onsuccess = function() { resolve(req.result || null); };
                req.onerror = function() { resolve(null); };
            });
        } catch (e) {
            return null;
        }
    }

    async function saveDataJsonHandle(handle) {
        try {
            var db = await getIDB();
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(IDB_STORE, 'readwrite');
                var store = tx.objectStore(IDB_STORE);
                var req = store.put(handle, 'data_json_file');
                req.onsuccess = function() { resolve(true); };
                req.onerror = function() { reject(req.error); };
            });
        } catch (e) {
            console.warn('Could not save data_json_file handle in IDB:', e);
        }
    }

    async function getStoredDataJsonHandle() {
        try {
            var db = await getIDB();
            return new Promise(function(resolve) {
                var tx = db.transaction(IDB_STORE, 'readonly');
                var store = tx.objectStore(IDB_STORE);
                var req = store.get('data_json_file');
                req.onsuccess = function() { resolve(req.result || null); };
                req.onerror = function() { resolve(null); };
            });
        } catch (e) {
            return null;
        }
    }

    async function scanEntriesFromHandle(dirHandle) {
        var newCount = 0;
        var existingNames = [];
        var videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv', '.flv'];

        for await (var entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                var name = entry.name;
                existingNames.push(name);
                var lower = name.toLowerCase();
                var isVid = videoExtensions.some(function(ext) { return lower.endsWith(ext); });
                if (isVid) {
                    var exists = appState.videos.some(function(v) { return v.filename === name; });
                    if (!exists) {
                        var fileData = await entry.getFile();
                        appState.videos.push({
                            id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            filename: name,
                            path: 'VIDEOS/' + name,
                            title: '',
                            year: '',
                            description: '',
                            tags: [],
                            lastEditedBy: '',
                            lastEditedAt: '',
                            duration: '',
                            durationSeconds: 0,
                            fileSizeBytes: fileData.size || 0,
                            fileExists: true,
                            dateAdded: new Date().toISOString()
                        });
                        newCount++;
                    }
                }
            }
        }

        // Check fileExists for all videos
        appState.videos.forEach(function(v) {
            v.fileExists = (existingNames.indexOf(v.filename) !== -1);
        });

        return newCount;
    }

    /**
     * Smooth Overlay Transition Helpers
     */
    function showOverlay(overlayEl) {
        if (!overlayEl) return;
        overlayEl.classList.remove('fade-out');
        overlayEl.classList.remove('hidden');
    }

    async function hideOverlaySmoothly(overlayEl) {
        if (!overlayEl) return;
        overlayEl.classList.add('fade-out');
        await new Promise(function(r) { setTimeout(r, 450); });
        overlayEl.classList.add('hidden');
        overlayEl.classList.remove('fade-out');
    }

    function setFolderVerificationUI(isVerified) {
        var lockedWrap = document.getElementById('lockedContentWrap');
        var requiredBanner = document.getElementById('folderRequiredBanner');
        var btnRegister = document.getElementById('btnRegisterFolder');
        var btnRegisterText = document.getElementById('btnRegisterFolderText');
        var btnSyncVideos = document.getElementById('btnSyncVideos');
        var folderRegisterArrow = document.getElementById('folderRegisterArrow');

        if (isVerified) {
            if (lockedWrap) lockedWrap.classList.remove('content-locked-blur');
            if (requiredBanner) requiredBanner.classList.add('hidden');
            if (btnRegister) btnRegister.classList.remove('btn-highlight-pulse');
            if (btnRegisterText) btnRegisterText.innerText = 'پوشه مرجع متصل است';
            if (btnSyncVideos) {
                btnSyncVideos.classList.remove('content-locked-blur');
                btnSyncVideos.style.pointerEvents = 'auto';
            }
            if (folderRegisterArrow) folderRegisterArrow.classList.add('hidden');
        } else {
            if (lockedWrap) lockedWrap.classList.add('content-locked-blur');
            if (requiredBanner) requiredBanner.classList.remove('hidden');
            if (btnRegister) btnRegister.classList.add('btn-highlight-pulse');
            if (btnRegisterText) btnRegisterText.innerText = 'ثبت پوشه VIDEOS';
            if (btnSyncVideos) {
                btnSyncVideos.classList.add('content-locked-blur');
                btnSyncVideos.style.pointerEvents = 'none';
            }
            if (folderRegisterArrow) folderRegisterArrow.classList.remove('hidden');
        }
    }

    async function runDirectoryPickerWithValidation() {
        var dirHandle;
        try {
            dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast('خطا در باز کردن انتخابگر پوشه: ' + err.message, 'error');
            }
            return;
        }

        var overlay = document.getElementById('folderValidationOverlay');
        showOverlay(overlay);
        var startTime = Date.now();

        try {
            var foundNames = [];
            for await (var entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    foundNames.push(entry.name);
                    try {
                        var fileObj = await entry.getFile();
                        var blobUrl = URL.createObjectURL(fileObj);
                        appState.videoBlobs[entry.name] = blobUrl;
                    } catch (fe) {}
                }
            }

            var videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv', '.flv'];
            var isInitialSetup = (appState.videos.length === 0);
            var isMatch = false;

            if (isInitialSetup) {
                // مسیر اختصاصی برای تعریف اولیه پوشه VIDEOS (خام/فکتوری ریست)
                var folderName = (dirHandle.name || '').trim().toLowerCase();
                var hasVideoFiles = foundNames.some(function(n) {
                    var l = n.toLowerCase();
                    return videoExtensions.some(function(ext) { return l.endsWith(ext); });
                });

                // تایید اصالت: تطبیق نام پوشه VIDEOS یا وجود فایل‌های ویدیویی (حتی در صورت خالی بودن پوشه تازه)
                if (folderName === 'videos' || hasVideoFiles || foundNames.length === 0) {
                    isMatch = true;
                }
            } else {
                isMatch = appState.videos.some(function(v) {
                    return foundNames.indexOf(v.filename) !== -1;
                });
            }

            // Enforce minimum 500ms delay so loading animation is visible and smooth
            var elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(function(r) { setTimeout(r, 500 - elapsed); });
            }

            if (isMatch) {
                await saveDirectoryHandle(dirHandle);
                appState.dirHandle = dirHandle;
                sessionStorage.setItem('family_pics_folder_verified', 'true');
                setFolderVerificationUI(true);

                if (isInitialSetup) {
                    // فرآیند همگام‌سازی اولیه و ذخیره دیتای نو در دیتابیس
                    var newCount = await scanEntriesFromHandle(dirHandle);
                    var payload = {
                        systemName: appState.systemName,
                        version: appState.version,
                        masterPassword: appState.masterPassword,
                        defaultEditorName: appState.defaultEditorName,
                        lastUpdated: new Date().toISOString(),
                        videos: appState.videos
                    };
                    saveDatabaseLocally();
                    await saveDataToJsonFile(payload);
                    render();
                    fetchStorageStats();
                    await hideOverlaySmoothly(overlay);

                    if (newCount > 0) {
                        showToast('پوشه VIDEOS به عنوان پوشه مرجع اولیه تایید و ' + newCount + ' ویدئو همگام‌سازی شد.', 'success');
                    } else {
                        showToast('پوشه VIDEOS به عنوان پوشه مرجع اولیه تایید شد. ویدئوهای قرار گرفته در آن شناسایی خواهند شد.', 'info');
                    }
                } else {
                    showToast('پوشه VIDEOS با موفقیت تایید و متصل گردید.', 'success');
                    await hideOverlaySmoothly(overlay);
                    loadVideosAndFetchDataJson(dirHandle);
                }
            } else {
                setFolderVerificationUI(false);
                showToast('خطا: پوشه انتخاب‌شده حاوی فایل‌های ویدیویی این سامانه نیست! لطفاً پوشه VIDEOS کنار پروژه را انتخاب فرمایید.', 'error');
                await hideOverlaySmoothly(overlay);
            }
        } catch (e) {
            showToast('خطا در بررسی پوشه: ' + (e.message || e), 'error');
            setFolderVerificationUI(false);
            await hideOverlaySmoothly(overlay);
        }
    }

    async function runFolderInputWithValidation(files) {
        if (!files || files.length === 0) return;

        var overlay = document.getElementById('folderValidationOverlay');
        showOverlay(overlay);
        var startTime = Date.now();

        try {
            var foundNames = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                foundNames.push(f.name);
                var bUrl = URL.createObjectURL(f);
                appState.videoBlobs[f.name] = bUrl;
            }

            var videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv', '.flv'];
            var isInitialSetup = (appState.videos.length === 0);
            var isMatch = false;

            if (isInitialSetup) {
                var hasVideoFiles = foundNames.some(function(n) {
                    var l = n.toLowerCase();
                    return videoExtensions.some(function(ext) { return l.endsWith(ext); });
                });
                var isVideosFolder = Array.from(files).some(function(f) {
                    var path = (f.webkitRelativePath || '').toLowerCase();
                    return path.indexOf('videos') !== -1;
                });
                if (isVideosFolder || hasVideoFiles || files.length === 0) {
                    isMatch = true;
                }
            } else {
                isMatch = appState.videos.some(function(v) {
                    return foundNames.indexOf(v.filename) !== -1;
                });
            }

            var elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(function(r) { setTimeout(r, 500 - elapsed); });
            }

            if (isMatch) {
                sessionStorage.setItem('family_pics_folder_verified', 'true');
                handleFolderFiles(files);
                setFolderVerificationUI(true);

                if (isInitialSetup) {
                    var payload = {
                        systemName: appState.systemName,
                        version: appState.version,
                        masterPassword: appState.masterPassword,
                        defaultEditorName: appState.defaultEditorName,
                        lastUpdated: new Date().toISOString(),
                        videos: appState.videos
                    };
                    saveDataToJsonFile(payload);
                }

                showToast('پوشه VIDEOS با موفقیت تایید و متصل گردید.', 'success');
                await hideOverlaySmoothly(overlay);
            } else {
                setFolderVerificationUI(false);
                showToast('خطا: پوشه انتخاب‌شده حاوی فایل‌های ویدیویی این سامانه نیست! لطفاً پوشه VIDEOS کنار پروژه را انتخاب فرمایید.', 'error');
                await hideOverlaySmoothly(overlay);
            }
        } catch (e) {
            showToast('خطا در بررسی پوشه: ' + (e.message || e), 'error');
            setFolderVerificationUI(false);
            await hideOverlaySmoothly(overlay);
        }
    }

    function handleFolderFiles(fileList) {
        if (!fileList || fileList.length === 0) return;
        var videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv', '.flv'];
        var newCount = 0;
        var foundNames = [];

        for (var i = 0; i < fileList.length; i++) {
            var f = fileList[i];
            var name = f.name;
            foundNames.push(name);
            var lower = name.toLowerCase();
            var isVid = videoExtensions.some(function(ext) { return lower.endsWith(ext); });
            if (isVid) {
                var exists = appState.videos.some(function(v) { return v.filename === name; });
                if (!exists) {
                    appState.videos.push({
                        id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        filename: name,
                        path: 'VIDEOS/' + name,
                        title: '',
                        year: '',
                        description: '',
                        tags: [],
                        lastEditedBy: '',
                        lastEditedAt: '',
                        duration: '',
                        durationSeconds: 0,
                        fileSizeBytes: f.size || 0,
                        fileExists: true,
                        dateAdded: new Date().toISOString()
                    });
                    newCount++;
                }
            }
        }

        // Synchronize file existence flags
        appState.videos.forEach(function(v) {
            v.fileExists = (foundNames.indexOf(v.filename) !== -1);
        });

        saveDatabaseLocally();
        render();
        fetchStorageStats();
        if (newCount > 0) {
            showToast(newCount + ' ویدئوی جدید اضافه شد.', 'success');
        } else {
            showToast('ویدیوی جدیدی یافت نشد.', 'info');
        }
    }

    /**
     * Missing / Deleted Video File Handler (v2.3.0)
     */
    var activeMissingVideo = null;
    function openMissingFileModal(video) {
        activeMissingVideo = video;
        var modal = document.getElementById('missingFileModal');
        var nameEl = document.getElementById('missingFileName');
        if (nameEl) {
            nameEl.innerText = video.filename + (video.title ? (' (' + video.title + ')') : '');
        }
        if (modal) openModal(modal);
    }

    /**
     * Stage 2 & 3: Reference Folder Verification, Load Videos & Fetch data.json (v2.4.0)
     */
    var hasInitialSyncTriggered = false;
    var isSynchronizingFilesAndData = false;

    async function checkFolderAndTriggerSync() {
        if (hasInitialSyncTriggered) return;

        var isConnected = false;

        // Mode 1: HTTP Server Mode (direct backend access confirmed)
        if (window.location.protocol !== 'file:') {
            isConnected = true;
        } else {
            // Mode 2: Local file:/// Mode (check handle & session)
            var isSessionVerified = sessionStorage.getItem('family_pics_folder_verified') === 'true';
            if (isSessionVerified) {
                isConnected = true;
            } else {
                try {
                    var handle = await getStoredDirectoryHandle();
                    if (handle) {
                        var perm = await handle.queryPermission({ mode: 'read' });
                        if (perm === 'granted') {
                            if (appState.videos.length === 0) {
                                // در حالت دیتای خام و اولیه، تایید بر اساس نام پوشه VIDEOS یا پسوند فایل‌های ویدیویی
                                var hName = (handle.name || '').trim().toLowerCase();
                                if (hName === 'videos') {
                                    isConnected = true;
                                    appState.dirHandle = handle;
                                    sessionStorage.setItem('family_pics_folder_verified', 'true');
                                } else {
                                    var vExts = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv', '.flv'];
                                    for await (var entry of handle.values()) {
                                        if (entry.kind === 'file') {
                                            var lName = entry.name.toLowerCase();
                                            if (vExts.some(function(ext) { return lName.endsWith(ext); })) {
                                                isConnected = true;
                                                appState.dirHandle = handle;
                                                sessionStorage.setItem('family_pics_folder_verified', 'true');
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                for await (var entry of handle.values()) {
                                    if (entry.kind === 'file') {
                                        if (appState.videos.some(function(v) { return v.filename === entry.name; })) {
                                            isConnected = true;
                                            appState.dirHandle = handle;
                                            sessionStorage.setItem('family_pics_folder_verified', 'true');
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    isConnected = false;
                }
            }
        }

        if (isConnected) {
            setFolderVerificationUI(true);
            hasInitialSyncTriggered = true;
            // On page load: Load videos from folder first, then fetch fresh data from data.json!
            loadVideosAndFetchDataJson();
        } else {
            // Not connected: Lock content with blur and prompt user to register VIDEOS folder
            setFolderVerificationUI(false);
        }
    }

    /**
     * Page Load Lifecycle:
     * 1. Videos are loaded/scanned from the folder.
     * 2. AFTER loading videos, data is retrieved/fetched from data.json and merged.
     * 3. Stage for detecting missing/deleted files and prompting user.
     * 4. Minimum 1-second stay timer and smooth fade-out exit.
     */
    async function loadVideosAndFetchDataJson(explicitHandle) {
        if (isSynchronizingFilesAndData) return;
        isSynchronizingFilesAndData = true;

        var syncOverlay = document.getElementById('syncProgressOverlay');
        var syncTitle = document.getElementById('syncProgressTitle');
        var syncSub = document.getElementById('syncProgressSub');
        showOverlay(syncOverlay);
        if (syncTitle) syncTitle.innerText = 'در حال همگام‌سازی و بارگذاری اولیه...';
        if (syncSub) syncSub.innerText = 'اسکن فایل‌های ویدئویی و تطبیق اطلاعات با پایگاه داده سامانه...';

        var startTime = Date.now();
        var missingList = [];

        try {
            // گام ۱: لود شدن و اسکن ویدئوها از پوشه مرجع
            if (window.location.protocol !== 'file:') {
                try {
                    var res = await fetch('/api/scan');
                    if (res.ok) {
                        var payload = await res.json();
                        if (payload.data && Array.isArray(payload.data.videos)) {
                            appState.systemName = payload.data.systemName || appState.systemName;
                            appState.videos = normalizeVideos(payload.data.videos);
                        }
                    }
                } catch (apiErr) {
                    console.warn('HTTP scan failed:', apiErr);
                }
            } else {
                var handle = explicitHandle || appState.dirHandle || (await getStoredDirectoryHandle());
                if (handle) {
                    var perm = await handle.queryPermission({ mode: 'read' });
                    if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'read' });
                    if (perm === 'granted') {
                        appState.dirHandle = handle;
                        await scanEntriesFromHandle(handle);
                    }
                }
            }

            // گام ۲: فراخوانی اطلاعات از data.json بعد از لود شدن ویدئوها (بدون ذخیره‌سازی)
            var freshData = await loadDataFromJsonSource();
            if (freshData) {
                mergeDataJsonIntoVideos(freshData);
            }

            // گام ۳: تشخیص فایل‌های ناموجود و ارجاع به تعیین تکلیف
            missingList = appState.videos.filter(function(v) { return v.fileExists === false; });
            if (missingList.length > 0) {
                if (syncTitle) syncTitle.innerText = 'تشخیص فایل‌های ناموجود...';
                if (syncSub) syncSub.innerText = missingList.length + ' فایل ثبت‌شده در پوشه یافت نشد؛ در حال آماده‌سازی جهت تعیین تکلیف...';
                await new Promise(function(r) { setTimeout(r, 400); });
            }

            render();
            fetchStorageStats();

            // حداقل یک ثانیه (1000 میلی‌ثانیه) ماندن اورلی blur
            var elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
                await new Promise(function(r) { setTimeout(r, 1000 - elapsed); });
            }

            showToast('ویدئوها بارگذاری و اطلاعات از data.json با موفقیت فراخوانی شد.', 'info');
        } catch (err) {
            console.error('loadVideosAndFetchDataJson error:', err);
        } finally {
            await hideOverlaySmoothly(syncOverlay);
            isSynchronizingFilesAndData = false;

            // در صورت وجود فایل ناموجود، مودال تعیین تکلیف نمایش داده می‌شود
            if (missingList.length > 0) {
                setTimeout(function() {
                    openMissingFileModal(missingList[0]);
                    showToast('هشدار: ' + missingList.length + ' فایل ویدیویی ثبت‌شده در پوشه یافت نشد. لطفاً وضعیت آن را مشخص فرمایید.', 'warning');
                }, 200);
            }
        }
    }

    /**
     * Master "همگام‌سازی و ذخیره" Button Handler:
     * 1. ابتدا اطلاعات جدید در data.json ذخیره می‌شوند.
     * 2. سپس ویدئوها همگام‌سازی می‌گردند.
     */
    async function handleSyncAndSaveButton() {
        var btn = document.getElementById('btnSyncVideos');
        setButtonLoading(btn, true);

        var syncOverlay = document.getElementById('syncProgressOverlay');
        var syncTitle = document.getElementById('syncProgressTitle');
        var syncSub = document.getElementById('syncProgressSub');
        showOverlay(syncOverlay);
        if (syncTitle) syncTitle.innerText = 'در حال همگام‌سازی و ذخیره...';
        if (syncSub) syncSub.innerText = 'ذخیره اطلاعات در data.json و همگام‌سازی فایل‌های پوشه مرجع در جریان است.';

        var startTime = Date.now();

        try {
            // ۱. ابتدا اطلاعات جدید در data.json ذخیره می شوند
            var payload = {
                systemName: appState.systemName,
                version: appState.version,
                masterPassword: appState.masterPassword,
                defaultEditorName: appState.defaultEditorName,
                lastUpdated: new Date().toISOString(),
                videos: appState.videos
            };
            var saveOk = await saveDataToJsonFile(payload);

            // ۲. سپس ویدئوها همگام سازی می شوند
            var newCount = 0;
            if (window.location.protocol !== 'file:') {
                var res = await fetch('/api/scan');
                if (res.ok) {
                    var p = await res.json();
                    if (p.data && Array.isArray(p.data.videos)) {
                        newCount = p.newCount || 0;
                        mergeDataJsonIntoVideos(p.data);
                    }
                }
            } else {
                var handle = appState.dirHandle || (await getStoredDirectoryHandle());
                if (handle) {
                    var perm = await handle.queryPermission({ mode: 'read' });
                    if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'read' });
                    if (perm === 'granted') {
                        appState.dirHandle = handle;
                        newCount = await scanEntriesFromHandle(handle);
                    }
                }
            }

            // If newly added video files were detected, update data.json to include them!
            if (newCount > 0) {
                payload.videos = appState.videos;
                await saveDataToJsonFile(payload);
            }

            render();
            fetchStorageStats();

            var elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
                await new Promise(function(r) { setTimeout(r, 1000 - elapsed); });
            }

            if (saveOk) {
                showToast('اطلاعات با موفقیت در data.json ذخیره شد و ویدئوها همگام‌سازی گردیدند.', 'success');
            } else {
                showToast('ویدئوها همگام‌سازی شدند (ذخیره data.json توسط کاربر متوقف شد).', 'info');
            }
        } catch (err) {
            console.error('handleSyncAndSaveButton error:', err);
            showToast('خطا در ذخیره و همگام‌سازی: ' + (err.message || err), 'error');
        } finally {
            await hideOverlaySmoothly(syncOverlay);
            setButtonLoading(btn, false);
        }
    }

    /**
     * Dedicated data.json File Saver
     * Saves data to data.json on disk via stored FileHandle, showSaveFilePicker, or HTTP /api/save.
     */
    async function saveDataToJsonFile(payload) {
        var saved = false;

        // 1. Silent persistent write using stored FileHandle in IndexedDB
        try {
            var storedHandle = await getStoredDataJsonHandle();
            if (storedHandle) {
                var perm = await storedHandle.queryPermission({ mode: 'readwrite' });
                if (perm !== 'granted') {
                    perm = await storedHandle.requestPermission({ mode: 'readwrite' });
                }
                if (perm === 'granted') {
                    var writable = await storedHandle.createWritable();
                    await writable.write(JSON.stringify(payload, null, 2));
                    await writable.close();
                    saved = true;
                }
            }
        } catch (idbErr) {
            console.warn('IDB stored handle save error:', idbErr);
        }

        // 2. If running under file:/// and not yet saved, ask user to select/confirm data.json once
        if (!saved && window.showSaveFilePicker && window.location.protocol === 'file:') {
            try {
                var newHandle = await window.showSaveFilePicker({
                    suggestedName: 'data.json',
                    types: [{
                        description: 'JSON Database File (data.json)',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                var w = await newHandle.createWritable();
                await w.write(JSON.stringify(payload, null, 2));
                await w.close();
                await saveDataJsonHandle(newHandle);
                saved = true;
            } catch (pickerErr) {
                if (pickerErr.name === 'AbortError') {
                    console.log('User dismissed file picker');
                } else {
                    console.warn('Picker error:', pickerErr);
                }
            }
        }

        // 3. HTTP Server Mode or background localhost:8080 API
        try {
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function(r) { if (r.ok) saved = true; }).catch(function(){});

            if (window.location.protocol === 'file:') {
                fetch('http://localhost:8080/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(function(r) { if (r.ok) saved = true; }).catch(function(){});
            }
        } catch (e) {}

        // 4. Update localStorage cache
        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(payload));

        // 5. Download fallback if handle not permitted
        if (!saved && window.location.protocol === 'file:') {
            downloadDataJsonFile(payload);
            saved = true;
        }

        return saved;
    }

    /**
     * Read fresh data.json on demand
     */
    async function loadDataFromJsonSource() {
        // 1. Direct disk read from stored data.json handle (no CORS, 100% accurate)
        try {
            var handle = await getStoredDataJsonHandle();
            if (handle) {
                var file = await handle.getFile();
                var text = await file.text();
                var parsed = JSON.parse(text);
                if (parsed && Array.isArray(parsed.videos)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('loadDataFromJsonSource handle read error:', e);
        }

        // 2. HTTP fetch
        if (window.location.protocol !== 'file:') {
            try {
                var res = await fetch('data.json?t=' + Date.now());
                if (res.ok) return await res.json();
            } catch (e) {}
        } else {
            try {
                var resLocal = await fetch('http://localhost:8080/data.json?t=' + Date.now());
                if (resLocal.ok) return await resLocal.json();
            } catch (e) {}
        }

        // 3. LocalStorage
        try {
            var cached = localStorage.getItem(STORAGE_DATA_KEY);
            if (cached) {
                var p = JSON.parse(cached);
                if (p && Array.isArray(p.videos)) return p;
            }
        } catch (e) {}

        // 4. Initial static bundle fallback
        if (window.__INITIAL_DATA__ && Array.isArray(window.__INITIAL_DATA__.videos)) {
            return window.__INITIAL_DATA__;
        }

        return null;
    }

    function mergeDataJsonIntoVideos(freshData) {
        if (!freshData || !Array.isArray(freshData.videos)) return;

        if (freshData.systemName) appState.systemName = freshData.systemName;
        if (freshData.masterPassword) {
            appState.masterPassword = freshData.masterPassword;
            localStorage.setItem(STORAGE_AUTH_KEY, freshData.masterPassword);
        }
        if (freshData.defaultEditorName) {
            appState.defaultEditorName = freshData.defaultEditorName;
            localStorage.setItem(STORAGE_USER_KEY, freshData.defaultEditorName);
        }

        var metaByFilename = {};
        freshData.videos.forEach(function(v) {
            if (v.filename) {
                metaByFilename[v.filename] = v;
            }
        });

        appState.videos.forEach(function(v) {
            var fromJson = metaByFilename[v.filename];
            if (fromJson) {
                if (fromJson.title) v.title = fromJson.title;
                if (fromJson.year) v.year = fromJson.year;
                if (fromJson.description) v.description = fromJson.description;
                if (Array.isArray(fromJson.tags)) v.tags = fromJson.tags;
                if (fromJson.thumbnail) v.thumbnail = fromJson.thumbnail;
                if (fromJson.lastEditedBy) v.lastEditedBy = fromJson.lastEditedBy;
                if (fromJson.lastEditedAt) v.lastEditedAt = fromJson.lastEditedAt;
                if (fromJson.duration) v.duration = fromJson.duration;
                if (fromJson.durationSeconds) v.durationSeconds = fromJson.durationSeconds;
                if (typeof fromJson.fileExists !== 'undefined') v.fileExists = fromJson.fileExists;
            }
        });

        freshData.videos.forEach(function(fv) {
            var exists = appState.videos.some(function(v) { return v.filename === fv.filename; });
            if (!exists) {
                appState.videos.push(fv);
            }
        });

        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify({
            systemName: appState.systemName,
            version: appState.version,
            masterPassword: appState.masterPassword,
            defaultEditorName: appState.defaultEditorName,
            lastUpdated: freshData.lastUpdated || new Date().toISOString(),
            videos: appState.videos
        }));
    }

    function downloadDataJsonFile(payload) {
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            a.remove();
            URL.revokeObjectURL(url);
        }, 10000);
    }

    /**
     * Tag Input Autocomplete
     */
    function setupTagInputComponent() {
        var tagInput = document.getElementById('tagInput');
        var tagDropdown = document.getElementById('tagAutocompleteDropdown');
        if (!tagInput || !tagDropdown) return;

        tagInput.addEventListener('input', function() {
            var val = tagInput.value.trim().toLowerCase();
            if (!val) {
                tagDropdown.classList.remove('open');
                return;
            }

            var allTagsMap = getAllTagsWithCount();
            var matches = [];
            for (var tag in allTagsMap) {
                if (tag.toLowerCase().indexOf(val) !== -1 && appState.currentEditingTags.indexOf(tag) === -1) {
                    matches.push({ name: tag, count: allTagsMap[tag] });
                }
            }

            if (matches.length > 0) {
                tagDropdown.innerHTML = '';
                matches.forEach(function(m) {
                    var item = document.createElement('div');
                    item.className = 'tag-suggestion-item';
                    item.innerHTML = '<span>' + escapeHtml(m.name) + '</span><span class="tag-suggestion-count">' + m.count + ' فیلم</span>';
                    item.addEventListener('click', function() {
                        addTagToCurrentEdit(m.name);
                        tagInput.value = '';
                        tagDropdown.classList.remove('open');
                        tagInput.focus();
                    });
                    tagDropdown.appendChild(item);
                });
                tagDropdown.classList.add('open');
            } else {
                tagDropdown.classList.remove('open');
            }
        });

        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                var val = tagInput.value.replace(/,/g, '').trim();
                if (val) {
                    addTagToCurrentEdit(val);
                    tagInput.value = '';
                    tagDropdown.classList.remove('open');
                }
            } else if (e.key === 'Escape') {
                tagDropdown.classList.remove('open');
            }
        });

        document.addEventListener('click', function(e) {
            if (!tagInput.contains(e.target) && !tagDropdown.contains(e.target)) {
                tagDropdown.classList.remove('open');
            }
        });
    }

    function addTagToCurrentEdit(tagText) {
        tagText = tagText.trim();
        if (!tagText) return;
        if (appState.currentEditingTags.indexOf(tagText) === -1) {
            appState.currentEditingTags.push(tagText);
            renderCurrentEditTagChips();
        }
    }

    function removeTagFromCurrentEdit(tagText) {
        appState.currentEditingTags = appState.currentEditingTags.filter(function(t) { return t !== tagText; });
        renderCurrentEditTagChips();
    }

    function renderCurrentEditTagChips() {
        var container = document.getElementById('tagsChipList');
        if (!container) return;
        container.innerHTML = '';
        appState.currentEditingTags.forEach(function(t) {
            var chip = document.createElement('div');
            chip.className = 'tag-chip';
            chip.innerHTML = '<span>' + escapeHtml(t) + '</span>' +
                             '<span class="tag-chip-remove" title="حذف">&times;</span>';
            chip.querySelector('.tag-chip-remove').addEventListener('click', function() {
                removeTagFromCurrentEdit(t);
            });
            container.appendChild(chip);
        });
    }

    function setupSettingsTabs() {
        var tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = this.getAttribute('data-tab');
                tabBtns.forEach(function(b) { b.classList.remove('active'); });
                document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });

                this.classList.add('active');
                var targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');

                if (targetId === 'tabLogs') {
                    loadSystemLogs();
                }
            });
        });

        var btnRefreshLogs = document.getElementById('btnRefreshLogs');
        if (btnRefreshLogs) {
            btnRefreshLogs.addEventListener('click', function() {
                loadSystemLogs();
                showToast('لاگ‌های سیستم به‌روزرسانی شدند.', 'info');
            });
        }

        var btnClearLogs = document.getElementById('btnClearLogs');
        if (btnClearLogs) {
            btnClearLogs.addEventListener('click', function() {
                if (window.AppLogger) window.AppLogger.clearLogs();
                if (window.location.protocol.indexOf('http') === 0) {
                    fetch('/api/logs/clear', { method: 'POST' }).catch(function() {});
                }
                var viewer = document.getElementById('systemLogsViewer');
                if (viewer) viewer.innerText = 'لاگ‌ها با موفقیت پاک‌سازی شدند.';
                showToast('فایل لاگ‌ها پاک‌سازی شد.', 'success');
            });
        }

        // Maintenance Mode Toggle (Hides/Shows system logs and enables/disables logging)
        var toggleMaintenanceMode = document.getElementById('toggleMaintenanceMode');
        var tabBtnLogs = document.getElementById('tabBtnLogs');
        var isMaintenance = localStorage.getItem('family_pics_maintenance_mode') === 'true';

        if (toggleMaintenanceMode) {
            toggleMaintenanceMode.checked = isMaintenance;
        }
        if (tabBtnLogs) {
            tabBtnLogs.style.display = isMaintenance ? 'inline-flex' : 'none';
        }

        if (toggleMaintenanceMode) {
            toggleMaintenanceMode.addEventListener('change', function() {
                var enabled = this.checked;
                localStorage.setItem('family_pics_maintenance_mode', enabled ? 'true' : 'false');
                if (tabBtnLogs) {
                    tabBtnLogs.style.display = enabled ? 'inline-flex' : 'none';
                }
                if (enabled) {
                    showToast('حالت تعمیر نرم‌افزار فعال شد؛ تب لاگ‌های سیستم نمایان گردید.', 'info');
                    if (window.AppLogger) {
                        window.AppLogger.info('App', 'حالت تعمیر نرم‌افزار توسط کاربر فعال شد.');
                    }
                } else {
                    showToast('حالت تعمیر نرم‌افزار غیرفعال شد؛ سیستم لاگ مخفی گردید.', 'info');
                    var activeTab = document.querySelector('.tab-btn.active');
                    if (activeTab && activeTab.getAttribute('data-tab') === 'tabLogs') {
                        var firstTab = document.querySelector('.tab-btn[data-tab="tabStats"]');
                        if (firstTab) firstTab.click();
                    }
                }
            });
        }

        // Factory Reset & Clear All Cache Button Handlers
        var btnFactoryReset = document.getElementById('btnFactoryReset');
        var btnConfirmFactoryReset = document.getElementById('btnConfirmFactoryReset');
        var factoryResetModal = document.getElementById('factoryResetModal');

        if (btnFactoryReset) {
            btnFactoryReset.addEventListener('click', function() {
                if (factoryResetModal) openModal(factoryResetModal);
            });
        }

        if (btnConfirmFactoryReset) {
            btnConfirmFactoryReset.addEventListener('click', function() {
                executeFactoryReset();
            });
        }
    }

    /**
     * Factory Reset: Clear all cache, localStorage, sessionStorage, IndexedDB,
     * reset data.json to factory empty state, and restart application.
     */
    async function executeFactoryReset() {
        var btnConfirm = document.getElementById('btnConfirmFactoryReset');
        setButtonLoading(btnConfirm, true);

        try {
            var cleanPayload = {
                systemName: 'خانواده من',
                version: APP_VERSION,
                masterPassword: '1234',
                defaultEditorName: 'مدیر سیستم',
                videos: []
            };

            // 1. Reset data.json via server API or stored file handle
            if (window.location.protocol.indexOf('http') === 0) {
                try {
                    await fetch('/api/reset', { method: 'POST' });
                } catch (e) {
                    await saveDataToJsonFile(cleanPayload);
                }
            } else {
                try {
                    await saveDataToJsonFile(cleanPayload);
                } catch (e) {
                    console.warn('Factory reset data.json write error:', e);
                }
            }

            // 2. Revoke all active object URLs
            if (appState.videoBlobs) {
                Object.keys(appState.videoBlobs).forEach(function(k) {
                    try { URL.revokeObjectURL(appState.videoBlobs[k]); } catch(e) {}
                });
            }

            // 3. Clear all browser storage
            localStorage.clear();
            sessionStorage.clear();

            // 4. Delete IndexedDB database
            if (window.indexedDB) {
                try {
                    indexedDB.deleteDatabase('family_pics_idb');
                } catch (idbE) {}
            }

            // 5. Clear system logs
            if (window.AppLogger) {
                window.AppLogger.clearLogs();
            }
            if (window.location.protocol.indexOf('http') === 0) {
                fetch('/api/logs/clear', { method: 'POST' }).catch(function() {});
            }

            showToast('کلیه اطلاعات و کش سامانه پاک شد. در حال شروع مجدد...', 'success');

            setTimeout(function() {
                window.location.reload();
            }, 600);
        } catch (err) {
            console.error('Factory reset error:', err);
            setButtonLoading(btnConfirm, false);
            showToast('خطا در پاک‌سازی: ' + (err.message || err), 'error');
        }
    }

    function loadSystemLogs() {
        var viewer = document.getElementById('systemLogsViewer');
        if (!viewer) return;
        viewer.innerText = 'در حال دریافت لاگ‌ها...';

        if (window.location.protocol.indexOf('http') === 0) {
            fetch('/api/logs')
                .then(function(r) { return r.json(); })
                .then(function(d) {
                    if (d.status === 'success' && Array.isArray(d.logs)) {
                        if (d.logs.length === 0) {
                            viewer.innerText = 'هیچ لاگی در سیستم ثبت نشده است (سیستم کاملاً پایدار است).';
                        } else {
                            viewer.innerText = d.logs.join('\n');
                            viewer.scrollTop = viewer.scrollHeight;
                        }
                        return;
                    }
                    throw new Error('Invalid log format');
                })
                .catch(function() {
                    displayLocalLogs(viewer);
                });
        } else {
            displayLocalLogs(viewer);
        }
    }

    function displayLocalLogs(viewer) {
        var local = window.AppLogger ? window.AppLogger.getLogs() : [];
        if (!local || local.length === 0) {
            viewer.innerText = 'هیچ خطایی در سیستم رخ نداده است.';
            return;
        }
        var formatted = local.map(function(l) {
            return '[' + l.timestamp + '] [' + l.level + '] [' + l.source + '] ' + l.message + (l.details ? (' | ' + l.details) : '');
        }).join('\n');
        viewer.innerText = formatted;
        viewer.scrollTop = viewer.scrollHeight;
    }

    function updateStatsModalUI() {
        var stats = appState.storageStats;
        var totalVideos = appState.videos.length;
        var completeVideos = appState.videos.filter(function(v) { return !isVideoIncomplete(v); }).length;
        var incompleteVideos = totalVideos - completeVideos;

        var elTotalSize = document.getElementById('statTotalSize');
        var elTotalVideos = document.getElementById('statTotalVideos');
        var elComplete = document.getElementById('statCompleteCount');
        var elIncomplete = document.getElementById('statIncompleteCount');
        var elMiscCount = document.getElementById('statMiscCount');
        var elMiscList = document.getElementById('statMiscList');
        var elTagsList = document.getElementById('statTagsList');
        var changeEditorNameInput = document.getElementById('changeEditorName');

        if (changeEditorNameInput) changeEditorNameInput.value = appState.defaultEditorName || '';

        var verEl = document.getElementById('settingsVersionText');
        if (verEl) verEl.innerText = 'v' + APP_VERSION;
        updateBackupStatsUI();

        if (elTotalSize) elTotalSize.innerText = formatBytes(stats.totalStorageBytes || stats.totalVideoSizeBytes || 0);
        if (elTotalVideos) elTotalVideos.innerText = totalVideos;
        if (elComplete) elComplete.innerText = completeVideos;
        if (elIncomplete) elIncomplete.innerText = incompleteVideos;
        if (elMiscCount) elMiscCount.innerText = stats.miscFilesCount || 0;

        if (elMiscList) {
            if (stats.miscFiles && stats.miscFiles.length > 0) {
                elMiscList.innerHTML = stats.miscFiles.map(function(f) {
                    return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #222;font-size:0.76rem;direction:ltr;">' +
                           '<span>' + escapeHtml(f.filename) + '</span>' +
                           '<span style="color:#888;">' + formatBytes(f.sizeBytes) + '</span>' +
                           '</div>';
                }).join('');
            } else {
                elMiscList.innerHTML = '<span style="color:var(--text-muted);font-size:0.78rem;">هیچ فایل متفرقه یا اضافه‌ای در پوشه VIDEOS وجود ندارد.</span>';
            }
        }

        if (elTagsList) {
            var tagMap = getAllTagsWithCount();
            var tagKeys = Object.keys(tagMap);
            if (tagKeys.length > 0) {
                elTagsList.innerHTML = tagKeys.sort().map(function(t) {
                    return '<div class="tag-stat-item" data-tag-name="' + escapeHtml(t) + '">' +
                           '<span style="display:flex;align-items:center;gap:6px;">' +
                           window.Icons.get('tag', { size: 14 }) +
                           '<strong>' + escapeHtml(t) + '</strong>' +
                           '</span>' +
                           '<span style="color:var(--text-muted);font-size:0.75rem;">' + tagMap[t] + ' ویدئو</span>' +
                           '</div>';
                }).join('');

                elTagsList.querySelectorAll('.tag-stat-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        var clickedTag = this.getAttribute('data-tag-name');
                        if (filterTag) {
                            filterTag.value = clickedTag;
                            appState.activeTag = clickedTag;
                            renderVideoList();
                        }
                        closeModal(settingsModal);
                    });
                });
            } else {
                elTagsList.innerHTML = '<span style="color:var(--text-muted);font-size:0.78rem;">هنوز تگی برای ویدئوها تعریف نشده است.</span>';
            }
        }
    }

    function setButtonLoading(btn, isLoading) {
        if (!btn) return;
        if (isLoading) btn.classList.add('btn-loading');
        else btn.classList.remove('btn-loading');
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        var input = modal.querySelector('input:not([type="hidden"]), textarea');
        if (input) setTimeout(function() { input.focus(); }, 150);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
    }

    function requestEdit(videoId) {
        var masterPin = appState.masterPassword || localStorage.getItem(STORAGE_AUTH_KEY);
        if (!masterPin) {
            appState.pendingEditId = videoId;
            openModal(setupPinModal);
            return;
        }

        appState.pendingEditId = videoId;
        var pinInput = document.getElementById('verifyPinInput');
        if (pinInput) pinInput.value = '';
        openModal(pinModal);
    }

    function openEditModal(videoId) {
        var video = appState.videos.find(function(v) { return v.id === videoId; });
        if (!video) return;

        appState.currentEditingId = videoId;
        appState.currentEditingTags = Array.isArray(video.tags) ? video.tags.slice() : [];
        appState.currentEditingThumbnail = video.thumbnail || null;

        document.getElementById('editFilename').value = video.filename || '';
        document.getElementById('editTitle').value = video.title || '';
        document.getElementById('editYear').value = video.year || '';
        document.getElementById('editDesc').value = video.description || '';
        
        var editorInput = document.getElementById('editEditorName');
        if (editorInput) {
            editorInput.value = video.lastEditedBy || appState.defaultEditorName || '';
        }

        var onlineLinkInput = document.getElementById('editOnlineLink');
        if (onlineLinkInput) {
            onlineLinkInput.value = video.onlineLink || '';
        }

        var previewBox = document.getElementById('editThumbPreviewBox');
        if (previewBox) {
            if (video.thumbnail) {
                previewBox.innerHTML = '<img src="' + video.thumbnail + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
            } else {
                previewBox.innerHTML = '<span>پیش‌فرض ویدئو</span>';
            }
        }

        renderCurrentEditTagChips();
        openModal(editModal);
    }

    /**
     * Centered QR Modal with Active Link Presentation
     */
    function openQrModal(video) {
        appState.currentQrVideo = video;
        var qrTitle = document.getElementById('qrVideoTitle');
        var directLinkEl = document.getElementById('qrDirectLink');
        var qrSourceLabel = document.getElementById('qrSourceLabel');
        var qrTypeNotice = document.getElementById('qrTypeNotice');
        var btnDownload = document.getElementById('qrDownloadBtn');

        var titleText = video.title || video.filename;
        if (qrTitle) qrTitle.innerText = titleText;

        var cleanPath = video.path || ('VIDEOS/' + video.filename);
        var directLocalUrl = new URL(cleanPath, window.location.href).href;

        var isOnline = !!(video.onlineLink && video.onlineLink.trim());
        var effectiveUrl = isOnline ? video.onlineLink.trim() : directLocalUrl;

        if (directLinkEl) directLinkEl.innerText = effectiveUrl;
        if (qrSourceLabel) {
            qrSourceLabel.innerText = 'دانلود فایل:';
        }
        if (qrTypeNotice) {
            qrTypeNotice.innerText = isOnline ?
                'این بارکد بر اساس لینک آنلاین ویدئو تولید شده و در هر دستگاهی قابل پخش است.' :
                'با اسکن این بارکد با دوربین گوشی در شبکه خانگی، ویدئو مستقیماً دریافت می‌شود.';
        }

        if (btnDownload) {
            btnDownload.href = isOnline ? effectiveUrl : cleanPath;
            btnDownload.setAttribute('download', video.filename);
        }

        generateQrCodeSvg(effectiveUrl);
        openModal(qrModal);
    }

    function generateQrCodeSvg(text) {
        var qrBox = document.getElementById('qrCodeContainer');
        if (window.QRCodeGenerator && qrBox) {
            var svgHtml = window.QRCodeGenerator.generateSVG(text, 220, 2);
            qrBox.innerHTML = svgHtml;
        }
    }

    /**
     * Direct Playback Trigger - Launches Player Page
     */
    function playVideoInPlayer(video) {
        if (!video) return;
        launchPlayerTab(video);
    }

    function launchPlayerTab(video, mode) {
        try {
            sessionStorage.setItem(STORAGE_ACTIVE_VIDEO_KEY, JSON.stringify(video));
            if (appState.videoBlobs && appState.videoBlobs[video.filename]) {
                sessionStorage.setItem('family_pics_active_blob', appState.videoBlobs[video.filename]);
                sessionStorage.setItem('family_pics_active_blob_filename', video.filename);
            }
            localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify({
                systemName: appState.systemName,
                version: appState.version,
                videos: appState.videos
            }));
        } catch (e) {}

        var isInCodeDir = window.location.pathname.replace(/\\/g, '/').toLowerCase().indexOf('/code/') !== -1;
        var playerPath = isInCodeDir ? 'player.html' : 'code/player.html';
        var playerUrl = playerPath + '?id=' + encodeURIComponent(video.id) + '&file=' + encodeURIComponent(video.filename) + (mode ? '&mode=' + encodeURIComponent(mode) : '');
        window.open(playerUrl, '_blank');
    }

    // Auto-Backup System Configuration (v2.1.0)
    var AUTO_BACKUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
    var autoBackupTimer = null;

    function initAutoBackupSystem() {
        if (autoBackupTimer) clearInterval(autoBackupTimer);

        // Schedule periodic auto-backup every 10 minutes
        autoBackupTimer = setInterval(function() {
            performAutoBackup('interval_10min');
        }, AUTO_BACKUP_INTERVAL_MS);

        updateBackupStatsUI();
    }

    function updateBackupStatsUI() {
        var el = document.getElementById('lastAutoBackupTimeText');
        if (!el) return;
        var lastTime = localStorage.getItem('family_pics_last_backup_time');
        if (!lastTime) {
            el.innerText = 'در انتظار اولین پشتیبان‌گیری...';
            return;
        }
        try {
            var dt = new Date(parseInt(lastTime, 10));
            var timeStr = dt.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            el.innerText = 'امروز ساعت ' + timeStr;
        } catch (e) {
            el.innerText = 'چند لحظه پیش';
        }
    }

    /**
     * Performs Backup (Manual or Automatic):
     * - Saves snapshot to localStorage
     * - Posts to /api/backup so server writes directly to BACKUP.JSON on disk
     * - If trigger is 'movie_completed' or user click, also initiates file download and toast
     */
    function performAutoBackup(triggerType, movieTitle) {
        if (!appState.videos || appState.videos.length === 0) return;

        var backupPayload = {
            systemName: appState.systemName,
            version: appState.version,
            exportDate: new Date().toISOString(),
            autoBackupTrigger: triggerType || 'scheduled',
            description: "فایل پشتیبان رسمی سیستم خانواده من (پشتیبان‌گیری خودکار - بدون رمز عبور)",
            videos: appState.videos.map(function(v) {
                return {
                    id: v.id,
                    filename: v.filename,
                    path: v.path,
                    title: v.title || '',
                    year: v.year || '',
                    description: v.description || '',
                    tags: v.tags || [],
                    thumbnail: v.thumbnail || '',
                    onlineLink: v.onlineLink || '',
                    lastEditedBy: v.lastEditedBy || '',
                    lastEditedAt: v.lastEditedAt || '',
                    duration: v.duration || '',
                    durationSeconds: v.durationSeconds || 0,
                    fileSizeBytes: v.fileSizeBytes || 0,
                    dateAdded: v.dateAdded || new Date().toISOString()
                };
            })
        };

        var jsonString = JSON.stringify(backupPayload, null, 2);

        // 1. Save locally in localStorage
        try {
            localStorage.setItem('family_pics_auto_backup', jsonString);
            localStorage.setItem('family_pics_last_backup_time', Date.now().toString());
        } catch (e) {}

        // 2. Post to backend server /api/backup (synchronizes disk BACKUP.JSON)
        fetch('/api/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonString
        }).catch(function() {});

        updateBackupStatsUI();

        // 3. User feedback and download trigger
        if (triggerType === 'movie_completed') {
            downloadBackupJsonFile(backupPayload);
            showToast('فیلم «' + (movieTitle || '') + '» تکمیل شد و پشتیبان‌گیری خودکار در BACKUP.JSON انجام گردید.', 'success');
        } else if (triggerType === 'manual_click') {
            downloadBackupJsonFile(backupPayload);
            showToast('پشتیبان‌گیری در فایل BACKUP.JSON با موفقیت انجام شد.', 'success');
        } else if (triggerType === 'interval_10min') {
            showToast('پشتیبان‌گیری خودکار ۱۰ دقیقه‌ای انجام شد (ذخیره در حافظه و BACKUP.JSON).', 'info');
        }
    }

    function downloadBackupJsonFile(payload) {
        try {
            var jsonString = JSON.stringify(payload, null, 2);
            var blob = new Blob([jsonString], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'BACKUP.JSON';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        } catch (e) {}
    }

    /**
     * Export BACKUP.JSON (Excluding masterPassword)
     */
    function exportBackupJSON() {
        performAutoBackup('manual_click');
    }

    function render() {
        updateAlertBanner();
        updateYearFilter();
        updateTagFilter();
        renderVideoList();
    }

    function updateAlertBanner() {
        var incompleteVideos = appState.videos.filter(isVideoIncomplete);
        if (incompleteVideos.length > 0) {
            alertBanner.classList.remove('hidden');
            if (alertCountEl) alertCountEl.innerText = incompleteVideos.length;
        } else {
            alertBanner.classList.add('hidden');
        }
    }

    function updateYearFilter() {
        if (!filterYear) return;
        var years = [];
        appState.videos.forEach(function(v) {
            if (v.year && String(v.year).trim().length > 0) {
                var y = String(v.year).trim();
                if (years.indexOf(y) === -1) years.push(y);
            }
        });

        years.sort().reverse();
        var current = filterYear.value;
        filterYear.innerHTML = '<option value="all">همه سال‌ها</option>';
        years.forEach(function(y) {
            var opt = document.createElement('option');
            opt.value = y;
            opt.innerText = 'سال ' + y;
            if (y === current) opt.selected = true;
            filterYear.appendChild(opt);
        });
    }

    function updateTagFilter() {
        if (!filterTag) return;
        var tagMap = getAllTagsWithCount();
        var current = filterTag.value;
        filterTag.innerHTML = '<option value="all">همه دسته‌ها و تگ‌ها</option>';

        Object.keys(tagMap).sort().forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = t;
            opt.innerText = t + ' (' + tagMap[t] + ')';
            if (t === current) opt.selected = true;
            filterTag.appendChild(opt);
        });
    }

    function renderVideoList() {
        if (!videoGrid) return;

        var list = appState.videos.slice();

        if (appState.searchQuery) {
            var q = appState.searchQuery;
            list = list.filter(function(v) {
                var t = (v.title || '').toLowerCase();
                var fn = (v.filename || '').toLowerCase();
                var d = (v.description || '').toLowerCase();
                var y = (v.year || '').toString().toLowerCase();
                var tagsStr = (v.tags || []).join(' ').toLowerCase();
                var ed = (v.lastEditedBy || '').toLowerCase();
                return t.indexOf(q) !== -1 || fn.indexOf(q) !== -1 || d.indexOf(q) !== -1 || y.indexOf(q) !== -1 || tagsStr.indexOf(q) !== -1 || ed.indexOf(q) !== -1;
            });
        }

        if (appState.activeFilter === 'incomplete') {
            list = list.filter(isVideoIncomplete);
        } else if (appState.activeFilter === 'complete') {
            list = list.filter(function(v) { return !isVideoIncomplete(v); });
        }

        if (appState.activeYear !== 'all') {
            list = list.filter(function(v) { return String(v.year) === appState.activeYear; });
        }

        if (appState.activeTag !== 'all') {
            list = list.filter(function(v) {
                return Array.isArray(v.tags) && v.tags.indexOf(appState.activeTag) !== -1;
            });
        }

        list.sort(function(a, b) {
            switch (appState.activeSort) {
                case 'date-desc':
                    return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
                case 'date-asc':
                    return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
                case 'name-asc':
                    return (a.title || a.filename).localeCompare(b.title || b.filename, 'fa');
                case 'name-desc':
                    return (b.title || b.filename).localeCompare(a.title || a.filename, 'fa');
                case 'duration-desc':
                    return (b.durationSeconds || 0) - (a.durationSeconds || 0);
                case 'duration-asc':
                    return (a.durationSeconds || 0) - (b.durationSeconds || 0);
                case 'year-desc':
                    return parseInt(b.year || '0', 10) - parseInt(a.year || '0', 10);
                default:
                    return 0;
            }
        });

        if (totalCountEl) totalCountEl.innerText = appState.videos.length;
        if (shownCountEl) shownCountEl.innerText = list.length;

        // Visual Active Filter Highlights
        if (filterStatus) filterStatus.classList.toggle('filter-active', appState.activeFilter !== 'all');
        if (filterYear) filterYear.classList.toggle('filter-active', appState.activeYear !== 'all');
        if (filterTag) filterTag.classList.toggle('filter-active', appState.activeTag !== 'all');
        if (sortSelect) sortSelect.classList.toggle('filter-active', appState.activeSort !== 'date-desc');

        videoGrid.innerHTML = '';

        if (list.length === 0) {
            videoGrid.innerHTML = [
                '<div class="empty-state">',
                '  <div class="empty-icon">' + window.Icons.get('folder', { size: 36 }) + '</div>',
                '  <h3>هیچ فیلمی با این مشخصات یافت نشد!</h3>',
                '  <p>می‌توانید فیلترها را ریست کنید یا با کلیک بر روی "همگام‌سازی ویدئوها" فایل‌های جدید را اسکن نمایید.</p>',
                '</div>'
            ].join('');
            return;
        }

        var fragment = document.createDocumentFragment();
        list.forEach(function(video) {
            var card = createVideoCard(video);
            fragment.appendChild(card);
        });
        videoGrid.appendChild(fragment);

        if (window.Icons) window.Icons.renderAll(videoGrid);
    }

    /**
     * Search Match Highlighter
     */
    function highlightSearch(text, query) {
        if (!text) return '';
        var str = String(text);
        if (!query || !query.trim()) return escapeHtml(str);
        var q = query.trim();
        var escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('(' + escapedQ + ')', 'gi');
        var escapedStr = escapeHtml(str);
        return escapedStr.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * Create Video Card with Robust Live Hover Preview & Search Highlighting
     */
    function createVideoCard(video) {
        var card = document.createElement('div');
        var incomplete = isVideoIncomplete(video);
        card.className = 'video-card' + (incomplete ? ' incomplete' : '');
        card.setAttribute('data-id', video.id);

        var rawTitle = video.title && video.title.trim() ? video.title : 'بدون نام (تکمیل نشده)';
        var displayYear = video.year ? video.year : 'نامشخص';
        var rawDesc = video.description && video.description.trim() ? video.description : 'هنوز توضیحاتی برای این ویدئو ثبت نشده است.';

        var highlightedTitle = highlightSearch(rawTitle, appState.searchQuery);
        var highlightedDesc = highlightSearch(rawDesc, appState.searchQuery);
        var highlightedFilename = highlightSearch(video.filename, appState.searchQuery);

        var badgeHtml = '';
        if (incomplete) {
            badgeHtml = '<div class="card-badge badge-warning" data-tooltip="مشخصات این فیلم هنوز ثبت نشده است">' +
                        window.Icons.get('alert', { size: 14 }) +
                        '<span>نیازمند تکمیل</span></div>';
        } else {
            badgeHtml = '<div class="card-badge" data-tooltip="مشخصات و توضیحات این فیلم کامل است">' +
                        window.Icons.get('check', { size: 13 }) + '<span>تکمیل شده</span></div>';
        }

        var editorMetaHtml = '';
        if (video.lastEditedBy) {
            editorMetaHtml = '<div class="card-editor-meta">' +
                window.Icons.get('edit', { size: 12 }) +
                '<span>ویرایش توسط: <strong>' + highlightSearch(video.lastEditedBy, appState.searchQuery) + '</strong></span>' +
                '</div>';
        }

        var tagsHtml = '';
        if (Array.isArray(video.tags) && video.tags.length > 0) {
            tagsHtml = '<div class="card-tags">' +
                video.tags.map(function(t) {
                    return '<span class="tag-pill" data-tag="' + escapeHtml(t) + '" data-tooltip="فیلتر بر اساس تگ ' + escapeHtml(t) + '">' +
                           window.Icons.get('tag', { size: 11 }) +
                           '<span>' + highlightSearch(t, appState.searchQuery) + '</span>' +
                           '</span>';
                }).join('') +
                '</div>';
        }

        var metaBoxHtml = '';
        if (editorMetaHtml || tagsHtml) {
            metaBoxHtml = '<div class="card-meta-box">' + editorMetaHtml + tagsHtml + '</div>';
        }

        var thumbImgHtml = video.thumbnail ? ('<img src="' + video.thumbnail + '" class="thumbnail-img" alt="Thumbnail">') : '';

        var videoSrc = resolveVideoPath(video);
        var cardHtml = [
            badgeHtml,
            '<div class="card-thumb" data-tooltip="کلیک برای پخش ویدئو">' +
            thumbImgHtml +
            '  <video src="' + videoSrc + '" preload="auto" muted playsinline loop></video>' +
            '  <div class="hover-peek-bar"><div class="hover-peek-fill"></div></div>' +
            '  <div class="play-hover-btn">' + window.Icons.get('play', { size: 26 }) + '</div>' +
            (video.duration ? ('  <div class="card-duration">' + video.duration + '</div>') : '') +
            '</div>',
            '<div class="card-body">',
            '  <div class="card-info">',
            '    <div class="card-title-row">',
            '      <div class="card-title">' + highlightedTitle + '</div>',
            '      <span class="card-year">' + displayYear + '</span>',
            '    </div>',
            '    <div class="card-filename">' + highlightedFilename + '</div>',
            '    <div class="card-desc' + (!video.description ? ' empty' : '') + '">' + highlightedDesc + '</div>',
            metaBoxHtml,
            '  </div>',
            '  <div class="card-actions">',
            '    <button class="btn btn-primary btn-card btn-play-trigger" data-tooltip="پخش ویدئو در پلیر سینمایی اختصاصی">' +
            '      <span class="btn-content" style="display:flex;align-items:center;gap:6px;">' + window.Icons.get('play', { size: 16 }) + '<span>پخش ویدئو</span></span>' +
            '    </button>',
            '    <div class="card-action-group">',
            '      <button class="btn btn-outline btn-card btn-edit" data-tooltip="ویرایش عنوان، سال، توضیحات، تگ‌ها و تامنیل">' +
            '        ' + window.Icons.get('edit', { size: 16 }) +
            '      </button>',
            '      <button class="btn btn-outline btn-card btn-qr" data-tooltip="تولید بارکد QR و دریافت لینک مستقیم دانلود">' +
            '        ' + window.Icons.get('qrcode', { size: 16 }),
            '      </button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');

        card.innerHTML = cardHtml;

        // If physical video file was deleted from VIDEOS folder -> Apply blur and missing-file overlay
        if (video.fileExists === false) {
            card.classList.add('file-missing');
            var missingOverlay = document.createElement('div');
            missingOverlay.className = 'missing-file-card-overlay';
            missingOverlay.innerHTML = [
                '<div class="missing-file-icon-box">' + window.Icons.get('alert', { size: 22 }) + '</div>',
                '<h4 class="missing-file-title">فایل در پوشه یافت نشد</h4>',
                '<p class="missing-file-sub">فایل ویدیویی این فیلم حذف شده است. برای تعیین وضعیت کلیک فرمایید.</p>',
                '<button type="button" class="btn-missing-action">تعیین تکلیف کارت</button>'
            ].join('');
            missingOverlay.addEventListener('click', function(e) {
                e.stopPropagation();
                openMissingFileModal(video);
            });
            card.appendChild(missingOverlay);
        }

        var thumbEl = card.querySelector('.card-thumb');
        var vidEl = card.querySelector('video');
        var peekFill = card.querySelector('.hover-peek-fill');
        var thumbImg = card.querySelector('.thumbnail-img');

        // Click on thumb or "پخش ویدئو" -> Launch Player cleanly
        thumbEl.addEventListener('click', function() { playVideoInPlayer(video); });
        card.querySelector('.btn-play-trigger').addEventListener('click', function(e) {
            e.stopPropagation();
            playVideoInPlayer(video);
        });

        // Smooth Live Hover Preview (Continuous video playback without frame freeze)
        var isCardHovering = false;

        if (vidEl) {
            vidEl.addEventListener('timeupdate', function() {
                if (!isCardHovering) return;
                var dur = (vidEl.duration && isFinite(vidEl.duration) && vidEl.duration > 0) ? vidEl.duration : (video.durationSeconds || 0);
                if (dur > 0 && peekFill) {
                    var pct = Math.min(100, (vidEl.currentTime / dur) * 100);
                    peekFill.style.width = pct + '%';
                }
            });

            vidEl.addEventListener('playing', function() {
                if (isCardHovering && thumbImg) {
                    thumbImg.style.opacity = '0';
                }
            });
        }

        thumbEl.addEventListener('mouseenter', function() {
            if (!vidEl) return;
            isCardHovering = true;
            vidEl.muted = true;
            vidEl.playbackRate = 1.0;

            var playPromise = vidEl.play();
            if (playPromise !== undefined) {
                playPromise.then(function() {
                    if (isCardHovering && thumbImg) {
                        thumbImg.style.opacity = '0';
                    }
                }).catch(function() {});
            }
        });

        thumbEl.addEventListener('mouseleave', function() {
            if (!vidEl) return;
            isCardHovering = false;

            try {
                vidEl.pause();
                vidEl.currentTime = 0;
            } catch (err) {}

            if (peekFill) peekFill.style.width = '0%';
            if (thumbImg) thumbImg.style.opacity = '1';
        });

        card.querySelectorAll('.tag-pill').forEach(function(pill) {
            pill.addEventListener('click', function(e) {
                e.stopPropagation();
                var clickedTag = this.getAttribute('data-tag');
                if (filterTag) {
                    filterTag.value = clickedTag;
                    appState.activeTag = clickedTag;
                    renderVideoList();
                }
            });
        });

        var btnEdit = card.querySelector('.btn-edit');
        if (btnEdit) {
            btnEdit.addEventListener('click', function(e) {
                e.stopPropagation();
                requestEdit(video.id);
            });
        }

        var btnQr = card.querySelector('.btn-qr');
        if (btnQr) {
            btnQr.addEventListener('click', function(e) {
                e.stopPropagation();
                openQrModal(video);
            });
        }

        if (vidEl && (!video.duration || video.duration === '')) {
            vidEl.addEventListener('loadedmetadata', function() {
                if (vidEl.duration && !isNaN(vidEl.duration) && isFinite(vidEl.duration)) {
                    var sec = Math.floor(vidEl.duration);
                    var formatted = formatTime(sec);
                    video.duration = formatted;
                    video.durationSeconds = sec;
                    var durBox = card.querySelector('.card-duration');
                    if (durBox) durBox.innerText = formatted;
                }
            });
        }

        return card;
    }

    function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 بایت';
        var k = 1024;
        var sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

})();
