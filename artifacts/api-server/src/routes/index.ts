import { Router, type IRouter } from "express";
import healthRouter from "./health";
import menuRouter from "./menu";
import tabsRouter from "./tabs";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(menuRouter);
router.use(tabsRouter);
router.use(historyRouter);
router.use(dashboardRouter);

export default router;
