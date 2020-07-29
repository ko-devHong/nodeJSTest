import axios from "axios";

export const AUTH_KEY = "OyPVN.pAgCG04mkC1YvARe95CDK4OQPQsXU0lxNYcwKdIuOXuZRLK";

export const STORE_KEY = "71304665387239306661787956754738"; // 암호화 복호화 키

export const zeropayApi = axios.create({
  baseURL: "https://zpg.dev-zeropaypoint.or.kr/",
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
    Authorization: `OnlineAK ${AUTH_KEY}`,
  },
});

export default zeropayApi;
