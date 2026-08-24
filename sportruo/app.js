const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((item) => item.addEventListener('click', () => {
  navItems.forEach((n) => n.classList.remove('active'));
  item.classList.add('active');
}));

document.querySelector('.primary')?.addEventListener('click', () => {
  document.querySelector('#talent')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('.secondary')?.addEventListener('click', () => {
  window.alert('Organization registration workspace is coming next.');
});

document.querySelectorAll('.service button').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.service');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
