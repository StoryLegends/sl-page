export const renderCustomPageHtml = (htmlContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @font-face {
        font-family: 'Minecraft';
        src: url('/fonts/Minecraft.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }
    body {
      margin: 0;
      background: transparent;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
    
    .sl-content-wrapper {
      width: 100%;
      /* Default Tailwind base reset handles rest */
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
</body>
</html>
`;
