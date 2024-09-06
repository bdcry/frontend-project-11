import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import i18next from 'i18next';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import render from './view.js';
import resources from './locales/index.js';
import parseRSS from './parser.js';

const updateDelay = 5000;
const buttonDisableDelay = 3000;

const generateId = () => uuidv4();

const main = () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  });

  const createProxiedUrl = (url) => {
    const proxyUrl = new URL('https://allorigins.hexlet.app/get');
    proxyUrl.searchParams.set('url', url);
    proxyUrl.searchParams.set('disableCache', 'true');
    return proxyUrl.toString();
  };

  const fetchRSS = (url) => {
    const proxiedUrl = createProxiedUrl(url);

    return axios
      .get(proxiedUrl)
      .then((response) => response.data.contents)
      .catch(() => {
        throw new Error(i18nextInstance.t('errors.networkError'));
      });
  };

  const createSchema = (feeds) => yup
    .string()
    .required()
    .url(i18nextInstance.t('errors.url'))
    .notOneOf(
      feeds.map((feed) => feed.link),
      i18nextInstance.t('errors.notOneOf'),
    );
  // notOneOf - принимает на вход массив запрещенных значений (фидов)

  const handleRSSData = (rssData) => {
    const { title, description, posts } = rssData;
    const postsWithId = posts.map((post) => ({
      ...post,
      id: generateId(), // Добавляем id к каждому посту
    }));
    return { title, description, posts: postsWithId };
  };

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

  const view = render(state, elements, i18nextInstance);

  const handleInputChange = (e) => {
    view.url = e.target.value;
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
            view,
          );
          if (parsedData) {
            const processedData = handleRSSData(parsedData);
            const { posts: newPosts } = processedData;
            const actualTitles = posts.map((post) => post.title);
            const filteredPosts = newPosts.filter(
              (newPost) => !actualTitles.includes(newPost.title),
            );

            if (filteredPosts.length > 0) {
              view.posts.push(...filteredPosts);
            }
          }
        })
        .catch((err) => {
          view.errors = err.response;
        });
    };
    feeds.forEach((feed) => {
      fetchFeedUpdates(feed);
    });

    setTimeout(checkForUpdates, updateDelay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const sumbitDocBtn = form.querySelector('button[type="submit"]');

    const { url, feeds } = view;

    validate(url, feeds)
      .then((errors) => {
        // Проверка валидации
        // если что-то не так, то будем собирать ошибки в состоянии
        if (Object.keys(errors).length > 0) {
          view.errors = Object.values(errors).map((err) => err.message);
          sumbitDocBtn.disabled = false;
          return;
        }

        fetchRSS(url)
          .then((fetchData) => {
            try {
              const parsedData = parseRSS(fetchData);
              const processedData = handleRSSData(parsedData);
              const { title, description, posts } = processedData;
              // Если все ок, то пушим в фиды и в посты наши данные
              const feed = { title, description, link: url };
              feeds.push(feed);
              view.posts.push(...posts.flatMap((postArray) => postArray));
              // разбиваем данные на отдельные части, тк без спред оператора
              // приходит вложенный массив, который мы не можем посмотреть
              view.url = '';
              input.value = '';
              input.focus();
              view.errors = [];
              feedback.classList.remove('text-danger');
              feedback.classList.add('text-success');
              feedback.textContent = i18nextInstance.t('messages.success');
              checkForUpdates();
              sumbitDocBtn.disabled = true;
              setTimeout(() => {
                sumbitDocBtn.disabled = false;
              }, buttonDisableDelay);
            } catch (error) {
              view.errors = i18nextInstance.t('errors.parserError');
            }
          })
          .catch((error) => {
            view.errors = error.message;
            sumbitDocBtn.disabled = false;
          });
      })
      .catch((err) => {
        view.errors = err.message;
        sumbitDocBtn.disabled = false;
      });
  };

  input.addEventListener('input', handleInputChange);
  form.addEventListener('submit', handleSubmit);

  document.querySelector('label[data-lng="ru"]').addEventListener('click', () => {
    i18nextInstance.changeLanguage('ru');
    view.currentLanguage = 'ru';
  });

  document.querySelector('label[data-lng="en"]').addEventListener('click', () => {
    i18nextInstance.changeLanguage('en');
    view.currentLanguage = 'en';
  });
};

main();
