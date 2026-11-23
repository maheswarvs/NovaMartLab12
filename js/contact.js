/* NOVA MART – contact form validation */
const contactForm = $('#contact-form');
if (contactForm) contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = $('.form-msg', contactForm);
  const ok = validate(contactForm, {
    name: v => v.length >= 2 ? '' : 'Enter your name.',
    email: v => emailRe.test(v) ? '' : 'Enter a valid email address.',
    subject: v => v.length >= 3 ? '' : 'Enter a subject.',
    message: v => v.length >= 15 ? '' : 'Your message should be at least 15 characters.'
  });
  if (!ok) return setMsg(msg, 'Please fix the errors above.', false);
  setMsg(msg, `Thank you, ${contactForm.elements.name.value.trim()}! We have received your message and will reply within one working day.`, true);
  contactForm.reset();
});
