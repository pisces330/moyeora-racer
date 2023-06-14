const likeService = require('./service');

module.exports = {
  async selectLike(req, res) {
    const { board_id } = req.query;
    const loginId = req.currentId;

    res.status(200).json(await likeService.selectLike(board_id, loginId));
  },

  async setLike(req, res) {
    const { board_id } = req.body;
    const loginId = req.currentId;

    res.status(201).json(await likeService.setLike(board_id, loginId));
  },

  async deleteLike(req, res) {
    const { board_id } = req.body;
    const loginId = req.currentId;

    res.status(200).json(await likeService.deleteLike(board_id, loginId));
  },
};
