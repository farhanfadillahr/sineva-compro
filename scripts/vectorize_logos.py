"""Trace the supplied Sineva PNGs without replacing the wordmark with a font.

Requires Pillow and NumPy. Original 5225-square canvas and contours are kept.
Normal and dark SVGs share byte-identical geometry; only paint stops differ.
"""

from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'brand' / 'logos'
SOURCE = ROOT / 'source'
OUTPUT = ROOT / 'svg'
REPORTS = ROOT / 'reports'
OUTPUT.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)


def unit(v):
    norm = np.linalg.norm(v)
    return v / norm if norm else v


def simplify(points, tolerance=0.2):
    if len(points) < 3:
        return points
    v = points[-1] - points[0]
    length = np.linalg.norm(v)
    delta = points - points[0]
    d = (np.abs(v[0]*delta[:, 1] - v[1]*delta[:, 0]) / length
         if length else np.linalg.norm(points - points[0], axis=1))
    index = int(np.argmax(d))
    if d[index] <= tolerance:
        return points[[0, -1]]
    return np.concatenate((simplify(points[:index+1], tolerance)[:-1],
                           simplify(points[index:], tolerance)))


def fit_curve(points, left, right, tolerance=0.3):
    if len(points) == 2:
        distance = np.linalg.norm(points[1] - points[0]) / 3
        return [np.array([points[0], points[0] + left * distance,
                          points[1] + right * distance, points[1]])]
    distance = np.linalg.norm(np.diff(points, axis=0), axis=1)
    t = np.concatenate(([0.0], np.cumsum(distance)))
    t /= t[-1]
    b = np.stack(((1-t)**3, 3*t*(1-t)**2, 3*t*t*(1-t), t**3), axis=1)
    a0, a1 = b[:, 1, None] * left, b[:, 2, None] * right
    residual = points - ((b[:, 0]+b[:, 1])[:, None] * points[0]
                         + (b[:, 2]+b[:, 3])[:, None] * points[-1])
    matrix = np.array([[np.sum(a0*a0), np.sum(a0*a1)],
                       [np.sum(a0*a1), np.sum(a1*a1)]])
    rhs = np.array([np.sum(a0*residual), np.sum(a1*residual)])
    try:
        alpha = np.linalg.solve(matrix, rhs)
    except np.linalg.LinAlgError:
        alpha = np.array([-1.0, -1.0])
    chord = np.linalg.norm(points[-1] - points[0])
    if min(alpha) < chord * 1e-6 or max(alpha) > np.sum(distance)*2:
        alpha[:] = chord / 3
    curve = np.array([points[0], points[0] + left*alpha[0],
                      points[-1] + right*alpha[1], points[-1]])
    error = np.sum((b @ curve - points)**2, axis=1)
    split = int(np.argmax(error))
    if error[split] <= tolerance*tolerance:
        return [curve]
    split = min(max(split, 1), len(points)-2)
    middle = unit(points[split-1] - points[split+1])
    return (fit_curve(points[:split+1], left, middle, tolerance)
            + fit_curve(points[split:], -middle, right, tolerance))


def contours(alpha):
    """Marching squares with subpixel crossings from the PNG's alpha coverage."""
    p = np.pad(alpha, 1)
    cases = ((p[:-1, :-1] > 127.5).astype(np.uint8)
             + 2*(p[:-1, 1:] > 127.5).astype(np.uint8)
             + 4*(p[1:, 1:] > 127.5).astype(np.uint8)
             + 8*(p[1:, :-1] > 127.5).astype(np.uint8))
    connections = {1:[('T','L')],2:[('T','R')],3:[('L','R')],
                   4:[('R','B')],5:[('T','L'),('R','B')],6:[('T','B')],
                   7:[('L','B')],8:[('L','B')],9:[('T','B')],
                   10:[('T','R'),('L','B')],11:[('R','B')],
                   12:[('L','R')],13:[('T','R')],14:[('T','L')]}
    edges, positions = {}, {}
    for case, pairs in connections.items():
        ys, xs = np.nonzero(cases == case)
        for y, x in zip(ys.tolist(), xs.tolist()):
            keys = {'T':('h',x,y),'R':('v',x+1,y),
                    'B':('h',x,y+1),'L':('v',x,y)}
            for a,b in pairs:
                a,b = keys[a],keys[b]
                edges.setdefault(a,[]).append(b)
                edges.setdefault(b,[]).append(a)
                for key in [a,b]:
                    if key in positions:
                        continue
                    direction, xx, yy = key
                    first = float(p[yy,xx])
                    last = float(p[yy,xx+1] if direction=='h' else p[yy+1,xx])
                    t = (127.5-first)/(last-first)
                    positions[key] = (xx-0.5+(t if direction=='h' else 0),
                                      yy-0.5+(t if direction=='v' else 0))
    loops = []
    while edges:
        start = next(iter(edges))
        current, previous, loop = start, None, []
        while True:
            loop.append(positions[current])
            following = next(n for n in edges[current] if n != previous)
            previous, current = current, following
            if current == start:
                break
        for key in [start]:
            current, previous = key, None
            while True:
                following = next(n for n in edges[current] if n != previous)
                del edges[current]
                previous, current = current, following
                if current == start:
                    break
        if len(loop) >= 12:
            loops.append(np.array(loop, dtype=float))
    return sorted(loops, key=len, reverse=True)


def path_from_contour(points):
    # Split a closed contour into two open runs for stable cubic fitting.
    first = int(np.argmin(points[:, 0] + points[:, 1]))
    points = np.roll(points, -first, axis=0)
    second = int(np.argmax(np.sum((points-points[0])**2, axis=1)))
    runs = [points[:second+1], np.concatenate((points[second:], points[:1]))]
    curves = []
    for run in runs:
        run = simplify(run)
        # Validate the fitted curve between simplified vertices too. Sparse
        # endpoints alone can permit a Bézier handle to overshoot a corner.
        dense = []
        for a, b in zip(run[:-1], run[1:]):
            steps = max(1, int(np.ceil(np.linalg.norm(b-a)/2)))
            dense.extend(a+(b-a)*t for t in np.linspace(0, 1, steps, endpoint=False))
        run = np.array(dense+[run[-1]])
        curves.extend(fit_curve(run, unit(run[1]-run[0]), unit(run[-2]-run[-1])))
    fmt = lambda p: f'{p[0]:.3f},{p[1]:.3f}'
    return ('M'+fmt(curves[0][0]) + ''.join('C'+fmt(c[1])+' '+fmt(c[2])+' '+fmt(c[3])
                                         for c in curves) + 'Z', len(curves))


def gradient(region, rgba, y0, y1):
    ys, xs = np.where(rgba[y0:y1, :, 3] == 255)
    ys += y0
    step = max(1, len(xs)//120000)
    xs, ys = xs[::step], ys[::step]
    colors = rgba[ys, xs, :3].astype(float)
    positions = np.stack((np.ones(len(xs)), xs+0.5, ys+0.5), axis=1)
    beta = np.linalg.lstsq(positions, colors, rcond=None)[0]
    # Green and blue remain linear even where the original red is clamped at 0.
    direction = unit(-beta[1:, 1])
    projection = positions[:, 1:] @ direction
    lo, hi = float(projection.min()), float(projection.max())
    sample_stops = []
    for t in np.linspace(0, 1, 33):
        selected = np.abs(projection - (lo+t*(hi-lo))) < (hi-lo)/128
        if np.count_nonzero(selected) < 12:
            selected = np.argsort(np.abs(projection-(lo+t*(hi-lo))))[:100]
        x = np.stack((np.ones(np.size(projection[selected])), projection[selected]), axis=1)
        coefficients = np.linalg.lstsq(x, colors[selected], rcond=None)[0]
        color = np.clip(np.rint(np.array([1, lo+t*(hi-lo)]) @ coefficients), 0, 255).astype(int)
        sample_stops.append((float(t), color.tolist()))
    start, end = direction*lo, direction*hi
    return {'id':region,'start':start.tolist(),'end':end.tolist(),'stops':sample_stops}


def gradient_xml(g, dark):
    stops = []
    for t, rgb in g['stops']:
        if dark:
            # Preserve the original gradient ordering/hue, lift all RGB channels.
            rgb = np.rint(np.array(rgb)*0.30 + np.array([183, 236, 234])*0.70).astype(int).tolist()
        color = '#'+''.join(f'{c:02x}' for c in rgb)
        stops.append(f'<stop offset="{t:.5f}" stop-color="{color}"/>')
    x1,y1 = g['start']; x2,y2 = g['end']
    return (f'<linearGradient id="{g["id"]}" gradientUnits="userSpaceOnUse" '
            f'x1="{x1:.4f}" y1="{y1:.4f}" x2="{x2:.4f}" y2="{y2:.4f}">'
            + ''.join(stops) + '</linearGradient>')


def main():
    report = {'figma':'https://www.figma.com/design/vdG8pTacFcbDnEUb8cjBDM',
              'method':'Alpha contour tracing + fitted cubic Bézier paths; original wordmark outlined',
              'contourSimplificationSourcePixels':0.2,'curveFittingSourcePixels':0.3,
              'originalCanvas':[5225,5225],'assetRoot':'..','assets':[]}
    for source, name, regions in [
        ('Sineva_Logo.png','sineva-symbol',[('symbol',0,5225)]),
        ('Sineva_Stacked_Wordmark_With_Logo.png','sineva-stacked',[('symbol',0,3000),('wordmark',3000,5225)])
    ]:
        rgba = np.asarray(Image.open(SOURCE/source).convert('RGBA'))
        paths, gradients, curve_count = [], [], 0
        for region, y0, y1 in regions:
            alpha = rgba[:,:,3].copy()
            alpha[:y0] = 0; alpha[y1:] = 0
            loops = contours(alpha)
            for i, loop in enumerate(loops):
                path, count = path_from_contour(loop)
                paths.append(f'<path id="{region}-{i+1}" fill="url(#{region})" fill-rule="evenodd" d="{path}"/>')
                curve_count += count
            gradients.append(gradient(region, rgba, y0, y1))
        # Each shape's holes are in the same compound path so transparency stays intact.
        for region,_,_ in regions:
            region_paths = [p for p in paths if p.startswith(f'<path id="{region}-')]
            joined = ''.join(ET.fromstring(p).attrib['d'] for p in region_paths)
            paths = [p for p in paths if p not in region_paths]
            paths.append(f'<path id="{region}" fill="url(#{region})" fill-rule="evenodd" d="{joined}"/>')
        geometry = '\n'.join(paths)
        files = []
        for dark in [False,True]:
            filename = name+('-dark' if dark else '-original')+'.svg'
            svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="5225" height="5225" viewBox="0 0 5225 5225" role="img" aria-labelledby="title">\n'
                   '<title id="title">Sineva '+('symbol' if name=='sineva-symbol' else 'stacked logo')+(' — dark mode' if dark else '')+'</title>\n'
                   '<defs>'+''.join(gradient_xml(g,dark) for g in gradients)+'</defs>\n'+geometry+'\n</svg>\n')
            (OUTPUT/filename).write_text(svg)
            files.append('svg/'+filename)
        report['assets'].append({'source':'source/'+source,'files':files,'curves':curve_count,
                                 'geometrySha256':hashlib.sha256(geometry.encode()).hexdigest(),
                                 'sourceSha256':hashlib.sha256((SOURCE/source).read_bytes()).hexdigest()})
        print(name,curve_count,'cubic segments',flush=True)
    (REPORTS/'trace-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
