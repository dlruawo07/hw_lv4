const express = require('express');
const router = express.Router();

const { Comments } = require('../models');
const { Posts } = require('../models');

const authMiddleware = require('../middlewares/auth-middleware');
const { errorWithStatusCode } = require('../middlewares/errorHandler');

// 1. 댓글 목록 조회 API
//     - 로그인 토큰을 전달하지 않아도 댓글 목록 조회가 가능하도록 하기
//     - 조회하는 게시글에 작성된 모든 댓글을 목록 형식으로 볼 수 있도록 하기
//     - 작성 날짜 기준으로 내림차순 정렬하기
router.get('/:postId/comments', async (req, res) => {
  console.log('\u001b[1;32m GET /:postId/comments\u001b[0m');

  const { postId } = req.params;

  const comments = await Comments.findAll({
    attributes: {
      exclude: ['postId'],
      order: [['createdAt', 'DESC']],
    },
    where: { postId },
  }).catch((err) => {
    throw errorWithStatusCode(400, '댓글 조회에 실패했습니다.');
  });

  if (!comments.length) {
    throw errorWithStatusCode(404, '댓글이 존재하지 않습니다.');
  }

  res.status(200).json({ comments });
});

// 2. 댓글 작성 API
//     - 로그인 토큰을 검사하여, 유효한 토큰일 경우에만 댓글 작성 가능
//     - 댓글 내용을 비워둔 채 댓글 작성 API를 호출하면 "댓글 내용을 입력해주세요" 라는 메세지를 return하기
//     - 댓글 내용을 입력하고 댓글 작성 API를 호출한 경우 작성한 댓글을 추가하기
router.post('/:postId/comments', authMiddleware, async (req, res) => {
  console.log('\u001b[1;34m POST /:postId/comments\u001b[0m');

  const { userId, nickname } = res.locals.user;
  const { postId } = req.params;

  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, '댓글 작성에 실패했습니다.');
  });

  // 댓글을 작성할 게시글이 존재하지 않는 경우
  if (!post) {
    throw errorWithStatusCode(404, '게시글이 존재하지 않습니다.');
  }

  const { comment } = req.body;

  // 데이터가 정상적으로 전달되지 않는 경우
  if (Object.keys(req.body).length !== 1 || comment === undefined) {
    throw errorWithStatusCode(412, '데이터 형식이 올바르지 않습니다.');
  }

  // 댓글이 비어있는 경우
  if (comment === '') {
    throw errorWithStatusCode(400, '댓글 내용을 입력해주세요.');
  }

  await Comments.create({
    userId,
    nickname,
    postId,
    comment,
  }).catch((err) => {
    throw errorWithStatusCode(400, '댓글 작성에 실패했습니다.');
  });

  res.status(201).json({ message: '댓글 작성에 성공했습니다.' });
});

// 3. 댓글 수정 API
//     - 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 수정 가능
//     - 댓글 내용을 비워둔 채 댓글 수정 API를 호출하면 "댓글 내용을 입력해주세요" 라는 메세지를 return하기
//     - 댓글 내용을 입력하고 댓글 수정 API를 호출한 경우 작성한 댓글을 수정하기
router.put('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  console.log('\u001b[1;33m PUT /:postId/comments/:commentId\u001b[0m');

  const { userId } = res.locals.user;
  const { postId } = req.params;

  // 예외 케이스에서 처리하지 못한 에러
  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, '댓글 수정에 실패했습니다.');
  });

  // 댓글을 수정할 게시글이 존재하지 않는 경우
  if (!post) {
    throw errorWithStatusCode(404, '게시글이 존재하지 않습니다.');
  }

  const { commentId } = req.params;

  // 예외 케이스에서 처리하지 못한 에러
  const targetComment = await Comments.findOne({
    where: { commentId },
  }).catch((err) => {
    throw errorWithStatusCode(400, '댓글 수정에 실패했습니다.');
  });

  // 댓글이 존재하지 않는 경우
  if (!targetComment) {
    throw errorWithStatusCode(404, '댓글이 존재하지 않습니다.');
  }

  // 댓글의 수정 권한이 존재하지 않는 경우
  if (userId !== targetComment.userId) {
    throw errorWithStatusCode(403, '댓글의 수정 권한이 존재하지 않습니다.');
  }

  const { comment } = req.body;

  // 데이터가 정상적으로 전달되지 않는 경우
  if (Object.keys(req.body).length !== 1 || comment === undefined) {
    throw errorWithStatusCode(412, '데이터 형식이 올바르지 않습니다.');
  }

  // 댓글이 비어있는 경우
  if (comment === '') {
    throw errorWithStatusCode(400, '댓글 내용을 입력해주세요.');
  }

  // 댓글 수정에 실패한 경우
  await Comments.update(
    { comment, updatedAt: new Date() },
    { where: { commentId } }
  ).catch((err) => {
    throw errorWithStatusCode(401, '댓글이 정상적으로 수정되지 않았습니다.');
  });

  res.status(200).json({ message: '댓글을 수정했습니다.' });
});

// 4. 댓글 삭제 API
//     - 로그인 토큰을 검사하여, 해당 사용자가 작성한 댓글만 삭제 가능
//     - 원하는 댓글을 삭제하기
router.delete(
  '/:postId/comments/:commentId',
  authMiddleware,
  async (req, res) => {
    console.log('\u001b[1;31m DELETE /:postId/comments/:commentId\u001b[0m');

    const { userId } = res.locals.user;
    const { postId } = req.params;

    // 예외 케이스에서 처리하지 못한 에러
    const post = await Posts.findOne({ where: { postId } }).catch((err) => {
      throw errorWithStatusCode(400, '댓글 삭제에 실패했습니다.');
    });

    // 댓글을 삭제할 게시글이 존재하지 않는 경우
    if (!post) {
      throw errorWithStatusCode(404, '게시글이 존재하지 않습니다.');
    }

    const { commentId } = req.params;

    // 예외 케이스에서 처리하지 못한 에러
    const targetComment = await Comments.findOne({
      where: { commentId },
    }).catch((err) => {
      throw errorWithStatusCode(400, '댓글 삭제에 실패했습니다.');
    });

    // 댓글이 존재하지 않는 경우
    if (!targetComment) {
      throw errorWithStatusCode(404, '댓글이 존재하지 않습니다.');
    }

    // 댓글의 삭제 권한이 존재하지 않는 경우
    if (userId !== targetComment.userId) {
      throw errorWithStatusCode(403, '댓글의 삭제 권한이 존재하지 않습니다.');
    }

    // 댓글 삭제에 실패한 경우
    await Comments.destroy({ where: { commentId } }).catch((err) => {
      throw errorWithStatusCode(401, '댓글이 정상적으로 삭제되지 않았습니다.');
    });

    res.status(200).json({ message: '댓글을 삭제했습니다.' });
  }
);

module.exports = router;
