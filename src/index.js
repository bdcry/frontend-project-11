import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import i18next from 'i18next';
import axios from 'axios';
import render from './view';
import resources from './locales/index';
import parseRSS from './parser';

const i18nextInstance = i18next.createInstance();
await i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources,
});

const fetchRSS = (url) => axios
  .get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
  .then((response) => response.data.contents)
  .catch((error) => {
    console.log('Error fetching RSS data:', error);
  });

const createSchema = (feeds) => yup
  .string()
  .required()
  .url(i18nextInstance.t('errors.url'))
  .notOneOf(feeds, i18nextInstance.t('errors.notOneOf'));
// notOneOf - принимает на вход массив запрещенных значений (фидов)

const state = {
  currentLanguage: 'ru',
  url: '',
  errors: [],
  feeds: [], // добавленные ссылки для проверки дубликатов
  posts: [],
};

const input = document.getElementById('url-input');
const form = document.querySelector('.rss-form');
const feedback = document.querySelector('.feedback');
const elements = { input, form, feedback };

const watchedState = render(state, elements, i18nextInstance);

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
      // если что-то не так, то будем собирать ошибки в состоянии
      if (Object.keys(errors).length > 0) {
        watchedState.errors = Object.values(errors).map((err) => err.message);
        return;
      }

      fetchRSS(url)
        .then((fetchData) => {
          const parsedData = parseRSS(fetchData);
          console.log('Parsed RSS data:', parsedData);
          const { title, description, posts } = parsedData;
          // Если все ок, то пушим в фиды и в посты наши данные
          const feed = { title, description, link: url };
          watchedState.feeds.push(feed);
          watchedState.posts.push(posts);
          console.log('Feeds', state.feeds);
          console.log('Posts', state.posts);
          watchedState.url = '';
          input.value = '';
          input.focus();
          watchedState.errors = [];
          feedback.classList.remove('text-danger');
          feedback.classList.add('text-success');
          feedback.textContent = i18nextInstance.t('messages.success');
        })
        .catch((error) => {
          watchedState.errors = error.message;
        });
    })
    .catch((err) => {
      watchedState.errors = err.message;
    });
};

input.addEventListener('input', handleInputChange);
form.addEventListener('submit', handleSubmit);

document.querySelector('label[data-lng="ru"]').addEventListener('click', () => {
  i18nextInstance.changeLanguage('ru');
  watchedState.currentLanguage = 'ru';
});

document.querySelector('label[data-lng="en"]').addEventListener('click', () => {
  i18nextInstance.changeLanguage('en');
  watchedState.currentLanguage = 'en';
});
