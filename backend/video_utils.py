import cv2
import numpy as np
import base64
import io
from PIL import Image
from io import BytesIO
from typing import List, Tuple, Dict

def extract_frames(video_path: str, num_frames: int = 32) -> Tuple[List[Image.Image], Dict]:
    """
    Extract evenly-spaced frames from a video file.
    
    Args:
        video_path: Path to the input video file
        num_frames: Number of frames to extract (default: 32)
    
    Returns:
        Tuple of (List of PIL Image objects, Metadata dictionary)
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Failed to open video file: {video_path}")
    
    # Get video metadata
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    
    if total_frames == 0:
        raise ValueError(f"Video has 0 frames: {video_path}")
    
    # Calculate frame indices for even sampling
    if total_frames <= num_frames:
        # If video is shorter than requested frames, return all frames
        frame_indices = list(range(total_frames))
    else:
        # Evenly sample frames across the video
        frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    
    frames = []
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        
        if success:
            # Convert OpenCV frame (BGR) to PIL Image (RGB)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            frames.append(pil_image)
        else:
            # Handle frame read failure
            print(f"Warning: Failed to read frame {idx}")
    
    cap.release()
    
    # Return metadata for media_io_kwargs
    return frames, {
        "fps": fps,
        "frames_indices": frame_indices.tolist() if isinstance(frame_indices, np.ndarray) else frame_indices,
        "total_num_frames": total_frames,
        "duration": duration
    }

def encode_image(image: Image.Image) -> str:
    """
    Encode a PIL Image to base64 string.
    
    Args:
        image: PIL Image object
    
    Returns:
        Base64-encoded string of the image
    """
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
