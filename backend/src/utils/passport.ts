import passport from "passport";
import passportJWT from "passport-jwt";
import constants from "../helpers/constants";
import User from "../models/user";
import { UserAttribute } from "../interfaces/user.interface";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: constants.AUTHENTICATION.APP_SECRET,
    },
    async (jwtPayload, cb) => {
      try {
        await User.findOne({
          where: { email_id: jwtPayload.email_id },
        })
          .then((user: User | null) => {
            cb(null, (user ? user.dataValues : null) as UserAttribute);
          })
          .catch((err) => {
            cb(err);
          });
      } catch (err) {
        return cb(err, false);
      }
    }
  )
);