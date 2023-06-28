const cron = require('node-cron');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const mailer = require('./send-mail');
const serviceHandler = require('./service-handler');
const { Plan, User, Alert } = require('../models');
const logger = require('../logger');
const { InternalServerErrorException } = require('../middlewares');

let isRunning = false;

cron.schedule(
  '0 * * * *',
  serviceHandler(async () => {
    logger.info('node-cron 스케줄링은 1시간마다 실행됩니다.');
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const nextHour = dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

    const plan = await Plan.findAll({
      where: { start_date: { [Op.between]: [currentTime, nextHour] } },
      raw: true,
    });

    if (plan.length > 0) {
      if (!isRunning) {
        isRunning = true;
        logger.info('1시간 내 일정이 있습니다.');

        let text = '';
        let content = '';
        let planId = '';
        plan.forEach((p) => {
          text += p.title;
          content += p.content;
          planId += p.id;
        });

        const users = await User.findAll({
          attributes: ['id', 'email'],
          raw: true,
        });

        /**
         * 일정 1시간 전 알림 등록
         */
        let plans = [];
        users.forEach((u) => {
          plans.push({
            from_user_id: u.id,
            to_user_id: u.id,
            type: 'PLAN',
            target_id: planId,
          });
        });

        const alerts = await Alert.bulkCreate(plans).then(() => {
          return Alert.findAll();
        });
        if (!alerts) {
          throw new InternalServerErrorException(
            '스케줄링에서 일정 알림 등록 처리에 실패하였습니다.'
          );
        }

        /**
         * 일정 1시간 전 메일 전송
         */
        users.forEach((emails) => {
          mailer.sendGmail(
            emails.email,
            '모여라 레이서에서 1시간 뒤에 있을 일정을 알려드립니다.',
            text,
            content
          );
        });

        isRunning = false;
      } else {
        logger.info('일정 스케줄 API가 이미 실행중입니다.');
      }
    }
  })
);
