import express from 'express';
import sequelize from './db_connect';
import User from './model/user';
import swaggerDoc from './swaggerDoc';
import ROUTER from './board';
import zeroPayAPI, { STORE_KEY, MID } from './config/restApi';
import CryptoJS from 'crypto-js';
import moment from 'moment';

var app = express();

app.use(ROUTER);
app.use(swaggerDoc);
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// GET method route
app.get('/', function (req, res) {
  res.send('GET request to the homepage!!');
  sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
    })
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
    });
});

// POST method route
app.post('/', function (req, res) {
  res.send('POST request to the homepage');
});

app.get('/about', function (req, res) {
  res.send('about');
});

// 물음표 왼쪽 문자가 없거나 포함되거나 ex) /acd , /abcd
app.get('/ab?cd', function (req, res) {
  res.send('ab?cd');
});

// + 왼쪽 문자가 몇개든지 추가 될수있다. ex)  /efgh , /efffffgh
app.get('/ef+gh', function (req, res) {
  res.send('ef+gh');
});

// * 문자 부분에 아무 문자가 들어올 수 있음 ex) /qwer , /qw14hher
app.get('/qw*er', function (req, res) {
  res.send('qw*er');
});

// cd 문자가 포함되거나 안되거나
app.get('/ab(cd)?e', function (req, res) {
  res.send('ab(cd)?e');
});

// // z 가 포함된 모든 항목
// app.get(/z/, function (req, res) {
//   res.send("/z/ 가 포함됨 ");
// });

// 콘솔 로그가 먼저 보인후 문자가 보여짐
app.get(
  '/example/b',
  function (req, res, next) {
    console.log('the response will be sent by the next function ...');
    next();
  },
  function (req, res) {
    res.send('Hello from B!');
  }
);

// 배열로 할경우 처음부터 순차적으로 실행됨
var cb0 = function (req, res, next) {
  console.log('CB0');
  next();
};

var cb1 = function (req, res, next) {
  console.log('CB1');
  next();
};

var cb2 = function (req, res) {
  res.send('Hello from C!');
};

app.get('/example/c', [cb0, cb1, cb2]);

//route 활용 get / push /post
app
  .route('/book')
  .get(function (req, res) {
    res.send('Get a random book!!');
  })
  .post(function (req, res) {
    res.send('Add a book');
  })
  .put(function (req, res) {
    res.send('Update the book');
  });

app.get('/userAdd', function (req, res) {
  // 새로운 유저 생성
  User.create({ firstName: 'John', lastName: 'Doe' }).then((user) => {
    console.log("Jane's auto-generated ID:", user.id);
    res.send(`${user.firstName} ${user.lastName} add success`);
  });
});

app.get('/userUpdate', function (req, res) {
  // 성이 없는 모든 사용자를 "Doe"로 변경
  User.update(
    { lastName: 'Doe' },
    {
      where: {
        lastName: null,
      },
    }
  ).then(() => {
    console.log('update Done');
    res.send('user update success');
  });
});

app.get('/userDelete', function (req, res) {
  // Jane 이라는 이름을 가진 사람 삭제
  User.destroy({
    where: {
      firstName: 'Jane',
    },
  }).then(() => {
    console.log('Done');
    res.send('user delete success');
  });
});

app.get('/userFindAll', function (req, res) {
  // 모든 유저 찾기
  User.findAll().then((users) => {
    console.log('All users:', JSON.stringify(users, null, 4));
    res.send(`${JSON.stringify(users, null, 4)} \n \n user FindAll success`);
  });
});

const EncryptHex = (string, chip) => {
  let result = '';
  try {
    const key = CryptoJS.enc.Hex.parse(STORE_KEY);
    if (chip === 'AES') {
      const iv = CryptoJS.lib.WordArray.create([0x00, 0x00, 0x00, 0x00]);
      result = CryptoJS.AES.encrypt(string, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
      });
      result = result.ciphertext.toString(CryptoJS.enc.Hex);
      DecryptHex(result, 'AES', STORE_KEY);
    } else {
      result = CryptoJS.HmacSHA256(string, key).toString(CryptoJS.enc.Hex);
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const DecryptHex = (string, chip, skey) => {
  let result = '';
  const key = CryptoJS.enc.Hex.parse(skey);
  const iv = CryptoJS.lib.WordArray.create([0x00, 0x00, 0x00, 0x00]);
  try {
    const array = CryptoJS.enc.Hex.parse(string);
    if (chip === 'AES') {
      result = CryptoJS.AES.decrypt(array, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
      }).toString();
      console.log('$$$$');
      console.log('result : ', result);
      console.log('$$$$');
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const verifyMac = (skey, res_ev, res_vv) => {
  const decryptedData = DecryptHex(res_ev, 'AES', skey);
  const checkHmac = EncryptHex(decryptedData, 'SHA');
  console.log('$$$$');
  console.log('decryptedData : ', decryptedData);
  console.log('$$$$');
  console.log('$$$$');
  console.log('res_vv : ' + res_vv);
  console.log('$$$$');
  console.log('$$$$');
  console.log('checkHmac : ' + checkHmac);
  console.log('$$$$');
  if (res_vv === checkHmac) {
    return true;
  } else {
    return false;
  }
};

//결제 준비
app.get('/zeropayReady', async (req, res) => {
  const params = {};
  const productItems = [];
  const productItem = {};
  const productItem2 = {};
  const body = {};
  productItem.seq = 1;
  productItem.name = '[오더프레쉬] 못난이(흠과) 사과 5kg (과수크기 랜덤발송)';
  productItem.category = 'F';
  productItem.count = 2;
  productItem.amount = 1000;
  productItem.biz_no = '123456790';
  productItems.push(productItem);
  productItem2.seq = 2;
  productItem2.name = '실속혼합과일선물세트5호(사과4과/배1과)';
  productItem2.category = 'F';
  productItem2.count = 1;
  productItem2.amount = 500;
  productItem2.biz_no = '123456790';
  productItems.push(productItem2);

  params.mid = MID; // 가맹점 코드
  params.mode = 'development'; //개발환경
  params.merchantOrderID = '20200723_order_id1234'; //가맹점 주문번호
  params.merchantUserKey = 'test_mall_userkey'; // 가맹점 회원키
  params.productName =
    '[오더프레쉬] 못난이(흠과) 사과 5kg (과수크기 랜덤발송) 포함 총2건'; //상품 표시명
  params.quantity = 3; // 상품 총수량
  params.totalAmount = 1500; // 상품권 총금액
  params.taxFreeAmount = 0; // 상품비과세금액
  params.vatAmount = 137; // 상품 부가세 금액
  params.approvalURL = 'http://localhost:3000/zeropay/result?type=success'; // 결제승인 성공시 return url
  params.cancelURL = 'http://localhost:3000/zeropay/result?type=cancel';
  params.failURL = 'http://localhost:3000/zeropay/result?type=fail';
  params.apiCallYn = 'N'; // API 호출여부(API,복합: Y, 화면: N )
  params.payrCi = '';
  params.clphNo = '';
  params.zip_no = '010';
  params.productItems = productItems;

  try {
    const date = moment(new Date()).format('yyyyMMddkkmmss');
    const reqEV = EncryptHex(JSON.stringify(params), 'AES');
    const reqVV = EncryptHex(JSON.stringify(params), 'SHA');
    body.MID = MID;
    body.RQ_DTIME = date;
    body.TNO = date;
    body.EV = reqEV;
    body.VV = reqVV;
    body.RC = '';
    body.RM = '';

    // 결제 준비
    const { data } = await zeroPayAPI.post('/api_v1_payment_reserve.jct', body);
    return res.send(data);
    if (data.RC !== '0000') {
      return res.send('zeropay ready fail');
    } else {
      const resEV = data.EV;
      const resVV = data.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const result = DecryptHex(resEV, 'AES', STORE_KEY);
        if (result.code === '000') {
          return res.send(result.data);
          params.tid = data.data.tid;
          params.token = data.data.token;
          params.createdAt = data.data.createdAt;
          const result = await zeroPayAgreement(params);
          return res.send(result);
        } else {
          return res.send('zeropay ready not 000 fail');
        }
      } else {
        return res.send('zeropay ready verify fail');
      }
    }
  } catch (error) {
    throw error;
  }
});

// 결제 승인
const zeroPayAgreement = async (params) => {
  try {
    if (params) {
      const body = {};
      body.mid = params.MID;
      body.tid = params.tid;
      body.merchantOrderID = params.merchantOrderID;
      body.merchantUserKey = params.merchantUserKey;
      body.token = params.token;
      body.payload = '';
      body.totalAmount = params.totalAmount;
      const { data } = await zeroPayAPI.post(
        '/api_v1_payment_approval.jct',
        body
      );
      return data;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

// 결제 결과
app.get('/zeropay/result', function (req, res) {
  if (req.query.type === 'success') {
    res.send('zeropay success');
  } else {
    res.send('zeropay  fail');
  }
});

// 결제 취소
app.get('/zeropay/cancel', async function (req, res) {
  const mid = req.query.mid || MID;
  const tid = req.query.tid || '191204ZP00000426';
  const cancelAmount = req.query.cancelAmount || 1500;
  const cancelTaxFreeAmount = req.query.cancelTaxFreeAmount || 0;
  const body = {};
  body.mid = mid;
  body.tid = tid;
  body.cancelAmount = cancelAmount;
  body.cancelTaxFreeAmount = cancelTaxFreeAmount;
  try {
    const { data } = await zeroPayAPI.post('/api_v1_payment_cancel.jct', body);
    return res.send(data);
  } catch (error) {
    throw error;
  }
});

// 결제 상태 조회
app.get('/zeropay/status/search', async function (req, res) {
  const mid = req.query.mid || MID;
  const tid = req.query.tid || '191204ZP00000426';
  const body = {};
  body.mid = mid;
  body.tid = tid;
  try {
    const { data } = await zeroPayAPI.post('/api_v1_payment_status.jct', body);
    return res.send(data);
  } catch (error) {
    throw error;
  }
});

// 정산내역 조회
app.get('/zeropay/payment/search', async function (req, res) {
  const mid = req.query.mid || MID;
  const fromDate = req.query.fromDate || '20060102'; //조회 시작일자
  const toDate = req.query.toDate || '20060131'; //조회 종료일자
  const perPage = req.query.perPage || 10; // 페이지당 건수
  const pageIndex = req.query.pageIndex || 1; //시작 페이지
  const body = {};
  body.mid = mid;
  body.fromDate = fromDate;
  body.toDate = toDate;
  body.perPage = perPage;
  body.pageIndex = pageIndex;
  try {
    const { data } = await zeroPayAPI.post('/api_v1_payment_sttlinq.jct', body);
    return res.send(data);
  } catch (error) {
    throw error;
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
