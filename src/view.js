import onChange from 'on-change';

const renderForm = (state, elements) => {
  const { input, feedback } = elements;

  if (state.errors.length > 0) {
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    feedback.textContent = state.errors;
  } else {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
  }
};

const renderLocales = (i18nextInstance) => {
  document.querySelector('title').textContent = i18nextInstance.t('title');
  document.querySelector('h1').textContent = i18nextInstance.t('header');
  document.querySelector('.lead').textContent = i18nextInstance.t('lead');
  document.querySelector('label[for="url-input"]').textContent = i18nextInstance.t('url_input');
  document.querySelector('button[type="submit"').textContent = i18nextInstance.t('button');
  document.querySelector('.mt-2').textContent = i18nextInstance.t('example');
  document.querySelector('.footer .text-center').childNodes[0].textContent = i18nextInstance.t('created_by');
};

const renderLanguageButtons = (currentLanguage) => {
  const ruButton = document.querySelector('label[data-lng="ru"]');
  const enButton = document.querySelector('label[data-lng="en"]');

  switch (currentLanguage) {
    case 'ru':
      ruButton.classList.add('active');
      enButton.classList.remove('active');
      break;
    case 'en':
      enButton.classList.add('active');
      ruButton.classList.remove('active');
      break;
    default:
      ruButton.classList.add('active');
      enButton.classList.remove('active');
  }
};

const render = (state, elements, i18nextInstance) => {
  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'errors':
        renderForm(state, elements);
        break;
      case 'currentLanguage':
        renderLocales(i18nextInstance);
        renderLanguageButtons(state.currentLanguage);
        break;
      default:
        break;
    }
  });
  renderLocales(i18nextInstance);
  renderLanguageButtons(state.currentLanguage);
  return watchedState;
};

export default render;
