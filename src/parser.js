const parseRSS = (fetchData, i18nextInstance, watchedState) => {
  const state = watchedState;
  const parser = new DOMParser();
  const doc = parser.parseFromString(fetchData, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    state.errors = i18nextInstance.t('errors.parserError');
    return null;
    // возвращаем null, чтобы сразу прокидывать ошибку
    // в обработчик Sumbit'a, после парсинга
  }

  // Извлекаем основную информацию для фидов
  const channel = doc.querySelector('channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;

  // Извлекаем информацию для постов
  const items = channel.querySelectorAll('item');
  const posts = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));

  return { title, description, posts };
};

export default parseRSS;
