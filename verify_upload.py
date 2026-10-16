import os
import sys
import urllib.request
import uuid

boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
payload = (
    b'--' + boundary.encode() + b'\r\n'
    b'Content-Disposition: form-data; name="mediaFiles"; filename="test.png"\r\n'
    b'Content-Type: image/png\r\n\r\n'
    b'PNGDATA\r\n'
    b'--' + boundary.encode() + b'--\r\n'
)
req = urllib.request.Request(
    'http://localhost:8000/api/upload-media',
    data=payload,
    headers={
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': str(len(payload)),
    },
)
try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode('utf-8', 'replace')
        print('STATUS', resp.status)
        print(body)
except urllib.error.URLError as exc:
    print(f"Error connecting to backend: {exc}")
    print("Please make sure server.py is running on port 8000 (e.g. 'python server.py') before running verify_upload.py.")
    sys.exit(1)

