import os
import sys
import json
import requests
from typing import List
from PIL import Image

from video_utils import extract_frames, encode_image
from svg_to_img import render

LLM_MODEL = "Qwen3-VL-8B-Instruct"
LLM_URL = "http://3.211.201.25:7862/v1/chat/completions"

SYSTEM_PROMPT = """You are an expert at analyzing accident videos and generating a structured, high-fidelity JSON representation for an accident diagram and analysis.
Analyze the video frames and provide a JSON object describing the scene with technical and environmental precision.

REQUIRED JSON STRUCTURE:
{
  "accident_summary": "Short description of what happened in the video",
  "fault_assessment": {
    "at_fault_vehicle_id": "1", "2", etc.,
    "rationale": "Detailed explanation of fault based on traffic rules and video evidence"
  },
  "involvement": [
    {
      "id": "1", "2", etc.,
      "role": "Striking", "Struck", "Witness",
      "description": "Vehicle action"
    }
  ],
  "annotations": [
    {"x": x, "y": y, "text": "Specific observation (e.g., 'Impact point', 'Skid marks')"}
  ],
  "scene_layout": {
    "scene_type": "narrow street" or "intersection",
    "road_segments": [
      {
        "name": "Street Name",
        "orientation": "horizontal" or "vertical",
        "position": [x1, y1, x2, y2]
      }
    ],
    "sidewalks": [
      {"position": [x1, y1, x2, y2]}
    ],
    "buildings": [
      {"name": "Building A", "position": [x1, y1, x2, y2]}
    ],
    "vehicles": [
      {
        "id": "1", "2", etc.,
        "type": "sedan",
        "x": x_center,
        "y": y_center,
        "heading": degrees (0 is right, 90 is down, 180 is left, 270 is up)
      }
    ],
    "signals": [
      {
        "type": "traffic_light",
        "x": x,
        "y": y,
        "color": "red", "green", "yellow", or "gray"
      }
    ],
    "north_arrow": true
  }
}

COORDINATE SYSTEM (scene_layout):
- Width: 1400, Height: 1000
- Horizontal Road: y=375 to 625 (center 500)
- Vertical Road: x=575 to 825 (center 700)
- Place buildings and sidewalks proportionally relative to the roads.
- COORDINATE ORDER: Always use [x0, y0, x1, y1] where x1 >= x0 and y1 >= y0.

Analyze buildings, sidewalks, and vehicle headings carefully. Output ONLY the JSON object."""

def get_scene_json_from_vlm(video_path: str) -> dict:
    print(f"Extracting frames from {video_path}...")
    frames, _ = extract_frames(video_path, num_frames=12)
    
    print("Encoding frames and preparing VLM request...")
    current_content = []
    for frame in frames:
        b64 = encode_image(frame)
        current_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
        })
    
    current_content.append({
        "type": "text", 
        "text": "Analyze this accident video in detail including surroundings (buildings, sidewalks) and generate the scene JSON."
    })
    
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": current_content}
        ],
        "max_tokens": 1024,
        "temperature": 0.1
    }
    
    print(f"Sending request to VLM ({LLM_URL})...")
    response = requests.post(LLM_URL, json=payload, headers={"Content-Type": "application/json"})
    response.raise_for_status()
    
    result = response.json()
    content = result["choices"][0]["message"]["content"]
    
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    
    return json.loads(content)

def process_video_to_diagram(video_path: str, output_png: str = "accident_diagram_vlm.png") -> dict:
    """End-to-end processing: Video -> VLM -> JSON -> Render PNG."""
    analysis_data = get_scene_json_from_vlm(video_path)
    render(analysis_data, out_path=output_png)
    return analysis_data

def main():
    if len(sys.argv) < 2:
        video_path = "sample_video.mp4"
    else:
        video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"Error: {video_path} not found.")
        return

    try:
        analysis_data = process_video_to_diagram(video_path)
        print("VLM generated accident analysis:")
        print(json.dumps(analysis_data, indent=2))
        
        with open("accident_analysis.json", "w") as f:
            json.dump(analysis_data, f, indent=2)
        
        print("Rendering diagram...")
        out_path = render(analysis_data, out_path="accident_diagram_vlm.png")
        print(f"Successfully generated diagram: {out_path}")
        print(f"Full analysis saved to accident_analysis.json")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
