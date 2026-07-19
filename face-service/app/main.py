import base64
import os
import time
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from insightface.app import FaceAnalysis


MODEL_NAME = os.getenv("INSIGHTFACE_MODEL_NAME", "buffalo_s")
DET_SIZE = int(os.getenv("INSIGHTFACE_DET_SIZE", "640"))
DET_THRESH = float(os.getenv("INSIGHTFACE_DET_THRESH", "0.65"))
MAX_IMAGE_SIDE = int(os.getenv("FACE_MAX_IMAGE_SIDE", "960"))

app = FastAPI(title="AMS Face Service", version="1.0.0")
face_app: FaceAnalysis | None = None
warmup_status: dict[str, Any] = {"ok": False, "elapsedMs": None, "error": None}


def get_face_app() -> FaceAnalysis:
    global face_app
    if face_app is None:
        providers = ["CPUExecutionProvider"]
        face_app = FaceAnalysis(name=MODEL_NAME, providers=providers)
        face_app.prepare(ctx_id=-1, det_size=(DET_SIZE, DET_SIZE), det_thresh=DET_THRESH)
    return face_app


@app.on_event("startup")
def startup() -> None:
    global warmup_status
    started = time.perf_counter()
    try:
        service = get_face_app()
        dummy = np.zeros((DET_SIZE, DET_SIZE, 3), dtype=np.uint8)
        service.get(dummy)
        warmup_status = {
            "ok": True,
            "elapsedMs": int((time.perf_counter() - started) * 1000),
            "error": None,
        }
    except Exception as exc:
        warmup_status = {
            "ok": False,
            "elapsedMs": int((time.perf_counter() - started) * 1000),
            "error": str(exc),
        }
        raise


def decode_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    height, width = image.shape[:2]
    longest = max(height, width)
    if longest > MAX_IMAGE_SIDE:
        scale = MAX_IMAGE_SIDE / longest
        image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    return image


def quality_score(face: Any, image: np.ndarray) -> dict[str, Any]:
    x1, y1, x2, y2 = [int(v) for v in face.bbox]
    h, w = image.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return {"brightness": 0.0, "sharpness": 0.0, "faceArea": 0.0}

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    face_area = float(((x2 - x1) * (y2 - y1)) / max(1, w * h))
    return {"brightness": brightness, "sharpness": sharpness, "faceArea": face_area}


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "engine": "insightface",
        "model": MODEL_NAME,
        "detSize": DET_SIZE,
        "detThresh": DET_THRESH,
        "warmup": warmup_status,
    }


@app.post("/extract")
async def extract(file: UploadFile = File(...)) -> dict[str, Any]:
    started = time.perf_counter()
    image_bytes = await file.read()
    image = decode_image(image_bytes)
    faces = get_face_app().get(image)

    if not faces:
      raise HTTPException(status_code=404, detail="No face detected")
    if len(faces) > 1:
      raise HTTPException(status_code=400, detail="Multiple faces detected")

    face = faces[0]
    embedding = np.asarray(face.normed_embedding, dtype=np.float32)
    if embedding.shape[0] != 512:
        raise HTTPException(status_code=500, detail=f"Unexpected embedding length {embedding.shape[0]}")

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return {
        "success": True,
        "engine": "arcface",
        "model": MODEL_NAME,
        "embedding": embedding.tolist(),
        "embeddingLength": int(embedding.shape[0]),
        "detectionScore": float(face.det_score),
        "bbox": [float(v) for v in face.bbox],
        "quality": quality_score(face, image),
        "elapsedMs": elapsed_ms,
    }


@app.post("/extract-base64")
async def extract_base64(payload: dict[str, str]) -> dict[str, Any]:
    raw = payload.get("imageBase64", "")
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    class InMemoryUpload:
        async def read(self) -> bytes:
            return image_bytes

    return await extract(InMemoryUpload())  # type: ignore[arg-type]
