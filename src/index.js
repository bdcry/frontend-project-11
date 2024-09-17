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

const generateId = () => uuidv4();

const main = async () => {
  const i18nextInstance = i18next.createInstance();
  await i18nextInstance.init({
    lng: 'ru',
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

  const handleRSSData = (rssData) => {
    const { title, description, posts } = rssData;
    const postsWithId = posts.map((post) => ({
      ...post,
      id: generateId(), // Добавляем id к каждому посту
    }));
    return { title, description, posts: postsWithId };
  };

  const initialState = {
    currentLanguage: 'ru',
    url: '',
    errors: [],
    feeds: [],
    posts: [],
    readPosts: [],
    status: 'idle',
    isUpdatingFeeds: false,
  };

  const input = document.getElementById('url-input');
  const form = document.querySelector('.rss-form');
  const feedback = document.querySelector('.feedback');
  const submitButton = form.querySelector('button[type="submit"]');
  const elements = {
    input,
    form,
    feedback,
    submitButton,
  };

  const state = render(initialState, elements, i18nextInstance);

  const handleInputChange = (e) => {
    state.url = e.target.value;
  };

  const validate = (url, feeds) => {
    const schema = createSchema(feeds);
    return schema
      .validate(url, { abortEarly: false })
      .then(() => ({}))
      .catch((e) => keyBy(e.inner, 'path'));
  };

  const checkForUpdates = () => {
    const { posts, feeds } = initialState;

    const fetchFeedUpdates = (feed) => fetchRSS(feed.link)
      .then((fetchData) => {
        const parsedData = parseRSS(fetchData);
        const processedData = handleRSSData(parsedData);
        const { posts: newPosts } = processedData;
        const actualTitles = posts.map((post) => post.title);
        const filteredPosts = newPosts.filter(
          (newPost) => !actualTitles.includes(newPost.title),
        );
        if (filteredPosts.length > 0) {
          state.posts.push(...filteredPosts);
        }
      })
      .catch((err) => {
        state.errors = err.response;
        state.status = 'failed';
      });

    const promises = feeds.map((feed) => fetchFeedUpdates(feed));

    Promise.all(promises)
      .then(() => {
        setTimeout(checkForUpdates, updateDelay);
      })
      .catch((err) => {
        throw new Error(`Error updating feeds: ${err}`);
      });
  };

  const syncUpdatesForFeeds = () => {
    if (!state.isUpdatingFeeds) {
      state.isUpdatingFeeds = true;
      checkForUpdates();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    state.status = 'loading';

    const { url, feeds } = state;

    validate(url, feeds)
      .then((errors) => {
        if (Object.keys(errors).length > 0) {
          const errorMessages = Object.values(errors).map((err) => err.message);
          state.errors = errorMessages;
          state.status = 'failed';
          return Promise.reject(new Error(errorMessages.join(', ')));
        }

        return fetchRSS(url);
      })
      .then((fetchData) => {
        try {
          const parsedData = parseRSS(fetchData);
          const processedData = handleRSSData(parsedData);
          const { title, description, posts } = processedData;

          const feed = { title, description, link: url };
          state.feeds.push(feed);
          const processedPosts = posts.flatMap((postArray) => postArray);
          state.posts.push(...processedPosts);

          state.url = '';
          state.errors = [];
          state.status = 'success';
          syncUpdatesForFeeds();
        } catch (error) {
          state.errors = i18nextInstance.t('errors.parserError');
          state.status = 'failed';
        }
      })
      .catch((error) => {
        state.errors = error.message;
        state.status = 'failed';
      });
  };

  input.addEventListener('input', handleInputChange);
  form.addEventListener('submit', handleSubmit);

  document.querySelector('label[data-lng="ru"]').addEventListener('click', () => {
    i18nextInstance.changeLanguage('ru');
    state.currentLanguage = 'ru';
  });

  document.querySelector('label[data-lng="en"]').addEventListener('click', () => {
    i18nextInstance.changeLanguage('en');
    state.currentLanguage = 'en';
  });
};

main();
