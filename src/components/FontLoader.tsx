import React, { useEffect } from 'react';
import { useStore } from '../store';

export const FontLoader: React.FC = () => {
  const { theme } = useStore();

  useEffect(() => {
    const loadFont = (fontFamily: string) => {
      const match = fontFamily.match(/'([^']+)'/);
      if (!match) return;

      const fontName = match[1];
      if (['Arial', 'Courier New', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS'].includes(fontName)) {
        return;
      }

      const googleFontName = fontName.replace(/ /g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@400;700&display=swap`;

      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    };

    loadFont(theme.frenchFontFamily);
    loadFont(theme.englishFontFamily);

  }, [theme.frenchFontFamily, theme.englishFontFamily]);

  return null;
};
