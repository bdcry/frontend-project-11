import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import i18next from 'i18next';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import render from './view';
import resources from './locales/index';
import parseRSS from './parser';

const generateId = () => uuidv4();

const i18nextInstance = i18next.createInstance();
await i18nextInstance.init({
  lng: 'ru',
  debug: true,
  resources,
});

const fetchRSS = (url) => axios
  .get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}&disableCache=true`)
  .then((response) => response.data.contents)
  .catch((error) => {
    console.log('Error fetching RSS data:', error);
  });

const createSchema = (feeds) => yup
  .string()
  .required()
  .url(i18nextInstance.t('errors.url'))
  .notOneOf(
    feeds.map((feed) => feed.link),
    i18nextInstance.t('errors.notOneOf'),
  );
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

const checkForUpdates = () => {
  const { posts, feeds } = state;

  const fetchFeedUpdates = (feed) => {
    fetchRSS(feed.link)
      .then((fetchData) => {
        const parsedData = parseRSS(
          fetchData,
          i18nextInstance,
          watchedState,
          generateId,
        );
        if (parsedData) {
          const { posts: newPosts } = parsedData;
          const actualTitles = posts.map((post) => post.title);
          const filteredPosts = newPosts.filter((newPost) => !actualTitles.includes(newPost.title));
          // console.log(actualTitles);
          console.log('Выводим новые посты:', newPosts);
          console.log('Выводим отфильтрованные посты:', filteredPosts);

          if (filteredPosts.length > 0) {
            watchedState.posts.push(...filteredPosts);
            // console.log('Выводим состояние с новыми постами:', watchedState.posts);
          }
        }
      })
      .catch((err) => {
        console.log('Error fetching feed updates:', err);
      });
  };
  feeds.forEach((feed) => {
    fetchFeedUpdates(feed);
  });

  setTimeout(checkForUpdates, 5000);
};

const handleSubmit = (e) => {
  e.preventDefault();

  const sumbitDocBtn = form.querySelector('button[type="submit"]');
  sumbitDocBtn.disabled = true;

  const { url, feeds } = watchedState;

  validate(url, feeds)
    .then((errors) => {
      // Проверка валидации
      // если что-то не так, то будем собирать ошибки в состоянии
      if (Object.keys(errors).length > 0) {
        watchedState.errors = Object.values(errors).map((err) => err.message);
        sumbitDocBtn.disabled = false;
        return;
      }

      fetchRSS(url)
        .then((fetchData) => {
          const parsedData = parseRSS(
            fetchData,
            i18nextInstance,
            watchedState,
            generateId,
          );
          if (parsedData) {
            console.log('Parsed RSS data:', parsedData);
            const { title, description, posts } = parsedData;
            // Если все ок, то пушим в фиды и в посты наши данные
            const feed = { title, description, link: url };
            feeds.push(feed);
            watchedState.posts.push(...posts.flatMap((postArray) => postArray));
            // разбиваем данные на отдельные части, тк без спред оператора
            // приходит вложенный массив, который мы не можем посмотреть
            // console.log('Feeds', state.feeds);
            // console.log('Posts', state.posts);
            // console.log('Состояние', state);
            watchedState.url = '';
            input.value = '';
            input.focus();
            watchedState.errors = [];
            feedback.classList.remove('text-danger');
            feedback.classList.add('text-success');
            feedback.textContent = i18nextInstance.t('messages.success');
            checkForUpdates();
            setTimeout(() => {
              sumbitDocBtn.disabled = false;
            }, '3000');
          }
        })
        .catch((error) => {
          watchedState.errors = error.message;
          sumbitDocBtn.disabled = false;
        });
    })
    .catch((err) => {
      watchedState.errors = err.message;
      sumbitDocBtn.disabled = false;
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
