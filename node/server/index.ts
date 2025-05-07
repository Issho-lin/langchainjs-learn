/*
 * @Author: linqibin
 * @Date: 2025-05-07 14:55:06
 * @LastEditors: linqibin
 * @LastEditTime: 2025-05-07 17:09:28
 * @Description:
 *
 * Copyright (c) 2025 by 智慧空间研究院/金地空间科技, All Rights Reserved.
 */
import express from "express";
import { chat } from "../chatbot";

const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  let question = req.query.question as string;
  // 再次解码，防止客户端未正确编码
  try {
    question = decodeURIComponent(question);
  } catch (e) {}
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  for await (const chunk of await chat(question)) {
    res.write(chunk);
  }
  res.end();
});

app.post("/", async (req, res) => {
  let question = req.body.question;
  // 兼容处理：如果检测到乱码，尝试转码
  if (typeof question === "string" && /[\u00C0-\u017F]/.test(question)) {
    try {
      question = Buffer.from(question, "latin1").toString("utf8");
    } catch (e) {}
  }
  console.log(question)
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  for await (const chunk of await chat(question)) {
    res.write(chunk);
  }
  res.end();
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
