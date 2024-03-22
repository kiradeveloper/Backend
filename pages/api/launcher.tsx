// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
const bcrypt = require("bcryptjs");
const sql = require("mssql");

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

const usingBcrypt = process.env.USE_BCRYPT;
const usingAuthToken = process.env.USE_AUTH_TOKEN;
let checkpassword;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(403).send({ message: "Request forbidden!" });
    return;
  } else {
    const { username, password } = req.body;

    await sql.connect(sqlConfig);

    if (usingAuthToken) {
      const authKey =
        await sql.query`SELECT encodeKey FROM define_encode_key ORDER BY regDate`;

      const authorization = req.headers.authorization;
      if (!authorization || !authorization.startsWith("Bearer ")) {
        // No Bearer token present
        return res.status(401).json({
          message: "Unauthorized!",
        });
      }

      // Extract the token from the authorization header
      const token = authorization.split(" ")[1];

      if (token !== "losaapi" + authKey.recordset[0].encodeKey) {
        // Token is present, but doesn't match the expected value
        return res.status(401).json({
          message: "Unauthorized!",
        });
      }
    }

    if (!username || !password) {
      return res.status(203).json({
        message: "Username or Password is required!",
      });
    } else {
      try {
        const userID =
          await sql.query`SELECT * FROM userMemberDB WHERE userID = ${username}`;

        if (userID.recordset.length > 0) {
          const encodeKey =
            await sql.query`SELECT encodeKey FROM define_encode_key ORDER BY regDate`;

          const serverID =
            await sql.query`SELECT serverID FROM define_game_server ORDER BY regDate`;

          await sql.query`UPDATE userLoginDB SET connDate = getdate() WHERE accountIDX = ${userID.recordset[0].accountIDX}`;
          await sql.query`UPDATE userGameDB SET userState = -1 WHERE accountIDX = ${userID.recordset[0].accountIDX}`;
          const clientIp =
            typeof req.headers["x-real-ip"] === "undefined"
              ? "127.0.0.1"
              : req.headers["x-real-ip"];

          {
            usingBcrypt
              ? (checkpassword = await bcrypt.compare(
                  password,
                  userID.recordset[0].userPWD
                ))
              : (checkpassword = password === userID.recordset[0].userPWD);

            checkpassword
              ? res.status(200).json({
                  AppName: "lostsaga.exe",
                  userID: userID.recordset[0].userID,
                  encodeKey: encodeKey.recordset[0].encodeKey,
                  serverID: serverID.recordset[0].serverID,
                  clientIP: clientIp,
                  message: "Password Match",
                })
              : res.status(401).json({
                  message: "Wrong Password!",
                });
          }
        } else {
          return res.status(404).json({
            message: "Account Not Found or Account not verifiy yet!",
          });
        }
      } catch (error) {
        return res.json(error);
      } finally {
        await sql.close();
      }
    }
  }
}
