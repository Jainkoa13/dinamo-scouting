import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import teamsRouter from "./teams";
import removebgRouter from "./removebg";
import authRouter from "./auth";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(requireAuth, playersRouter);
router.use(requireAuth, teamsRouter);
router.use(requireAuth, removebgRouter);

export default router;
