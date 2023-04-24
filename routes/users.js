const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { Users } = require("../models");
const { errorWithStatusCode } = require("../middlewares/errorHandler");

// 회원가입 API
router.post("/signup", async (req, res) => {
  console.log("\u001b[1;34m POST /signup\u001b[0m");
  // req.body로 들어온 값이 3개가 아닌 경우
  if (Object.keys(req.body).length !== 3) {
    throw errorWithStatusCode(400, "요청한 데이터 형식이 올바르지 않습니다.");
  }

  const { nickname, password, confirm } = req.body;

  // nickname, password, confirm이 string 타입이 아닌 경우
  if (
    typeof nickname !== "string" ||
    typeof password !== "string" ||
    typeof confirm !== "string"
  ) {
    throw errorWithStatusCode(400, "요청한 데이터 형식이 올바르지 않습니다.");
  }

  // 닉네임 형식이 비정상적인 경우
  if (!/^[a-zA-Z0-9]{3,}/.test(nickname)) {
    throw errorWithStatusCode(412, "닉네임의 형식이 일치하지 않습니다.");
  }

  // 비밀번호 형식이 비정상적인 경우
  if (password.length < 4) {
    throw errorWithStatusCode(412, "패스워드 형식이 일치하지 않습니다.");
  }

  // 비밀번호에 닉네임이 포함되는 경우
  if (password.includes(nickname)) {
    throw errorWithStatusCode(412, "패스워드에 닉네임이 포함되어 있습니다.");
  }

  // 비밀번호가 일치하지 않는 경우
  if (password !== confirm) {
    throw errorWithStatusCode(412, "패스워드가 일치하지 않습니다.");
  }

  const user = await Users.findOne({ where: { nickname } }).catch((err) => {
    throw errorWithStatusCode(400, "회원가입에 실패했습니다.");
  });

  // 닉네임이 중복된 경우
  if (user) {
    throw errorWithStatusCode(412, "중복된 닉네임입니다.");
  }

  await Users.create({
    nickname,
    password,
  }).catch((err) => {
    throw errorWithStatusCode(400, "회원가입에 실패했습니다.");
  });

  return res.status(201).json({ message: "회원가입에 성공하였습니다." });
});

// 로그인 API
router.post("/login", async (req, res) => {
  console.log("\u001b[1;34m POST /login\u001b[0m");

  // req.body로 들어온 값이 2개가 아닌 경우
  if (Object.keys(req.body).length !== 2) {
    throw errorWithStatusCode(400, "로그인에 실패했습니다.");
  }
  const { nickname, password } = req.body;

  if (
    nickname === undefined ||
    password === undefined ||
    typeof nickname !== "string" ||
    typeof password !== "string" ||
    nickname === "" ||
    password === ""
  ) {
    throw errorWithStatusCode(400, "로그인에 실패했습니다.");
  }

  const user = await Users.findOne({ where: { nickname, password } }).catch(
    (err) => {
      throw errorWithStatusCode(400, "로그인에 실패했습니다.");
    }
  );

  // 유저가 존재하지 않거나 비밀번호가 일치하지 않는 경우
  if (!user) {
    throw errorWithStatusCode(412, "닉네임 또는 패스워드를 확인해주세요.");
  }

  const token = jwt.sign({ userId: user.userId }, "customized-secret-key", {
    expiresIn: "1h",
  });

  res.cookie("Authorization", `Bearer ${token}`);

  return res.status(200).json({ token });
});

module.exports = router;
