const express = require("express");
const router = express.Router();

const { Posts } = require("../models");
const { Likes } = require("../models");

const authMiddleware = require("../middlewares/auth-middleware");
const { errorWithStatusCode } = require("../middlewares/errorHandler");

router.put("/:postId/like", authMiddleware, async (req, res) => {
  console.log("\u001b[1;33m PUT /:postId/like\u001b[0m");

  const { userId } = res.locals.user;
  const { postId } = req.params;

  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, "게시글의 좋아요 등록에 실패했습니다.");
  });

  // 좋아요를 등록하고자 하는 게시글이 존재하지 않는 경우
  if (!post) {
    throw errorWithStatusCode(404, "게시글이 존재하지 않습니다.");
  }

  const like = await Likes.findOne({ where: { userId, postId } }).catch(
    (err) => {
      throw errorWithStatusCode(400, "게시글의 좋아요 등록에 실패했습니다.");
    }
  );

  // postId에 대한 userId의 좋아요가 없을 때
  if (!like) {
    // postId에 대한 userId의 좋아요 등록
    await Likes.create({
      userId,
      postId,
    }).catch((err) => {
      throw errorWithStatusCode(400, "게시글의 좋아요 등록에 실패했습니다.");
    });
    await post.increment("likes", { by: 1 }).catch((err) => {
      throw errorWithStatusCode(400, "게시글의 좋아요 등록에 실패했습니다.");
    });
  } else {
    // 좋아요 취소
    await Likes.destroy({ where: { userId, postId } }).catch((err) => {
      throw errorWithStatusCode(400, "게시글의 좋아요 취소에 실패했습니다.");
    });
    await post.decrement("likes", { by: 1 }).catch((err) => {
      throw errorWithStatusCode(400, "게시글의 좋아요 등록에 실패했습니다.");
    });
  }
  if (!like) {
    return res.status(200).json({ message: "게시글의 좋아요를 등록했습니다." });
  }
  return res.status(200).json({ message: "게시글의 좋아요를 취소했습니다." });
});

router.get("/like", authMiddleware, async (req, res) => {
  console.log("\u001b[1;32m GET /like\u001b[0m");

  const { userId } = res.locals.user;

  // 원하는 출력값
  // postId: 2
  // Posts.attr1
  // Posts.attr2
  // Posts.attr3

  // 현재 출력값
  // postId: 2
  // Posts: {
  //   attr1
  //   attr2
  //   attr3
  // }
  const likes = await Likes.findAll({ where: { userId } }).catch((err) => {
    throw errorWithStatusCode(400, "게시글 조회에 실패했습니다.");
  });

  if (!likes.length) {
    throw errorWithStatusCode(404, "게시글이 존재하지 않습니다.");
  }

  const targetPosts = await Likes.findAll({
    attributes: ["postId"],
    include: [
      {
        model: Posts,
        required: true,
        attributes: { exclude: ["content"] },
      },
    ],
    where: { userId },
  });

  // 다른 방법이 있지 않을까?
  // const posts = targetPosts.map((post) => {
  //   return {
  //     postId: post.postId,
  //     userId: post.Post.userId,
  //     nickname: post.Post.nickname,
  //     title: post.Post.title,
  //     likes: post.Post.likes,
  //     createdAt: post.Post.createdAt,
  //     updatedAt: post.Post.updatedAt,
  //   };
  // });

  // return res.status(200).json({ posts });

  return res.status(200).json({ targetPosts });
});

module.exports = router;
