import io
import json
import os
import re
import shutil
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)


def safe_name(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name or "media"


def parse_multipart_form(raw_body: bytes, content_type: str):
    boundary = content_type.split("boundary=", 1)[1].strip().strip('"')
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
        filename_match = re.search(r'filename="([^"]*)"', disposition)
        name_match = re.search(r'name="([^"]*)"', disposition)
        if not filename_match:
            continue

        filename = filename_match.group(1)
        field_name = name_match.group(1) if name_match else "mediaFiles"
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
            gallery_dir = os.path.join(UPLOAD_ROOT, gallery_id)
            if os.path.isdir(gallery_dir):
                self.serve_file("gallery.html")
                return
            self.send_error(404, "Gallery not found")
            return

        if path in ("/app.js", "/media-config.js", "/style.css", "/favicon.ico"):
            self.serve_file(path.lstrip("/"))
            return

        if path.startswith("/api/gallery/"):
            gallery_id = path.split("/api/gallery/", 1)[1].strip("/")
            self.send_gallery_json(gallery_id)
            return

        if path.startswith("/uploads/"):
            storage_path = os.path.normpath(os.path.join(BASE_DIR, path.lstrip("/")))
            if os.path.isfile(storage_path):
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

        self.send_error(404, "Not found")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def handle_upload(self):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_json({"error": "Expected multipart/form-data"}, 400)
            return

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            self.send_json({"error": "Missing upload body"}, 400)
            return

        form_boundary = content_type.split("boundary=")[-1]
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

            saved_files.append({
                "name": os.path.basename(target_path),
                "type": "video" if field_data["content_type"].startswith("video/") else "image",
                "path": "/uploads/" + gallery_id + "/" + os.path.basename(target_path),
            })

        if not saved_files:
            shutil.rmtree(gallery_dir, ignore_errors=True)
            self.send_json({"error": "No files uploaded"}, 400)
            return

        host = self.headers.get("Host", "localhost:8000")
        gallery_url = f"http://{host}/gallery/{gallery_id}"
        response = {"galleryId": gallery_id, "url": gallery_url, "files": saved_files}
        self.send_json(response, 200)

    def send_gallery_json(self, gallery_id):
        gallery_dir = os.path.join(UPLOAD_ROOT, gallery_id)
        if not os.path.isdir(gallery_dir):
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
                "path": f"/uploads/{gallery_id}/{entry}",
            })

        self.send_json({"galleryId": gallery_id, "files": files}, 200)

    def serve_file(self, file_name):
        path = os.path.join(BASE_DIR, file_name)
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
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload, status):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
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
