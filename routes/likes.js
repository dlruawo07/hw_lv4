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

  // 여기서 includes model/attributes를 해주고 싶은데 그렇게 하면 객체가 따로 생김

  // 기대값
  // postId: 2
  // Posts.attr1
  // Posts.attr2
  // Posts.attr3

  // 실제 출력값
  // postId: 2
  // Posts: {
  //   attr1
  //   attr2
  //   attr3
  // }

  // 하고 싶은거
  // 1. Likes 테이블에서 userId가 userId인 값들만 추출.
  // 2. 추출된 데이터에서의 postId의 전체 정보를 Posts 테이블에서 조회.
  const likes = await Likes.findAll({ where: { userId } }).catch((err) => {
    throw errorWithStatusCode(400, "게시글 조회에 실패했습니다.");
  });

  if (!likes.length) {
    throw errorWithStatusCode(404, "게시글이 존재하지 않습니다.");
  }

  const posts = await Likes.findAll({
    attributes: ["postId"],
    include: [
      {
        model: Posts,
        required: true,
        // through: { where: { userId } },
        attributes: { exclude: ["postId", "content"] },
      },
    ],
    where: { userId },
  });

  return res.status(200).json({ posts });
});

module.exports = router;
