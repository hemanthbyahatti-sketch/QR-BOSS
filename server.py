import io
import json
import os
import re
import shutil
import sqlite3
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")
DB_PATH = os.path.join(BASE_DIR, "qr_database.sqlite3")
os.makedirs(UPLOAD_ROOT, exist_ok=True)


def safe_name(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name or "media"


def get_db_connection(db_path=DB_PATH):
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database(db_path=DB_PATH):
    conn = get_db_connection(db_path)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS qr_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            qr_type TEXT NOT NULL,
            content TEXT NOT NULL,
            theme TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()
    return db_path


def save_qr_record(db_path, payload):
    if not isinstance(payload, dict):
        raise ValueError("QR record payload must be a dictionary")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    raw_meta = payload.get("metadata")
    if isinstance(raw_meta, str):
        try:
            meta_obj = json.loads(raw_meta)
        except Exception:
            meta_obj = {}
    elif isinstance(raw_meta, dict):
        meta_obj = raw_meta
    else:
        meta_obj = {}

    data = {
        "title": str(payload.get("title") or "Untitled QR"),
        "qr_type": str(payload.get("type") or payload.get("qr_type") or "url"),
        "content": str(payload.get("content") or ""),
        "theme": str(payload.get("theme") or "gradient"),
        "metadata": json.dumps(meta_obj, ensure_ascii=False),
        "created_at": str(payload.get("created_at") or now),
        "updated_at": now,
    }

    conn = get_db_connection(db_path)
    cursor = conn.execute(
        """
        INSERT INTO qr_records (title, qr_type, content, theme, metadata, created_at, updated_at)
        VALUES (:title, :qr_type, :content, :theme, :metadata, :created_at, :updated_at)
        """,
        data,
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id


def get_recent_qr_records(db_path=DB_PATH, limit=10):
    conn = get_db_connection(db_path)
    rows = conn.execute(
        "SELECT id, title, qr_type, content, theme, metadata, created_at, updated_at FROM qr_records ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "type": row["qr_type"],
            "content": row["content"],
            "theme": row["theme"],
            "metadata": json.loads(row["metadata"] or "{}"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


def parse_multipart_form(raw_body: bytes, content_type: str):
    if "boundary=" not in content_type:
        raise ValueError("Missing multipart boundary")
    boundary = content_type.split("boundary=", 1)[1].split(";")[0].strip().strip('"')
    if not boundary:
        raise ValueError("Missing multipart boundary")

    marker = b"--" + boundary.encode("utf-8")
    parts = raw_body.split(marker)
    uploaded = []

    for part in parts:
        if not part or part in (b"--\r\n", b"--"):
            continue
        part = part.strip(b"\r\n")
        if not part:
            continue
        if b"\r\n\r\n" not in part:
            continue
        headers_block, file_data = part.split(b"\r\n\r\n", 1)
        headers = {}
        for line in headers_block.split(b"\r\n"):
            if not line:
                continue
            name, sep, value = line.partition(b":")
            if not sep:
                continue
            headers[name.decode("utf-8", "replace").lower()] = value.decode("utf-8", "replace").strip()

        disposition = headers.get("content-disposition", "")
        filename_match = re.search(r'filename\*?=(?:"([^"]*)"|([^;\r\n]+))', disposition)
        name_match = re.search(r'name=(?:"([^"]*)"|([^;\r\n]+))', disposition)
        if not filename_match:
            continue

        raw_filename = filename_match.group(1) or filename_match.group(2) or "media"
        if "''" in raw_filename:
            raw_filename = raw_filename.split("''", 1)[-1]
        filename = raw_filename.strip().strip("'\"")
        field_name = (name_match.group(1) or name_match.group(2) or "mediaFiles").strip().strip("'\"") if name_match else "mediaFiles"
        file_bytes = file_data
        if file_bytes.endswith(b"\r\n"):
            file_bytes = file_bytes[:-2]
        uploaded.append({
            "field": field_name,
            "filename": filename,
            "content_type": headers.get("content-type", "application/octet-stream"),
            "data": file_bytes,
        })

    return uploaded


initialize_database(DB_PATH)


class MediaServer(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/":
            self.serve_file("index.html")
            return

        if path == "/gallery.html":
            self.serve_file("gallery.html")
            return

        if path.startswith("/gallery/"):
            gallery_id = path.split("/gallery/", 1)[1].strip("/")
            safe_id = safe_name(gallery_id)
            gallery_dir = os.path.abspath(os.path.join(UPLOAD_ROOT, safe_id))
            if gallery_dir.startswith(os.path.abspath(UPLOAD_ROOT)) and os.path.isdir(gallery_dir):
                self.serve_file("gallery.html")
                return
            self.send_error(404, "Gallery not found")
            return

        if path in ("/app.js", "/media-config.js", "/style.css", "/favicon.ico"):
            self.serve_file(path.lstrip("/"))
            return

        if path == "/api/qr":
            self.send_recent_qr_records()
            return

        if path.startswith("/api/qr/"):
            qr_id = path.split("/api/qr/", 1)[1].strip("/")
            self.send_qr_record(qr_id)
            return

        if path.startswith("/api/gallery/"):
            gallery_id = path.split("/api/gallery/", 1)[1].strip("/")
            self.send_gallery_json(gallery_id)
            return

        if path.startswith("/uploads/"):
            rel_path = path.lstrip("/").replace("/", os.sep)
            storage_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
            upload_root_abs = os.path.abspath(UPLOAD_ROOT)
            if storage_path.startswith(upload_root_abs) and os.path.isfile(storage_path):
                self.serve_binary(storage_path)
                return
            self.send_error(404, "File not found")
            return

        self.send_error(404, "Not found")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/upload-media":
            self.handle_upload()
            return

        if path == "/api/qr":
            self.handle_qr_save()
            return

        self.send_error(404, "Not found")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Content-Length, X-Requested-With")
        self.end_headers()

    def handle_qr_save(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            self.send_json({"error": "Missing request body"}, 400)
            return

        try:
            raw_body = self.rfile.read(length)
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            self.send_json({"error": "Invalid JSON payload"}, 400)
            return

        if not isinstance(payload, dict):
            self.send_json({"error": "JSON payload must be an object"}, 400)
            return

        record_id = save_qr_record(DB_PATH, payload)
        self.send_json({"id": record_id, "message": "QR saved successfully"}, 201)

    def send_recent_qr_records(self):
        records = get_recent_qr_records(DB_PATH, limit=20)
        self.send_json({"records": records}, 200)

    def send_qr_record(self, qr_id):
        try:
            record_id = int(qr_id)
        except ValueError:
            self.send_json({"error": "Invalid QR id"}, 400)
            return

        conn = get_db_connection(DB_PATH)
        row = conn.execute(
            "SELECT id, title, qr_type, content, theme, metadata, created_at, updated_at FROM qr_records WHERE id = ?",
            (record_id,),
        ).fetchone()
        conn.close()
        if row is None:
            self.send_json({"error": "QR not found"}, 404)
            return

        record = {
            "id": row["id"],
            "title": row["title"],
            "type": row["qr_type"],
            "content": row["content"],
            "theme": row["theme"],
            "metadata": json.loads(row["metadata"] or "{}"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        self.send_json(record, 200)

    def handle_upload(self):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type or "boundary=" not in content_type:
            self.send_json({"error": "Expected multipart/form-data with boundary"}, 400)
            return

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            self.send_json({"error": "Missing upload body"}, 400)
            return

        form_boundary = content_type.split("boundary=", 1)[1].split(";")[0].strip().strip('"')
        if not form_boundary:
            self.send_json({"error": "Missing multipart boundary"}, 400)
            return

        gallery_id = str(uuid.uuid4())
        gallery_dir = os.path.join(UPLOAD_ROOT, gallery_id)
        os.makedirs(gallery_dir, exist_ok=True)

        raw_body = self.rfile.read(content_length)

        try:
            uploaded_files = parse_multipart_form(raw_body, content_type)
        except Exception:
            self.send_json({"error": "Invalid multipart upload"}, 400)
            return

        saved_files = []
        for field_data in uploaded_files:
            current_name = safe_name(field_data["filename"])
            target_path = os.path.join(gallery_dir, current_name)
            if os.path.exists(target_path):
                base, ext = os.path.splitext(current_name)
                target_path = os.path.join(gallery_dir, f"{base}_{uuid.uuid4().hex[:8]}{ext}")

            file_data = field_data["data"]
            if not file_data:
                continue

            with open(target_path, "wb") as target_file:
                target_file.write(file_data)

            file_ext = os.path.splitext(target_path)[1].lower()
            is_video = field_data["content_type"].startswith("video/") or file_ext in (
                ".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"
            )
            saved_files.append({
                "name": os.path.basename(target_path),
                "type": "video" if is_video else "image",
                "path": "/uploads/" + gallery_id + "/" + os.path.basename(target_path),
            })

        if not saved_files:
            shutil.rmtree(gallery_dir, ignore_errors=True)
            self.send_json({"error": "No files uploaded"}, 400)
            return

        host = self.headers.get("Host", "localhost:8000")
        forwarded_host = self.headers.get("X-Forwarded-Host") or host
        forwarded_proto = (
            self.headers.get("X-Forwarded-Proto")
            or self.headers.get("X-Forwarded-Protocol")
            or self.headers.get("X-Forwarded-Scheme")
        )
        scheme = "https" if forwarded_proto and forwarded_proto.lower().startswith("https") else "http"
        gallery_url = f"{scheme}://{forwarded_host}/gallery/{gallery_id}"
        response = {"galleryId": gallery_id, "url": gallery_url, "files": saved_files}
        self.send_json(response, 200)

    def send_gallery_json(self, gallery_id):
        safe_id = safe_name(gallery_id)
        gallery_dir = os.path.abspath(os.path.join(UPLOAD_ROOT, safe_id))
        upload_root_abs = os.path.abspath(UPLOAD_ROOT)
        if not gallery_dir.startswith(upload_root_abs) or not os.path.isdir(gallery_dir):
            self.send_json({"error": "Gallery not found"}, 404)
            return

        files = []
        for entry in sorted(os.listdir(gallery_dir)):
            full_path = os.path.join(gallery_dir, entry)
            if not os.path.isfile(full_path):
                continue
            media_type = "video" if entry.lower().endswith((".mp4", ".mov", ".webm", ".avi")) else "image"
            files.append({
                "name": entry,
                "type": media_type,
                "path": f"/uploads/{safe_id}/{entry}",
            })

        self.send_json({"galleryId": safe_id, "files": files}, 200)

    def serve_file(self, file_name):
        safe_base = safe_name(file_name)
        path = os.path.join(BASE_DIR, safe_base)
        if os.path.isfile(path):
            self.serve_binary(path)
            return
        self.send_error(404, "File not found")

    def serve_binary(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        content_type = "application/octet-stream"
        if ext in (".html",):
            content_type = "text/html; charset=utf-8"
        elif ext in (".js",):
            content_type = "application/javascript; charset=utf-8"
        elif ext in (".css",):
            content_type = "text/css; charset=utf-8"
        elif ext in (".png",):
            content_type = "image/png"
        elif ext in (".jpg", ".jpeg"):
            content_type = "image/jpeg"
        elif ext in (".gif",):
            content_type = "image/gif"
        elif ext in (".webp",):
            content_type = "image/webp"
        elif ext in (".mp4", ".mov", ".webm", ".avi"):
            content_type = "video/" + ext.lstrip(".")

        with open(file_path, "rb") as file_obj:
            data = file_obj.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload, status):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Content-Length, X-Requested-With")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), MediaServer)
    print(f"Serving HTTP on {host} port {port}")
    server.serve_forever()
