import json
import math
import textwrap
from PIL import Image, ImageDraw, ImageFont

W, H_SCENE = 1400, 1000
H_PANEL = 550
W_TOTAL, H_TOTAL = W, H_SCENE + H_PANEL
OUT = "accident_diagram.png"

ROAD_GRAY = (140, 140, 140)
STRIPING = (245, 245, 245)
YELLOW_STRIPE = (245, 215, 0)
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)
DARK = (60, 60, 60)
CAR_BODY = (235, 235, 235)
RED_TEXT = (180, 0, 0)
BUILDING_FILL = (210, 210, 220)
SIDEWALK_FILL = (180, 180, 180)

def normalize_rect(pos):
    """Normalize [x0, y0, x1, y1] to ensure x1 >= x0 and y1 >= y0."""
    x0, y0, x1, y1 = pos
    return [min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)]

def load_font(size=24, bold=False):
    fonts = ["C:\\Windows\\Fonts\\arial.ttf", "C:\\Windows\\Fonts\\segoeui.ttf"]
    if bold:
        fonts = ["C:\\Windows\\Fonts\\arialbd.ttf", "C:\\Windows\\Fonts\\segoeuib.ttf"]
    for path in fonts:
        try:
            return ImageFont.truetype(path, size=size)
        except:
            pass
    return ImageFont.load_default()

def draw_dashed_line(draw, x1, y1, x2, y2, dash=24, gap=16, fill=STRIPING, width=4):
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0: return
    n = int(length // (dash + gap)) + 1
    for i in range(n):
        s = i * (dash + gap)
        e = min(s + dash, length)
        xs, ys = x1 + (x2 - x1) * s / length, y1 + (y2 - y1) * s / length
        xe, ye = x1 + (x2 - x1) * e / length, y1 + (y2 - y1) * e / length
        draw.line((xs, ys, xe, ye), fill=fill, width=width)

def draw_vehicle(draw, cx, cy, L, W_v, angle_deg, fill=CAR_BODY, label="V"):
    angle = math.radians(angle_deg)
    # Body points
    pts = [(-L/2, -W_v/2), (L/2, -W_v/2), (L/2, W_v/2), (-L/2, W_v/2)]
    def rotate(p):
        xr = p[0] * math.cos(angle) - p[1] * math.sin(angle) + cx
        yr = p[0] * math.sin(angle) + p[1] * math.cos(angle) + cy
        return (xr, yr)
    
    poly = [rotate(p) for p in pts]
    draw.polygon(poly, fill=fill, outline=DARK, width=2)
    
    # Windshield
    ws_pts = [(L/10, -W_v*0.4), (L/3, -W_v*0.4), (L/3, W_v*0.4), (L/10, W_v*0.4)]
    ws_poly = [rotate(p) for p in ws_pts]
    draw.polygon(ws_poly, fill=(200, 220, 240), outline=DARK)
    
    # Headlights
    for dy in [-W_v*0.4, W_v*0.4]:
        hx, hy = rotate((L/2, dy))
        draw.ellipse([hx-4, hy-4, hx+4, hy+4], fill=(255, 255, 200), outline=DARK)

def draw_wrapped_text(draw, text, x, y, max_width, font, fill=BLACK, spacing=8):
    if not text: return y
    lines = textwrap.wrap(text, width=int(max_width / (font.size * 0.55)))
    curr_y = y
    for line in lines:
        draw.text((x, curr_y), line, font=font, fill=fill)
        curr_y += font.size + spacing
    return curr_y

def render(data, out_path=OUT):
    img = Image.new("RGB", (W_TOTAL, H_TOTAL), (240, 240, 240))
    draw = ImageDraw.Draw(img)
    f_s, f_m, f_mb, f_b, f_bb = load_font(22), load_font(28), load_font(28, True), load_font(38), load_font(38, True)

    scene = data.get("scene_layout", data)
    
    # Sidewalks (optional)
    for sw in scene.get("sidewalks", []):
        draw.rectangle(normalize_rect(sw["position"]), fill=SIDEWALK_FILL)

    # Roads
    for road in scene.get("road_segments", []):
        pos = normalize_rect(road["position"]) # [x1, y1, x2, y2]
        draw.rectangle(pos, fill=ROAD_GRAY)
        # Detailed striping
        if road.get("orientation") == "horizontal":
            mid_y = (pos[1] + pos[3]) // 2
            draw.line((pos[0], mid_y-2, pos[2], mid_y-2), fill=YELLOW_STRIPE, width=3)
            draw.line((pos[0], mid_y+2, pos[2], mid_y+2), fill=YELLOW_STRIPE, width=3)
        else:
            mid_x = (pos[0] + pos[2]) // 2
            draw.line((mid_x-2, pos[1], mid_x-2, pos[3]), fill=YELLOW_STRIPE, width=3)
            draw.line((mid_x+2, pos[1], mid_x+2, pos[3]), fill=YELLOW_STRIPE, width=3)
        draw.text((pos[0] + 15, pos[1] + 15), road.get("name", ""), font=f_mb, fill=WHITE)

    # Buildings
    for bld in scene.get("buildings", []):
        pos = normalize_rect(bld["position"])
        draw.rectangle(pos, fill=BUILDING_FILL, outline=DARK, width=2)
        bx = (pos[0] + pos[2]) // 2
        by = (pos[1] + pos[3]) // 2
        draw.text((bx - 40, by - 15), bld.get("name", "Building"), font=f_s, fill=DARK)

    # Vehicles
    inv_map = {str(v["id"]): v for v in data.get("involvement", [])}
    for v in scene.get("vehicles", []):
        x, y = v.get("x"), v.get("y")
        if x and y:
            draw_vehicle(draw, x, y, v.get("length", 110), v.get("width", 50), v.get("heading", 0))
            label = f"V{v['id']}"
            if str(v['id']) in inv_map: label += f" ({inv_map[str(v['id'])].get('role','')})"
            draw.text((x + 10, y - 55), label, font=f_mb, fill=BLACK)

    # Analysis Panel
    py = H_SCENE
    draw.rectangle([0, py, W_TOTAL, H_TOTAL], fill=WHITE)
    draw.line((0, py, W_TOTAL, py), fill=BLACK, width=6)
    margin, cy = 60, py + 40
    
    if "accident_summary" in data:
        draw.text((margin, cy), "ACCIDENT SUMMARY", font=f_bb, fill=BLACK)
        cy = draw_wrapped_text(draw, data["accident_summary"], margin, cy + 60, W_TOTAL - 2*margin, f_m) + 40

    if "fault_assessment" in data:
        f = data["fault_assessment"]
        draw.rectangle([margin - 20, cy - 10, W_TOTAL - margin + 20, cy + 220], fill=(255, 245, 245), outline=RED_TEXT, width=3)
        draw.text((margin, cy + 10), "FAULT ASSESSMENT", font=f_mb, fill=RED_TEXT)
        draw.text((margin + 300, cy + 10), f"At-Fault: Vehicle {f.get('at_fault_vehicle_id', 'Unknown')}", font=f_mb, fill=BLACK)
        draw_wrapped_text(draw, f.get("rationale", ""), margin, cy + 60, W_TOTAL - 2*margin, f_s)

    # Callouts
    for i, call in enumerate(data.get("annotations", [])):
        cx, cy_a, txt = call.get("x", 0), call.get("y", 0), call.get("text", "")
        if cx and cy_a:
            draw.ellipse([cx-12, cy_a-12, cx+12, cy_a+12], fill=RED_TEXT)
            draw.text((cx-6, cy_a-12), str(i+1), font=f_s, fill=WHITE)
            draw.line((cx, cy_a, cx + 50, cy_a - 50), fill=RED_TEXT, width=2)
            draw.text((cx + 55, cy_a - 70), txt, font=f_s, fill=RED_TEXT)

    # North Arrow
    nx, ny = 1300, 80
    draw.line((nx, ny + 80, nx, ny), fill=BLACK, width=8)
    draw.polygon([(nx - 18, ny + 25), (nx + 18, ny + 25), (nx, ny)], fill=BLACK)
    draw.text((nx - 14, ny + 85), "N", font=f_bb, fill=BLACK)

    draw.text((30, 25), "ACCIDENT SCENE DIAGRAM", font=f_bb, fill=BLACK)
    img.save(out_path); return out_path

if __name__ == "__main__":
    jp = "accident_analysis.json"
    import os
    if os.path.exists(jp):
        with open(jp, "r") as f: render(json.load(f))
        print(f"Generated {OUT}")