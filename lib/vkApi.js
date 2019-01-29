const fetch = require('node-fetch');
const { stringify } = require('querystring');

module.exports = async (method, settings = {}, v = 5.92) => {
  try {
    const response = await fetch(`https://api.vk.com/method/${method}?${stringify({
      v,
      ...settings,
    })}`);

    const data = await response.json();

    if (data.error) {
      throw JSON.stringify(data);
    }

    return data;
  } catch (e) {
    throw (typeof e === 'object' ? JSON.stringify(e) : e);
  }
};
