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

const MyCashError = {
  result: "error",
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
  let flag = false; // Declare flag variable with default value of false

  busboy.on("field", (fieldName: string, value: string) => {
    form[fieldName] = value;
  });

  busboy.on("finish", async () => {
    const TempCash = {
      realCash: 0,
      bonusCash: 0,
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

    const MyCash = {
      result: "success",
      userNo: parseInt(form.userNo, 10),
      realCash: 0,
      bonusCash: 0,
      chargedCashAmt:
        parseInt(form.itemUnitPrice, 10) * parseInt(form.itemCnt, 10),
      itemInfos: { chargeNo: "test123" },
    };

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
        .input("ACCOUNTIDX", mssql.Int, MyCash.userNo)
        .execute("game_money_get");

      MyCash.realCash = result.recordset[0].amtCash;
      TempCash.realCash = MyCash.realCash;
      MyCash.bonusCash = result.recordset[0].amtBonus;
      TempCash.bonusCash = MyCash.bonusCash;

      if (TempCash.bonusCash > 0) {
        TempCash.bonusCash -= MyCash.chargedCashAmt;
        if (TempCash.bonusCash < 0) {
          TempCash.realCash -= -TempCash.bonusCash;
          TempCash.bonusCash = 0;
        }
      } else {
        TempCash.realCash -= MyCash.chargedCashAmt;
      }

      if (TempCash.realCash >= 0) {
        if (TempCash.bonusCash >= 0) {
          MyCash.realCash = TempCash.realCash;
          MyCash.bonusCash = TempCash.bonusCash;
          const result2 = await pool
            .request()
            .input("ACCOUNTIDX", mssql.Int, MyCash.userNo)
            .input("USER_MONEY", mssql.Int, MyCash.realCash)
            .execute("game_money_set_realCash");

          const result3 = await pool
            .request()
            .input("ACCOUNTIDX", mssql.Int, MyCash.userNo)
            .input("USER_MONEY", mssql.Int, MyCash.bonusCash)
            .execute("game_money_set_bonusCash");

          flag = true;
        }
      }

      if (flag) {
        return res.status(200).send(MyCash);
      } else {
        res.status(403).json(MyCashError);
      }
    } catch (err) {
      res.status(403).json(MyCashError);
    }
  });

  req.pipe(busboy);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
