import path from "node:path";
import { fileURLToPath } from "node:url";
import scrape from "website-scraper";
import PuppeteerPlugin from "website-scraper-puppeteer";
import SaveToExistingDirectoryPlugin from "website-scraper-existing-directory";
import express from "express";
import cors from "cors";


(async () => {
  const { website_url: siteURL } = process.env; 
  console.log("siteURL", siteURL);

  const resourceDir = "website_source";
  const PORT = 3600;

  await scrapeURL(siteURL, resourceDir);

  console.log("Spinning up an API...");
  const app = express();
  const router = express.Router();
  const resouces = path.resolve(process.cwd(), resourceDir);

  app.use(cors());
  app.use("/", express.static(resouces));

  router.get("/", async (req, res) => {
    res.sendFile(path.join(resouces, "index.html"));
  });

  app.use(router);

  app.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
  });


  async function scrapeURL(givenURL, resourceDir) {
    if (!givenURL || typeof givenURL !== "string") return "";
    const targetURL = givenURL.startsWith("https://")
      ? givenURL
      : "https://" + givenURL;

    const root = path.dirname(fileURLToPath(import.meta.url));
  
    const rs = await scrape({
      urls: [targetURL],
      directory: path.resolve(root, resourceDir),
      plugins: [
        new SaveToExistingDirectoryPlugin(),
        new PuppeteerPlugin({
          blockNavigation: true,
          launchOptions: {
            headless: true,
            executablePath: process.env.CHROME_BIN || null,
            args: ["--no-sandbox", "--headless", "--disable-gpu","--disable-dev-shm-usage"]
          },
          scrollToBottom: {
            timeout: 10000,
            viewportN: 10
          },
        })
      ]
    });
  
    return rs && rs[0] || undefined;
  }
})();