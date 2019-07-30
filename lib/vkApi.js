const fetch = require('node-fetch');
const { stringify } = require('querystring');

let requestsSec = 0;

setInterval(() => {
  if (requestsSec > 0) requestsSec -= 1;
}, 1000);

module.exports = (method, settings = {}, v = 5.92) => new Promise((resolve, reject) => {
  const request = async () => {
    requestsSec += 1;

    const response = await fetch(`https://api.vk.com/method/${method}?${stringify({
      v,
      ...settings,
    })}`, {
      method: 'POST',
    });

    const data = await response.json();

    if (data.error) {
      reject(JSON.stringify(data));
    }

    resolve(data);
  };

  if (requestsSec < 3) request();

  const timerId = setInterval(() => {
    if (requestsSec >= 3) return;

    clearInterval(timerId);
    request();
  }, 1000);
});
