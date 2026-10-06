// The single-page Expo export does not render +html.tsx. Keep browser refinements
// here as well, without changing the native app or Metro configuration.
export default function WebAppearance() {
  return (
    <style>{`
      html,body,#root{height:100%;width:100%;margin:0;background:#F4F7FA}
      #root{display:flex;flex:1;min-height:0}
      *{-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
      button,[role="button"],a{cursor:pointer;touch-action:manipulation}
      :focus-visible{outline:3px solid #1261E8;outline-offset:3px}
      ::selection{background:#B9F3D7;color:#112D46}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-thumb{background:#BACAD7;border-radius:8px}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}}
    `}</style>
  );
}
