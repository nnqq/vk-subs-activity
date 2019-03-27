const VkSubsActivity = require('../index');
const vkApi = require('../lib/vkApi');

const vkSubsActivity = new VkSubsActivity({
  token: process.env.TOKEN,
  groupId: process.env.GROUP_ID,
});

vkSubsActivity.startAutoUpdate({
  interval: 288e5,
})
  .then(() => {
    const updateTopic = () => {
      const list = vkSubsActivity.getList({ count: 15 });

      const today = new Date();

      let ratingMsg = `Самые активные подписчики за последние 7 дней (обновлено сегодня в ${today.getHours()}:${today.getMinutes()})\n\n`;

      list.forEach((sub, i) => {
        let medal;
        const place = i + 1;

        if (place === 1) medal = '🥇';
        else if (place === 2) medal = '🥈';
        else if (place === 3) medal = '🥉';

        ratingMsg += `${medal || `${place}.`} ${sub.firstName} ${sub.lastName}. ⭐️ Баллы: ${sub.points}\n`;
      });

      ratingMsg += '\nКак считаются баллы? Лайк +1 балл (+2 балла, если среди первых 5 человек). '
        + 'Лайк на всех записях за неделю +5 баллов. Комментарий +3 балла (+4 балла, если среди '
        + 'первых 5 человек). Если ваш комментарий лайкнули +5 баллов.';

      vkApi('board.editComment', {
        access_token: process.env.TOKEN,
        group_id: process.env.GROUP_ID,
        topic_id: process.env.TOPIC_ID,
        comment_id: process.env.COMMENT_ID,
        message: ratingMsg,
      });
    };

    updateTopic();
    setInterval(() => {
      updateTopic();
    }, 289e5);
  });
