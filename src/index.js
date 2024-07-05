import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import initView from './view';

const createSchema = (feeds) => yup
  .string()
  .required()
  .url('Ссылка должна быть валидным URL')
  .notOneOf(feeds, 'RSS уже существует');
  // notOneOf - принимает на вход массив запрещенных значений (фидов)

const state = {
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
      feedback.textContent = 'RSS успешно добавлен!';
    })
    .catch((err) => {
      watchedState.errors = err.message;
    });
};

input.addEventListener('input', handleInputChange);
form.addEventListener('submit', handleSubmit);
