/**
 * Dedicated Hardcoded SVG Icons v1.8
 * Style: Rounded + Fill Solid Color (Monochrome: Black / White)
 * Strictly zero emojis, zero external CDN fonts or stylesheets.
 * Optimized for crisp inline rendering with vertical alignment.
 */
(function(root) {
    'use strict';

    var ICONS = {
        logo: '<svg viewBox="0 0 64 64"><circle cx="14" cy="11" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="26" cy="11" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="38" cy="11" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="50" cy="11" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="14" cy="53" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="26" cy="53" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="38" cy="53" r="2.2" fill="currentColor" opacity="0.7"/><circle cx="50" cy="53" r="2.2" fill="currentColor" opacity="0.7"/><path d="M32 17 L48 29 L44 29 L44 45 C44 46.1 43.1 47 42 47 L22 47 C20.9 47 20 46.1 20 45 L20 29 L16 29 Z" fill="currentColor"/><path d="M29 27.5 L38.5 33.5 L29 39.5 Z" fill="#000000"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="2"/><rect x="14" y="5" width="4" height="14" rx="2"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82z"/><rect x="16" y="6" width="3" height="12" rx="1.5"/></svg>',
        prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.42 7.11l-5.77 4.07c-.56.4-.56 1.24 0 1.63l5.77 4.07c.67.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82z"/><rect x="5" y="6" width="3" height="12" rx="1.5"/></svg>',
        forward10: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 13c-.5 3.91-3.86 7-7.92 7-4.42 0-8-3.58-8-8s3.58-8 8-8c2.4 0 4.58 1.06 6.07 2.75L18.41 8H21c.55 0 1-.45 1-1V2.41c0-.89-1.08-1.34-1.71-.71l-1.62 1.62C16.64 1.35 13.98 0 11 0 4.93 0 0 4.93 0 11s4.93 11 11 11c5.21 0 9.53-3.64 10.65-8.5.15-.65-.32-1.26-.98-1.26-.49 0-.91.35-.98.83z"/><text x="11.5" y="15" font-size="7.5" font-weight="900" text-anchor="middle" fill="currentColor" font-family="sans-serif">+10</text></svg>',
        replay10: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.08 13c.5 3.91 3.86 7 7.92 7 4.42 0 8-3.58 8-8s-3.58-8-8-8c-2.4 0-4.58 1.06-6.07 2.75L5.59 8H3c-.55 0-1-.45-1-1V2.41c0-.89 1.08-1.34 1.71-.71l1.62 1.62C7.36 1.35 10.02 0 13 0c6.07 0 11 4.93 11 11s-4.93 11-11 11c-5.21 0-9.53-3.64-10.65-8.5-.15-.65.32-1.26.98-1.26.49 0-.91.35-.98.83z"/><text x="12.5" y="15" font-size="7.5" font-weight="900" text-anchor="middle" fill="currentColor" font-family="sans-serif">-10</text></svg>',
        volumeHigh: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3.38l4.41 3.86c.64.56 1.65.11 1.65-.75V5.89c0-.86-1.01-1.31-1.65-.75L7.38 9H4z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/><path d="M19 12c0 3.12-1.79 5.82-4.4 7.12-.47.24-.65.81-.42 1.28.23.47.81.65 1.28.42C18.66 19.26 21 15.9 21 12s-2.34-7.26-5.54-8.82c-.47-.23-1.05-.05-1.28.42-.23.47-.05 1.05.42 1.28C17.21 6.18 19 8.88 19 12z"/></svg>',
        volumeMute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3.38l4.41 3.86c.64.56 1.65.11 1.65-.75V5.89c0-.86-1.01-1.31-1.65-.75L7.38 9H4z"/><path d="M16.59 12l2.7-2.7c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L15.18 10.59l-2.7-2.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l2.7 2.7-2.7 2.7c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l2.7-2.7 2.7 2.7c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L16.59 12z"/></svg>',
        speed: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C6.48 4 2 8.48 2 14c0 2.21.72 4.25 1.94 5.91.4.55 1.18.62 1.66.14.38-.38.41-.98.09-1.44C4.69 17.15 4 15.66 4 14c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.66-.69 3.15-1.69 4.61-.32.46-.29 1.06.09 1.44.48.48 1.26.41 1.66-.14C21.28 18.25 22 16.21 22 14c0-5.52-4.48-10-10-10zm-.71 6.29c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L12.7 10.29c-.39-.38-1.02-.38-1.41 0z"/></svg>',
        fullscreen: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3H4c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V5h2c.55 0 1-.45 1-1s-.45-1-1-1zm13 0h-3c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zm0 14c-.55 0-1 .45-1 1v2h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1zM4 17c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H5v-2c0-.55-.45-1-1-1z"/></svg>',
        download: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 15v3H6v-3c0-.55-.45-1-1-1s-1 .45-1 1v4c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1s-1 .45-1 1zm-5.71-1.29l3.29-3.29c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L13 10.17V4c0-.55-.45-1-1-1s-1 .45-1 1v6.17l-1.17-1.17c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l3.29 3.29c.39.4 1.02.4 1.41.01z"/></svg>',
        qrcode: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm-5 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2z"/></svg>',
        edit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
        filter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4c.55 0 1-.45 1-1s-.45-1-1-1h-4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1zm3 6h12c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>',
        sort: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 17h6c.55 0 1 .45 1 1s-.45 1-1 1H8c-.55 0-1-.45-1-1s.45-1 1-1zm-5-6h16c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1s.45-1 1-1zm-1-6c0-.55.45-1 1-1h20c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1z"/></svg>',
        backup: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-4.29 4.29c-.39.39-1.02.39-1.41 0L7 13c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L11 14.17V9c0-.55.45-1 1-1s1 .45 1 1v5.17l2.59-2.58c.39-.39 1.02-.39 1.41 0 .39.38.39 1.02 0 1.41z"/></svg>',
        restore: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM12 9l3.59 3.59c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0L13 12.83V17c0 .55-.45 1-1 1s-1-.45-1-1v-4.17l-1.18 1.18c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41L12 9z"/></svg>',
        alert: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4c0 .55.45 1 1 1s1-.45 1-1v-4c0-.55-.45-1-1-1s-1 .45-1 1zm0 6h2v2h-2v-2z"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>',
        folder: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
        rotate: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm1 17H7V6h10v12zm-5 4c-.83 0-1.5-.67-1.5-1.5S11.17 19 12 19s1.5.67 1.5 1.5S12.83 22 12 22z"/><path d="M21.5 9c-.28 0-.53.11-.71.29l-1.08 1.08C19.12 7.74 16.83 6 14 6v2c2.21 0 4.04 1.34 4.67 3.25L17.29 9.9c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l2.83 2.83c.39.39 1.02.39 1.41 0l2.83-2.83c.39-.39.39-1.03 0-1.42-.18-.18-.43-.29-.71-.29z"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
        back: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-7.29 7.29c-.39.39-.39 1.02 0 1.41l7.29 7.29c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H20c.55 0 1-.45 1-1s-.45-1-1-1z"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
        tag: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/><path d="M4 20h16c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1s1 .45 1 1v17z"/></svg>',
        storage: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 5h-2V7h2v2zm2 4H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2zm-2 5h-2v-2h2v2z"/></svg>',
        sync: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
        link: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
        camera: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>',
        image: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2c0-.55-.45-1-1-1s-1 .45-1 1v2H8V2c0-.55-.45-1-1-1s-1 .45-1 1v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>',
        status: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>',
        eye: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
        eyeOff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.17c0-1.66-1.34-3-3-3l-.17.02z"/></svg>'
    };

    root.Icons = {
        get: function(name, options) {
            options = options || {};
            var svg = ICONS[name] || ICONS.logo;
            var size = options.size || 20;
            var className = options.className || '';
            var fill = options.color || 'currentColor';
            
            return '<span class="app-icon ' + className + '" style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;flex-shrink:0;vertical-align:middle;line-height:0;">' +
                   svg.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ') +
                   '</span>';
        },
        renderAll: function(container) {
            container = container || document;
            var elements = container.querySelectorAll('[data-icon]');
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var name = el.getAttribute('data-icon');
                var size = parseInt(el.getAttribute('data-icon-size') || '20', 10);
                var color = el.getAttribute('data-icon-color') || 'currentColor';
                el.innerHTML = root.Icons.get(name, { size: size, color: color });
            }
        }
    };
})(typeof window !== 'undefined' ? window : this);
