// TelePage - CRT Post-Processing Effects

class CRTEffects {
  constructor(sourceCanvas, effectsCanvas) {
    this.source = sourceCanvas;
    this.canvas = effectsCanvas;
    this.ctx = effectsCanvas.getContext('2d');

    this.settings = {
      scanlines: true,
      scanlineIntensity: 0.4,
      glow: true,
      glowIntensity: 0.3,
      vignette: true,
      vignetteIntensity: 0.5,
      barrel: true,
      barrelIntensity: 0.2,
      bleed: true,
      bleedIntensity: 0.25,
      noise: true,
      noiseIntensity: 0.15
    };
  }

  apply() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    // Start with source image
    this.ctx.drawImage(this.source, 0, 0, w, h);

    // Check if any effects enabled
    const anyEnabled = this.settings.scanlines || this.settings.glow ||
                       this.settings.vignette || this.settings.barrel ||
                       this.settings.bleed || this.settings.noise;
    if (!anyEnabled) return;

    // Apply barrel distortion first (modifies pixel positions)
    if (this.settings.barrel && this.settings.barrelIntensity > 0) {
      this.applyBarrelDistortion();
    }

    // Color bleed (chromatic aberration)
    if (this.settings.bleed && this.settings.bleedIntensity > 0) {
      this.applyColorBleed();
    }

    // Phosphor glow
    if (this.settings.glow && this.settings.glowIntensity > 0) {
      this.applyGlow();
    }

    // Scanlines
    if (this.settings.scanlines && this.settings.scanlineIntensity > 0) {
      this.applyScanlines();
    }

    // Noise
    if (this.settings.noise && this.settings.noiseIntensity > 0) {
      this.applyNoise();
    }

    // Vignette (always last, darkens edges)
    if (this.settings.vignette && this.settings.vignetteIntensity > 0) {
      this.applyVignette();
    }
  }

  applyScanlines() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const intensity = this.settings.scanlineIntensity;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.5})`;
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }

  applyGlow() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const intensity = this.settings.glowIntensity;

    // Create a blurred copy and composite with screen blend
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw current state at reduced size for blur effect, then scale back
    const blurScale = 0.25;
    tempCtx.drawImage(this.canvas, 0, 0, w * blurScale, h * blurScale);
    tempCtx.drawImage(tempCanvas, 0, 0, w * blurScale, h * blurScale, 0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = intensity * 0.6;
    ctx.filter = 'blur(4px)';
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
  }

  applyVignette() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const intensity = this.settings.vignetteIntensity;

    const gradient = ctx.createRadialGradient(
      w / 2, h / 2, w * 0.25,
      w / 2, h / 2, w * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.8})`);

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  applyBarrelDistortion() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const strength = this.settings.barrelIntensity * 0.15;

    const srcData = this.ctx.getImageData(0, 0, w, h);
    const dstData = this.ctx.createImageData(w, h);
    const src = srcData.data;
    const dst = dstData.data;

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) / cx;
        const dy = (y - cy) / cy;
        const r2 = dx * dx + dy * dy;
        const distort = 1 + r2 * strength;
        const srcX = Math.round(cx + dx * distort * cx);
        const srcY = Math.round(cy + dy * distort * cy);

        const dstIdx = (y * w + x) * 4;
        if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
          const srcIdx = (srcY * w + srcX) * 4;
          dst[dstIdx] = src[srcIdx];
          dst[dstIdx + 1] = src[srcIdx + 1];
          dst[dstIdx + 2] = src[srcIdx + 2];
          dst[dstIdx + 3] = src[srcIdx + 3];
        }
      }
    }

    this.ctx.putImageData(dstData, 0, 0);
  }

  applyColorBleed() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const offset = Math.round(this.settings.bleedIntensity * 3);
    if (offset < 1) return;

    const srcData = this.ctx.getImageData(0, 0, w, h);
    const dstData = this.ctx.createImageData(w, h);
    const src = srcData.data;
    const dst = dstData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        // Red channel shifted right
        const rxSrc = Math.min(x + offset, w - 1);
        const rIdx = (y * w + rxSrc) * 4;
        dst[idx] = src[rIdx];

        // Green channel stays
        dst[idx + 1] = src[idx + 1];

        // Blue channel shifted left
        const bxSrc = Math.max(x - offset, 0);
        const bIdx = (y * w + bxSrc) * 4;
        dst[idx + 2] = src[bIdx + 2];

        dst[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(dstData, 0, 0);
  }

  applyNoise() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const intensity = this.settings.noiseIntensity;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const noiseAmount = intensity * 40;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * noiseAmount;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Render to a target canvas at a specific scale (for export)
  renderToCanvas(targetCanvas, scale = 1) {
    const w = this.source.width * scale;
    const h = this.source.height * scale;
    targetCanvas.width = w;
    targetCanvas.height = h;
    const ctx = targetCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Draw source scaled up
    ctx.drawImage(this.source, 0, 0, w, h);

    // Temporarily resize our working canvas
    const origW = this.canvas.width;
    const origH = this.canvas.height;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');

    // Apply effects at export resolution
    this.ctx.drawImage(this.source, 0, 0, w, h);
    const anyEnabled = this.settings.scanlines || this.settings.glow ||
                       this.settings.vignette || this.settings.barrel ||
                       this.settings.bleed || this.settings.noise;
    if (anyEnabled) {
      if (this.settings.barrel && this.settings.barrelIntensity > 0) this.applyBarrelDistortion();
      if (this.settings.bleed && this.settings.bleedIntensity > 0) this.applyColorBleed();
      if (this.settings.glow && this.settings.glowIntensity > 0) this.applyGlow();
      if (this.settings.scanlines && this.settings.scanlineIntensity > 0) this.applyScanlines();
      if (this.settings.noise && this.settings.noiseIntensity > 0) this.applyNoise();
      if (this.settings.vignette && this.settings.vignetteIntensity > 0) this.applyVignette();
    }

    // Copy to target
    ctx.drawImage(this.canvas, 0, 0);

    // Restore original size
    this.canvas.width = origW;
    this.canvas.height = origH;
    this.ctx = this.canvas.getContext('2d');
  }
}

// CRT Effect Presets
const CRT_PRESETS = {
  clean: {
    scanlines: false, scanlineIntensity: 0,
    glow: false, glowIntensity: 0,
    vignette: false, vignetteIntensity: 0,
    barrel: false, barrelIntensity: 0,
    bleed: false, bleedIntensity: 0,
    noise: false, noiseIntensity: 0
  },
  mild: {
    scanlines: true, scanlineIntensity: 0.2,
    glow: true, glowIntensity: 0.15,
    vignette: true, vignetteIntensity: 0.3,
    barrel: false, barrelIntensity: 0,
    bleed: true, bleedIntensity: 0.1,
    noise: false, noiseIntensity: 0
  },
  authentic: {
    scanlines: true, scanlineIntensity: 0.4,
    glow: true, glowIntensity: 0.3,
    vignette: true, vignetteIntensity: 0.5,
    barrel: true, barrelIntensity: 0.2,
    bleed: true, bleedIntensity: 0.25,
    noise: true, noiseIntensity: 0.15
  },
  beatup: {
    scanlines: true, scanlineIntensity: 0.6,
    glow: true, glowIntensity: 0.5,
    vignette: true, vignetteIntensity: 0.7,
    barrel: true, barrelIntensity: 0.35,
    bleed: true, bleedIntensity: 0.5,
    noise: true, noiseIntensity: 0.35
  }
};
