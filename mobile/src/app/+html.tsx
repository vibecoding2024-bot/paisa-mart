import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#112D46" />
        <meta
          name="description"
          content="Explore banking, credit cards, loans, and insurance with Paisa Mart. Discover products, support your customers, and grow your business."
        />
        <title>Paisa Mart — Your financial growth partner</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
      html,body,#root{height:100%;width:100%;margin:0;padding:0;background:#F4F7FA}
      html,body{overflow:hidden} #root{display:flex;flex:1;min-height:0}
      *{-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
      button,[role="button"],a{cursor:pointer;touch-action:manipulation}
      :focus-visible{outline:3px solid #1261E8;outline-offset:3px}
      ::selection{background:#B9F3D7;color:#112D46}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-thumb{background:#BACAD7;border-radius:8px}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}}
    `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
