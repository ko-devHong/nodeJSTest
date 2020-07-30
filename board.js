import express from 'express';
import User from './model/user';

const router = express.Router();

/**
 * @swagger
 * definitions:
 *  usersItem:
 *   type: object
 *   required:
 *     - firstName
 *     - lastName
 *     - createdAt
 *     - updatedAt
 *   properties:
 *     id:
 *       type: integer
 *       description: ObjectId
 *     firstName:
 *       type: string
 *       description: 첫이름
 *     lastName:
 *       type: string
 *       description: 마지막이름
 *     createdAt:
 *       type: string
 *       description: 생성날짜
 *     updatedAt:
 *       type: string
 *       description: 수정날짜
 */

/**
 * @swagger
 *  /swagger/users:
 *    get:
 *      tags:
 *      - users
 *      description: 유저를 가지고온다
 *      produces:
 *      - applicaion/json
 *      parameters:
 *      responses:
 *       200:
 *        description: users of column list
 *        schema:
 *          type: array
 *          items:
 *           $ref: '#/definitions/usersItem'
 */
router.get('/swagger/users', async (req, res) => {
  const users = await User.findAll();
  return res.json(users);
});

/**
 * @swagger
 *  /boards/:id:
 *    get:
 *      tags:
 *      - board
 *      description: 지정된 게시글을 가져온다.
 *      produces:
 *      - applicaion/json
 *      parameters:
 *      responses:
 *       200:
 *        description: board of selected id column list
 *        schema:
 *          type: array
 *          items:
 *           $ref: '#/definitions/boardItem'
 */
router.get('/boards/:id', async (req, res) => {
  //   const board = await db.board.findOne({
  //     where: { id: req.params.id },
  //   });

  //   return res.json(board);
  return res.send(`boards id is ${req.params.id}`);
});

export default router;
