const vkApi = require('./lib/vkApi');

function updateSubProfile(ctx, id, firstName, lastName, event, totalPosts = null, count = 1) {
  if (!ctx.subsStats[`${id}`]) {
    ctx.subsStats[`${id}`] = {
      firstName,
      lastName,
      usualLikes: 0,
      topLikes: 0,
      totalLikes: 0,
      usualComments: 0,
      topComments: 0,
      totalComments: 0,
      commentsLikesFromOthers: 0,
      likedAllPosts: false,
      points: 0,
      place: 0,
    };
  }

  const noAdminLikes = ctx.adminsIds.includes(id) && ctx.likes.ignoreAdmins;

  const noAdminComments = ctx.adminsIds.includes(id) && ctx.comments.ignoreAdmins;

  switch (event) {
    case 'usualLike':
      if (noAdminLikes) return;
      ctx.subsStats[`${id}`].usualLikes += count;
      ctx.subsStats[`${id}`].totalLikes += count;
      if (ctx.subsStats[`${id}`].totalLikes === totalPosts) {
        ctx.subsStats[`${id}`].likedAllPosts = true;
        ctx.subsStats[`${id}`].points += ctx.likes.valueOfLikedAllPosts;
      }
      ctx.subsStats[`${id}`].points += ctx.likes.valueOfUsual * count;
      break;

    case 'topLike':
      if (noAdminLikes) return;
      ctx.subsStats[`${id}`].topLikes += count;
      ctx.subsStats[`${id}`].totalLikes += count;
      if (ctx.subsStats[`${id}`].totalLikes === totalPosts) {
        ctx.subsStats[`${id}`].likedAllPosts = true;
        ctx.subsStats[`${id}`].points += ctx.likes.valueOfLikedAllPosts;
      }
      ctx.subsStats[`${id}`].points += ctx.likes.valueOfTop * count;
      break;

    case 'usualComment':
      if (noAdminComments) return;
      ctx.subsStats[`${id}`].usualComments += count;
      ctx.subsStats[`${id}`].totalComments += count;
      ctx.subsStats[`${id}`].points += ctx.comments.valueOfUsual * count;
      break;

    case 'topComment':
      if (noAdminComments) return;
      ctx.subsStats[`${id}`].topComments += count;
      ctx.subsStats[`${id}`].totalComments += count;
      ctx.subsStats[`${id}`].points += ctx.comments.valueOfTop * count;
      break;

    case 'commentLikeFromOther':
      if (noAdminComments) return;
      ctx.subsStats[`${id}`].commentsLikesFromOthers += count;
      ctx.subsStats[`${id}`].points += ctx.comments.valueOfLikesFromOthers * count;
      break;

    default:
      throw new Error('No sub event specified!');
  }
}

function cutPostsInInterval(groupWallArr, fromDate, toDate) {
  return groupWallArr.filter(post => post.date > fromDate && post.date < toDate);
}

function findFullNameById(profilesArr, id) {
  for (let i = 0; i < profilesArr.length; i += 1) {
    if (profilesArr[i].id === id) {
      return {
        firstName: profilesArr[i].first_name,
        lastName: profilesArr[i].last_name,
      };
    }
  }

  return false;
}

async function getGroupWall(ctx, fromDate) {
  const { token, groupId, lang } = ctx;

  const first100WallItems = await vkApi('wall.get', {
    lang,
    access_token: token,
    owner_id: -groupId,
    count: 100,
  });

  const groupWall = [];
  groupWall.push(first100WallItems);

  let j = 0;
  while (groupWall[groupWall.length - 1].response.items[groupWall[groupWall.length - 1].response
    .items.length - 1].date > fromDate) {
    j += 1;

    const groupWallChunk = await vkApi('wall.get', {
      lang,
      access_token: token,
      owner_id: -groupId,
      count: 100,
      offset: 100 * j,
    });

    groupWall.push(groupWallChunk);
  }

  const posts = [];
  groupWall.forEach((item) => {
    item.response.items.forEach((post) => {
      posts.push(post);
    });
  });

  return posts;
}

function countLikes(ctx, likesData, totalPosts) {
  likesData.response.items.forEach((likeItem, i) => {
    if (i < ctx.likes.countOfFirstAreTop) {
      updateSubProfile(ctx, likeItem.id, likeItem.first_name, likeItem.last_name, 'topLike',
        totalPosts);
    } else {
      updateSubProfile(ctx, likeItem.id, likeItem.first_name, likeItem.last_name, 'usualLike',
        totalPosts);
    }
  });
}

async function getLikes(ctx, postId, totalPosts) {
  const { token, groupId, lang } = ctx;

  const likesData = await vkApi('likes.getList', {
    lang,
    access_token: token,
    type: 'post',
    owner_id: -groupId,
    item_id: postId,
    filter: 'likes',
    extended: 1,
    count: 1000,
  });

  let withRestLikes;

  if (likesData.response.count > 1000) {
    const requests = [];

    for (let i = 1; i < Math.ceil(likesData.response.count / 1000); i += 1) {
      requests.push(vkApi('likes.getList', {
        lang,
        access_token: token,
        type: 'post',
        owner_id: -groupId,
        item_id: postId,
        filter: 'likes',
        extended: 1,
        count: 1000,
        offset: 1000 * i,
      }));
    }

    withRestLikes = await Promise.all(requests);

    withRestLikes.unshift(likesData);
  }

  if (withRestLikes) {
    withRestLikes.forEach((likesListItem) => {
      countLikes(ctx, likesListItem, totalPosts);
    });
  } else {
    countLikes(ctx, likesData, totalPosts);
  }
}

function countComments(ctx, commentsData) {
  commentsData.response.items.forEach((commentItem, i) => {
    if (commentItem.text.length < ctx.comments.ignoreShorterThan) return;

    const userId = commentItem.from_id;
    const { firstName, lastName } = findFullNameById(commentsData.response.profiles, userId);
    const likesCount = commentItem.likes.count;

    updateSubProfile(ctx, userId, firstName, lastName, 'commentLikeFromOther', null, likesCount);

    if (i < ctx.comments.countOfFirstAreTop) {
      updateSubProfile(ctx, userId, firstName, lastName, 'topComment');
    } else {
      updateSubProfile(ctx, userId, firstName, lastName, 'usualComment');
    }
  });
}

async function getComments(ctx, postId) {
  const { token, groupId, lang } = ctx;

  const commentsData = await vkApi('wall.getComments', {
    lang,
    access_token: token,
    owner_id: -groupId,
    post_id: postId,
    need_likes: 1,
    count: 100,
    sort: 'asc',
    preview_length: ctx.comments.ignoreShorterThan * 2,
    extended: 1,
  }, 5.84);

  let withRestComments;

  if (commentsData.response.count > 100) {
    const requests = [];

    for (let i = 1; i < Math.ceil(commentsData.response.count / 100); i += 1) {
      requests.push(vkApi('wall.getComments', {
        lang,
        access_token: token,
        owner_id: -groupId,
        post_id: postId,
        need_likes: 1,
        count: 100,
        offset: 100 * i,
        sort: 'asc',
        preview_length: ctx.comments.ignoreShorterThan * 2,
        extended: 1,
      }, 5.84));
    }

    withRestComments = await Promise.all(requests);

    withRestComments.unshift(commentsData);
  }

  if (withRestComments) {
    withRestComments.forEach((commentsListItem) => {
      countComments(ctx, commentsListItem);
    });
  } else {
    countComments(ctx, commentsData);
  }
}

function searchInList(list, query) {
  if (!query) throw new Error('No search query Object specified!');
  return list.filter(sub => Object.keys(sub).some(key => sub[key] === query[key]));
}

class VkSubsActivity {
  constructor(settings = {}) {
    const defaultSettingsConstructor = {
      lang: 'ru',
      adminsIds: [],
      likes: {
        valueOfUsual: 1,
        valueOfTop: 2,
        countOfFirstAreTop: 5,
        valueOfLikedAllPosts: 5,
        ignoreAdmins: true,
      },
      comments: {
        valueOfUsual: 3,
        valueOfTop: 4,
        countOfFirstAreTop: 5,
        ignoreShorterThan: 10,
        valueOfLikesFromOthers: 5,
        ignoreAdmins: true,
      },
    };

    if (!settings.token) throw new Error('No VK access_token (service/user) specified!');
    if (!settings.groupId) throw new Error('No VK groupId specified!');

    this.token = settings.token;
    this.groupId = settings.groupId;
    this.lang = settings.lang || defaultSettingsConstructor.lang;
    this.adminsIds = settings.adminsIds || defaultSettingsConstructor.adminsIds;
    this.likes = Object.assign({}, defaultSettingsConstructor.likes, settings.likes);
    this.comments = Object.assign({}, defaultSettingsConstructor.comments, settings.comments);

    this.autoUpdateTimerId = null;

    this.subsStats = {};
  }

  async updateList(settings = {}) {
    const defaultSettingsUpdateList = {
      fromDate: Math.floor(Date.now() / 1000 - 604800),
      toDate: Math.floor(Date.now() / 1000),
    };

    const { fromDate, toDate } = Object.assign({}, defaultSettingsUpdateList, settings);

    const posts = await getGroupWall(this, fromDate);

    const groupWallInInterval = cutPostsInInterval(posts, fromDate, toDate);

    const updateListRequests = [];
    groupWallInInterval.forEach((post) => {
      updateListRequests.push(getLikes(this, post.id, groupWallInInterval.length));
      updateListRequests.push(getComments(this, post.id));
    });

    return Promise.all(updateListRequests);
  }

  getList(settings = {}) {
    const defaultSettingsGetList = {
      count: 0,
      plain: false,
      sortBy: 'points',
      sortDirection: 'desc',
    };

    const {
      count,
      plain,
      sortBy,
      sortDirection,
    } = Object.assign({}, defaultSettingsGetList, settings);

    const list = Object.keys(this.subsStats).map((sub) => {
      const {
        firstName,
        lastName,
        usualLikes,
        topLikes,
        totalLikes,
        usualComments,
        topComments,
        totalComments,
        commentsLikesFromOthers,
        likedAllPosts,
        points,
        place,
      } = this.subsStats[sub];

      return {
        id: +sub,
        firstName,
        lastName,
        usualLikes,
        topLikes,
        totalLikes,
        usualComments,
        topComments,
        totalComments,
        commentsLikesFromOthers,
        likedAllPosts,
        points,
        place,
      };
    });

    list.sort((a, b) => b.points - a.points);
    list.forEach((item, i) => {
      item.place = i + 1;
    });

    const resultList = list.sort((a, b) => {
      if (a[sortBy] > b[sortBy]) {
        return sortDirection === 'desc' ? -1 : 1;
      }

      if (a[sortBy] < b[sortBy]) {
        return sortDirection === 'desc' ? 1 : -1;
      }

      return 0;
    }).slice(0, count !== 0 ? count : list.length);

    const afterSearch = settings.search ? searchInList(resultList, settings.search) : resultList;

    if (plain) {
      let plainList = '';

      afterSearch.forEach((item, i) => {
        plainList += `${i + 1}) ${item.firstName} ${item.lastName} https://vk.com/id${item.id} `
          + `Всего Баллов: ${item.points} (${item.place} место), Топовых Лайков: `
          + `${item.topLikes}, Обычных Лайков: ${item.usualLikes}, Топовых Комментариев: `
          + `${item.topComments}, Обычных Комментариев: ${item.usualComments}, Получил Лайков `
          + `на Комментарии: ${item.commentsLikesFromOthers}\n`;
      });

      return plainList;
    }

    return afterSearch;
  }

  clearList() {
    this.subsStats = {};
  }

  async startAutoUpdate(settings = {}) {
    this.clearList();
    await this.updateList(settings);

    this.autoUpdateTimerId = setInterval(async () => {
      this.clearList();
      await this.updateList(settings);
    }, settings.interval || 3e5);
  }

  stopAutoUpdate() {
    clearInterval(this.autoUpdateTimerId);
  }
}

module.exports = {
  updateSubProfile,
  cutPostsInInterval,
  findFullNameById,
  countLikes,
  countComments,
  searchInList,
  VkSubsActivity,
};
