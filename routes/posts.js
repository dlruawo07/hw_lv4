const express = require('express');
const router = express.Router();

const { Posts } = require('../models');

const authMiddleware = require('../middlewares/auth-middleware');
const { errorWithStatusCode } = require('../middlewares/errorHandler');

const commentsRouter = require('./comments');
const likesRouter = require('./likes');

router.use('/posts/', [commentsRouter, likesRouter]);

// 1. 전체 게시글 목록 조회 API
//     - 제목, 작성자명(nickname), 작성 날짜를 조회하기
//     - 작성 날짜 기준으로 내림차순 정렬하기
router.get('/posts', async (req, res) => {
  console.log('\u001b[1;32m GET /posts\u001b[0m');

  const posts = await Posts.findAll({
    attributes: {
      exclude: ['content'],
      order: [['createdAt', 'DESC']],
    },
  }).catch((err) => {
    throw errorWithStatusCode(400, '게시글 조회에 실패했습니다.');
  });

  if (!posts.length) {
    throw errorWithStatusCode(404, '게시글이 존재하지 않습니다.');
  }

  res.status(200).json({ posts });
});

// 2. 게시글 작성 API
//     - 토큰을 검사하여, 유효한 토큰일 경우에만 게시글 작성 가능
//     - 제목, 작성 내용을 입력하기
router.post('/posts', authMiddleware, async (req, res) => {
  '\u001b[1;34m post /posts\u001b[0m';
  const { userId, nickname } = res.locals.user;
  const { title, content } = req.body;

  // body 데이터가 정상적으로 전달되지 않는 경우
  if (
    Object.keys(req.body).length !== 2 ||
    title === undefined ||
    content === undefined
  ) {
    throw errorWithStatusCode(412, '데이터 형식이 올바르지 않습니다.');
  }

  // title의 형식이 비정상적인 경우
  if (title === '' || typeof title !== 'string') {
    throw errorWithStatusCode(412, '게시글 제목의 형식이 일치하지 않습니다.');
  }

  // content의 형식이 비정상적인 경우
  if (content === '' || typeof content !== 'string') {
    throw errorWithStatusCode(412, '게시글 내용의 형식이 일치하지 않습니다.');
  }

  await Posts.create({
    userId,
    nickname,
    title,
    content,
  }).catch((err) => {
    throw errorWithStatusCode(400, '게시글 작성에 실패했습니다.');
  });

  res.status(201).json({ message: '게시글 작성에 성공했습니다.' });
});

// 3. 게시글 조회 API
//     - 제목, 작성자명(nickname), 작성 날짜, 작성 내용을 조회하기
//     (검색 기능이 아닙니다. 간단한 게시글 조회만 구현해주세요.)
router.get('/posts/:postId', async (req, res) => {
  console.log('\u001b[1;32m GET /posts/:postId\u001b[0m');

  const { postId } = req.params;
  const post = await Posts.findOne({
    order: [['createdAt', 'DESC']],
    where: { postId },
  }).catch((err) => {
    throw errorWithStatusCode(400, '게시글 조회에 실패했습니다.');
  });

  if (!post) {
    throw errorWithStatusCode(400, '게시글 조회에 실패했습니다.');
  }

  res.status(200).json({ post });
});

// 4. 게시글 수정 API
//     - 토큰을 검사하여, 해당 사용자가 작성한 게시글만 수정 가능
router.put('/posts/:postId', authMiddleware, async (req, res) => {
  console.log('\u001b[1;33m PUT /posts/:postId\u001b[0m');

  const { userId } = res.locals.user;
  const { postId } = req.params;

  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, '게시글 수정에 실패했습니다.');
  });

  // 수정하고자 하는 게시글이 존재하지 않는 경우
  if (!post) {
    throw errorWithStatusCode(404, '게시글이 존재하지 않습니다.');
  }

  // 게시글들 수정할 권한이 존재하지 않는 경우
  if (userId !== post.userId) {
    throw errorWithStatusCode(403, '게시글의 수정 권한이 존재하지 않습니다.');
  }

  const { title, content } = req.body;

  // body 데이터가 정상적으로 전달되지 않는 경우
  if (Object.keys(req.body).length !== 2) {
    throw errorWithStatusCode(412, '데이터 형식이 올바르지 않습니다.');
  }

  // title의 형식이 비정상적인 경우
  if (title === undefined || title === '' || typeof title !== 'string') {
    throw errorWithStatusCode(412, '게시글 제목의 형식이 일치하지 않습니다.');
  }

  // content의 형식이 비정상적인 경우
  if (content === undefined || content === '' || typeof content !== 'string') {
    throw errorWithStatusCode(412, '게시글 내용의 형식이 일치하지 않습니다.');
  }

  // 게시글 수정이 실패한 경우
  await Posts.update(
    { title, content, updatedAt: new Date() },
    { where: { postId } }
  ).catch((err) => {
    throw errorWithStatusCode(401, '게시글이 정상적으로 수정되지 않았습니다.');
  });

  res.status(200).json({ message: '게시글을 수정했습니다.' });
});

// 5. 게시글 삭제 API
//     - 토큰을 검사하여, 해당 사용자가 작성한 게시글만 삭제 가능
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  console.log('\u001b[1;31m DELETE /posts/:postId/\u001b[0m');

  const { userId } = res.locals.user;
  const { postId } = req.params;

  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, '게시글이 삭제에 실패했습니다.');
  });

  // 삭제하고자 하는 게시글이 존재하지 않는 경우
  if (!post) {
    throw errorWithStatusCode(404, '게시글이 존재하지 않습니다.');
  }

  // 게시글을 삭제할 권한이 존재하지 않는 경우
  if (userId !== post.userId) {
    throw errorWithStatusCode(403, '게시글의 삭제 권한이 존재하지 않습니다.');
  }

  // 게시글 삭제에 실패한 경우
  await Posts.destroy({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(401, '게시글이 정상적으로 삭제되지 않습니다.');
  });

  res.status(200).json({ message: '게시글을 삭제했습니다.' });
});

module.exports = router;
