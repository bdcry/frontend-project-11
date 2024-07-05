import onChange from 'on-change';

const initView = (state) => {
  const input = document.getElementById('url-input');
  const feedback = document.querySelector('.feedback');

  const watchedState = onChange(state, (path, value) => {
    if (path === 'errors' && value.length > 0) {
      input.classList.add('is-invalid');
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      feedback.textContent = value;
    } else {
      input.classList.remove('is-invalid');
      feedback.textContent = '';
    }
  });
  return watchedState;
};

export default initView;
