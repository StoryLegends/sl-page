export const renderCustomPageHtml = (htmlContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <style>
    @font-face {
        font-family: 'Minecraft';
        src: url('/fonts/Minecraft.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: transparent !important;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
    
    .sl-content-wrapper {
      width: 100%;
    }
    /* Style scrollbars to match the main site */
    ::-webkit-scrollbar {
        width: 8px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body>
  <div class="sl-content-wrapper">
    ${htmlContent}
  </div>
  <script>
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'iframeHeight', height }, '*');
    };
    window.addEventListener('load', sendHeight);
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    setInterval(sendHeight, 1000);
  </script>
</body>
</html>
`;
