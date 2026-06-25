import Quill from 'quill';

const FONT_OPTIONS_RAW = [
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Inter',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Source Sans 3',
  'Oswald',
  'Rubik',
  'Work Sans',
  'Mulish',
  'Ubuntu',
  'PT Sans',
  'Noto Sans',
  'Fira Sans',
  'Quicksand',
  'Cabin',
  'Libre Baskerville',
  'Crimson Text',
  'Arimo',
  'Karla',
  'DM Sans',
  'Manrope',
  'Outfit',
  'Plus Jakarta Sans',
  'Space Grotesk',
  'Bitter',
  'EB Garamond',
  'Josefin Sans',
  'Lexend',
  'Barlow',
  'Inconsolata',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
];

export const FONT_OPTIONS = [...FONT_OPTIONS_RAW].sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: 'base' })
);

export const SIZE_OPTIONS = Array.from({ length: 41 }, (_, index) => `${index}px`);

const SYSTEM_FONTS = new Set([
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Helvetica',
  'Trebuchet MS',
  'Palatino Linotype',
  'Garamond',
  'Comic Sans MS',
]);

const escapeCssString = (value) => value.replace(/'/g, "\\'");

const getFontFamilyCss = (font) => {
  if (font.includes(' ')) {
    return `'${font}', sans-serif`;
  }
  return `${font}, sans-serif`;
};

export const getGoogleFontsUrl = () => {
  const googleFonts = FONT_OPTIONS.filter((font) => !SYSTEM_FONTS.has(font));
  const families = googleFonts
    .map((font) => `family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

export const ensureGoogleFontsLoaded = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('editor-google-fonts')) return;

  const link = document.createElement('link');
  link.id = 'editor-google-fonts';
  link.rel = 'stylesheet';
  link.href = getGoogleFontsUrl();
  document.head.appendChild(link);
};

export const injectPickerStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('quill-picker-styles')) return;

  const fontRules = FONT_OPTIONS.map((font) => {
    const escaped = escapeCssString(font);
    const family = getFontFamilyCss(font);
    return `
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='${escaped}']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='${escaped}']::before {
  content: '${escaped}';
  font-family: ${family};
}`;
  }).join('\n');

  const sizeRules = SIZE_OPTIONS.map((size) => {
    const escaped = escapeCssString(size);
    return `
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='${escaped}']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='${escaped}']::before {
  content: '${escaped}';
}`;
  }).join('\n');

  const style = document.createElement('style');
  style.id = 'quill-picker-styles';
  style.textContent = `
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: 'Font';
}
.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: 'Size';
}
${fontRules}
${sizeRules}
`;
  document.head.appendChild(style);
};

const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = SIZE_OPTIONS;
Quill.register(SizeStyle, true);

const FontStyle = Quill.import('attributors/style/font');
FontStyle.whitelist = FONT_OPTIONS;
Quill.register(FontStyle, true);

injectPickerStyles();

export const QUILL_FORMATS = [
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'align',
  'list',
  'indent',
  'blockquote',
  'link',
  'image',
];

export const buildQuillModules = (imageHandler) => ({
  toolbar: {
    container: [
      [{ font: FONT_OPTIONS }],
      [{ size: SIZE_OPTIONS }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote'],
      ['link', 'image'],
      ['clean'],
    ],
    handlers: {
      image: imageHandler,
    },
  },
});

export const sanitizeQuillHtmlForDisplay = (html) => {
  if (!html) return '';
  return html.replace(/&nbsp;/gi, ' ');
};

export const normalizePlainText = (value) => {
  if (!value) return '';

  return value
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim();
};

export const generateExcerpt = (html, maxLength = 200) => {
  const text = normalizePlainText(html);
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

export const getInitialEditorContent = (excerpt, content) => {
  const stripped = content.replace(/<[^>]*>/g, '').trim();
  if (stripped) return content;
  if (excerpt?.trim()) {
    const escaped = excerpt
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p>${escaped}</p>`;
  }
  return '';
};
