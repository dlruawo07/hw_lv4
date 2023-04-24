const express = require("express");
const router = express.Router();

const { Posts } = require("../models");
const { Likes } = require("../models");

const authMiddleware = require("../middlewares/auth-middleware");
const { errorWithStatusCode } = require("../middlewares/errorHandler");

router.put("/:postId/like", authMiddleware, async (req, res) => {
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
  } else {
    // 좋아요 취소
    await Likes.destroy({ where: { userId, postId } }).catch((err) => {
      throw errorWithStatusCode(400, "게시글의 좋아요 취소에 실패했습니다.");
    });
  }

  const likes = await Likes.count({ where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, "게시글의 좋아요 갯수 조회에 실패했습니다.");
  });

  await Posts.update({ likes }, { where: { postId } }).catch((err) => {
    throw errorWithStatusCode(400, "게시글의 좋아요 등록/취소에 실패했습니다.");
  });

  if (!like) {
    return res.status(200).json({ message: "게시글의 좋아요를 등록했습니다." });
  }
  return res.status(200).json({ message: "게시글의 좋아요를 취소했습니다." });
});

router.get("/like", authMiddleware, async (req, res) => {
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
  const likes = await Likes.findAll({
    where: { userId },
  });

  if (!likes.length) {
    throw errorWithStatusCode(404, "게시글이 존재하지 않습니다.");
  }

  // 위에서 기대했던 값을 아래처럼 구현함
  // 이렇게 되면 findOne 메소드를 likes의 길이만큼 호출하는데, 이 길이가 엄청 길다면 너무 비효율적일듯..
  // likes에 있는 postId의 데이터만 조회하고 싶은데 가능한지?
  let posts = [];
  for (let postId of likes) {
    let post = await Posts.findOne(
      { attributes: { exclude: ["content"], order: ["createdAt", "DESC"] } },
      { where: { postId: postId.postId } }
    );
    posts.push(post);
  }

  return res.status(200).json({ posts });

  // Likes의 postId가 Posts의 postId를 참조하기 때문에 join이 됨
  // const joinWithPosts = await Likes.findAll({
  //   attributes: ["postId"],
  //   include: [
  //     {
  //       model: Posts,
  //       through: { attributes: ["postId"] },
  //       // through: { attributes: { exclude: ["postId", "content"] } },
  //     },
  //   ],
  //   where: { userId },
  // });

  //   const joinWithPosts = await Posts.findAll({
  //     include: [
  //       {
  //         model: Likes,
  //         through: {
  //           where: {
  //             userId,
  //           },
  //         },
  //       },
  //     ],
  //   });
  //   return res.status(200).json({ joinWithPosts });
});

module.exports = router;
