import os
import json
import uuid
import base64
import io
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import requests
from video_utils import extract_frames, encode_image

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Config ────────────────────────────────────────────────────────────────────
LLM_MODEL = "Qwen3-VL-8B-Instruct"
LLM_URL = "http://3.211.201.25:7862/v1/chat/completions"

DATA_DIR = Path("/app/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
CHATS_FILE = DATA_DIR / "chats.json"
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Credentials ───────────────────────────────────────────────────────────────
ADMIN_USERNAME = "admin_gigaforce"
ADMIN_PASSWORD = "Giga@2026"

# ─── Helpers ───────────────────────────────────────────────────────────────────

def load_chats() -> dict:
    if CHATS_FILE.exists():
        return json.loads(CHATS_FILE.read_text())
    return {}


def save_chats(chats: dict):
    CHATS_FILE.write_text(json.dumps(chats, indent=2))


def image_to_base64(image: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()




# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="VLM Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Verify LLM endpoint availability."""
    logger.info(f"Using remote LLM at {LLM_URL}")

# ─── Pydantic Models ───────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class ChatCreateRequest(BaseModel):
    title: str = "New Chat"


class MessageRequest(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    images: Optional[List[str]] = None  # list of base64 strings
    video_url: Optional[str] = None # base64 sampled video frames
    attachment: Optional[dict] = None

class ChatRequest(BaseModel):
    chat_id: str
    message: str
    images: Optional[List[str]] = None  # base64 encoded images
    video_url: Optional[str] = None # data URI for video
    history: Optional[List[dict]] = None
    attachment: Optional[dict] = None  # metadata: {type, filename}


# ─── Auth Endpoint ─────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(req: LoginRequest):
    if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
        return {"success": True, "username": req.username, "role": "ADMIN"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


# ─── Upload Endpoint ───────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accept an image, PDF or Video upload.
    - Images: returned as a single base64 string.
    - Images: converted to base64.
    - Videos: sample 32 frames, returned as a data URI.
    """
    content = await file.read()
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()

    logger.info(f"Received upload: {filename} ({len(content)} bytes)")
    
    # Save to temp for processing
    temp_path = UPLOADS_DIR / f"{uuid.uuid4()}{ext}"
    temp_path.write_bytes(content)

    try:
        if ext in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"]:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            max_dim = 1500
            w, h = img.size
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                new_size = (int(w * scale), int(h * scale))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            b64 = image_to_base64(img)
            return {
                "type": "image",
                "filename": filename,
                "images": [b64],
            }
        elif ext in [".mp4", ".avi", ".mov", ".mkv"]:
            frames, metadata = extract_frames(str(temp_path), num_frames=32)
            frames_b64 = ",".join([encode_image(f) for f in frames])
            video_data_url = f"data:video/jpeg;base64,{frames_b64}"
            return {
                "type": "video",
                "filename": filename,
                "video_url": video_data_url,
                "metadata": metadata
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    finally:
        if temp_path.exists():
            temp_path.unlink()


# ─── Chat Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/chats")
def get_chats():
    chats = load_chats()
    # Return summaries sorted by updated_at desc
    result = []
    for cid, chat in chats.items():
        result.append({
            "id": cid,
            "title": chat.get("title", "New Chat"),
            "created_at": chat.get("created_at", ""),
            "updated_at": chat.get("updated_at", ""),
            "message_count": len(chat.get("messages", [])),
        })
    result.sort(key=lambda x: x["updated_at"], reverse=True)
    return result


@app.post("/api/chats")
def create_chat(req: ChatCreateRequest):
    chats = load_chats()
    cid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    chats[cid] = {
        "id": cid,
        "title": req.title,
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }
    save_chats(chats)
    return chats[cid]


@app.get("/api/chats/{chat_id}")
def get_chat(chat_id: str):
    chats = load_chats()
    if chat_id not in chats:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chats[chat_id]


@app.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str):
    chats = load_chats()
    if chat_id not in chats:
        raise HTTPException(status_code=404, detail="Chat not found")
    del chats[chat_id]
    save_chats(chats)
    return {"success": True}


@app.patch("/api/chats/{chat_id}/title")
def update_chat_title(chat_id: str, body: dict):
    chats = load_chats()
    if chat_id not in chats:
        raise HTTPException(status_code=404, detail="Chat not found")
    chats[chat_id]["title"] = body.get("title", chats[chat_id]["title"])
    chats[chat_id]["updated_at"] = datetime.utcnow().isoformat()
    save_chats(chats)
    return chats[chat_id]


# ─── Inference Endpoint ────────────────────────────────────────────────────────

@app.post("/api/chat")
def chat(req: ChatRequest):
    """
    Send a message to Qwen3-VL with multimodal history support.
    """
    chats = load_chats()
    if req.chat_id not in chats:
        raise HTTPException(status_code=404, detail="Chat not found")

    chat_data = chats[req.chat_id]
    
    # Process history into Qwen's expected format
    remote_messages = []
    for msg in chat_data["messages"]:
        content_list = []
        
        # Add text
        content_list.append({"type": "text", "text": msg["content"]})
        
        # Add stored images (if any - though we usually don't store them for space)
        if "images" in msg and msg["images"]:
            for img_b64 in msg["images"]:
                 content_list.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{img_b64}"}
                })
        
        # Add stored video (if any)
        if "video_url" in msg and msg["video_url"]:
             content_list.append({
                "type": "video_url",
                "video_url": {"url": msg["video_url"]}
            })
            
        remote_messages.append({
            "role": msg["role"],
            "content": content_list
        })

    # Add current message
    current_content = []
    if req.video_url:
        current_content.append({
            "type": "video_url",
            "video_url": {"url": req.video_url}
        })
    
    if req.images:
        for img_b64 in req.images:
            current_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{img_b64}"}
            })
            
    current_content.append({"type": "text", "text": req.message})
    
    remote_messages.append({
        "role": "user",
        "content": current_content
    })

    payload = {
        "model": LLM_MODEL,
        "messages": remote_messages,
        "max_tokens": 1024,
        "temperature": 0.1
    }

    try:
        response = requests.post(LLM_URL, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        result = response.json()
        assistant_content = result["choices"][0]["message"]["content"]
    except Exception as e:
        logger.exception(f"Remote LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

    # Save to history
    now = datetime.utcnow().isoformat()
    user_msg_record = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": req.message,
        "timestamp": now,
    }
    
    # Persist images and video in history for display when re-loading a chat
    if req.images:
        user_msg_record["images"] = req.images
    if req.video_url:
        user_msg_record["video_url"] = req.video_url
    # Save attachment metadata (type + filename) for UI display
    if req.attachment:
        user_msg_record["attachment"] = req.attachment
    elif req.images:
        user_msg_record["attachment"] = {
            "type": "image",
            "filename": "image",
            "images": req.images
        }
    elif req.video_url:
        user_msg_record["attachment"] = {
            "type": "video",
            "filename": "video",
            "video_url": req.video_url
        }

    assistant_msg_record = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": assistant_content,
        "timestamp": datetime.utcnow().isoformat(),
    }

    chat_data["messages"].append(user_msg_record)
    chat_data["messages"].append(assistant_msg_record)
    chat_data["updated_at"] = now

    if len(chat_data["messages"]) == 2:
        title = req.message[:50] + ("..." if len(req.message) > 50 else "")
        chat_data["title"] = title

    save_chats(chats)

    return {
        "message": assistant_content,
        "chat_id": req.chat_id,
        "user_msg_id": user_msg_record["id"],
        "assistant_msg_id": assistant_msg_record["id"],
    }


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "model": LLM_MODEL, "llm_url": LLM_URL}
