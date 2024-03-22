import { NextApiRequest, NextApiResponse } from "next";
const mssql = require("mssql");
const Busboy = require("busboy");

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

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Method Not Allowed" });
  }
  const form: { [key: string]: string } = {};
  const busboy = Busboy({ headers: req.headers });

  busboy.on("field", (fieldName: string, value: string) => {
    form[fieldName] = value;
  });

  busboy.on("finish", async () => {
    const MyCash = {
      result: "success",
      message: "",
      userNo: parseInt(form.userNo, 10),
      realCash: 0,
      bonusCash: 0,
      chargedCashAmt:
        parseInt(form.itemUnitPrice, 10) * parseInt(form.itemCnt, 10),
      itemInfos: { chargeNo: "test123" },
    };
    const MyCashError = {
      result: "error",
    };
    if (
      !form.userNo ||
      !form.userId ||
      !form.makeCodeNo ||
      !form.itemCnt ||
      !form.itemUnitPrice
    ) {
      res.status(403).json(MyCashError);
    }

    if (form.makeCodeNo !== "100103") {
      res.status(403).json(MyCashError);
    }

    try {
      const pool = await mssql.connect(sqlConfig);
      const checkuserlogin =
        await mssql.query`SELECT * FROM userLoginDB WHERE accountIDX = ${MyCash.userNo}`;

      if (checkuserlogin.recordset[0].gameServerID == 0) {
        return res.status(403).json(MyCashError);
      }
      const result = await pool
        .request()
        .input("ACCOUNTIDX", mssql.Int, parseInt(form.userNo, 10))
        .execute("game_money_get");

      if (result.recordset.length > 0) {
        const record = result.recordset[0];

        MyCash.realCash = record.amtCash;
        MyCash.bonusCash = record.amtBonus;

        const num = MyCash.realCash - MyCash.chargedCashAmt;
        if (num >= 0) {
          MyCash.realCash = num;
          const result = await pool
            .request()
            .input("ACCOUNTIDX", mssql.Int, MyCash.userNo)
            .input("USER_MONEY", mssql.Int, MyCash.realCash)
            .execute("game_money_set_realCash");
        } else {
          res.status(403).json(MyCashError);
        }
      } else {
        res.status(403).json(MyCashError);
      }

      await pool.close();
    } catch (error) {
      res.status(403).json(MyCashError);
    }

    res.send(MyCash);
  });
  req.pipe(busboy);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
