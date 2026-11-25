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
    columns = frameCount,
    flip = false,
  ): boolean {
    const image = this.image(fileName);
    if (!image?.complete || image.naturalWidth === 0) return false;

    const columnCount = Math.max(1, Math.min(frameCount, columns));
    const rowCount = Math.ceil(frameCount / columnCount);
    const frameWidth = image.naturalWidth / columnCount;
    const frameHeight = image.naturalHeight / rowCount;
    const frameIndex = Math.floor(frame % frameCount);
    context.save();
    if (flip) {
      context.translate(x * 2 + width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(
      image,
      (frameIndex % columnCount) * frameWidth,
      Math.floor(frameIndex / columnCount) * frameHeight,
      frameWidth,
      frameHeight,
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
