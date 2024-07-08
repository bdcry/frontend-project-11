import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import i18next from 'i18next';
import initView from './view';
import resources from './locales/index';

const i18nextInstance = i18next.createInstance();
await i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources,
});

const createSchema = (feeds) => yup
  .string()
  .required()
  .url(i18nextInstance.t('errors.url'))
  .notOneOf(feeds, i18nextInstance.t('errors.notOneOf'));
// notOneOf - принимает на вход массив запрещенных значений (фидов)

const state = {
  currentLanguage: 'en',
  url: '',
  errors: [],
  feeds: [], // добавленные ссылки для проверки дубликатов
};

const input = document.getElementById('url-input');
const form = document.querySelector('.rss-form');
const feedback = document.querySelector('.feedback');

const watchedState = initView(state);

const handleInputChange = (e) => {
  watchedState.url = e.target.value;
};

const validate = (url, feeds) => {
  const schema = createSchema(feeds);
  return schema
    .validate(url, { abortEarly: false })
    .then(() => ({}))
    .catch((e) => keyBy(e.inner, 'path'));
};

const handleSubmit = (e) => {
  e.preventDefault();

  const { url } = watchedState;

  validate(url, watchedState.feeds)
    .then((errors) => {
      // Проверка валидации
      // если что-то не так, то будем собирать ошибки в копии состояния
      if (Object.keys(errors).length > 0) {
        watchedState.errors = Object.values(errors).map((err) => err.message);
        return;
      }

      // Если все ок, то пушим в фиды наш RSS
      watchedState.feeds.push(url);
      watchedState.url = '';
      input.value = '';
      input.focus();
      watchedState.errors = [];
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18nextInstance.t('messages.success');
    })
    .catch((err) => {
      watchedState.errors = err.message;
    });
};

input.addEventListener('input', handleInputChange);
form.addEventListener('submit', handleSubmit);

const initLocales = () => {
  document.querySelector('title').textContent = i18nextInstance.t('title');
  document.querySelector('h1').textContent = i18nextInstance.t('header');
  document.querySelector('.lead').textContent = i18nextInstance.t('lead');
  document.querySelector('label[for="url-input"]').textContent = i18nextInstance.t('url_input');
  document.querySelector('button[type="submit"').textContent = i18nextInstance.t('button');
  document.querySelector('.mt-2').textContent = i18nextInstance.t('example');
  document.querySelector('.footer .text-center').childNodes[0].textContent = i18nextInstance.t('created_by');
};

initLocales();

document.querySelector('label[data-lng="ru"]').addEventListener('click', () => {
  i18nextInstance.changeLanguage('ru');
  watchedState.currentLanguage = 'ru';
  initLocales();
});

document.querySelector('label[data-lng="en"]').addEventListener('click', () => {
  i18nextInstance.changeLanguage('en');
  watchedState.currentLanguage = 'en';
  initLocales();
});
