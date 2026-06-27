declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
declare module "*.css?url" {
  const url: string;
  export default url;
}
declare module '*.mp4' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}