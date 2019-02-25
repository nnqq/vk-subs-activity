const vkApi = require('./lib/vkApi');

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

    this._autoUpdateTimerId = null;

    this._hotSubsStats = {};
    this._coldSubsStats = [];
  }

  _updateSubProfile(id, firstName, lastName, event, totalPosts = null, count = 1) {
    if (!this._hotSubsStats[`${id}`]) {
      this._hotSubsStats[`${id}`] = {
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

    const noAdminLikes = this.adminsIds.includes(id) && this.likes.ignoreAdmins;

    const noAdminComments = this.adminsIds.includes(id) && this.comments.ignoreAdmins;

    switch (event) {
      case 'usualLike':
        if (noAdminLikes) return;
        this._hotSubsStats[`${id}`].usualLikes += count;
        this._hotSubsStats[`${id}`].totalLikes += count;
        if (this._hotSubsStats[`${id}`].totalLikes === totalPosts) {
          this._hotSubsStats[`${id}`].likedAllPosts = true;
          this._hotSubsStats[`${id}`].points += this.likes.valueOfLikedAllPosts;
        }
        this._hotSubsStats[`${id}`].points += this.likes.valueOfUsual * count;
        break;

      case 'topLike':
        if (noAdminLikes) return;
        this._hotSubsStats[`${id}`].topLikes += count;
        this._hotSubsStats[`${id}`].totalLikes += count;
        if (this._hotSubsStats[`${id}`].totalLikes === totalPosts) {
          this._hotSubsStats[`${id}`].likedAllPosts = true;
          this._hotSubsStats[`${id}`].points += this.likes.valueOfLikedAllPosts;
        }
        this._hotSubsStats[`${id}`].points += this.likes.valueOfTop * count;
        break;

      case 'usualComment':
        if (noAdminComments) return;
        this._hotSubsStats[`${id}`].usualComments += count;
        this._hotSubsStats[`${id}`].totalComments += count;
        this._hotSubsStats[`${id}`].points += this.comments.valueOfUsual * count;
        break;

      case 'topComment':
        if (noAdminComments) return;
        this._hotSubsStats[`${id}`].topComments += count;
        this._hotSubsStats[`${id}`].totalComments += count;
        this._hotSubsStats[`${id}`].points += this.comments.valueOfTop * count;
        break;

      case 'commentLikeFromOther':
        if (noAdminComments) return;
        this._hotSubsStats[`${id}`].commentsLikesFromOthers += count;
        this._hotSubsStats[`${id}`].points += this.comments.valueOfLikesFromOthers * count;
        break;

      default:
        throw new Error('No sub event specified!');
    }
  }

  static _cutPostsInInterval(groupWallArr, fromDate, toDate) {
    return groupWallArr.filter(post => post.date > fromDate && post.date < toDate);
  }

  static _findFullNameById(profilesArr, id) {
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

  async _getGroupWall(fromDate) {
    const first100WallItems = await vkApi('wall.get', {
      lang: this.lang,
      access_token: this.token,
      owner_id: -this.groupId,
      count: 100,
    });

    const groupWall = [];
    groupWall.push(first100WallItems);

    let j = 0;
    while (groupWall[groupWall.length - 1].response.items[groupWall[groupWall.length - 1].response
      .items.length - 1].date > fromDate) {
      j += 1;

      const groupWallChunk = await vkApi('wall.get', {
        lang: this.lang,
        access_token: this.token,
        owner_id: -this.groupId,
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

  async _countLikes(likesData, totalPosts) {
    likesData.response.items.forEach((likeItem, i) => {
      if (i < this.likes.countOfFirstAreTop) {
        this._updateSubProfile(likeItem.id, likeItem.first_name, likeItem.last_name, 'topLike',
          totalPosts);
      } else {
        this._updateSubProfile(likeItem.id, likeItem.first_name, likeItem.last_name, 'usualLike',
          totalPosts);
      }
    });
  }

  async _getLikes(postId, totalPosts) {
    const likesData = await vkApi('likes.getList', {
      lang: this.lang,
      access_token: this.token,
      type: 'post',
      owner_id: -this.groupId,
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
          lang: this.lang,
          access_token: this.token,
          type: 'post',
          owner_id: -this.groupId,
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
        this._countLikes(likesListItem, totalPosts);
      });
    } else {
      this._countLikes(likesData, totalPosts);
    }
  }

  async _countComments(commentsData) {
    commentsData.response.items.forEach((commentItem, i) => {
      if (commentItem.text.length < this.comments.ignoreShorterThan) return;

      const userId = commentItem.from_id;
      const { firstName, lastName } = VkSubsActivity._findFullNameById(commentsData.response
        .profiles, userId);
      const likesCount = commentItem.likes.count;

      this._updateSubProfile(userId, firstName, lastName, 'commentLikeFromOther', null, likesCount);

      if (i < this.comments.countOfFirstAreTop) {
        this._updateSubProfile(userId, firstName, lastName, 'topComment');
      } else {
        this._updateSubProfile(userId, firstName, lastName, 'usualComment');
      }
    });
  }

  async _getComments(postId) {
    const commentsData = await vkApi('wall.getComments', {
      lang: this.lang,
      access_token: this.token,
      owner_id: -this.groupId,
      post_id: postId,
      need_likes: 1,
      count: 100,
      sort: 'asc',
      preview_length: this.comments.ignoreShorterThan * 2,
      extended: 1,
    }, 5.84);

    let withRestComments;

    if (commentsData.response.count > 100) {
      const requests = [];

      for (let i = 1; i < Math.ceil(commentsData.response.count / 100); i += 1) {
        requests.push(vkApi('wall.getComments', {
          lang: this.lang,
          access_token: this.token,
          owner_id: -this.groupId,
          post_id: postId,
          need_likes: 1,
          count: 100,
          offset: 100 * i,
          sort: 'asc',
          preview_length: this.comments.ignoreShorterThan * 2,
          extended: 1,
        }, 5.84));
      }

      withRestComments = await Promise.all(requests);

      withRestComments.unshift(commentsData);
    }

    if (withRestComments) {
      withRestComments.forEach((commentsListItem) => {
        this._countComments(commentsListItem);
      });
    } else {
      this._countComments(commentsData);
    }
  }

  static _searchInList(list, query) {
    if (!query) throw new Error('No search query Object specified!');
    return list.filter(sub => Object.keys(sub).some(key => sub[key] === query[key]));
  }

  async updateList(settings = {}) {
    const defaultSettingsUpdateList = {
      fromDate: Math.floor(Date.now() / 1000 - 604800),
      toDate: Math.floor(Date.now() / 1000),
    };

    const { fromDate, toDate } = Object.assign({}, defaultSettingsUpdateList, settings);

    const posts = await this._getGroupWall(fromDate);

    const groupWallInInterval = VkSubsActivity._cutPostsInInterval(posts, fromDate, toDate);

    const updateListRequests = [];
    groupWallInInterval.forEach((post) => {
      updateListRequests.push(this._getLikes(post.id, groupWallInInterval.length));
      updateListRequests.push(this._getComments(post.id));
    });

    await Promise.all(updateListRequests);

    this._coldSubsStats = Object.keys(this._hotSubsStats).map((sub) => {
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
      } = this._hotSubsStats[sub];

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

    this._coldSubsStats.sort((a, b) => b.points - a.points);
    this._coldSubsStats.forEach((item, i) => {
      item.place = i + 1;
    });
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

    const resultList = this._coldSubsStats.sort((a, b) => {
      if (a[sortBy] > b[sortBy]) {
        return sortDirection === 'desc' ? -1 : 1;
      }

      if (a[sortBy] < b[sortBy]) {
        return sortDirection === 'desc' ? 1 : -1;
      }

      return 0;
    }).slice(0, count !== 0 ? count : this._coldSubsStats.length);

    const afterSearch = settings.search ? VkSubsActivity._searchInList(resultList, settings.search)
      : resultList;

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
    this._hotSubsStats = {};
  }

  async startAutoUpdate(settings = {}) {
    this.clearList();
    await this.updateList(settings);

    this._autoUpdateTimerId = setInterval(async () => {
      this.clearList();
      await this.updateList(settings);
    }, settings.interval || 3e5);
  }

  stopAutoUpdate() {
    clearInterval(this._autoUpdateTimerId);
  }
}

module.exports = VkSubsActivity;
