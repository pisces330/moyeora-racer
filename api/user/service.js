const User = require('./model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserDetail = require('../user-detail/model');
const { BadRequestException } = require('../../middlewares');

module.exports = {
  /**
   * 회원가입
   * @param {name, email, password}
   */
  async addUser(userInfo) {
    const { name, email, password } = userInfo;
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return;
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원가입
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    //회원 정보 테이블 초기 값 설정
    await UserDetail.create({
      user_id: newUser.id,
      position: '직책을 입력해주세요.',
      generation_id: '기수를 입력해주세요.',
      profile_public: false,
    });

    if (!newUser) {
      throw new BadRequestException('회원가입에 실패했습니다.');
    }

    return newUser;
  },

  async getUserToken({ email, password }) {
    // 사용자 조회
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return;
    }

    // 패스워드 검증
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return;
    }

    const secretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(
      { id: user.id, role: 'user' },
      secretKey
      // { 개발 단계에서 토큰 시간 ❌
      //   expiresIn: '3h',
      // }
    );
    return token;
  },
};
