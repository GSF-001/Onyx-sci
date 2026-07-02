import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
// import routes lain yang udah ada di project lo:
// import searchRoutes from "./routes/search.routes";
// import copilotRoutes from "./routes/copilot.routes";
// dst...

const app = express();

app.use(cors({ origin: process.env.APP_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
// app.use("/search", searchRoutes);
// app.use("/copilot", copilotRoutes);
// ... route lain yang udah ada tetap jalan seperti biasa

app.listen(process.env.PORT || 4000, () => {
  console.log(`🚀 Server jalan di port ${process.env.PORT || 4000}`);
});
