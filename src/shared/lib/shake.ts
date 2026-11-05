/**
 * 빈 입력으로 보내려 할 때 입력칸을 흔들고(`.is-error`) 포커스를 옮깁니다. (demo-design `shake`)
 * 같은 칸을 연달아 눌러도 다시 흔들리도록 클래스를 뺐다가 다음 프레임 전에 다시 붙이고,
 * 테두리가 계속 빨갛게 남지 않도록 애니메이션이 끝나면 뺍니다.
 */
export const shake = (element: HTMLElement | null) => {
  if (!element) return;
  element.classList.remove('is-error');
  void element.offsetWidth;
  element.classList.add('is-error');
  element.addEventListener('animationend', () => element.classList.remove('is-error'), {
    once: true,
  });
  element.focus();
};
