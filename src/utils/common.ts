export const copy = (content: string) => {
  const input = document.createElement('input');
  input.value = content;
  document.body.appendChild(input);
  input.select();
  document.execCommand('Copy');
  input.remove();
};
