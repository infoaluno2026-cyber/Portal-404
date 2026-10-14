export class AssetLibrary {
  private readonly cache = new Map<string, HTMLImageElement>();

  url(fileName: string): string {
    return new URL(`assets/${fileName}`, document.baseURI).href;
  }

  image(fileName?: string): HTMLImageElement | undefined {
    if (!fileName) return undefined;
    const cached = this.cache.get(fileName);
    if (cached) return cached;

    const image = new Image();
    image.src = this.url(fileName);
    this.cache.set(fileName, image);
    return image;
  }

  drawFrame(
    context: CanvasRenderingContext2D,
    fileName: string | undefined,
    frameCount: number,
    frame: number,
    x: number,
    y: number,
    width: number,
    height: number,
    flip = false,
  ): boolean {
    const image = this.image(fileName);
    if (!image?.complete || image.naturalWidth === 0) return false;

    const frameWidth = image.naturalWidth / Math.max(1, frameCount);
    context.save();
    if (flip) {
      context.translate(x * 2 + width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(
      image,
      Math.floor(frame % frameCount) * frameWidth,
      0,
      frameWidth,
      image.naturalHeight,
      x,
      y,
      width,
      height,
    );
    context.restore();
    return true;
  }
}

export const assets = new AssetLibrary();
