const parseRSS = (fetchData) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fetchData, 'application/xml');

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
