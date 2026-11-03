/* Форма запроса: маска телефона +7, валидация, отправка.
   Пока бэкенда нет — FORM_ENDPOINT ведёт на mailto. Для продакшна заменить на URL обработчика (POST multipart). */
const FORM_ENDPOINT = 'mailto:order@sznp.info';

(function () {
  const form = document.querySelector('[data-request-form]');
  if (!form) return;

  const phone = form.querySelector('input[name="phone"]');
  const file = form.querySelector('input[type="file"]');
  const fileName = form.querySelector('[data-file-name]');
  const status = form.querySelector('[data-form-status]');

  // Маска: +7 (913) 920-03-71
  function formatPhone(value) {
    let d = value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = '+7';
    if (p.length) out += ' (' + p.slice(0, 3);
    if (p.length >= 3) out += ')';
    if (p.length > 3) out += ' ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);
    return out;
  }
  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7'; });
  phone.addEventListener('blur', () => { if (phone.value === '+7') phone.value = ''; });
  phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); });

  file?.addEventListener('change', () => {
    const names = [...file.files].map((f) => f.name).join(', ');
    if (fileName) fileName.textContent = names || fileName.dataset.empty;
  });

  function setError(input, message) {
    const field = input.closest('.field');
    field?.classList.toggle('is-error', Boolean(message));
    const err = field?.querySelector('.field__err');
    if (err) err.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const task = form.elements.task;
    const agree = form.elements.agree;
    let ok = true;

    setError(name, name.value.trim() ? '' : 'Укажите имя');
    if (!name.value.trim()) ok = false;

    const digits = phone.value.replace(/\D/g, '');
    setError(phone, digits.length === 11 ? '' : 'Введите номер полностью');
    if (digits.length !== 11) ok = false;

    if (!agree.checked) {
      status.textContent = 'Нужно согласие на обработку персональных данных.';
      ok = false;
    }
    if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    status.textContent = '';
    if (FORM_ENDPOINT.startsWith('mailto:')) {
      const body = [
        'Имя: ' + name.value.trim(),
        'Телефон: ' + phone.value,
        'Задача: ' + task.value.trim(),
        file?.files.length ? 'Файл: ' + [...file.files].map((f) => f.name).join(', ') + ' (приложите к письму)' : ''
      ].filter(Boolean).join('\n');
      location.href = FORM_ENDPOINT + '?subject=' + encodeURIComponent('Запрос с сайта sznp.info') + '&body=' + encodeURIComponent(body);
      status.textContent = 'Открываем почтовую программу…';
      return;
    }
    fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form) })
      .then((r) => { if (!r.ok) throw new Error(r.status); status.textContent = 'Спасибо! Ответим с ценой и сроком.'; form.reset(); })
      .catch(() => { status.textContent = 'Не удалось отправить. Позвоните: +7 913 920-03-71'; });
  });
})();
