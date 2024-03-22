// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
const sql = require("mssql");
const busboy = require("busboy");

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || "", 10);

const sqlConfig = {
  user: dbUsername,
  password: dbPassword,
  database: dbName,
  server: dbHost,
  port: dbPort,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

const myCashError = {
  result: "error",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const formData: { [key: string]: string } = {};

    const busboyInstance = busboy({ headers: req.headers });

    busboyInstance.on("field", (fieldName: string, value: string) => {
      formData[fieldName] = value;
    });

    busboyInstance.on("finish", async () => {
      if (!formData.userNo || !formData.userId || !formData.makeCodeNo) {
        res.status(203).json(myCashError);
      }
      const myCash = {
        result: "success",
        message: "",
        userNo: Number(formData.userNo),
        realCash: 0,
        bonusCash: 0,
      };

      if (formData.makeCodeNo !== "100103") {
        res.status(200).json(myCashError);
      }

      try {
        const pool = await sql.connect(sqlConfig);
        const checkuserlogin =
          await sql.query`SELECT * FROM userLoginDB WHERE accountIDX = ${myCash.userNo}`;

        if (checkuserlogin.recordset[0].gameServerID == 0) {
          return res.status(403).json(myCashError);
        }
        const result = await pool
          .request()
          .input("ACCOUNTIDX", sql.Int, myCash.userNo)
          .execute("game_money_get");

        if (result.recordset.length > 0) {
          myCash.realCash = result.recordset[0].amtCash;
          myCash.bonusCash = result.recordset[0].amtBonus;
          res.status(200).json(myCash);
        } else {
          res.status(200).json(myCashError);
        }
      } catch (err) {
        res.status(200).json(myCashError);
      }
    });

    req.pipe(busboyInstance);
  } else {
    res.status(200).json(myCashError);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
