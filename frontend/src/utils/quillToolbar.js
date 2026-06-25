const TOOLBAR_TITLES = {
  'ql-bold': 'Bold',
  'ql-italic': 'Italic',
  'ql-underline': 'Underline',
  'ql-strike': 'Strikethrough',
  'ql-blockquote': 'Block quote',
  'ql-link': 'Insert link',
  'ql-image': 'Insert image',
  'ql-clean': 'Clear formatting',
  'ql-list-ordered': 'Numbered list',
  'ql-list-bullet': 'Bullet list',
  'ql-indent-decrease': 'Decrease indent',
  'ql-indent-increase': 'Increase indent',
  'ql-font-picker': 'Font family',
  'ql-size-picker': 'Font size',
  'ql-color-picker': 'Text color',
  'ql-background-picker': 'Highlight color',
  'ql-align-picker': 'Text alignment',
};

const ALIGN_TITLES = {
  '': 'Align left',
  center: 'Align center',
  right: 'Align right',
  justify: 'Justify',
};

const setTitle = (element, title) => {
  if (element && title) {
    element.setAttribute('title', title);
    element.setAttribute('aria-label', title);
  }
};

export const setupToolbarTooltips = (quill) => {
  const toolbar = quill.container?.previousElementSibling;
  if (!toolbar?.classList.contains('ql-toolbar')) return;

  toolbar.querySelectorAll('button.ql-bold').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-bold']));
  toolbar.querySelectorAll('button.ql-italic').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-italic']));
  toolbar.querySelectorAll('button.ql-underline').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-underline']));
  toolbar.querySelectorAll('button.ql-strike').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-strike']));
  toolbar.querySelectorAll('button.ql-blockquote').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-blockquote']));
  toolbar.querySelectorAll('button.ql-link').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-link']));
  toolbar.querySelectorAll('button.ql-image').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-image']));
  toolbar.querySelectorAll('button.ql-clean').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-clean']));

  toolbar.querySelectorAll('button.ql-list[value="ordered"]').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-list-ordered']));
  toolbar.querySelectorAll('button.ql-list[value="bullet"]').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-list-bullet']));
  toolbar.querySelectorAll('button.ql-indent[value="-1"]').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-indent-decrease']));
  toolbar.querySelectorAll('button.ql-indent[value="+1"]').forEach((el) => setTitle(el, TOOLBAR_TITLES['ql-indent-increase']));

  const fontPicker = toolbar.querySelector('.ql-font');
  if (fontPicker) {
    setTitle(fontPicker.querySelector('.ql-picker-label'), TOOLBAR_TITLES['ql-font-picker']);
  }

  const sizePicker = toolbar.querySelector('.ql-size');
  if (sizePicker) {
    setTitle(sizePicker.querySelector('.ql-picker-label'), TOOLBAR_TITLES['ql-size-picker']);
  }

  const colorPicker = toolbar.querySelector('.ql-color');
  if (colorPicker) {
    setTitle(colorPicker.querySelector('.ql-picker-label'), TOOLBAR_TITLES['ql-color-picker']);
  }

  const backgroundPicker = toolbar.querySelector('.ql-background');
  if (backgroundPicker) {
    setTitle(backgroundPicker.querySelector('.ql-picker-label'), TOOLBAR_TITLES['ql-background-picker']);
  }

  const alignPicker = toolbar.querySelector('.ql-align');
  if (alignPicker) {
    setTitle(alignPicker.querySelector('.ql-picker-label'), TOOLBAR_TITLES['ql-align-picker']);
    alignPicker.querySelectorAll('.ql-picker-item').forEach((item) => {
      const value = item.getAttribute('data-value') ?? '';
      setTitle(item, ALIGN_TITLES[value] || 'Text alignment');
    });
  }
};

export const setupQuillToolbar = (quill) => {
  setupToolbarTooltips(quill);
};
