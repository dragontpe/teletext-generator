// TelePage - Export Functionality

class TelePageExporter {
  constructor(renderer, crtEffects) {
    this.renderer = renderer;
    this.crtEffects = crtEffects;
  }

  // Export with CRT effects at specified scale
  exportPNG(scale = 3) {
    try {
      const exportCanvas = document.createElement('canvas');
      const w = this.renderer.baseWidth * scale;
      const h = this.renderer.baseHeight * scale;
      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.renderer.canvas, 0, 0, w, h);

      // Apply CRT effects at export resolution
      const effectCanvas = document.createElement('canvas');
      effectCanvas.width = w;
      effectCanvas.height = h;
      const effectCtx = effectCanvas.getContext('2d');
      effectCtx.drawImage(exportCanvas, 0, 0);

      const tempEffects = new CRTEffects(exportCanvas, effectCanvas);
      tempEffects.settings = { ...this.crtEffects.settings };
      tempEffects.apply();

      this._downloadCanvas(effectCanvas, 'telepage-export.png');
    } catch (err) {
      console.error('exportPNG error:', err);
      alert('Export failed: ' + err.message);
    }
  }

  // Export clean (no CRT effects) at specified scale
  exportClean(scale = 3) {
    try {
      const exportCanvas = document.createElement('canvas');
      const w = this.renderer.baseWidth * scale;
      const h = this.renderer.baseHeight * scale;
      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.renderer.canvas, 0, 0, w, h);

      this._downloadCanvas(exportCanvas, 'telepage-clean.png');
    } catch (err) {
      console.error('exportClean error:', err);
      alert('Export failed: ' + err.message);
    }
  }

  // Copy to clipboard
  async copyToClipboard(withEffects = true) {
    try {
      const scale = 3;
      const exportCanvas = document.createElement('canvas');
      const w = this.renderer.baseWidth * scale;
      const h = this.renderer.baseHeight * scale;
      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.renderer.canvas, 0, 0, w, h);

      if (withEffects) {
        const effectCanvas = document.createElement('canvas');
        effectCanvas.width = w;
        effectCanvas.height = h;
        const effectCtx = effectCanvas.getContext('2d');
        effectCtx.drawImage(exportCanvas, 0, 0);

        const tempEffects = new CRTEffects(exportCanvas, effectCanvas);
        tempEffects.settings = { ...this.crtEffects.settings };
        tempEffects.apply();

        return this._canvasToClipboard(effectCanvas);
      }

      return this._canvasToClipboard(exportCanvas);
    } catch (err) {
      console.error('copyToClipboard error:', err);
      return false;
    }
  }

  _downloadCanvas(canvas, filename) {
    // Use blob URL approach with fallbacks
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('toBlob returned null, trying dataURL');
          this._downloadViaDataURL(canvas, filename);
          return;
        }
        const url = URL.createObjectURL(blob);
        this._triggerDownload(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }, 'image/png');
    } else {
      this._downloadViaDataURL(canvas, filename);
    }
  }

  _downloadViaDataURL(canvas, filename) {
    const dataUrl = canvas.toDataURL('image/png');
    this._triggerDownload(dataUrl, filename);
  }

  _triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    // Use a timeout to ensure the element is in the DOM
    setTimeout(() => {
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }, 0);
  }

  async _canvasToClipboard(canvas) {
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('toBlob returned null'));
        }, 'image/png');
      });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    } catch (err) {
      console.error('Clipboard write failed:', err);
      this._downloadCanvas(canvas, 'telepage-export.png');
      return false;
    }
  }
}
