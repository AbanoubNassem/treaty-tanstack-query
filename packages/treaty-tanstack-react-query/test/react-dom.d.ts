declare module 'react-dom/client' {
  export const hydrateRoot: (...args: any[]) => any;
}

declare module 'react-dom/server' {
  export const renderToString: (...args: any[]) => string;
}

