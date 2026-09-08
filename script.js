// Intro owns its lifecycle in intro.js; navigation never restarts it.
const sections = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('show'); observer.unobserve(entry.target); } });
}, { threshold: 0.14 });
sections.forEach((section) => observer.observe(section));

const navLinks = [...document.querySelectorAll('nav a')];
const anchors = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); });
}, { rootMargin: '-35% 0px -55% 0px' });
anchors.forEach(section => navObserver.observe(section));

const contact = document.querySelector('#contact');
if (contact && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  new IntersectionObserver((entries) => {
    entries.forEach(entry => { entry.target.classList.toggle('contact-active', entry.isIntersecting); });
  }, { threshold: .3 }).observe(contact);
}

['#services', '#about'].forEach((selector) => {
  const section = document.querySelector(selector);
  if (section && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) new IntersectionObserver((entries) => entries.forEach(entry => { entry.target.classList.toggle('section-active', entry.isIntersecting); }), { threshold: .22 }).observe(section);
});
