#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Family Pics - High-Performance Local HTTP Server with HTTP 206 Range Request Support
Enables instant streaming, zero black-screen lag, seekbar scrubbing, and fast hover peek.
"""

import http.server
import socketserver
import os
import json
import urllib.parse
import webbrowser
import mimetypes
import re
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
# If server.py is inside code/ folder, VIDEOS is in the parent root directory
ROOT_DIR = os.path.dirname(DIRECTORY) if os.path.basename(DIRECTORY).lower() == 'code' else DIRECTORY
VIDEOS_DIR = os.path.join(ROOT_DIR, 'VIDEOS')
if not os.path.exists(VIDEOS_DIR):
    VIDEOS_DIR = os.path.join(DIRECTORY, 'VIDEOS')

THUMBNAILS_DIR = os.path.join(DIRECTORY, 'thumbnails')
LOGS_DIR = os.path.join(DIRECTORY, 'logs')
LOG_FILE = os.path.join(LOGS_DIR, 'app.log')
DATA_FILE = os.path.join(DIRECTORY, 'data.json')
BACKUP_FILE = os.path.join(DIRECTORY, 'BACKUP.JSON')

VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.flv', '.wmv'}

def write_system_log(level, message, source="system", details=""):
    """Write an entry to logs/app.log file."""
    try:
        if not os.path.exists(LOGS_DIR):
            os.makedirs(LOGS_DIR, exist_ok=True)
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{timestamp}] [{level.upper()}] [{source}] {message}"
        if details:
            line += f" | {details}"
        line += "\n"
        with open(LOG_FILE, 'a', encoding='utf-8') as lf:
            lf.write(line)
    except Exception as e:
        print(f"Failed to write log: {e}")

def get_file_duration(path):
    """Estimate duration for Matroska / MP4 files."""
    try:
        size = os.path.getsize(path)
        with open(path, 'rb') as f:
            f.seek(max(0, size - 500000))
            chunk = f.read()
        idx = 0
        last_tc = None
        while True:
            pos = chunk.find(b'\x1f\x43\xb6\x75', idx)
            if pos == -1:
                break
            tc_pos = chunk.find(b'\xe7', pos, pos + 30)
            if tc_pos != -1:
                tc_len = chunk[tc_pos + 1] & 0x7f
                tc_bytes = chunk[tc_pos + 2 : tc_pos + 2 + tc_len]
                last_tc = int.from_bytes(tc_bytes, 'big')
            idx = pos + 4
        if last_tc:
            sec = int(last_tc / 1000)
            h = sec // 3600
            m = (sec % 3600) // 60
            s = sec % 60
            dur_str = f"{h:02d}:{m:02d}:{s:02d}" if h > 0 else f"{m:02d}:{s:02d}"
            return dur_str, sec
    except Exception:
        pass
    return "", 0

def sync_videos_folder():
    """Scan VIDEOS directory and merge into data.json directly."""
    if not os.path.exists(VIDEOS_DIR):
        os.makedirs(VIDEOS_DIR, exist_ok=True)
    if not os.path.exists(THUMBNAILS_DIR):
        os.makedirs(THUMBNAILS_DIR, exist_ok=True)

    data = {
        "systemName": "خانواده من",
        "version": "2.5.0",
        "masterPassword": "1234",
        "defaultEditorName": "مدیر سیستم",
        "videos": []
    }

    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    data.update(loaded)
        except Exception as e:
            print(f"Notice: Reading data.json error: {e}")

    existing_by_file = {v.get('filename'): v for v in data.get('videos', [])}
    found_filenames = set()
    new_count = 0

    for root, _, files in os.walk(VIDEOS_DIR):
        for file in sorted(files):
            ext = os.path.splitext(file)[1].lower()
            if ext in VIDEO_EXTENSIONS:
                found_filenames.add(file)
                full_path = os.path.join(root, file)
                try:
                    file_size = os.path.getsize(full_path)
                    mtime = int(os.path.getmtime(full_path) * 1000)
                except OSError:
                    file_size = 0
                    mtime = 0

                dur_str, dur_sec = get_file_duration(full_path)
                if file in existing_by_file:
                    existing_by_file[file]['path'] = f"VIDEOS/{file}"
                    existing_by_file[file]['fileSizeBytes'] = file_size
                    existing_by_file[file]['fileExists'] = True
                    if not existing_by_file[file].get('durationSeconds') and dur_sec > 0:
                        existing_by_file[file]['durationSeconds'] = dur_sec
                        existing_by_file[file]['duration'] = dur_str
                else:
                    new_item = {
                        "id": f"vid_{mtime}_{abs(hash(file)) % 10000}",
                        "filename": file,
                        "path": f"VIDEOS/{file}",
                        "title": "",
                        "year": "",
                        "description": "",
                        "tags": [],
                        "thumbnail": "",
                        "onlineLink": "",
                        "lastEditedBy": "",
                        "lastEditedAt": "",
                        "duration": dur_str,
                        "durationSeconds": dur_sec,
                        "fileSizeBytes": file_size,
                        "fileExists": True,
                        "dateAdded": mtime
                    }
                    data["videos"].append(new_item)
                    existing_by_file[file] = new_item
                    new_count += 1

    for v in data["videos"]:
        v['fileExists'] = (v.get('filename') in found_filenames)

    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving data.json: {e}")

    return data, new_count

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request Handler supporting Range header (206 Partial Content) for videos."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/' or parsed.path == '':
            self.send_response(302)
            self.send_header('Location', '/index.html')
            self.end_headers()
            return

        if parsed.path == '/api/scan':
            data, new_count = sync_videos_folder()
            self.send_json({
                "status": "success",
                "message": "پوشه ویدئوها با موفقیت اسکن و همگام‌سازی شد.",
                "totalVideos": len(data["videos"]),
                "newCount": new_count,
                "data": data
            })
            return

        if parsed.path == '/api/stats':
            self.handle_stats_api()
            return

        if parsed.path == '/api/logs':
            recent_logs = []
            if os.path.exists(LOG_FILE):
                try:
                    with open(LOG_FILE, 'r', encoding='utf-8') as lf:
                        lines = lf.readlines()
                        recent_logs = [l.strip() for l in lines[-100:]]
                except Exception:
                    pass
            self.send_json({"status": "success", "logs": recent_logs})
            return

        # Route /VIDEOS/ requests to the external VIDEOS folder
        if parsed.path.startswith('/VIDEOS/'):
            rel_vid = urllib.parse.unquote(parsed.path[len('/VIDEOS/'):])
            vid_path = os.path.join(VIDEOS_DIR, rel_vid)
            if os.path.isfile(vid_path):
                return self.send_range_file(vid_path)
            self.send_error(404, "Video file not found")
            return None

        # Serve static file with full Range Request support (Crucial for video streaming)
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            ext = os.path.splitext(path)[1].lower()
            if ext in VIDEO_EXTENSIONS or ext in ['.mp3', '.ogg', '.m4a']:
                return self.send_range_file(path)

        return super().do_GET()

    def send_range_file(self, path):
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        total_size = fs.st_size

        # Sniff EBML / Matroska / WebM vs MP4 containers
        mime_type = None
        try:
            with open(path, 'rb') as check_f:
                header_bytes = check_f.read(128)
                if header_bytes.startswith(b'\x1a\x45\xdf\xa3'):
                    # Check for WebM vs Matroska (MKV)
                    if b'webm' in header_bytes.lower():
                        mime_type = 'video/webm'
                    else:
                        mime_type = 'video/x-matroska'
        except OSError:
            pass

        if not mime_type:
            mime_type = mimetypes.guess_type(path)[0] or 'video/mp4'

        range_header = self.headers.get('Range')
        if not range_header:
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(total_size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            self.copyfile(f, self.wfile)
            f.close()
            return None

        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not range_match:
            self.send_error(416, "Requested Range Not Satisfiable")
            f.close()
            return None

        start = int(range_match.group(1))
        end = int(range_match.group(2)) if range_match.group(2) else total_size - 1

        if start >= total_size or end >= total_size or start > end:
            self.send_error(416, "Requested Range Not Satisfiable")
            f.close()
            return None

        content_length = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Range", f"bytes {start}-{end}/{total_size}")
        self.send_header("Content-Length", str(content_length))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()

        f.seek(start)
        remaining = content_length
        chunk_size = 64 * 1024
        while remaining > 0:
            read_bytes = min(remaining, chunk_size)
            data = f.read(read_bytes)
            if not data:
                break
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                break
            remaining -= len(data)
        f.close()
        return None

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/save':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length).decode('utf-8')
                new_data = json.loads(body)
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(new_data, f, ensure_ascii=False, indent=2)
                self.send_json({"status": "success", "message": "اطلاعات با موفقیت در data.json ذخیره شد."})
            except Exception as e:
                self.send_json({"status": "error", "message": f"خطا در ذخیره فایل: {str(e)}"}, status_code=500)
            return

        if parsed.path == '/api/backup':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length).decode('utf-8')
                backup_data = json.loads(body)
                if 'masterPassword' in backup_data:
                    del backup_data['masterPassword']
                with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, ensure_ascii=False, indent=2)
                # Also synchronize to project root BACKUP.JSON if applicable
                root_backup = os.path.join(DIRECTORY, '..', 'BACKUP.JSON')
                try:
                    with open(root_backup, 'w', encoding='utf-8') as rf:
                        json.dump(backup_data, rf, ensure_ascii=False, indent=2)
                except Exception:
                    pass
                self.send_json({"status": "success", "message": "پشتیبان در BACKUP.JSON ذخیره شد."})
            except Exception as e:
                self.send_json({"status": "error", "message": f"خطا در ایجاد پشتیبان: {str(e)}"}, status_code=500)
            return

        if parsed.path == '/api/log':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length).decode('utf-8')
                log_data = json.loads(body)
                lvl = log_data.get('level', 'ERROR')
                msg = log_data.get('message', 'No message')
                src = log_data.get('source', 'client')
                details = log_data.get('details', '')
                if 'stack' in log_data and log_data['stack']:
                    details = f"{details} | stack: {log_data['stack']}"
                write_system_log(lvl, msg, src, details)
                self.send_json({"status": "success", "message": "Log recorded"})
            except Exception as e:
                self.send_json({"status": "error", "message": str(e)}, status_code=500)
            return

        if parsed.path == '/api/logs/clear':
            try:
                if os.path.exists(LOG_FILE):
                    with open(LOG_FILE, 'w', encoding='utf-8') as lf:
                        lf.write("# Family Pics Application Log\n")
                self.send_json({"status": "success", "message": "لاگ‌ها با موفقیت پاک شدند."})
            except Exception as e:
                self.send_json({"status": "error", "message": str(e)}, status_code=500)
            return

        self.send_error(404, "Endpoint not found")

    def handle_stats_api(self):
        video_files_size = 0
        misc_files_size = 0
        video_count = 0
        misc_files = []

        if os.path.exists(VIDEOS_DIR):
            for root, _, files in os.walk(VIDEOS_DIR):
                for file in files:
                    full_p = os.path.join(root, file)
                    try:
                        sz = os.path.getsize(full_p)
                    except OSError:
                        sz = 0
                    ext = os.path.splitext(file)[1].lower()
                    if ext in VIDEO_EXTENSIONS:
                        video_files_size += sz
                        video_count += 1
                    else:
                        if file != '.gitkeep':
                            misc_files_size += sz
                            misc_files.append({"filename": file, "sizeBytes": sz})

        data_file_size = os.path.getsize(DATA_FILE) if os.path.exists(DATA_FILE) else 0

        res = {
            "status": "success",
            "videoCount": video_count,
            "totalVideoSizeBytes": video_files_size,
            "totalMiscSizeBytes": misc_files_size,
            "miscFilesCount": len(misc_files),
            "miscFiles": misc_files,
            "databaseSizeBytes": data_file_size,
            "totalStorageBytes": video_files_size + misc_files_size + data_file_size
        }
        self.send_json(res)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.end_headers()

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

def run_server():
    global PORT
    print("در حال اسکن و همگام‌سازی فایل‌های پوشه VIDEOS...")
    synced, _ = sync_videos_folder()
    print(f"تعداد {len(synced.get('videos', []))} فایل ویدئویی شناسایی و همگام شد.")

    for attempt_port in [8080, 8000, 8888, 9000]:
        try:
            with socketserver.TCPServer(("", attempt_port), RangeHTTPRequestHandler) as httpd:
                PORT = attempt_port
                url = f"http://localhost:{PORT}/index.html"
                print("=" * 60)
                print("  سامانه ویدئوهای خانوادگی (خانواده من) با موفقیت اجرا شد  ")
                print(f"  آدرس دسترسی در مرورگر: {url}")
                print("=" * 60)
                if '--no-browser' not in sys.argv:
                    webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == '__main__':
    run_server()
