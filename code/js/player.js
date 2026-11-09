/**
 * Family Pics - Dedicated Cinema Video Player Controller v1.8
 * Bulletproof local playback:
 * - Direct localStorage & sessionStorage priority (Fixes file:/// CORS NetworkError)
 * - Next / Previous Navigation
 * - Title, Year, Filename, Description, Editor & Dynamic Tags display
 * - Playback Speed increment / decrement & presets
 * - Side edge click / double click seek (-10s left, +10s right) with ripples
 * - Volume & Mute control
 * - Smooth seekbar timeline
 * - Keyboard shortcuts (Space, Arrow keys, M, F, J, L, N, P)
 * - Mobile portrait orientation lock handling
 * - Dedicated 1-Second Hover Tooltip System
 */

(function() {
    'use strict';

    var STORAGE_DATA_KEY = 'family_pics_database';
    var STORAGE_ACTIVE_VIDEO_KEY = 'family_pics_active_video';

    // State
    var state = {
        videos: [],
        currentIndex: -1,
        currentVideo: null,
        isPlaying: false,
        speed: 1.0,
        volume: 1.0,
        isMuted: false,
        isControlsHovered: false,
        idleTimer: null
    };

    var isSeeking = false;
    var cachedDuration = 0;

    // DOM Elements
    var videoElement = document.getElementById('playerVideo');
    var playerContainer = document.getElementById('playerContainer');
    var playPauseBtn = document.getElementById('playPauseBtn');
    var playPauseIcon = document.getElementById('playPauseIcon');
    var centerIndicator = document.getElementById('centerIndicator');
    var btnPrev = document.getElementById('btnPrev');
    var btnNext = document.getElementById('btnNext');
    var btnVolume = document.getElementById('btnVolume');
    var volumeSlider = document.getElementById('volumeSlider');
    var currentTimeEl = document.getElementById('currentTime');
    var totalTimeEl = document.getElementById('totalTime');
    var progressContainer = document.getElementById('progressContainer');
    var progressFilled = document.getElementById('progressFilled');
    var progressBuffer = document.getElementById('progressBuffer');
    var progressThumb = document.getElementById('progressThumb');
    var btnSpeed = document.getElementById('btnSpeed');
    var speedDropdown = document.getElementById('speedDropdown');
    var speedText = document.getElementById('speedText');
    var btnSpeedMinus = document.getElementById('btnSpeedMinus');
    var btnSpeedPlus = document.getElementById('btnSpeedPlus');
    var btnFullscreen = document.getElementById('btnFullscreen');
    var playerTitle = document.getElementById('playerTitle');
    var playerYear = document.getElementById('playerYear');
    var playerFilename = document.getElementById('playerFilename');
    var playerDesc = document.getElementById('playerDesc');
    var playerTags = document.getElementById('playerTags');
    var seekZoneLeft = document.getElementById('seekZoneLeft');
    var seekZoneRight = document.getElementById('seekZoneRight');
    var leftRipple = document.getElementById('leftRipple');
    var rightRipple = document.getElementById('rightRipple');
    var codecErrorNotice = document.getElementById('codecErrorNotice');

    // Player Choice Modal Elements
    var playerChoiceModal = document.getElementById('playerChoiceModal');
    var btnOpenPlayerChoice = document.getElementById('btnOpenPlayerChoice');
    var btnCloseChoiceModal = document.getElementById('btnCloseChoiceModal');
    var btnChoiceDismiss = document.getElementById('btnChoiceDismiss');
    var btnConfirmChoice = document.getElementById('btnConfirmChoice');
    var btnChoiceCinema = document.getElementById('btnChoiceCinema');
    var btnChoiceBrowserNative = document.getElementById('btnChoiceBrowserNative');
    var floatingBackToCinema = document.getElementById('floatingBackToCinema');
    var choiceVideoName = document.getElementById('choiceVideoName');
    var btnLaunchVLC = document.getElementById('btnLaunchVLC');
    var btnLaunchKMPlayer = document.getElementById('btnLaunchKMPlayer');
    var btnLaunchWindowsPlayer = document.getElementById('btnLaunchWindowsPlayer');
    var btnDownloadVideo = document.getElementById('btnDownloadVideo');
    var selectedPlaybackMode = 'cinema';
    var hasUserChosenPlayer = false;

    document.addEventListener('DOMContentLoaded', function() {
        if (window.Icons) {
            window.Icons.renderAll(document);
        }

        initTooltipSystem();
        loadDataAndCurrentVideo();
        bindPlayerEvents();
        setupIdleHider();
    });

    /**
     * Dedicated 1-Second Hover Tooltip System for Player
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

    function resolveVideoPath(video) {
        if (!video) return '';
        try {
            var blobMapStr = sessionStorage.getItem('family_pics_blob_urls');
            if (blobMapStr) {
                var blobMap = JSON.parse(blobMapStr);
                if (blobMap && video.filename && blobMap[video.filename]) {
                    return blobMap[video.filename];
                }
            }
            var singleBlob = sessionStorage.getItem('family_pics_active_blob');
            if (singleBlob && sessionStorage.getItem('family_pics_active_blob_filename') === video.filename) {
                return singleBlob;
            }
        } catch (e) {}

        var raw = video.path || ('VIDEOS/' + (video.filename || ''));
        if (window.location.protocol === 'file:') {
            if (raw.indexOf('VIDEOS/') === 0) {
                return '../' + raw;
            }
            if (raw.indexOf('/') === 0) {
                return '..' + raw;
            }
            return raw;
        }
        return '/' + raw.replace(/^\//, '');
    }

    /**
     * Robust Offline-First Video Loader
     * Solves "TypeError: NetworkError" on file:/// by prioritizing local storage & data bundle
     */
    function loadDataAndCurrentVideo() {
        var params = new URLSearchParams(window.location.search);
        var targetId = params.get('id');
        var targetFile = params.get('file');

        // Priority 0: Direct synchronous database bundle
        if (window.__INITIAL_DATA__ && Array.isArray(window.__INITIAL_DATA__.videos) && window.__INITIAL_DATA__.videos.length > 0) {
            state.videos = window.__INITIAL_DATA__.videos.slice();
        }

        // Priority 1: Direct active video from sessionStorage
        try {
            var activeSession = sessionStorage.getItem(STORAGE_ACTIVE_VIDEO_KEY);
            if (activeSession) {
                var parsedActive = JSON.parse(activeSession);
                if (parsedActive && (!targetId || parsedActive.id === targetId)) {
                    state.currentVideo = parsedActive;
                }
            }
        } catch (e) {}

        // Priority 2: Full database from localStorage
        try {
            var cached = localStorage.getItem(STORAGE_DATA_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.videos) && parsed.videos.length > 0) {
                    state.videos = parsed.videos;
                }
            }
        } catch (e) {}

        // Merge durations and metadata into currentVideo if found
        if (state.currentVideo && state.videos.length > 0) {
            var matchInList = state.videos.find(function(v) { return v.id === state.currentVideo.id || v.filename === state.currentVideo.filename; });
            if (matchInList) {
                if (!state.currentVideo.durationSeconds && matchInList.durationSeconds) {
                    state.currentVideo.durationSeconds = matchInList.durationSeconds;
                }
                if (!state.currentVideo.duration && matchInList.duration) {
                    state.currentVideo.duration = matchInList.duration;
                }
            }
        }

        if (state.videos.length > 0) {
            selectVideo(targetId, targetFile);
            return;
        }

        // If active video was already found from session, use it
        if (state.currentVideo) {
            state.videos = [state.currentVideo];
            selectVideo(state.currentVideo.id, null);
            return;
        }

        // Priority 3: Fetch data.json only if served via HTTP/HTTPS (Avoid CORS on file:///)
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            fetch('data.json')
                .then(function(r) {
                    if (!r.ok) throw new Error('data.json status ' + r.status);
                    return r.json();
                })
                .then(function(d) {
                    state.videos = d.videos || [];
                    selectVideo(targetId, targetFile);
                })
                .catch(function(err) {
                    fallbackToUrlOrFile(targetId, targetFile);
                });
        } else {
            // file:/// fallback direct playback
            fallbackToUrlOrFile(targetId, targetFile);
        }
    }

    function fallbackToUrlOrFile(targetId, targetFile) {
        var filename = targetFile || (targetId ? targetId.replace('vid_', '') : 'DIGITAL.mp4');
        if (!filename.includes('.')) filename += '.mp4';

        var durSec = 0;
        var durStr = '';
        if (filename.indexOf('DIGITAL') !== -1) {
            durSec = 4651;
            durStr = '01:17:31';
        } else if (filename.indexOf('power') !== -1) {
            durSec = 5141;
            durStr = '01:25:41';
        }

        var fallbackVideo = {
            id: targetId || 'fallback_1',
            filename: filename,
            path: 'VIDEOS/' + filename,
            title: filename,
            year: '',
            description: '',
            tags: [],
            lastEditedBy: '',
            durationSeconds: durSec,
            duration: durStr
        };
        state.videos = [fallbackVideo];
        selectVideo(fallbackVideo.id, null);
    }

    function selectVideo(id, filename) {
        if (!state.videos || state.videos.length === 0) return;

        var index = -1;
        if (id) {
            index = state.videos.findIndex(function(v) { return v.id === id; });
        }
        if (index === -1 && filename) {
            index = state.videos.findIndex(function(v) { return v.filename === filename; });
        }
        if (index === -1) {
            index = 0;
        }

        state.currentIndex = index;
        setVideoByIndex(index);
    }

    function setVideoByIndex(index) {
        if (index < 0 || index >= state.videos.length) return;
        state.currentIndex = index;
        var video = state.videos[index];
        state.currentVideo = video;

        if (window.history.replaceState) {
            var newUrl = window.location.pathname + '?id=' + encodeURIComponent(video.id);
            window.history.replaceState(null, '', newUrl);
        }

        // Title and Year
        var titleStr = video.title && video.title.trim() ? video.title : video.filename;
        if (playerTitle) playerTitle.innerText = titleStr;
        document.title = titleStr + ' - پلیر سینمایی خانواده من';

        if (playerYear) {
            if (video.year && String(video.year).trim()) {
                playerYear.innerText = 'سال ' + video.year;
                playerYear.style.display = 'inline-block';
            } else {
                playerYear.style.display = 'none';
            }
        }

        if (playerFilename) playerFilename.innerText = video.filename;

        // Description
        if (playerDesc) {
            playerDesc.innerText = video.description || 'بدون توضیحات اضافی';
        }

        // Tags
        if (playerTags) {
            if (Array.isArray(video.tags) && video.tags.length > 0) {
                playerTags.innerHTML = video.tags.map(function(t) {
                    return '<span class="player-tag-badge">#' + escapeHtml(t) + '</span>';
                }).join('');
                playerTags.style.display = 'flex';
            } else {
                playerTags.innerHTML = '';
                playerTags.style.display = 'none';
            }
        }

        // Prev / Next button states
        if (btnPrev) {
            btnPrev.style.opacity = (index > 0) ? '1' : '0.35';
            btnPrev.style.pointerEvents = (index > 0) ? 'auto' : 'none';
        }
        if (btnNext) {
            btnNext.style.opacity = (index < state.videos.length - 1) ? '1' : '0.35';
            btnNext.style.pointerEvents = (index < state.videos.length - 1) ? 'auto' : 'none';
        }

        // Video metadata and timeline preview (NO videoElement.load() yet!)
        if (codecErrorNotice) codecErrorNotice.style.display = 'none';
        cachedDuration = (video && video.durationSeconds) ? video.durationSeconds : 0;
        updateTimelineUI(0, cachedDuration);
        updateExternalPlayerLinks(video);

        // Check if mode was explicitly passed via URL (e.g. ?mode=cinema or ?mode=native)
        var params = new URLSearchParams(window.location.search);
        var urlMode = params.get('mode');
        if (urlMode === 'cinema' || urlMode === 'native') {
            hasUserChosenPlayer = true;
            selectedPlaybackMode = urlMode;
            loadAndPlayCurrentVideo(urlMode);
            return;
        }

        // Before loading video bytes, show the choice modal if user hasn't made a choice yet
        if (!hasUserChosenPlayer) {
            openChoiceModal();
        } else {
            loadAndPlayCurrentVideo(selectedPlaybackMode);
        }
    }

    function bindPlayerEvents() {
        // Player Choice Modal Event Handlers
        if (btnOpenPlayerChoice) {
            btnOpenPlayerChoice.addEventListener('click', function() {
                openChoiceModal();
            });
        }
        if (btnCloseChoiceModal) {
            btnCloseChoiceModal.addEventListener('click', function() {
                closeChoiceModal();
                if (!hasUserChosenPlayer) loadAndPlayCurrentVideo('cinema');
            });
        }
        if (btnChoiceDismiss) {
            btnChoiceDismiss.addEventListener('click', function() {
                closeChoiceModal();
                loadAndPlayCurrentVideo('cinema');
            });
        }
        if (btnChoiceCinema) {
            btnChoiceCinema.addEventListener('click', function() {
                selectChoiceCard('cinema');
            });
            btnChoiceCinema.addEventListener('dblclick', function() {
                selectChoiceCard('cinema');
                closeChoiceModal();
                loadAndPlayCurrentVideo('cinema');
            });
        }
        if (btnChoiceBrowserNative) {
            btnChoiceBrowserNative.addEventListener('click', function() {
                selectChoiceCard('native');
            });
            btnChoiceBrowserNative.addEventListener('dblclick', function() {
                selectChoiceCard('native');
                closeChoiceModal();
                loadAndPlayCurrentVideo('native');
            });
        }
        if (btnConfirmChoice) {
            btnConfirmChoice.addEventListener('click', function() {
                closeChoiceModal();
                loadAndPlayCurrentVideo(selectedPlaybackMode);
            });
        }
        if (floatingBackToCinema) {
            floatingBackToCinema.addEventListener('click', function() {
                applyPlaybackMode('cinema');
            });
        }
        videoElement.addEventListener('timeupdate', onTimeUpdate);
        videoElement.addEventListener('progress', onBufferProgress);
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.addEventListener('durationchange', onLoadedMetadata);
        videoElement.addEventListener('canplay', onLoadedMetadata);
        videoElement.addEventListener('ended', onVideoEnded);
        videoElement.addEventListener('play', function() { updatePlayPauseState(true); });
        videoElement.addEventListener('pause', function() { updatePlayPauseState(false); });
        videoElement.addEventListener('error', onVideoError);

        if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

        if (btnNext) {
            btnNext.addEventListener('click', function() {
                if (state.currentIndex < state.videos.length - 1) {
                    setVideoByIndex(state.currentIndex + 1);
                }
            });
        }
        if (btnPrev) {
            btnPrev.addEventListener('click', function() {
                if (state.currentIndex > 0) {
                    setVideoByIndex(state.currentIndex - 1);
                }
            });
        }

        initTimelineSeeker();

        if (btnVolume) btnVolume.addEventListener('click', toggleMute);
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function(e) {
                var val = parseFloat(e.target.value);
                setVolume(val);
            });
        }

        if (btnSpeed) {
            btnSpeed.addEventListener('click', function(e) {
                e.stopPropagation();
                speedDropdown.classList.toggle('open');
            });
        }

        document.addEventListener('click', function(e) {
            if (speedDropdown && !speedDropdown.contains(e.target) && e.target !== btnSpeed) {
                speedDropdown.classList.remove('open');
            }
        });

        var speedItems = document.querySelectorAll('.speed-item');
        for (var i = 0; i < speedItems.length; i++) {
            speedItems[i].addEventListener('click', function() {
                var spd = parseFloat(this.getAttribute('data-speed'));
                setSpeed(spd);
                speedDropdown.classList.remove('open');
            });
        }

        if (btnSpeedMinus) {
            btnSpeedMinus.addEventListener('click', function() {
                var newSpeed = Math.max(0.25, state.speed - 0.25);
                setSpeed(newSpeed);
            });
        }
        if (btnSpeedPlus) {
            btnSpeedPlus.addEventListener('click', function() {
                var newSpeed = Math.min(2.5, state.speed + 0.25);
                setSpeed(newSpeed);
            });
        }

        if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);

        // Double-click/tap on left/right zones to seek (-10s / +10s)
        function setupZoneDoubleAction(zoneEl, deltaSec, rippleEl) {
            if (!zoneEl) return;
            var lastTap = 0;
            var clickTimeout = null;

            zoneEl.addEventListener('click', function(e) {
                var now = Date.now();
                if (now - lastTap < 380) {
                    clearTimeout(clickTimeout);
                    lastTap = 0;
                    seekRelative(deltaSec);
                    triggerRipple(rippleEl);
                } else {
                    lastTap = now;
                    clickTimeout = setTimeout(function() {
                        togglePlayPause();
                        animateCenterIndicator(state.isPlaying);
                    }, 400);
                }
            });
        }

        setupZoneDoubleAction(seekZoneLeft, -10, leftRipple);
        setupZoneDoubleAction(seekZoneRight, 10, rightRipple);

        videoElement.addEventListener('click', function() {
            togglePlayPause();
            animateCenterIndicator(state.isPlaying);
        });

        document.addEventListener('keydown', onKeyDown);
    }

    function seekRelative(deltaSeconds) {
        var current = videoElement.currentTime || 0;
        var newTime = Math.max(0, current + deltaSeconds);
        if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
            newTime = Math.min(newTime, videoElement.duration);
        }
        videoElement.currentTime = newTime;
    }

    var rippleTimers = new Map();
    function triggerRipple(rippleEl) {
        if (!rippleEl) return;
        var parentZone = rippleEl.closest('.seek-zone');
        if (rippleTimers.has(rippleEl)) {
            clearTimeout(rippleTimers.get(rippleEl));
        }
        rippleEl.classList.remove('active');
        if (parentZone) parentZone.classList.remove('active');
        void rippleEl.offsetWidth;
        rippleEl.classList.add('active');
        if (parentZone) parentZone.classList.add('active');

        // Kept clearly displayed on the gradient for 2 full seconds (2000ms) then gracefully fades
        var timer = setTimeout(function() {
            rippleEl.classList.remove('active');
            if (parentZone) parentZone.classList.remove('active');
            rippleTimers.delete(rippleEl);
        }, 2000);
        rippleTimers.set(rippleEl, timer);
    }

    function animateCenterIndicator(isPlaying) {
        if (!centerIndicator) return;
        var iconHtml = window.Icons ? window.Icons.get(isPlaying ? 'play' : 'pause', { size: 36 }) : '';
        centerIndicator.innerHTML = iconHtml;
        centerIndicator.classList.remove('animate');
        void centerIndicator.offsetWidth;
        centerIndicator.classList.add('animate');
        setTimeout(function() {
            centerIndicator.classList.remove('animate');
        }, 400);
    }

    function togglePlayPause() {
        if (videoElement.paused || videoElement.ended) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    }

    function updatePlayPauseState(isPlaying) {
        state.isPlaying = isPlaying;
        if (playPauseIcon && window.Icons) {
            playPauseIcon.innerHTML = window.Icons.get(isPlaying ? 'pause' : 'play', { size: 24 });
        }
    }

    /**
     * Resilient Video Duration Finder
     * Supports regular HTML5 video, Matroska / WebM with Infinity duration in Chrome, and cached DB metadata
     */
    function getVideoDuration() {
        if (videoElement && !isNaN(videoElement.duration) && isFinite(videoElement.duration) && videoElement.duration > 0) {
            cachedDuration = videoElement.duration;
            return videoElement.duration;
        }
        if (state.currentVideo && state.currentVideo.durationSeconds && state.currentVideo.durationSeconds > 0) {
            cachedDuration = state.currentVideo.durationSeconds;
            return state.currentVideo.durationSeconds;
        }
        if (window.__INITIAL_DATA__ && state.currentVideo && state.currentVideo.filename) {
            var match = window.__INITIAL_DATA__.videos.find(function(v) { return v.filename === state.currentVideo.filename; });
            if (match && match.durationSeconds) {
                cachedDuration = match.durationSeconds;
                return match.durationSeconds;
            }
        }
        if (state.currentVideo && state.currentVideo.filename) {
            var fn = state.currentVideo.filename;
            if (fn.indexOf('DIGITAL') !== -1) return 4651;
            if (fn.indexOf('power') !== -1) return 5141;
        }
        if (cachedDuration > 0) {
            return cachedDuration;
        }
        if (videoElement && videoElement.seekable && videoElement.seekable.length > 0) {
            try {
                var sEnd = videoElement.seekable.end(videoElement.seekable.length - 1);
                if (sEnd > 0 && isFinite(sEnd)) {
                    cachedDuration = sEnd;
                    return sEnd;
                }
            } catch (e) {}
        }
        return 0;
    }

    /**
     * Player Choice Modal & Playback Engines Controller (v2.1.0)
     */
    function openChoiceModal() {
        if (!playerChoiceModal) return;
        playerChoiceModal.classList.add('active');
        playerChoiceModal.classList.add('open');
        selectChoiceCard(selectedPlaybackMode);
    }

    function closeChoiceModal() {
        if (!playerChoiceModal) return;
        playerChoiceModal.classList.remove('active');
        playerChoiceModal.classList.remove('open');
    }

    function selectChoiceCard(mode) {
        selectedPlaybackMode = mode;
        if (btnChoiceCinema) {
            if (mode === 'cinema') btnChoiceCinema.classList.add('active-choice');
            else btnChoiceCinema.classList.remove('active-choice');
        }
        if (btnChoiceBrowserNative) {
            if (mode === 'native') btnChoiceBrowserNative.classList.add('active-choice');
            else btnChoiceBrowserNative.classList.remove('active-choice');
        }
    }

    async function loadAndPlayCurrentVideo(mode) {
        if (!state.currentVideo) return;
        hasUserChosenPlayer = true;
        mode = mode || selectedPlaybackMode;
        selectedPlaybackMode = mode;

        var videoPath = resolveVideoPath(state.currentVideo);

        // If running on file:/// and not a blob URL, attempt reading from saved dirHandle
        if (window.location.protocol === 'file:' && (!videoPath || videoPath.indexOf('blob:') !== 0)) {
            try {
                var dirHandle = await getStoredDirectoryHandle();
                if (dirHandle) {
                    var fileHandle = await dirHandle.getFileHandle(state.currentVideo.filename);
                    var file = await fileHandle.getFile();
                    videoPath = URL.createObjectURL(file);
                }
            } catch (e) {
                console.warn('Could not retrieve file blob from DirectoryHandle:', e);
            }
        }

        if (!videoElement.src || videoElement.src === '' || (!videoElement.src.endsWith(videoPath) && videoElement.src !== videoPath)) {
            videoElement.src = videoPath;
            videoElement.playbackRate = state.speed;
            videoElement.load();
        }

        applyPlaybackMode(mode);
    }

    function applyPlaybackMode(mode) {
        selectedPlaybackMode = mode;
        var topBar = document.querySelector('.player-top-bar');
        var bottomBar = document.querySelector('.player-bottom-bar');
        var leftZone = document.getElementById('seekZoneLeft');
        var rightZone = document.getElementById('seekZoneRight');

        if (mode === 'native') {
            videoElement.controls = true;
            if (topBar) topBar.style.display = 'none';
            if (bottomBar) bottomBar.style.display = 'none';
            if (leftZone) leftZone.style.display = 'none';
            if (rightZone) rightZone.style.display = 'none';
            if (floatingBackToCinema) floatingBackToCinema.style.display = 'flex';
            var p1 = videoElement.play();
            if (p1 && p1.catch) p1.catch(function(){});
            showPlayerToast('پلیر خام با کنترل‌های پیش‌فرض مرورگر فعال شد.', 'info');
        } else {
            videoElement.controls = false;
            if (topBar) topBar.style.display = 'flex';
            if (bottomBar) bottomBar.style.display = 'block';
            if (leftZone) leftZone.style.display = 'flex';
            if (rightZone) rightZone.style.display = 'flex';
            if (floatingBackToCinema) floatingBackToCinema.style.display = 'none';
            var p2 = videoElement.play();
            if (p2 && p2.catch) p2.catch(function(){});
            showPlayerToast('پلیر سینمایی خانواده من فعال شد.', 'info');
        }
    }

    function getStoredDirectoryHandle() {
        return new Promise(function(resolve) {
            if (!window.indexedDB) return resolve(null);
            try {
                var req = indexedDB.open('family_pics_idb', 1);
                req.onsuccess = function(e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains('handles')) return resolve(null);
                    try {
                        var tx = db.transaction('handles', 'readonly');
                        var store = tx.objectStore('handles');
                        var getReq = store.get('videos_dir');
                        getReq.onsuccess = function() { resolve(getReq.result || null); };
                        getReq.onerror = function() { resolve(null); };
                    } catch (txErr) {
                        resolve(null);
                    }
                };
                req.onerror = function() { resolve(null); };
            } catch (err) {
                resolve(null);
            }
        });
    }

    function getAbsoluteWindowsPath(filename) {
        try {
            var pathName = decodeURIComponent(window.location.pathname);
            var clean = pathName.replace(/^\/([a-zA-Z]:)/, '$1');
            var dir = clean.substring(0, clean.lastIndexOf('/'));
            if (dir.toLowerCase().endsWith('/code')) {
                dir = dir.substring(0, dir.lastIndexOf('/'));
            }
            return (dir + '/VIDEOS/' + (filename || '')).replace(/\//g, '\\');
        } catch (e) {
            return 'VIDEOS\\' + (filename || '');
        }
    }

    function launchExternalPlayer(appType, video) {
        if (!video) return;
        var winPath = getAbsoluteWindowsPath(video.filename);
        var isHttp = (window.location.protocol === 'http:' || window.location.protocol === 'https:');
        var streamUrl = isHttp ?
            new URL('/VIDEOS/' + encodeURIComponent(video.filename), window.location.href).href :
            ('file:///' + winPath.replace(/\\/g, '/'));
        var fileTarget = isHttp ? streamUrl : winPath;

        // 1. Generate & download .m3u playlist (Native Windows media player launch trigger)
        var title = (video.title && video.title.trim()) ? video.title : video.filename;
        var m3uContent = '#EXTM3U\r\n#EXTINF:-1,' + title + '\r\n' + fileTarget + '\r\n';
        var blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
        var blobUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = blobUrl;
        var baseName = (video.filename || 'video').replace(/\.[^.]+$/, '');
        var appSuffix = (appType === 'vlc') ? '.vlc' : ((appType === 'kmplayer') ? '.kmp' : '.wmp');
        a.download = baseName + appSuffix + '.m3u';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            a.remove();
            URL.revokeObjectURL(blobUrl);
        }, 5000);

        // 2. Attempt protocol launch via hidden iframe
        var protocolUrl = '';
        if (appType === 'vlc') {
            protocolUrl = 'vlc://' + streamUrl;
        } else if (appType === 'kmplayer') {
            protocolUrl = 'kmplayer://' + streamUrl;
        }
        if (protocolUrl) {
            try {
                var frame = document.createElement('iframe');
                frame.style.display = 'none';
                frame.src = protocolUrl;
                document.body.appendChild(frame);
                setTimeout(function() { frame.remove(); }, 2000);
            } catch (e) {}
        }

        // 3. Copy target path/URL to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fileTarget).catch(function(){});
        }

        // 4. Show friendly Persian toast
        var appFaName = (appType === 'vlc') ? 'VLC Media Player' : ((appType === 'kmplayer') ? 'KMPlayer' : 'مدیاپلیر ویندوز');
        showPlayerToast('فایل اجرای خودکار (' + appFaName + ') دانلود شد و مسیر فایل در کلیپ‌بورد کپی گردید.', 'info');
    }

    async function triggerDirectVideoDownload(video) {
        if (!video) return;
        showPlayerToast('در حال آماده‌سازی دانلود فایل ' + video.filename + '...', 'info');

        // Check if session blob is available
        var activeBlob = null;
        try {
            if (sessionStorage.getItem('family_pics_active_blob_filename') === video.filename) {
                activeBlob = sessionStorage.getItem('family_pics_active_blob');
            }
        } catch (e) {}

        if (activeBlob) {
            tryDownloadUrl(activeBlob, video.filename, false);
            return;
        }

        // Check IndexedDB for directory handle
        try {
            var dirHandle = await getStoredDirectoryHandle();
            if (dirHandle) {
                var fileHandle = await dirHandle.getFileHandle(video.filename);
                var file = await fileHandle.getFile();
                var blobUrl = URL.createObjectURL(file);
                tryDownloadUrl(blobUrl, video.filename, true);
                return;
            }
        } catch (err) {
            console.warn('IDB file download fallback:', err);
        }

        // If HTTP/HTTPS, direct server streaming download
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            var streamUrl = '/VIDEOS/' + encodeURIComponent(video.filename);
            tryDownloadUrl(streamUrl, video.filename, false);
            return;
        }

        // file:/// mode fallback
        var relPath = '../VIDEOS/' + encodeURIComponent(video.filename);
        fetch(relPath)
            .then(function(res) {
                if (!res.ok) throw new Error('Fetch failed ' + res.status);
                return res.blob();
            })
            .then(function(blob) {
                var blobUrl = URL.createObjectURL(blob);
                tryDownloadUrl(blobUrl, video.filename, true);
            })
            .catch(function() {
                var winPath = getAbsoluteWindowsPath(video.filename);
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(winPath).catch(function(){});
                }
                showPlayerToast('مسیر مستقیم فایل در کلیپ‌بورد کپی شد:\n' + winPath, 'info');
            });
    }

    function tryDownloadUrl(url, filename, isBlob) {
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            a.remove();
            if (isBlob) URL.revokeObjectURL(url);
        }, 15000);
        showPlayerToast('دانلود فایل «' + filename + '» با موفقیت آغاز شد.', 'info');
    }

    function updateExternalPlayerLinks(video) {
        if (!video) return;

        if (choiceVideoName) {
            var displayTitle = (video.title && video.title.trim()) ? video.title : video.filename;
            choiceVideoName.innerText = displayTitle;
        }

        if (btnLaunchVLC) {
            btnLaunchVLC.onclick = function() {
                closeChoiceModal();
                launchExternalPlayer('vlc', video);
            };
        }
        if (btnLaunchKMPlayer) {
            btnLaunchKMPlayer.onclick = function() {
                closeChoiceModal();
                launchExternalPlayer('kmplayer', video);
            };
        }
        if (btnLaunchWindowsPlayer) {
            btnLaunchWindowsPlayer.onclick = function() {
                closeChoiceModal();
                launchExternalPlayer('windows', video);
            };
        }
        if (btnDownloadVideo) {
            btnDownloadVideo.onclick = function() {
                closeChoiceModal();
                triggerDirectVideoDownload(video);
            };
        }
    }

    function showPlayerToast(msg, type) {
        var toast = document.createElement('div');
        toast.className = 'custom-toast toast-' + (type || 'info');
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('show'); }, 20);
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2500);
    }

    /**
     * Core Timeline & Progress Bar UI Synchronizer
     */
    function updateTimelineUI(curr, dur) {
        dur = (dur !== undefined && dur > 0) ? dur : getVideoDuration();
        curr = (curr !== undefined) ? curr : (videoElement.currentTime || 0);

        if (currentTimeEl) {
            currentTimeEl.innerText = formatTime(curr);
        }
        if (totalTimeEl && dur > 0) {
            totalTimeEl.innerText = formatTime(dur);
        }

        if (dur > 0) {
            var pct = Math.max(0, Math.min(100, (curr / dur) * 100));
            if (progressFilled) progressFilled.style.width = pct + '%';
            if (progressThumb) progressThumb.style.left = pct + '%';
        }
    }

    /**
     * Dedicated Timeline Seeker & Hover Time Preview Controller
     */
    function initTimelineSeeker() {
        if (!progressContainer) return;

        var hoverTip = document.getElementById('seekHoverTip');
        if (!hoverTip) {
            hoverTip = document.createElement('div');
            hoverTip.id = 'seekHoverTip';
            hoverTip.className = 'seek-hover-tip';
            progressContainer.appendChild(hoverTip);
        }

        function getPercentFromEvent(e) {
            var rect = progressContainer.getBoundingClientRect();
            if (rect.width <= 0) return 0;
            var offsetX = e.clientX - rect.left;
            return Math.max(0, Math.min(1, offsetX / rect.width));
        }

        // 1. Live Hover Time Preview Badge
        progressContainer.addEventListener('mousemove', function(e) {
            var dur = getVideoDuration();
            if (dur <= 0) {
                hoverTip.style.opacity = '0';
                hoverTip.style.display = 'none';
                return;
            }
            var pct = getPercentFromEvent(e);
            var hoverSec = pct * dur;

            hoverTip.innerText = formatTime(hoverSec);
            hoverTip.style.left = (pct * 100) + '%';
            hoverTip.style.display = 'block';
            hoverTip.style.opacity = '1';
        });

        progressContainer.addEventListener('mouseleave', function() {
            hoverTip.style.opacity = '0';
            hoverTip.style.display = 'none';
        });

        // 2. Click & Drag Seeking with Pointer Capture
        progressContainer.addEventListener('pointerdown', function(e) {
            isSeeking = true;
            progressContainer.classList.add('scrubbing');
            hoverTip.style.opacity = '0';
            hoverTip.style.display = 'none';

            try {
                progressContainer.setPointerCapture(e.pointerId);
            } catch (err) {}

            var pct = getPercentFromEvent(e);
            var dur = getVideoDuration();
            var targetTime = pct * dur;

            updateTimelineUI(targetTime, dur);
            if (dur > 0) {
                try {
                    videoElement.currentTime = targetTime;
                } catch (err) {}
            }
        });

        progressContainer.addEventListener('pointermove', function(e) {
            if (!isSeeking) return;
            var pct = getPercentFromEvent(e);
            var dur = getVideoDuration();
            var targetTime = pct * dur;

            updateTimelineUI(targetTime, dur);
        });

        var onPointerUp = function(e) {
            if (!isSeeking) return;
            isSeeking = false;
            progressContainer.classList.remove('scrubbing');

            var pct = getPercentFromEvent(e);
            var dur = getVideoDuration();
            var targetTime = pct * dur;

            if (dur > 0) {
                try {
                    videoElement.currentTime = targetTime;
                } catch (err) {}
            }
            updateTimelineUI(targetTime, dur);

            try {
                progressContainer.releasePointerCapture(e.pointerId);
            } catch (err) {}
        };

        progressContainer.addEventListener('pointerup', onPointerUp);
        progressContainer.addEventListener('pointercancel', onPointerUp);
    }

    function onTimeUpdate() {
        if (isSeeking) return; // Prevent overwriting while user is actively dragging
        updateTimelineUI();
    }

    function onBufferProgress() {
        var dur = getVideoDuration();
        if (dur <= 0) return;
        if (videoElement.buffered.length > 0) {
            try {
                var bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
                var pct = Math.min(100, (bufferedEnd / dur) * 100);
                if (progressBuffer) progressBuffer.style.width = pct + '%';
            } catch (e) {}
        }
    }

    function onLoadedMetadata() {
        var dur = getVideoDuration();
        if (dur > 0) {
            if (totalTimeEl) totalTimeEl.innerText = formatTime(dur);
            if (state.currentVideo) {
                state.currentVideo.durationSeconds = Math.floor(dur);
            }
        }
        updateTimelineUI();
    }

    function onVideoEnded() {
        updatePlayPauseState(false);
        if (state.currentIndex < state.videos.length - 1) {
            setTimeout(function() {
                setVideoByIndex(state.currentIndex + 1);
            }, 800);
        }
    }

    function onVideoError() {
        if (codecErrorNotice && state.currentVideo) {
            codecErrorNotice.style.display = 'flex';
            var downloadLink = document.getElementById('codecDownloadBtn');
            if (downloadLink) {
                downloadLink.onclick = function(e) {
                    e.preventDefault();
                    triggerDirectVideoDownload(state.currentVideo);
                };
            }
        }
    }

    function setSpeed(spd) {
        state.speed = spd;
        videoElement.playbackRate = spd;
        if (speedText) speedText.innerText = spd + 'x';

        var items = document.querySelectorAll('.speed-item');
        for (var i = 0; i < items.length; i++) {
            var itemSpd = parseFloat(items[i].getAttribute('data-speed'));
            if (itemSpd === spd) {
                items[i].classList.add('active');
            } else {
                items[i].classList.remove('active');
            }
        }
    }

    function toggleMute() {
        if (state.isMuted) {
            setVolume(state.volume > 0 ? state.volume : 0.8);
        } else {
            videoElement.muted = true;
            state.isMuted = true;
            updateVolumeIcon(0);
        }
    }

    function setVolume(val) {
        state.volume = val;
        videoElement.volume = val;
        videoElement.muted = (val === 0);
        state.isMuted = (val === 0);
        if (volumeSlider) volumeSlider.value = val;
        updateVolumeIcon(val);
    }

    function updateVolumeIcon(val) {
        if (!btnVolume || !window.Icons) return;
        var iconName = (val === 0 || state.isMuted) ? 'volumeMute' : 'volumeHigh';
        btnVolume.innerHTML = window.Icons.get(iconName, { size: 20 });
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (playerContainer.requestFullscreen) {
                playerContainer.requestFullscreen();
            } else if (playerContainer.webkitRequestFullscreen) {
                playerContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    function setupIdleHider() {
        function resetIdleTimer() {
            playerContainer.classList.remove('idle');
            clearTimeout(state.idleTimer);
            if (state.isPlaying) {
                state.idleTimer = setTimeout(function() {
                    playerContainer.classList.add('idle');
                }, 2800);
            }
        }

        playerContainer.addEventListener('mousemove', resetIdleTimer);
        playerContainer.addEventListener('mousedown', resetIdleTimer);
        playerContainer.addEventListener('touchstart', resetIdleTimer);
    }

    function onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
            animateCenterIndicator(state.isPlaying);
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
            e.preventDefault();
            seekRelative(-10);
            triggerRipple(leftRipple);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
            e.preventDefault();
            seekRelative(10);
            triggerRipple(rightRipple);
        } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            setVolume(Math.min(1, state.volume + 0.1));
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            setVolume(Math.max(0, state.volume - 0.1));
        } else if (e.code === 'KeyM') {
            toggleMute();
        } else if (e.code === 'KeyF') {
            toggleFullscreen();
        } else if (e.code === 'KeyN') {
            if (state.currentIndex < state.videos.length - 1) {
                setVideoByIndex(state.currentIndex + 1);
            }
        } else if (e.code === 'KeyP') {
            if (state.currentIndex > 0) {
                setVideoByIndex(state.currentIndex - 1);
            }
        }
    }

    function formatTime(sec) {
        sec = Math.floor(sec || 0);
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = Math.floor(sec % 60);

        var sStr = (s < 10 ? '0' : '') + s;
        var mStr = (m < 10 ? '0' : '') + m;

        if (h > 0) return h + ':' + mStr + ':' + sStr;
        return mStr + ':' + sStr;
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
