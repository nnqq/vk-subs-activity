const { describe, it } = require('mocha');
const should = require('chai').should();

const {
  updateSubProfile,
  cutPostsInInterval,
  findFullNameById,
  countLikes,
  countComments,
  searchInList,
  VkSubsActivity,
} = require('../index');

const fixtureGroupWallArr = require('./fixtures/cutPostsInInterval');
const fixtureProfilesArr = require('./fixtures/findFullNameById');
const fixtureLikesData = require('./fixtures/countLikes');
const fixtureCommentsData = require('./fixtures/countComments');
const fixtureList = require('./fixtures/searchInList');
const fixtureSubsStats = require('./fixtures/getList');

describe('index.js', () => {
  let vkSubsActivity;

  beforeEach(() => {
    vkSubsActivity = new VkSubsActivity({
      token: 'localTestsTokenIsNoMatter',
      groupId: 147845620,
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
    });
  });

  describe('updateSubProfile', () => {
    it('should count usualLike properly', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualLike');
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 1,
          topLikes: 0,
          totalLikes: 1,
          usualComments: 0,
          topComments: 0,
          totalComments: 0,
          commentsLikesFromOthers: 0,
          likedAllPosts: false,
          points: 1,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });

    it('should count topLike properly', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'topLike');
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 0,
          topLikes: 1,
          totalLikes: 1,
          usualComments: 0,
          topComments: 0,
          totalComments: 0,
          commentsLikesFromOthers: 0,
          likedAllPosts: false,
          points: 2,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });

    it('should count usualComment properly', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualComment');
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 0,
          topLikes: 0,
          totalLikes: 0,
          usualComments: 1,
          topComments: 0,
          totalComments: 1,
          commentsLikesFromOthers: 0,
          likedAllPosts: false,
          points: 3,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });

    it('should count topComment properly', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'topComment');
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 0,
          topLikes: 0,
          totalLikes: 0,
          usualComments: 0,
          topComments: 1,
          totalComments: 1,
          commentsLikesFromOthers: 0,
          likedAllPosts: false,
          points: 4,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });

    it('should count commentLikeFromOther properly', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'commentLikeFromOther');
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 0,
          topLikes: 0,
          totalLikes: 0,
          usualComments: 0,
          topComments: 0,
          totalComments: 0,
          commentsLikesFromOthers: 1,
          likedAllPosts: false,
          points: 5,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });

    it('should count points and set likedAllPosts to true if totalLikes === totalPosts', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualLike', 1);
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 1,
          topLikes: 0,
          totalLikes: 1,
          usualComments: 0,
          topComments: 0,
          totalComments: 0,
          commentsLikesFromOthers: 0,
          likedAllPosts: true,
          points: 6,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });

    it('should work properly in complex', () => {
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualLike', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualLike', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'topLike', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'topLike', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualComment', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'usualComment', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'topComment', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'topComment', 3);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'commentLikeFromOther', 3, 5);
      updateSubProfile(vkSubsActivity, 123123, 'Ivan', 'Ivanov', 'commentLikeFromOther', 3, 10);
      const result = {
        '123123': {
          firstName: 'Ivan',
          lastName: 'Ivanov',
          usualLikes: 2,
          topLikes: 2,
          totalLikes: 4,
          usualComments: 2,
          topComments: 2,
          totalComments: 4,
          commentsLikesFromOthers: 15,
          likedAllPosts: true,
          points: 100,
          place: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });
  });

  describe('cutPostsInInterval', () => {
    it('should return only posts in time interval', () => {
      const result = [{
        id: 140824,
        from_id: -147845620,
        owner_id: -147845620,
        date: 1548691682,
        marked_as_ads: 0,
        post_type: 'post',
        text: 'Музыкальная редакция VK Music приглашает вас окунуться в ностальгию по нулевым. Из колонок бумбоксов и в наушниках CD-плеера нам пели короли дискотек O-Zone, тогда ещё 3D-Глюкoza, молодой и дерзкий Robbie Williams. А кто ваши герои нулевых? Слушайте и вспоминайте.',
        attachments: [{
          type: 'audio_playlist',
          audio_playlist: {
            id: 706,
            owner_id: -147845620,
            type: 0,
            title: 'Вернуться в нулевые',
            description: '',
            genres: [],
            count: 25,
            is_following: false,
            followers: 6094,
            plays: 362973,
            create_time: 1548370546,
            update_time: 1548370546,
            audios: [{
              id: 456256878,
              owner_id: -147845620,
              artist: 'O-Zone',
              title: 'Dragostea Din Tei',
              duration: 215,
              date: 1548370546,
              url: 'https://cs1-73v4....3hZS2gUJbqPu3Ai_t9k',
              is_hq: true,
              track_code: 'dab829cebYoNSlZGoQsK6eAM1-oa46m2akVI8fxgRmo',
              is_explicit: false,
              main_artists: [{
                name: 'O-Zone',
                id: '4995940037621654178',
                domain: '4995940037621654178',
              }],
            }, {
              id: 456256879,
              owner_id: -147845620,
              artist: 'Moby',
              title: 'Lift Me Up',
              duration: 197,
              date: 1548370546,
              url: 'https://cs1-59v4....aZu5bhqLqUN9RM625QU',
              is_hq: true,
              track_code: '8d35b675eqn6S4fLDBYWTfYurCFuBRrMZ0nxJcyK-B8',
              is_explicit: false,
              main_artists: [{
                name: 'Moby',
                id: '7652620659159174765',
                domain: '7652620659159174765',
              }],
            }, {
              id: 456256880,
              owner_id: -147845620,
              artist: 'Timo Maas',
              title: 'First Day',
              duration: 249,
              date: 1548370546,
              url: 'https://cs1-74v4....qpGENUTfoggCrco4g7E',
              is_hq: true,
              track_code: 'abeef666n1IPnQepKD_HzuJKnzmfORrP_lhCGDiHFDo',
              is_explicit: false,
              main_artists: [{
                name: 'Timo Maas',
                id: '412874830803771497',
                domain: '412874830803771497',
              }],
              subtitle: 'Extended Version',
            }],
            photo: {
              photo_34: 'https://sun1-12.u...373/RtHRn0CcYdE.jpg',
              photo_68: 'https://sun1-13.u...371/WYNtYXCiyUQ.jpg',
              photo_135: 'https://sun1-12.u...36f/7md-vWaE_ao.jpg',
              photo_270: 'https://sun1-3.us...36c/Ti4z5TcQEWQ.jpg',
              photo_300: 'https://sun1-4.us...36a/SHfrMzX8ePU.jpg',
              photo_600: 'https://sun1-7.us...367/0f8YvbfKB1Q.jpg',
              width: 300,
              height: 300,
            },
            access_key: '614d6e85fbda816850',
            album_type: 'playlist',
          },
        }],
        post_source: {
          type: 'vk',
        },
        comments: {
          count: 14,
          can_post: 1,
          groups_can_post: true,
        },
        likes: {
          count: 172,
          user_likes: 0,
          can_like: 1,
          can_publish: 1,
        },
        reposts: {
          count: 23,
          user_reposted: 0,
        },
        views: {
          count: 45929,
        },
        is_favorite: false,
      }, {
        id: 140774,
        from_id: -147845620,
        owner_id: -147845620,
        date: 1548683264,
        marked_as_ads: 0,
        post_type: 'post',
        text: 'Джулия Майклс рассказала, как бороться с апатией в новом мини-альбоме Inner Monologue Part 1. Певицу поддержала подруга Селена Гомес. Они давно дружат и работают вместе. Джулия написала часть песен для Гомес, а также композиции для Деми Ловато, Джастина Бибера, Fifth Harmony и других. Inner Monologue Part 1 — это откровенный рассказ о сложностях. Но слушать его легко: Джулия гармонично оформила свои тягостные мысли воздушной музыкой.',
        attachments: [{
          type: 'audio_playlist',
          audio_playlist: {
            id: 4226575,
            owner_id: -2000226575,
            type: 1,
            title: 'Inner Monologue Part 1',
            description: '',
            genres: [{
              id: 1,
              name: 'Поп',
            }],
            count: 6,
            is_following: false,
            followers: 5631,
            plays: 78408,
            create_time: 1548050574,
            update_time: 1548299833,
            audios: [{
              id: 47943273,
              owner_id: -2001943273,
              artist: 'Julia Michaels feat. Selena Gomez',
              title: 'Anxiety',
              duration: 210,
              date: 1548299833,
              url: 'https://cs1-61v4....qYoa8ES5huNwd6i8Y5o',
              is_hq: true,
              track_code: 'd05c230f2ETjGvJ939iPhZ0pjGk0Ez0ULeuC7snDYdRKJGFf9A',
              is_explicit: true,
              main_artists: [{
                name: 'Julia Michaels',
                id: '2818165050164835121',
                domain: '2818165050164835121',
              }],
              featured_artists: [{
                name: 'Selena Gomez',
                id: '6395824180720319971',
                domain: '6395824180720319971',
              }],
            }, {
              id: 47943272,
              owner_id: -2001943272,
              artist: 'Julia Michaels',
              title: 'Into You',
              duration: 192,
              date: 1548299833,
              url: 'https://cs1-67v4....OVjaUsAEaPJzysSK8GY',
              is_hq: true,
              track_code: 'ddc41facYIP3b1ZFmGirusDwX-fZ_rMh4njzM4phFO8afyZHxA',
              is_explicit: false,
              main_artists: [{
                name: 'Julia Michaels',
                id: '2818165050164835121',
                domain: '2818165050164835121',
              }],
            }, {
              id: 47943271,
              owner_id: -2001943271,
              artist: 'Julia Michaels',
              title: 'Happy',
              duration: 191,
              date: 1548299833,
              url: 'https://cs1-73v4....MTiBZWZx68H8Z2Vtcjc',
              is_hq: true,
              track_code: 'eb4f7905AJcIcNL6vfB2r0bVEy4LxB-oXdQrKXCh4j8ycmphZg',
              is_explicit: true,
              main_artists: [{
                name: 'Julia Michaels',
                id: '2818165050164835121',
                domain: '2818165050164835121',
              }],
            }],
            year: 2019,
            photo: {
              photo_34: 'https://sun1-6.us...22e/1oQhXsFYF0c.jpg',
              photo_68: 'https://sun1-6.us...22c/uglSauu2Bh0.jpg',
              photo_135: 'https://sun1-1.us...22a/2adQRDME1v8.jpg',
              photo_270: 'https://sun1-10.u...227/xnYJ5L53f4s.jpg',
              photo_300: 'https://sun1-16.u...225/ozPVGSlfVmQ.jpg',
              photo_600: 'https://sun1-15.u...222/nEo8xbGUd0s.jpg',
              width: 300,
              height: 300,
            },
            access_key: 'ea29b955e77d177264',
            is_explicit: true,
            main_artists: [{
              name: 'Julia Michaels',
              id: '2818165050164835121',
              domain: '2818165050164835121',
            }],
            album_type: 'main_feat',
          },
        }, {
          type: 'link',
          link: {
            url: 'https://m.vk.com/...85aa22b70237b0d8f49',
            title: 'Julia Michaels',
            caption: 'm.vk.com',
            description: '',
            photo: {
              id: 456239021,
              album_id: -102,
              owner_id: -2000931206,
              user_id: 100,
              sizes: [{
                type: 'm',
                url: 'https://pp.userap...e14/MQonWe5Jzi0.jpg',
                width: 360,
                height: 180,
              }, {
                type: 'x',
                url: 'https://pp.userap...e15/iRWYxNpYZnw.jpg',
                width: 720,
                height: 360,
              }, {
                type: 'y',
                url: 'https://pp.userap...e16/V3LM9YfJmU4.jpg',
                width: 1080,
                height: 540,
              }, {
                type: 'w',
                url: 'https://pp.userap...e17/ynqP3iG1Wkk.jpg',
                width: 1440,
                height: 720,
              }],
              text: '',
              date: 1548543766,
            },
          },
        }],
        post_source: {
          type: 'vk',
        },
        comments: {
          count: 19,
          can_post: 1,
          groups_can_post: true,
        },
        likes: {
          count: 155,
          user_likes: 0,
          can_like: 1,
          can_publish: 1,
        },
        reposts: {
          count: 10,
          user_reposted: 0,
        },
        views: {
          count: 60630,
        },
        is_favorite: false,
      }];
      cutPostsInInterval(fixtureGroupWallArr, 1548683254, 1548691692).should.eql(result);
    });
  });

  describe('findFullNameById', () => {
    it('should return object { firstName, lastName }', () => {
      const result = {
        firstName: 'Evgeny',
        lastName: 'Sidorin',
      };
      findFullNameById(fixtureProfilesArr, 53153367).should.eql(result);
    });
  });

  describe('countLikes', () => {
    it('should count likes and write data to subsStats properly', () => {
      countLikes(vkSubsActivity, fixtureLikesData, 10);
      const result = {
        '239518807': {
          commentsLikesFromOthers: 0,
          firstName: 'Добромира',
          lastName: 'Картавая',
          likedAllPosts: false,
          place: 0,
          points: 2,
          topComments: 0,
          topLikes: 1,
          totalComments: 0,
          totalLikes: 1,
          usualComments: 0,
          usualLikes: 0,
        },
        '327534614': {
          commentsLikesFromOthers: 0,
          firstName: 'Михаил',
          lastName: 'Орлов',
          likedAllPosts: false,
          place: 0,
          points: 2,
          topComments: 0,
          topLikes: 1,
          totalComments: 0,
          totalLikes: 1,
          usualComments: 0,
          usualLikes: 0,
        },
        '363685477': {
          commentsLikesFromOthers: 0,
          firstName: 'Анна',
          lastName: 'Евсеева',
          likedAllPosts: false,
          place: 0,
          points: 2,
          topComments: 0,
          topLikes: 1,
          totalComments: 0,
          totalLikes: 1,
          usualComments: 0,
          usualLikes: 0,
        },
        '372714038': {
          commentsLikesFromOthers: 0,
          firstName: 'Ден',
          lastName: 'Плотников',
          likedAllPosts: false,
          place: 0,
          points: 2,
          topComments: 0,
          topLikes: 1,
          totalComments: 0,
          totalLikes: 1,
          usualComments: 0,
          usualLikes: 0,
        },
        '526522941': {
          commentsLikesFromOthers: 0,
          firstName: 'Schwizer',
          lastName: 'Schwiz',
          likedAllPosts: false,
          place: 0,
          points: 2,
          topComments: 0,
          topLikes: 1,
          totalComments: 0,
          totalLikes: 1,
          usualComments: 0,
          usualLikes: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });
  });

  describe('countComments', () => {
    it('should count comments and write data to subsStats properly ', () => {
      countComments(vkSubsActivity, fixtureCommentsData);
      const result = {
        '100': {
          commentsLikesFromOthers: 0,
          firstName: 'Администрация ВКонтакте',
          lastName: '',
          likedAllPosts: false,
          place: 0,
          points: 4,
          topComments: 1,
          topLikes: 0,
          totalComments: 1,
          totalLikes: 0,
          usualComments: 0,
          usualLikes: 0,
        },
        '771300': {
          commentsLikesFromOthers: 17,
          firstName: 'Constantine',
          lastName: 'Nicolaevich',
          likedAllPosts: false,
          place: 0,
          points: 89,
          topComments: 1,
          topLikes: 0,
          totalComments: 1,
          totalLikes: 0,
          usualComments: 0,
          usualLikes: 0,
        },
        '53153367': {
          commentsLikesFromOthers: 20,
          firstName: 'Evgeny',
          lastName: 'Sidorin',
          likedAllPosts: false,
          place: 0,
          points: 104,
          topComments: 1,
          topLikes: 0,
          totalComments: 1,
          totalLikes: 0,
          usualComments: 0,
          usualLikes: 0,
        },
      };
      vkSubsActivity.subsStats.should.eql(result);
    });
  });

  describe('searchInList', () => {
    it('should return filtered array with search params (1)', () => {
      const data = searchInList(fixtureList, {
        firstName: 'Павел',
      });
      const result = [
        {
          commentsLikesFromOthers: 8,
          firstName: 'Павел',
          id: 1524150,
          lastName: 'Овчинников',
          likedAllPosts: false,
          place: 3,
          points: 44,
          topComments: 1,
          topLikes: 0,
          totalComments: 1,
          totalLikes: 0,
          usualComments: 0,
          usualLikes: 0,
        },
      ];
      data.should.eql(result);
    });

    it('should return filtered array with search params (2)', () => {
      const data = searchInList(fixtureList, {
        id: 475455807,
      });
      const result = [
        {
          id: 475455807,
          firstName: 'Karina',
          lastName: 'Mirzoeva',
          usualLikes: 1,
          topLikes: 0,
          totalLikes: 1,
          usualComments: 1,
          topComments: 0,
          totalComments: 1,
          commentsLikesFromOthers: 7,
          likedAllPosts: false,
          points: 39,
          place: 4,
        },
      ];
      data.should.eql(result);
    });

    it('should return filtered array with search params (3)', () => {
      const data = searchInList(fixtureList, {
        topComments: 1,
      });
      const result = [{
        id: 426632942,
        firstName: 'Валерий',
        lastName: 'Вальтер',
        usualLikes: 0,
        topLikes: 0,
        totalLikes: 0,
        usualComments: 4,
        topComments: 1,
        totalComments: 5,
        commentsLikesFromOthers: 9,
        likedAllPosts: false,
        points: 61,
        place: 1,
      },
      {
        id: 370493282,
        firstName: 'Rufat',
        lastName: 'Drobovilov',
        usualLikes: 6,
        topLikes: 0,
        totalLikes: 6,
        usualComments: 0,
        topComments: 1,
        totalComments: 1,
        commentsLikesFromOthers: 7,
        likedAllPosts: false,
        points: 45,
        place: 2,
      },
      {
        id: 1524150,
        firstName: 'Павел',
        lastName: 'Овчинников',
        usualLikes: 0,
        topLikes: 0,
        totalLikes: 0,
        usualComments: 0,
        topComments: 1,
        totalComments: 1,
        commentsLikesFromOthers: 8,
        likedAllPosts: false,
        points: 44,
        place: 3,
      }];
      data.should.eql(result);
    });
  });

  describe('VkSubsActivity.getList', () => {
    it('should return transformed "subsStats" consider to "settings" (1)', () => {
      vkSubsActivity.subsStats = fixtureSubsStats;
      const data = vkSubsActivity.getList({
        count: 0,
        plain: false,
        sortBy: 'points',
        sortDirection: 'desc',
      });
      const result = [{
        id: 426632942,
        firstName: 'Валерий',
        lastName: 'Вальтер',
        usualLikes: 0,
        topLikes: 0,
        totalLikes: 0,
        usualComments: 4,
        topComments: 1,
        totalComments: 5,
        commentsLikesFromOthers: 9,
        likedAllPosts: false,
        points: 61,
        place: 1,
      },
      {
        id: 370493282,
        firstName: 'Rufat',
        lastName: 'Drobovilov',
        usualLikes: 6,
        topLikes: 0,
        totalLikes: 6,
        usualComments: 0,
        topComments: 1,
        totalComments: 1,
        commentsLikesFromOthers: 7,
        likedAllPosts: false,
        points: 45,
        place: 2,
      },
      {
        id: 1524150,
        firstName: 'Павел',
        lastName: 'Овчинников',
        usualLikes: 0,
        topLikes: 0,
        totalLikes: 0,
        usualComments: 0,
        topComments: 1,
        totalComments: 1,
        commentsLikesFromOthers: 8,
        likedAllPosts: false,
        points: 44,
        place: 3,
      },
      {
        id: 475455807,
        firstName: 'Karina',
        lastName: 'Mirzoeva',
        usualLikes: 1,
        topLikes: 0,
        totalLikes: 1,
        usualComments: 1,
        topComments: 0,
        totalComments: 1,
        commentsLikesFromOthers: 7,
        likedAllPosts: false,
        points: 39,
        place: 4,
      },
      {
        id: 522058664,
        firstName: 'Селима',
        lastName: 'Кшановичус',
        usualLikes: 2,
        topLikes: 0,
        totalLikes: 2,
        usualComments: 1,
        topComments: 2,
        totalComments: 3,
        commentsLikesFromOthers: 5,
        likedAllPosts: false,
        points: 38,
        place: 5,
      }];
      data.should.eql(result);
    });

    it('should return transformed "subsStats" consider to "settings" (2)', () => {
      vkSubsActivity.subsStats = fixtureSubsStats;
      const data = vkSubsActivity.getList({
        count: 3,
        plain: true,
        sortBy: 'totalLikes',
        sortDirection: 'asc',
      });
      const result = `1) Валерий Вальтер https://vk.com/id426632942 Всего Баллов: 61 (1 место), Топовых Лайков: 0, Обычных Лайков: 0, Топовых Комментариев: 1, Обычных Комментариев: 4, Получил Лайков на Комментарии: 9
2) Павел Овчинников https://vk.com/id1524150 Всего Баллов: 44 (3 место), Топовых Лайков: 0, Обычных Лайков: 0, Топовых Комментариев: 1, Обычных Комментариев: 0, Получил Лайков на Комментарии: 8
3) Karina Mirzoeva https://vk.com/id475455807 Всего Баллов: 39 (4 место), Топовых Лайков: 0, Обычных Лайков: 1, Топовых Комментариев: 0, Обычных Комментариев: 1, Получил Лайков на Комментарии: 7
`;
      data.should.equal(result);
    });

    it('should return transformed "subsStats" consider to "settings" (3)', () => {
      vkSubsActivity.subsStats = fixtureSubsStats;
      const data = vkSubsActivity.getList({
        count: 0,
        plain: true,
        sortBy: 'totalLikes',
        sortDirection: 'asc',
        search: {
          usualComments: 0,
        },
      });
      const result = `1) Павел Овчинников https://vk.com/id1524150 Всего Баллов: 44 (3 место), Топовых Лайков: 0, Обычных Лайков: 0, Топовых Комментариев: 1, Обычных Комментариев: 0, Получил Лайков на Комментарии: 8
2) Rufat Drobovilov https://vk.com/id370493282 Всего Баллов: 45 (2 место), Топовых Лайков: 0, Обычных Лайков: 6, Топовых Комментариев: 1, Обычных Комментариев: 0, Получил Лайков на Комментарии: 7
`;
      data.should.equal(result);
    });
  });

  describe('VkSubsActivity.clearList', () => {
    it('should clear subsStats', () => {
      vkSubsActivity.subsStats = fixtureSubsStats;
      vkSubsActivity.clearList();
      vkSubsActivity.subsStats.should.eql({});
    });
  });
});
