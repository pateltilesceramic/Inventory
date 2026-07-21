const fs = require('fs');
const { PNG } = require('pngjs');

fs.createReadStream('public/logo-emblem.png')
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;

    // Find bounding box of actual logo pixels
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        if (this.data[idx + 3] > 20) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    console.log(`Original bbox: ${minX},${minY} -> ${maxX},${maxY} (${bboxW}x${bboxH})`);

    // Create intermediate buffer for scaled logo without halo
    const scaledBuf = new Uint8Array(500 * 500 * 4);
    const cx = 250, cy = 250;
    const targetSize = 460; // Scale logo to 460px inside 500x500
    const scale = targetSize / Math.max(bboxW, bboxH);

    for (let y = 0; y < 500; y++) {
      for (let x = 0; x < 500; x++) {
        const origX = minX + (x - (cx - (bboxW * scale) / 2)) / scale;
        const origY = minY + (y - (cy - (bboxH * scale) / 2)) / scale;

        if (origX >= minX && origX <= maxX && origY >= minY && origY <= maxY) {
          const sx = Math.floor(origX);
          const sy = Math.floor(origY);
          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const srcIdx = (width * sy + sx) << 2;
            const a = this.data[srcIdx + 3] / 255;
            if (a > 0) {
              const outIdx = (500 * y + x) << 2;
              const r = this.data[srcIdx];
              const g = this.data[srcIdx + 1];
              const b = this.data[srcIdx + 2];

              scaledBuf[outIdx] = Math.round(r * a);
              scaledBuf[outIdx + 1] = Math.round(g * a);
              scaledBuf[outIdx + 2] = Math.round(b * a);
              scaledBuf[outIdx + 3] = Math.round(a * 255);
            }
          }
        }
      }
    }

    // Now compute Euclidean distance to nearest logo pixel to create crisp white halo stroke
    const outPNG = new PNG({ width: 500, height: 500 });
    const haloRadius = 10; // 10px white protective border around every line

    // Create binary mask of logo pixels
    const logoMask = new Uint8Array(500 * 500);
    for (let i = 0; i < 500 * 500; i++) {
      if (scaledBuf[i * 4 + 3] > 30) {
        logoMask[i] = 1;
      }
    }

    // Distance transform for halo
    for (let y = 0; y < 500; y++) {
      for (let x = 0; x < 500; x++) {
        const idx = (500 * y + x) << 2;
        const a = scaledBuf[idx + 3];

        if (a > 30) {
          // This is a logo pixel - draw original color exactly
          outPNG.data[idx] = scaledBuf[idx];
          outPNG.data[idx + 1] = scaledBuf[idx + 1];
          outPNG.data[idx + 2] = scaledBuf[idx + 2];
          outPNG.data[idx + 3] = a;
        } else {
          // Check distance to nearest logo pixel within haloRadius
          let minSqDist = haloRadius * haloRadius + 1;
          for (let dy = -haloRadius; dy <= haloRadius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= 500) continue;
            for (let dx = -haloRadius; dx <= haloRadius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= 500) continue;
              if (logoMask[500 * ny + nx] === 1) {
                const sqDist = dx * dx + dy * dy;
                if (sqDist < minSqDist) {
                  minSqDist = sqDist;
                }
              }
            }
          }

          if (minSqDist <= haloRadius * haloRadius) {
            // Draw crisp solid white halo around the line
            outPNG.data[idx] = 255;
            outPNG.data[idx + 1] = 255;
            outPNG.data[idx + 2] = 255;
            outPNG.data[idx + 3] = 255;
          } else {
            // Farther than haloRadius -> 100% transparent gap for QR matrix dots!
            outPNG.data[idx] = 255;
            outPNG.data[idx + 1] = 255;
            outPNG.data[idx + 2] = 255;
            outPNG.data[idx + 3] = 0;
          }
        }
      }
    }

    outPNG.pack().pipe(fs.createWriteStream('public/logo-qr-circle.png'))
      .on('finish', () => {
        console.log('Successfully generated halo-outlined logo-qr-circle.png utilizing internal white space for QR matrix dots!');
      });
  });
