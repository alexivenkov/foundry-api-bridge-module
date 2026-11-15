export interface SceneImage {
  /** Base64, without a data-URL prefix. */
  readonly data: string;
  readonly mimeType: string;
  readonly width: number;
  readonly height: number;
}

/** A picture of the canvas, with the scene that was on it. */
export interface ViewportCapture {
  readonly sceneId: string;
  readonly sceneName: string;
  readonly image: SceneImage;
}
