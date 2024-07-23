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

  const feedTitle = document.querySelector('.feeds .card-title.h4');
  if (feedTitle) {
    feedTitle.textContent = i18nextInstance.t('feed_title');
  }
  const postTitle = document.querySelector('.posts .card-title.h4');
  if (postTitle) {
    postTitle.textContent = i18nextInstance.t('post_title');
  }

  const modalFooter = document.querySelector('.modal-footer .full-article');
  if (modalFooter) {
    modalFooter.textContent = i18nextInstance.t('modal_readFull');
  }
  const closeBtnFooter = document.querySelector('.modal-footer .btn.btn-secondary');
  if (closeBtnFooter) {
    closeBtnFooter.textContent = i18nextInstance.t('modal_closeBtn');
  }
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

const renderFeeds = (state, i18nextInstance) => {
  const { feeds } = state;
  const divContainer = document.querySelector('.feeds');
  divContainer.innerHTML = '';
  const divFeedCard = document.createElement('div');
  divFeedCard.classList.add('card', 'border-0');
  const divFeedHeader = document.createElement('div');
  divFeedHeader.classList.add('card-body');
  const h2Feed = document.createElement('h2');
  h2Feed.classList.add('card-title', 'h4');
  h2Feed.textContent = i18nextInstance.t('feed_title');
  const ulFeed = document.createElement('ul');
  ulFeed.classList.add('list-group', 'border-0', 'rounded-0');
  feeds.forEach((feed) => {
    const liFeed = document.createElement('li');
    liFeed.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;
    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;
    liFeed.append(h3);
    liFeed.append(p);
    ulFeed.prepend(liFeed);
  });
  divFeedCard.append(divFeedHeader);
  divFeedHeader.append(h2Feed);
  divFeedCard.append(ulFeed);
  divContainer.append(divFeedCard);
};

const renderModal = (post) => {
  const modalTitle = document.querySelector('.modal-title');
  const modalBody = document.querySelector('.modal-body');
  const modalFooter = document.querySelector('.modal-footer .full-article');

  modalTitle.textContent = post.title;
  modalBody.textContent = post.description;
  modalFooter.setAttribute('href', post.link);
};

const renderPosts = (state, i18nextInstance) => {
  const { posts } = state;
  const divContainer = document.querySelector('.posts');
  divContainer.innerHTML = '';
  const divPostCard = document.createElement('div');
  divPostCard.classList.add('card', 'border-0');
  const divPostHeader = document.createElement('div');
  divPostHeader.classList.add('card-body');
  const h2Post = document.createElement('h2');
  h2Post.classList.add('card-title', 'h4');
  h2Post.textContent = i18nextInstance.t('post_title');
  const ulPost = document.createElement('ul');
  ulPost.classList.add('list-group', 'border-0', 'rounded-0');
  posts.forEach((post) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');
    a.setAttribute('href', post.link);
    a.classList.add('fw-bold');
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.title;

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = 'Просмотр';
    button.addEventListener('click', () => {
      renderModal(post);
    });

    liPost.append(a);
    liPost.append(button);
    ulPost.prepend(liPost);
  });
  divPostCard.append(divPostHeader);
  divPostHeader.append(h2Post);
  divPostCard.append(ulPost);
  divContainer.append(divPostCard);
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
      case 'feeds':
        renderFeeds(state, i18nextInstance);
        break;
      case 'posts':
        renderPosts(state, i18nextInstance);
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
