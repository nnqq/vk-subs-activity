# VK group subscribers activity monitoring (Node.js)

This module helps you to count activity of your VK group subscribers (likes, comments etc). And easy to integrate with your bot or something else.

## Getting Started

### Install

```
npm i vk-subs-activity
```

### Usage

Fast start below, continue reading for advanced usage.

```javascript
const { VkSubsActivity } = require('vk-subs-activity');

const vkSubsActivity = new VkSubsActivity({
  token: process.env.TOKEN, // SERVICE or USER token, NOT group
  groupId: process.env.GROUP_ID, // e.g. 147845620
});

vkSubsActivity.updateList()
  .then(() => {
    console.log(vkSubsActivity.getList());
  });
```

### Tests

```
npm test
```

### Methods

* [constructor(settings)](#constructorsettings)
* [.startAutoUpdate(settings)](#startutoupdatesettings)
* [.stopAutoUpdate()](#stopautoupdate)
* [.getList(settings)](#getlistsettings)
* [.updateList(settings)](#updatelistsettings)
* [.clearList()](#clearlist)

#### constructor(settings)

##### Default config

```javascript
new VkSubsActivity({
  token: undefined,
  groupId: undefined,
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
```

##### Properties description

Property | Type | Default | Description
--- | --- | --- | --- |
token | `string` | undefined | [VK Service or User access_token](https://vk.com/dev/access_token) |
groupId | `number` | undefined | Group id for monitoring
lang | `string` | ru | VK api data language
adminsIds | `number[]` | [] | Activity of this users don't affect in rating (they will not get any points for activity)
likes.valueOfUsual | `number` | 1 | Number of points user receive for "usual" like (not in the first N likes)
likes.valueOfTop | `number` | 2 | Number of points user receive for "top" like (in the first N likes)
likes.countOfFirstAreTop | `number` | 5 | How many first likes will get extra points
likes.valueOfLikedAllPosts | `number` | 5 | User will get extra points if he liked all posts at the update interval fromDate - toDate
likes.ignoreAdmins | `boolean` | true | Admins likes will not affect in rating
comments.valueOfUsual | `number` | 3 | Number of points user receive for "usual" comment (not in the first N comments)
comments.valueOfTop | `number` | 4 | Number of points user receive for "top" comment (in the first N comments)
comments.countOfFirstAreTop | `number` | 5 | How many first comments will get extra points
comments.ignoreShorterThan | `number` | 10 | Users who leave short comment, will not get points for this
comments.valueOfLikesFromOthers | `number` | 5 | Number of points user receive if someone likes his comment
comments.ignoreAdmins | `boolean` | true | Admins comments will not affect in rating

#### .startAutoUpdate(settings)

Starts rating auto update in selected interval. Clears rating list before each iteration to prevent double data rewriting

##### Default config

```javascript
.startAutoUpdate({
  fromDate: Math.floor(Date.now() / 1000 - 604800),
  toDate: Math.floor(Date.now() / 1000),
  interval: 300000,
});
```

##### Properties description

Property | Type | Default | Description
--- | --- | --- | --- |
fromDate | `number` | `Math.floor(Date.now() / 1000 - 604800)` (Unix time 7 days ago) | Only group posts newer than this Unix time affects rating
toDate | `number` | `Math.floor(Date.now() / 1000)` (Unix time now) | Only group posts older than this Unix time affects rating
interval | `number` | 300000 (ms) | Interval of rating update

#### .stopAutoUpdate()

It stops rating auto update

#### .getList(settings)

##### Default config

```javascript
.getList({
  count: 0,
  plain: false,
  sortBy: 'points',
  sortDirection: 'desc',
  search: undefined,
});
```

##### Properties description

Property | Type | Default | Description
--- | --- | --- | --- |
count | `number` | 0 (all) | Number of rating items will return
plain | `boolean` | false | Rating list will return as string
sortBy | `string` | points | Rating list will sort by (id / firstName / lastName / usualLikes / topLikes / totalLikes / usualComments / topComments / totalComments / commentsLikesFromOthers / likedAllPosts / points / place)
sortDirection | `string` | desc | Rating list sort direction ascending or descending (asc / desc)
search | `object` | undefined (all) | Will return only rating items which match search query. E.g. `search: { id: 123456 }` or `search: { firstName: 'Ivan' }`

#### .updateList(settings)

Manual update of the rating list. Note that .updateList() will not clear rating list before update

Settings are equal to [.startAutoUpdate(settings)](#startutoupdatesettings), but without `interval` property

#### .clearList()

Clears rating list

### License

MIT