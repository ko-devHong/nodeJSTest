import express from 'express';
import sequelize from './db_connect';
import User from './model/user';
import swaggerDoc from './swaggerDoc';
import ROUTER from './board';
import zeroPayAPI, { STORE_KEY, MID } from './config/restApi';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import querystring from 'querystring';
import session from 'express-session';

const FileStore = require('session-file-store')(session);

var app = express();

app.use(ROUTER);
app.use(swaggerDoc);
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(
  session({
    secret: 'keyboard cat', // 암호화
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
  })
);
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

const EncryptHex = (string, chip, skey) => {
  let result = '';
  try {
    const key = CryptoJS.enc.Hex.parse(skey);
    if (chip === 'AES') {
      const iv = CryptoJS.lib.WordArray.create([0x00, 0x00, 0x00, 0x00]);
      result = CryptoJS.AES.encrypt(string, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
      });
      result = result.ciphertext.toString(CryptoJS.enc.Hex);
    } else {
      result = CryptoJS.HmacSHA256(string, key).toString(CryptoJS.enc.Hex);
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const DecryptHex = (encryptedStringHex, chip, skey) => {
  let result = '';
  const key = CryptoJS.enc.Hex.parse(skey);
  const iv = CryptoJS.lib.WordArray.create([0x00, 0x00, 0x00, 0x00]);
  try {
    const array = CryptoJS.enc.Hex.parse(encryptedStringHex);
    if (chip === 'AES') {
      result = CryptoJS.AES.decrypt({ ciphertext: array }, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
      }).toString(CryptoJS.enc.Utf8);
    } else {
      result = array;
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const verifyMac = (skey, res_ev, res_vv) => {
  const decryptedData = DecryptHex(res_ev, 'AES', skey);
  const checkHmac = EncryptHex(decryptedData, 'SHA', STORE_KEY);
  // console.log('$$$$');
  // console.log('decryptedData : ', decryptedData);
  // console.log('$$$$');
  // console.log('$$$$');
  // console.log('res_vv : ' + res_vv);
  // console.log('$$$$');
  // console.log('$$$$');
  // console.log('checkHmac : ' + checkHmac);
  // console.log('$$$$');
  if (res_vv === checkHmac) {
    return true;
  } else {
    return false;
  }
};
// 복합결제 준비
app.get('/zeropay/complex/ready', async (req, res) => {
  const params = {};
  const body = {};

  params.mid = MID; // 가맹점 코드
  params.mode = 'development'; //개발환경
  params.merchantOrderID = '20200723_order_id12349'; //가맹점 주문번호
  params.merchantUserKey = 'test_mall_userkey'; // 가맹점 회원키
  params.productName =
    '[닥닥프레쉬] 닥닥이 사과 5kg (과수크기 랜덤발송) 포함 총2건'; //상품 표시명
  params.totalAmount = 1500; // 상품권 총금액
  params.approvalURL = `http://localhost:3000/zeropay/complex/result?type=success&totalAmount=${params.totalAmount}&merchantOrderID=${params.merchantOrderID}&merchantUserKey=${params.merchantUserKey}&productName=${params.productName}`;
  params.cancelURL = `http://localhost:3000/zeropay/complex/result?type=cancel&totalAmount=${params.totalAmount}`;
  params.failURL = `http://localhost:3000/zeropay/complex/result?type=fail`;
  params.apiCallYn = 'N'; // API 호출여부(API,복합: Y, 화면: N )
  params.payrCi = ''; // 구매자 CI
  params.clphNo = ''; // 구매자 핸드폰번호
  params.zip_no = '072'; // 상품권 우편번호정보

  try {
    const date = moment(new Date()).format('yyyyMMddkkmmss');
    const reqEV = EncryptHex(JSON.stringify(params), 'AES', STORE_KEY);
    const reqVV = EncryptHex(JSON.stringify(params), 'SHA', STORE_KEY);
    body.MID = MID;
    body.RQ_DTIME = date;
    body.TNO = date;
    body.EV = reqEV;
    body.VV = reqVV;
    body.RC = '';
    body.RM = '';

    const { data } = await zeroPayAPI.post(
      '/api_v1_payment_complex_reserve.jct',
      body
    );
    // return res.send(data);
    if (data.RC !== '0000') {
      return res.send('zeropay complex ready fail');
    } else {
      const resEV = data.EV;
      const resVV = data.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        if (decResult.code === '000') {
          // return res.send(decResult.data);
          return res.redirect(decResult.data.redirectURLPC);
        } else {
          return res.send(
            'zeropay complex ready not 000 fail \n' + JSON.stringify(decResult)
          );
        }
      } else {
        return res.send('zeropay complex ready verify fail');
      }
    }
  } catch (error) {
    throw error;
  }
});

//복합결제준비 결과
app.get('/zeropay/complex/result', async (req, res) => {
  try {
    if (req.query.type === 'success') {
      // res.send('zeropay complex success');
      const resEV = req.query.EV;
      const resVV = req.query.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        if (decResult.payReqList) {
          // return res.send(decResult);
          const query = querystring.stringify({
            totalAmount: req.query.totalAmount,
            merchantOrderID: req.query.merchantOrderID,
            merchantUserKey: req.query.merchantUserKey,
            productName: req.query.productName,
            payReqList: decResult.payReqList,
          });

          return res.redirect('/zeropay/ready?' + query);
        } else {
          return res.send(
            'zeropay ready not 000 fail \n' + JSON.stringify(decResult)
          );
        }
      } else {
        return res.send('zeropay ready verify fail');
      }
    } else {
      res.send('zeropay complex fail');
    }
  } catch (error) {
    throw error;
  }
});

//결제 준비 (화면연동)
app.get('/zeropay/ready', async (req, res) => {
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
  params.merchantOrderID =
    req.query.merchantOrderID || '20200723_order_id12347'; //가맹점 주문번호
  params.merchantUserKey = req.query.merchantUserKey || 'test_mall_userkey'; // 가맹점 회원키
  params.productName =
    req.query.productName ||
    '[오더프레쉬] 못난이(흠과) 사과 5kg (과수크기 랜덤발송) 포함 총2건'; //상품 표시명
  params.quantity = 3; // 상품 총수량
  params.totalAmount = req.query.totalAmount || 1500; // 상품권 총금액
  params.taxFreeAmount = 0; // 상품비과세금액
  params.vatAmount = 137; // 상품 부가세 금액
  params.approvalURL = `http://localhost:3000/zeropay/result?type=success&totalAmount=${params.totalAmount}`; // 결제승인 성공시 return url
  params.cancelURL = `http://localhost:3000/zeropay/result?type=cancel&totalAmount=${params.totalAmount}`;
  params.failURL = `http://localhost:3000/zeropay/result?type=fail&totalAmount=${params.totalAmount}`;
  params.apiCallYn = 'N'; // API 호출여부(API,복합: Y, 화면: N )
  params.payrCi = '';
  params.clphNo = '';
  params.zip_no = '072';
  params.productItems = productItems;
  if (req.query.payReqList) {
    params.payReqList = req.query.payReqList;
  }

  try {
    const date = moment(new Date()).format('yyyyMMddkkmmss');
    const reqEV = EncryptHex(JSON.stringify(params), 'AES', STORE_KEY);
    const reqVV = EncryptHex(JSON.stringify(params), 'SHA', STORE_KEY);
    body.MID = MID;
    body.RQ_DTIME = date;
    body.TNO = date;
    body.EV = reqEV;
    body.VV = reqVV;
    body.RC = '';
    body.RM = '';

    // 결제 준비
    const { data } = await zeroPayAPI.post('/api_v1_payment_reserve.jct', body);
    // return res.send(data);
    if (data.RC !== '0000') {
      return res.send('zeropay ready fail');
    } else {
      const resEV = data.EV;
      const resVV = data.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        if (decResult.code === '000') {
          req.session.tid = decResult.data.tid;
          return res.redirect(decResult.data.redirectURLPC);
        } else {
          return res.send(
            'zeropay ready not 000 fail \n' + JSON.stringify(decResult)
          );
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
      const request = {};
      request.mid = params.MID; // 가맹점 코드
      request.tid = params.tid;
      // body.merchantOrderID = params.merchantOrderID;  //가맹점 주문번호
      // body.merchantUserKey = params.merchantUserKey; //가맹점 회원키
      request.token = params.token;
      request.payload = '';
      request.totalAmount = params.totalAmount;

      const date = moment(new Date()).format('yyyyMMddkkmmss');
      const reqEV = EncryptHex(JSON.stringify(request), 'AES', STORE_KEY);
      const reqVV = EncryptHex(JSON.stringify(request), 'SHA', STORE_KEY);
      body.MID = MID;
      body.RQ_DTIME = date;
      body.TNO = date;
      body.EV = reqEV;
      body.VV = reqVV;
      body.RC = '';
      body.RM = '';

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
app.get('/zeropay/result', async (req, res) => {
  if (req.query.type === 'success') {
    // res.send('zeropay success');
    if (req.query.RC !== '0000') {
      return res.send('zeropay ready fail');
    } else {
      const resEV = req.query.EV;
      const resVV = req.query.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        if (decResult) {
          decResult.MID = req.query.MID;
          decResult.totalAmount = req.query.totalAmount;
          decResult.tid = req.session.tid;
          req.session.tid = null; // 초기화
          const paymentResult = await zeroPayAgreement(decResult);
          if (paymentResult.RC !== '0000') {
            return res.send('zeropay result fail');
          } else {
            const resEV = paymentResult.EV;
            const resVV = paymentResult.VV;
            if (verifyMac(STORE_KEY, resEV, resVV)) {
              const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
              if (decResult.code === '000') {
                return res.send(decResult);
              } else {
                return res.send(
                  'zeropay result not 000 fail\n' + JSON.stringify(decResult)
                );
              }
            } else {
              return res.send('zeropay result verify fail');
            }
          }
        } else {
          return res.send(
            'zeropay ready not 000 fail \n' + JSON.stringify(decResult)
          );
        }
      } else {
        return res.send('zeropay ready verify fail');
      }
    }
  } else {
    res.send('zeropay  fail');
  }
});

// 결제 취소
app.get('/zeropay/cancel', async function (req, res) {
  const body = {};
  const params = {};
  const mid = req.query.mid || MID;
  const tid = req.query.tid || '200731ZP00010682';
  const cancelAmount = req.query.cancelAmount || 1500;
  const cancelTaxFreeAmount = req.query.cancelTaxFreeAmount || 0;
  params.mid = mid;
  params.tid = tid;
  params.cancelAmount = cancelAmount;
  params.cancelTaxFreeAmount = cancelTaxFreeAmount;

  const date = moment(new Date()).format('yyyyMMddkkmmss');
  const reqEV = EncryptHex(JSON.stringify(params), 'AES', STORE_KEY);
  const reqVV = EncryptHex(JSON.stringify(params), 'SHA', STORE_KEY);
  body.MID = MID;
  body.RQ_DTIME = date;
  body.TNO = date;
  body.EV = reqEV;
  body.VV = reqVV;
  body.RC = '';
  body.RM = '';

  try {
    const { data } = await zeroPayAPI.post('/api_v1_payment_cancel.jct', body);
    // return res.send(data);
    if (data.RC !== '0000') {
      return res.send('zeropay cancel fail');
    } else {
      const resEV = data.EV;
      const resVV = data.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        console.log('$$$$$$$$$$');
        console.log(decResult);
        console.log('$$$$$$$$$$');
        if (decResult.code === '000') {
          return res.send(decResult);
        } else {
          return res.send(
            'zeropay cancel not 000 fail\n' + JSON.stringify(decResult)
          );
        }
      } else {
        return res.send('zeropay cancel verify fail');
      }
    }
  } catch (error) {
    throw error;
  }
});

// 결제 상태 조회
app.get('/zeropay/status/search', async function (req, res) {
  const body = {};
  const params = {};
  const mid = req.query.mid || MID;
  const tid = req.query.tid || '200731ZP00010682';
  params.mid = mid;
  params.tid = tid;

  const date = moment(new Date()).format('yyyyMMddkkmmss');
  const reqEV = EncryptHex(JSON.stringify(params), 'AES', STORE_KEY);
  const reqVV = EncryptHex(JSON.stringify(params), 'SHA', STORE_KEY);
  body.MID = MID;
  body.RQ_DTIME = date;
  body.TNO = date;
  body.EV = reqEV;
  body.VV = reqVV;
  body.RC = '';
  body.RM = '';
  try {
    const { data } = await zeroPayAPI.post('/api_v1_payment_status.jct', body);
    // return res.send(data);
    if (data.RC !== '0000') {
      return res.send('zeropay ready fail');
    } else {
      const resEV = data.EV;
      const resVV = data.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        console.log('$$$$$$$$$$');
        console.log(decResult);
        console.log('$$$$$$$$$$');
        if (decResult.code === '000') {
          return res.send(decResult);
        } else {
          return res.send(
            'zeropay ready not 000 fail\n' + JSON.stringify(decResult)
          );
        }
      } else {
        return res.send('zeropay ready verify fail');
      }
    }
  } catch (error) {
    throw error;
  }
});

// 정산내역 조회
app.get('/zeropay/payment/search', async function (req, res) {
  const params = {};
  const body = {};
  const mid = req.query.mid || MID;
  const fromDate = req.query.fromDate || '20200729'; //조회 시작일자
  const toDate = req.query.toDate || '20200801'; //조회 종료일자
  const perPage = req.query.perPage || 10; // 페이지당 건수
  const pageIndex = req.query.pageIndex || 1; //시작 페이지
  params.mid = mid;
  params.fromDate = fromDate;
  params.toDate = toDate;
  params.perPage = perPage;
  params.pageIndex = pageIndex;

  const date = moment(new Date()).format('yyyyMMddkkmmss');
  const reqEV = EncryptHex(JSON.stringify(params), 'AES', STORE_KEY);
  const reqVV = EncryptHex(JSON.stringify(params), 'SHA', STORE_KEY);
  body.MID = MID;
  body.RQ_DTIME = date;
  body.TNO = date;
  body.EV = reqEV;
  body.VV = reqVV;
  body.RC = '';
  body.RM = '';
  try {
    const { data } = await zeroPayAPI.post('/api_v1_payment_sttlinq.jct', body);
    // return res.send(data);
    if (data.RC !== '0000') {
      return res.send('zeropay ready fail');
    } else {
      const resEV = data.EV;
      const resVV = data.VV;
      if (verifyMac(STORE_KEY, resEV, resVV)) {
        const decResult = JSON.parse(DecryptHex(resEV, 'AES', STORE_KEY));
        console.log('$$$$$$$$$$');
        console.log(decResult);
        console.log('$$$$$$$$$$');
        if (decResult.code === '000') {
          return res.send(decResult);
        } else {
          return res.send(
            'zeropay ready not 000 fail\n' + JSON.stringify(decResult)
          );
        }
      } else {
        return res.send('zeropay ready verify fail');
      }
    }
  } catch (error) {
    throw error;
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
